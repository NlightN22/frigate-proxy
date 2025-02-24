import { Camera, FrigateHost } from "@prisma/client"
import { dev } from "../../consts"
import { logger } from "../../utils/logger"
import { objForEach } from "../../utils/parse.object"
import prisma from "../../utils/prisma"
import { sleep } from "../../utils/sleep"
import { FrigateAPIUrls } from "../frigate-hosts/frigate-api.urls"
import { CameraStats } from "../frigate-hosts/frigate-hosts.schema"
import FrigateHostsService from "../frigate-hosts/frigate-hosts.service"
import { InputCamera } from "../frigate-hosts/frigate.config.schema"
import { FrigateConfig } from "../frigate-hosts/frigateConfig"
import { ErrorApp } from "../hooks/error.handler"
import { updateFetcher } from "./utils"

class FrigateCamerasUpdater {
    private static _instance: FrigateCamerasUpdater
    static _updateInProgress = false
    static _updateCamerasProgress = false
    private _frigateHostsService: FrigateHostsService
    private prismaClient = prisma.frigateHost

    private constructor(frigateHostsService: FrigateHostsService) {
        this._frigateHostsService = frigateHostsService;
        this.updateCamerasFromHost()
        this.updateCamerasState()
        logger.debug(`FrigateCamerasUpdater initialized`)
    }

    public static initialize(frigateHostsService: FrigateHostsService) {
        if (!FrigateCamerasUpdater._instance) {
            FrigateCamerasUpdater._instance = new FrigateCamerasUpdater(frigateHostsService);
        }
    }

    private async updateCamerasFromHost() {
        if (FrigateCamerasUpdater._updateInProgress || dev.disableUpdates) return
        const updateTimer = 60000
        while (true) {
            FrigateCamerasUpdater._updateInProgress = true
            const startTime = Date.now()
            try {
                logger.debug(`FrigateCamerasUpdater Start update cameras...`)
                // get all hosts
                const hosts = await this._frigateHostsService.getAllFrigateHosts()
                if (hosts.length > 0) {
                    for (const host of hosts) {
                        // get cameras from host
                        const config: FrigateConfig | undefined = await this.fetchConfig(host)
                        if (config) {
                            logger.debug(`FrigateCamerasUpdater Fetched cameras from host ${host.name}`)
                            const inputCameras = this.parseCamerasNamesAndConfig(config)
                            if (inputCameras && inputCameras.length > 0) {
                                const dbHostCameras = (await this._frigateHostsService.getFrigateHostById(host.id)).cameras
                                this.createCamerasFromInput(inputCameras, dbHostCameras, host)
                                this.deleteCamerasNotInInput(inputCameras, dbHostCameras, host)
                                this.updateCamerasFromInput(inputCameras, host)
                            }
                        }
                    }
                }
            } catch (e) {
                logger.error(`FrigateCamerasUpdater ${e.message}`)
            } finally {
                logger.debug(`FrigateCamerasUpdater End update cameras at ${(Date.now() - startTime) / 1000} sec`)
                FrigateCamerasUpdater._updateInProgress = false
            }
            await sleep(updateTimer)
        }
    }

    private async updateCamerasState() {
        let updateTimer = 10000
        const updateConditions = !FrigateCamerasUpdater._updateCamerasProgress ||
            !FrigateCamerasUpdater._updateInProgress ||
            !dev.disableUpdates
        while (true) {
            if (updateConditions) {
                FrigateCamerasUpdater._updateCamerasProgress = true
                const startTime = Date.now()
                try {
                    logger.debug(`FrigateCamerasUpdater Start cameras states update...`)
                    const hosts = await this._frigateHostsService.getAllFrigateHosts()
                    if (hosts.length > 0) {
                        for (const host of hosts) {
                            const stats = await this.fetchStats(host)
                            if (stats) {
                                const parsedStats = this.parseCamerasStats(stats)
                                if (parsedStats && parsedStats.length > 0) {
                                    const hostCameras = (await this._frigateHostsService.getFrigateHostById(host.id)).cameras
                                    const statsMap = new Map(parsedStats.map(stat => [stat.name, stat.state]));
                                    hostCameras.forEach(camera => {
                                        if (statsMap.has(camera.name)) {
                                            camera.state = statsMap.get(camera.name) ?? null;
                                        }
                                    })
                                    await this.updateHostCamerasState(host.id, hostCameras)
                                    logger.silly(`FrigateCamerasUpdater Updated from ${host.name} cameras state: ${JSON.stringify(hostCameras.flatMap(cam => cam.name))}`)
                                    logger.debug(`FrigateCamerasUpdater Updated from ${host.name} ${hostCameras.length} cameras states`)
                                    updateTimer = 60000
                                }
                            }
                        }
                    }
                } catch (e) {
                    logger.error(`FrigateCamerasUpdater ${e.message}`)
                    updateTimer = 10000
                } finally {
                    logger.debug(`FrigateCamerasUpdater End update cameras state at ${(Date.now() - startTime) / 1000} sec`)
                    FrigateCamerasUpdater._updateCamerasProgress = false
                }
            } else updateTimer = 10000
            await sleep(updateTimer)
        }
    }

