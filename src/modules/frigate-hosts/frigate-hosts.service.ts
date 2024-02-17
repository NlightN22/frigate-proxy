import axios from "axios";
import prisma from "../../utils/prisma";
import { ErrorApp } from "../hooks/error.handler";
import { CameraStats, CreateHostSchema, ResponseHostSchema, ResponseHostStatisSchema, UpdateHostSchema, } from "./frigate-hosts.schema";
import { FrigateAPIUrls } from "./frigate-api.urls";
import { logger } from "../../utils/logger";
import { objForEach } from "../../utils/parse.object";
import { dev } from "../../consts";
import { Camera, FrigateHost } from "@prisma/client";
import { FrigateConfig } from "./frigate.config.schema";
import { sleep } from "../../utils/sleep";


class FrigateHostsService {

    private prismaClient = prisma.frigateHost

    private static _updateInProgress = false
    private static _updateCamerasProgress = false

    constructor() {
        this.updateCamerasFromHost()
        this.updateCamerasState()
        logger.debug(`FrigateHostsService initialized`)
    }

    private async fetcher<T>(url: string): Promise<T> {
        const response = await axios.get<T>(url, {
            timeout: 10000,
        })
        return response.data
    }

    async createFrigateHost(input: CreateHostSchema) {
        return await this.prismaClient.create({
            data: input
        })
    }
    async updateFrigateHost(input: UpdateHostSchema) {
        return await this.prismaClient.update({
            where: {
                id: input.id
            },
            data: this.mapUpdateToCreateHosts(input)
        })
    }
    async getAllFrigateHosts() {
        const frigateHosts = await this.prismaClient.findMany()
        return frigateHosts
    }
    async getFrigateHostByHost(host: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: {
                host: host
            },
            include: {
                cameras: true
            }
        })
    }
    async getFrigateHostById(id: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: {
                id: id
            },
            include: {
                cameras: true
            }
        })
    }

    async getFrigateHostOrNull(id: string) {
        return await this.prismaClient.findUnique({
            where: {
                id: id
            }
        })
    }

    async deleteFrigateHostById(id: string) {
        return this.prismaClient.delete({
            where: {
                id: id,
                cameras: {
                }
            },
            include: {
                cameras: true
            }
        });
    }

    async deleteFrigateHostByHost(host: string): Promise<ResponseHostSchema> {
        return this.prismaClient.delete({
            where: {
                host: host
            },
        });
    }

    async getHostOnly(host: string): Promise<string> {
        const frigateHost = await this.getFrigateHostByHost(host)
        return new URL(frigateHost.host).host
    }

    async getHostStatus(id: string): Promise<ResponseHostStatisSchema> {
        const host = await this.getFrigateHostById(id)
        const hostURL = new URL(host.host)

        const checkURL = hostURL.toString() + FrigateAPIUrls.version
        logger.debug(`Check host ${host.name} status at ${hostURL}`)
        if (!hostURL || !(hostURL instanceof URL)) throw new ErrorApp('validate', `Can not convert host ${host.name} to URL`)

        try {
            const response = await this.fetcher(checkURL)
            logger.info(`Get response status from host: ${host.name}`)
            if (response) return {
                ...host,
                status: true
            }
        } catch {
            logger.info(`Failed to get response from host: ${host.name}`)
        }
        return {
            ...host,
            status: false
        }
    }

    private async updateCamerasFromHost() {
        if (FrigateHostsService._updateInProgress || dev.disableUpdates) return
        const updateTimer = 30000
        while (true) {
            FrigateHostsService._updateInProgress = true
            const startTime = Date.now()
            try {
                logger.debug(`Start update host cameras...`)
                // get all hosts
                const hosts = await this.getAllFrigateHosts()
                if (hosts.length > 0) {
                    for (const host of hosts) {
                        // get cameras from host
                        const config = await this.fetchConfig(host)
                        if (config) {
                            logger.debug(`Fetched cameras from host ${host.name}`)
                            const inputCameras = this.parseCamerasNames(config.cameras)
                            if (inputCameras && inputCameras.length > 0) {
                                const hostCameras = (await this.getFrigateHostById(host.id)).cameras
                                // create from input not existing cameras in DB
                                const notExistInDb = inputCameras.filter(
                                    inputCamera => !hostCameras.some(cameraHost => inputCamera === cameraHost.name)
                                )
                                const createdCameras = await this.createHostCameras(host.id, notExistInDb)
                                if (createdCameras) {
                                    logger.debug(`Created cameras: ${JSON.stringify(createdCameras.cameras.flatMap(cam => cam.name))}`)
                                }
                                // delete from DB not existing cameras in input
                                const notExistInInput = hostCameras.filter(
                                    cameraHost => !inputCameras.some(inputCamera => inputCamera === cameraHost.name)
                                )
                                const deleteCameras = await this.deleteHostCameras(host.id, notExistInInput.flatMap(cam => cam.name))
                                if (deleteCameras) {
                                    logger.debug(`Deleted cameras: ${JSON.stringify(deleteCameras.cameras.flatMap(cam => cam.name))}`)
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                logger.error(e.message)
            } finally {
                logger.debug(`End update hosts cameras at ${(Date.now() - startTime) / 1000} sec`)
                FrigateHostsService._updateInProgress = false
            }
            await sleep(updateTimer)
        }
    }

    private async updateCamerasState() {
        let updateTimer = 10000
        const updateConditions = !FrigateHostsService._updateCamerasProgress ||
            !FrigateHostsService._updateInProgress ||
            !dev.disableUpdates
        while (true) {
            if (updateConditions) {
                FrigateHostsService._updateCamerasProgress = true
                const startTime = Date.now()
                try {
                    logger.debug(`Start cameras states...`)
                    const hosts = await this.getAllFrigateHosts()
                    if (hosts.length > 0) {
                        for (const host of hosts) {
                            const stats = await this.fetchStats(host)
                            if (stats) {
                                const parsedStats = this.parseCamerasStats(stats)
                                if (parsedStats && parsedStats.length > 0) {
                                    const hostCameras = (await this.getFrigateHostById(host.id)).cameras
                                    const statsMap = new Map(parsedStats.map(stat => [stat.name, stat.state]));
                                    // logger.debug(`hostCameras before: ${JSON.stringify(hostCameras.slice(0,2).map(cam=>({name: cam.name, state: cam.state})))}`)
                                    hostCameras.forEach(camera => {
                                        if (statsMap.has(camera.name)) {
                                            camera.state = statsMap.get(camera.name) ?? null;
                                        }
                                    })
                                    // logger.debug(`hostCameras after: ${JSON.stringify(hostCameras.slice(0,2).map(cam=>({name: cam.name, state: cam.state})))}`)
                                    await this.updateHostCamerasState(host.id, hostCameras)
                                    logger.silly(`Updated from ${host.name} cameras state: ${JSON.stringify(hostCameras.flatMap(cam => cam.name))}`)
                                    logger.debug(`Updated from ${host.name} ${hostCameras.length} cameras states`)
                                    updateTimer = 60000
                                }
                            }
                        }
                    }
                } catch (e) {
                    logger.error(e.message)
                    updateTimer = 10000
                } finally {
                    logger.debug(`End update cameras state at ${(Date.now() - startTime) / 1000} sec`)
                    FrigateHostsService._updateCamerasProgress = false
                }
            } else updateTimer = 10000
            await sleep(updateTimer)
        }
    }

    private async updateHostCamerasState(hostId: string, cameras: Camera[]) {
        if (cameras.length < 1) return
        return await Promise.all(cameras.map(async camera => {
            logger.silly(`update host ${hostId} camera ${JSON.stringify(camera)}`)
            return this.prismaClient.update({
                where: { id: hostId },
                data: {
                    cameras: {
                        update: {
                            where: { id: camera.id },
                            data: { state: camera.state }
                        }
                    }
                }
            })
        }))
    }

    private parseCamerasStats(stats: any) {
        let camerasStates: CameraStats[] = []
        objForEach(stats, (name: string, value) => {
            if (value.hasOwnProperty('camera_fps')) {
                const isWork = value.camera_fps !== 0
                const item = { name: name, state: isWork }
                camerasStates.push(item)
            }
        })
        return camerasStates
    }

    private async createHostCameras(hostId: string, cameraNames: string[]) {
        if (cameraNames.length < 1) return
        const host = await this.prismaClient.findUniqueOrThrow({ where: { id: hostId } })
        const camerasData = cameraNames.map(cameraName => ({
            name: cameraName
        }))
        return await this.prismaClient.update({
            where: { id: host.id },
            data: {
                cameras: {
                    createMany: {
                        data: camerasData
                    }
                }
            },
            include: { cameras: true }
        })
    }

    private async deleteHostCameras(hostId: string, cameraIds: string[]) {
        if (cameraIds.length < 1) return
        const host = await this.prismaClient.findUniqueOrThrow({ where: { id: hostId } })
        return await this.prismaClient.update({
            where: { id: host.id },
            data: {
                cameras: {
                    deleteMany: {
                        id: { in: cameraIds }
                    }
                }
            },
            include: { cameras: true }
        })
    }

    private async fetchConfig(host: FrigateHost) {
        try {
            logger.debug(`Fetch config from ${host.name}`)
            const hostURL = new URL(host.host)
            const configURL = hostURL.toString() + FrigateAPIUrls.config
            return await this.fetcher<FrigateConfig>(configURL)
        } catch (e) {
            logger.error(`Error fetch config from ${host.name}: ${e.message}`)
            return undefined
        }
    }
    private async fetchStats(host: FrigateHost) {
        try {
            logger.debug(`Fetch stats from ${host.name}`)
            const hostURL = new URL(host.host)
            const configURL = hostURL.toString() + FrigateAPIUrls.stats
            return await this.fetcher<any>(configURL)
        } catch (e) {
            logger.error(`Error fetch config from ${host.name}: ${e.message}`)
            return undefined
        }
    }

    private parseCamerasNames(cameras: any) {
        let camerasNames: string[] = []
        objForEach(cameras, (name, v) => {
            if (typeof name === 'string') {
                camerasNames.push(name)
            }
        })
        return camerasNames
    }

    private mapUpdateToCreateHosts(original: UpdateHostSchema): CreateHostSchema {
        const { id, cameras, ...rest } = original
        return { ...rest, ...cameras }
    }
}

export default FrigateHostsService