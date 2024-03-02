import { Camera, FrigateHost } from "@prisma/client"
import { dev } from "../../consts"
import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import { sleep } from "../../utils/sleep"
import { InputCamera } from "./frigate.config.schema"
import { FrigateConfig } from "./frigateConfig"
import { ErrorApp } from "../hooks/error.handler"
import { objForEach } from "../../utils/parse.object"
import { FrigateAPIUrls } from "./frigate-api.urls"
import axios from "axios"
import { CameraStats } from "./frigate-hosts.schema"
import FrigateHostsService from "./frigate-hosts.service"


class FrigateHostUpdates {
    private static _instance: FrigateHostUpdates
    private static _updateInProgress = false
    private static _updateCamerasProgress = false
    private static _updateHostsStateProgress = false
    private _frigateHostsService: FrigateHostsService
    private prismaClient = prisma.frigateHost

    private constructor(frigateHostsService: FrigateHostsService) {
        this._frigateHostsService = frigateHostsService;
        this.updateHostsState()
        this.updateCamerasFromHost()
        this.updateCamerasState()
        logger.debug(`FrigateHostUpdates initialized`)
    }

    public static initialize(frigateHostsService: FrigateHostsService) {
        if (!FrigateHostUpdates._instance) {
            FrigateHostUpdates._instance = new FrigateHostUpdates(frigateHostsService);
        }
    }

    private async fetcher<T>(url: string): Promise<T> {
        const response = await axios.get<T>(url, {
            timeout: 60000,
        })
        return response.data
    }

    private async updateHostsState() {
        const updateTimer = 20000
        const updateConditions = !FrigateHostUpdates._updateHostsStateProgress || !dev.disableUpdates
        while (true) {
            if (updateConditions) {
                FrigateHostUpdates._updateHostsStateProgress = true
                logger.debug(`FrigateHostUpdates Start hosts states update...`)
                const enabledHosts = await this.prismaClient.findMany({ where: { enabled: true } })
                if (enabledHosts.length > 0) {
                    const startTime = Date.now()
                    const results = await Promise.all(enabledHosts.map(async host => {
                        try {
                            const { status } = await this._frigateHostsService.getHostState(host.id)
                            await this.prismaClient.update({
                                where: { id: host.id },
                                data: { state: status }
                            })
                            return { success: status, hostId: host.id }
                        } catch (e) {
                            if (e instanceof Error)
                                logger.error(`FrigateHostUpdates updateHostsState: ${e.message}`)
                            return { success: false, hostId: host.id }
                        }
                    }))

                    const successCount = results.filter(result => result.success).length
                    const failtureCount = results.length - successCount
                    logger.debug(`FrigateHostUpdates update states finished at ${(Date.now() - startTime) / 1000} sec. 
                                Success: ${successCount}, Failed: ${failtureCount}`)
                }
            }
            FrigateHostUpdates._updateHostsStateProgress = false
            await sleep(updateTimer)
        }
    }


    private async updateCamerasState() {
        let updateTimer = 10000
        const updateConditions = !FrigateHostUpdates._updateCamerasProgress ||
            !FrigateHostUpdates._updateInProgress ||
            !dev.disableUpdates
        while (true) {
            if (updateConditions) {
                FrigateHostUpdates._updateCamerasProgress = true
                const startTime = Date.now()
                try {
                    logger.debug(`FrigateHostUpdates Start cameras states update...`)
                    const hosts = await this._frigateHostsService.getAllFrigateHosts()
                    if (hosts.length > 0) {
                        for (const host of hosts) {
                            const stats = await this.fetchStats(host)
                            if (stats) {
                                const parsedStats = this.parseCamerasStats(stats)
                                if (parsedStats && parsedStats.length > 0) {
                                    const hostCameras = (await this._frigateHostsService.getFrigateHostById(host.id)).cameras
                                    const statsMap = new Map(parsedStats.map(stat => [stat.name, stat.state]));
                                    // logger.silly(`hostCameras before: ${JSON.stringify(hostCameras.slice(0,2).map(cam=>({name: cam.name, state: cam.state})))}`)
                                    hostCameras.forEach(camera => {
                                        if (statsMap.has(camera.name)) {
                                            camera.state = statsMap.get(camera.name) ?? null;
                                        }
                                    })
                                    // logger.debug(`hostCameras after: ${JSON.stringify(hostCameras.slice(0,2).map(cam=>({name: cam.name, state: cam.state})))}`)
                                    await this.updateHostCamerasState(host.id, hostCameras)
                                    logger.silly(`FrigateHostUpdates Updated from ${host.name} cameras state: ${JSON.stringify(hostCameras.flatMap(cam => cam.name))}`)
                                    logger.debug(`FrigateHostUpdates Updated from ${host.name} ${hostCameras.length} cameras states`)
                                    updateTimer = 60000
                                }
                            }
                        }
                    }
                } catch (e) {
                    logger.error(`FrigateHostUpdates ${e.message}`)
                    updateTimer = 10000
                } finally {
                    logger.debug(`FrigateHostUpdates End update cameras state at ${(Date.now() - startTime) / 1000} sec`)
                    FrigateHostUpdates._updateCamerasProgress = false
                }
            } else updateTimer = 10000
            await sleep(updateTimer)
        }
    }