    private async updateHostCamerasState(hostId: string, cameras: Camera[]) {
        if (cameras.length < 1) return
        return await Promise.all(cameras.map(async camera => {
            logger.silly(`FrigateCamerasUpdater update host ${hostId} camera ${JSON.stringify(camera)}`)
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

    private parseCamerasStats(input: any): CameraStats[] {
        let camerasStates: CameraStats[] = []
        if (!input.cameras) {
            logger.warn('parseCamerasStats Input data does not have cameras')
            return []
        }
        objForEach(input.cameras, (name: string, value) => {
            if (value.hasOwnProperty('camera_fps')) {
                const state = value.camera_fps !== 0
                const item = { name: name, state }
                camerasStates.push(item)
            }
        })
        return camerasStates
    }

    private async fetchStats(host: FrigateHost) {
        try {
            if (!host.enabled) return undefined
            logger.debug(`FrigateCamerasUpdater Fetch stats from ${host.name}`)
            const hostURL = new URL(host.host)
            const configURL = hostURL.toString() + FrigateAPIUrls.stats
            return await updateFetcher<any>(configURL)
        } catch (e) {
            logger.error(`FrigateCamerasUpdater Error fetch config from ${host.name}: ${e.message}`)
            return undefined
        }
    }

    private async updateCamerasFromInput(inputCameras: InputCamera[], host: FrigateHost) {
        await this.updateHostCamerasWConfig(host.id, inputCameras)
    }


    private async updateHostCamerasWConfig(hostId: string, inputCameras: InputCamera[]) {
        if (inputCameras.length < 1) return
        const host = await this.prismaClient.findUniqueOrThrow({
            where: { id: hostId },
            include: { cameras: true }
        })
        return Promise.all(inputCameras.map(camera => {
            const dbCamera = host.cameras.find(item => item.name === camera.name)
            if (dbCamera) {
                try {
                    return this.updateHostCameraConfig(host, dbCamera, camera)
                } catch (e) {
                    logger.error(`FrigateCamerasUpdater updateHostCamerasWConfig ${e.message}`)
                    return undefined
                }
            }
            return undefined
        }))
    }

    private async updateHostCameraConfig(host: FrigateHost, camera: Camera, inputCamera: InputCamera) {
        if (!inputCamera.config) throw new ErrorApp('runtime', `FrigateCamerasUpdater ${host.id} config does not exist`)
        const configAsJson = JSON.parse(JSON.stringify(inputCamera.config))
        return await this.prismaClient.update({
            where: { id: host.id },
            data: {
                cameras: {
                    update: {
                        where: { id: camera.id },
                        data: {
                            config: configAsJson
                        }
                    }
                }
            }
        })
    }

    private async deleteCamerasNotInInput(inputCameras: InputCamera[], dbHostCameras: Camera[], host: FrigateHost) {
        const notExistInInput = dbHostCameras.filter(
            cameraHost => !inputCameras.some(inputCamera => inputCamera.name === cameraHost.name)
        )
        if (notExistInInput && notExistInInput.length > 0) {
            logger.silly(`FrigateCamerasUpdater updateCamerasFromHost notExistInInput: ${JSON.stringify(notExistInInput)}`)
            const deleteCameras = await this.deleteHostCameras(host.id, notExistInInput.flatMap(cam => cam.id))
            if (deleteCameras) {
                logger.debug(`FrigateCamerasUpdater Deleted cameras: ${JSON.stringify(deleteCameras.cameras.flatMap(cam => cam.name))}`)
            }
        }
    }

    private parseCamerasNamesAndConfig(config: FrigateConfig): InputCamera[] {
        return Object.entries(config.cameras).map(
            ([name, config]) => ({ name, config }))
    }

    private async createCamerasFromInput(inputCameras: InputCamera[], dbHostCameras: Camera[], host: FrigateHost) {
        const notExistInDb = inputCameras.filter(
            inputCamera => !dbHostCameras.some(cameraHost => inputCamera.name === cameraHost.name)
        )
        if (notExistInDb && notExistInDb.length > 0) {
            logger.debug(`FrigateCamerasUpdater create cameras...: ${JSON.stringify(notExistInDb.flatMap(cam => cam.name))}`)
            const createdCameras = await this.createHostCamerasWConfig(host.id, notExistInDb)
            if (createdCameras) {
                const camerasNames = createdCameras.flatMap(item => item.cameras.flatMap(cam => cam.name))
                logger.debug(`FrigateCamerasUpdater Created cameras: ${JSON.stringify(camerasNames)}`)
            }
        }
    }

    private async createHostCamerasWConfig(hostId: string, inputCameras: InputCamera[]) {
        if (inputCameras.length < 1) return
        const host = await this.prismaClient.findUniqueOrThrow({ where: { id: hostId } })
        return await Promise.all(inputCameras.map(
            async camera => {
                const res = await this.createHostCameraWConfig(host, camera)
                return res
            }
        ))
    }

    private async createHostCameraWConfig(host: FrigateHost, inputCamera: InputCamera) {
        if (!inputCamera.config) throw new ErrorApp('runtime', `FrigateCamerasUpdater ${host.id} config does not exist`)
        const configAsJson = JSON.parse(JSON.stringify(inputCamera.config))
        return await this.prismaClient.update({
            where: { id: host.id },
            data: {
                cameras: {
                    create: {
                        name: inputCamera.name,
                        config: configAsJson
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

    async fetchConfig(host: FrigateHost) {
        try {
            if (!host.enabled) return undefined
            logger.debug(`FrigateCamerasUpdater Fetch config from ${host.name}`)
            const hostURL = new URL(host.host)
            const configURL = hostURL.toString() + FrigateAPIUrls.config
            return await updateFetcher<FrigateConfig>(configURL)
        } catch (e) {
            logger.error(`FrigateCamerasUpdater Error fetch config from ${host.name}: ${e.message}`)
            return undefined
        }
    }

}

export default FrigateCamerasUpdater