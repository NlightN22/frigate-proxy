import { dev } from "../../consts"
import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import { sleep } from "../../utils/sleep"
import FrigateHostsService from "../frigate-hosts/frigate-hosts.service"


class FrigateHostUpdater {
    private static _instance: FrigateHostUpdater
    static _updateInProgress = false
    private static _updateHostsStateProgress = false
    private _frigateHostsService: FrigateHostsService
    private prismaClient = prisma.frigateHost

    private constructor(frigateHostsService: FrigateHostsService) {
        this._frigateHostsService = frigateHostsService;
        this.updateHostsState()
        logger.debug(`FrigateHostUpdater initialized`)
    }

    public static initialize(frigateHostsService: FrigateHostsService) {
        if (!FrigateHostUpdater._instance) {
            FrigateHostUpdater._instance = new FrigateHostUpdater(frigateHostsService);
        }
    }

    private async updateHostsState() {
        const updateTimer = 20000
        const updateConditions = !FrigateHostUpdater._updateHostsStateProgress || !dev.disableUpdates
        while (true) {
            if (updateConditions) {
                FrigateHostUpdater._updateHostsStateProgress = true
                logger.debug(`FrigateHostUpdater Start hosts states update...`)
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
                                logger.error(`FrigateHostUpdater updateHostsState: ${e.message}`)
                            return { success: false, hostId: host.id }
                        }
                    }))

                    const successCount = results.filter(result => result.success).length
                    const failtureCount = results.length - successCount
                    logger.debug(`FrigateHostUpdater update states finished at ${(Date.now() - startTime) / 1000} sec. 
                                Success: ${successCount}, Failed: ${failtureCount}`)
                }
            }
            FrigateHostUpdater._updateHostsStateProgress = false
            await sleep(updateTimer)
        }
    }
}

export default FrigateHostUpdater