    private async updateHostCamerasState(hostId: string, cameras: Camera[]) {
        if (cameras.length < 1) return
        return await Promise.all(cameras.map(async camera => {
            logger.silly(`FrigateHostUpdates update host ${hostId} camera ${JSON.stringify(camera)}`)
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

    private async fetchStats(host: FrigateHost) {
        try {
            if (!host.enabled) return undefined
            logger.debug(`FrigateHostUpdates Fetch stats from ${host.name}`)
            const hostURL = new URL(host.host)
            const configURL = hostURL.toString() + FrigateAPIUrls.stats
            return await this.fetcher<any>(configURL)
        } catch (e) {
            logger.error(`FrigateHostUpdates Error fetch config from ${host.name}: ${e.message}`)
            return undefined
        }
    }

    private async updateCamerasFromHost() {
        if (FrigateHostUpdates._updateInProgress || dev.disableUpdates) return
        const updateTimer = 60000
        while (true) {
            FrigateHostUpdates._updateInProgress = true
            const startTime = Date.now()
            try {
                logger.debug(`FrigateHostUpdates Start update host cameras...`)
                // get all hosts
                const hosts = await this._frigateHostsService.getAllFrigateHosts()
                if (hosts.length > 0) {
                    for (const host of hosts) {
                        // get cameras from host
                        const config: FrigateConfig | undefined = await this.fetchConfig(host)
                        if (config) {
                            logger.debug(`FrigateHostUpdates Fetched cameras from host ${host.name}`)
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
                logger.error(`FrigateHostUpdates ${e.message}`)
            } finally {
                logger.debug(`FrigateHostUpdates End update hosts cameras at ${(Date.now() - startTime) / 1000} sec`)
                FrigateHostUpdates._updateInProgress = false
            }
            await sleep(updateTimer)
        }
    }

    async fetchConfig(host: FrigateHost) {
        try {
            if (!host.enabled) return undefined
            logger.debug(`FrigateHostUpdates Fetch config from ${host.name}`)
            const hostURL = new URL(host.host)
            const configURL = hostURL.toString() + FrigateAPIUrls.config
            return await this.fetcher<FrigateConfig>(configURL)
        } catch (e) {
            logger.error(`FrigateHostUpdates Error fetch config from ${host.name}: ${e.message}`)
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
                    logger.error(`FrigateHostUpdates updateHostCamerasWConfig ${e.message}`)
                    return undefined
                }
            }
            return undefined
        }))
    }

    private async updateHostCameraConfig(host: FrigateHost, camera: Camera, inputCamera: InputCamera) {
        if (!inputCamera.config) throw new ErrorApp('runtime', `FrigateHostUpdates ${host.id} config does not exist`)
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
            logger.silly(`FrigateHostUpdates updateCamerasFromHost notExistInInput: ${JSON.stringify(notExistInInput)}`)
            const deleteCameras = await this.deleteHostCameras(host.id, notExistInInput.flatMap(cam => cam.id))
            if (deleteCameras) {
                logger.debug(`FrigateHostUpdates Deleted cameras: ${JSON.stringify(deleteCameras.cameras.flatMap(cam => cam.name))}`)
            }
        }
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

    private async createCamerasFromInput(inputCameras: InputCamera[], dbHostCameras: Camera[], host: FrigateHost) {
        const notExistInDb = inputCameras.filter(
            inputCamera => !dbHostCameras.some(cameraHost => inputCamera.name === cameraHost.name)
        )
        if (notExistInDb && notExistInDb.length > 0) {
            logger.debug(`FrigateHostUpdates create cameras...: ${JSON.stringify(notExistInDb.flatMap(cam => cam.name))}`)
            const createdCameras = await this.createHostCamerasWConfig(host.id, notExistInDb)
            if (createdCameras) {
                const camerasNames = createdCameras.flatMap(item => item.cameras.flatMap(cam => cam.name))
                logger.debug(`FrigateHostUpdates Created cameras: ${JSON.stringify(camerasNames)}`)
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
        if (!inputCamera.config) throw new ErrorApp('runtime', `FrigateHostUpdates ${host.id} config does not exist`)
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

    private parseCamerasNamesAndConfig(config: FrigateConfig): InputCamera[] {
        return Object.entries(config.cameras).map(
            ([name, config]) => ({ name, config }))
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

}

export default FrigateHostUpdates