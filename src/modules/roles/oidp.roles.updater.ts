import { dev } from "../../consts"
import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import { sleep } from "../../utils/sleep"
import CameraService from "../camera/camera.service"
import { ErrorApp } from "../hooks/error.handler"
import OIDPService, { OIDPAuthState } from "../oidp/oidp.service"
import { RoleCoreSchema, MissingRolesSchema } from "./roles.schema"
import RolesService from "./roles.service"


class OIDPRolesUpdater {
    private static _instance: OIDPRolesUpdater
    private updateTimer = 60000
    oidpService = OIDPService.getInstance()
    private rolesService: RolesService
    prismaClient = prisma.role
    cameraService = CameraService.getInstance()

    private constructor(rolesService: RolesService) {
        this.rolesService = rolesService;
        this.updateRolesJob(this.updateTimer)
        logger.debug(`OIDPRolesUpdater initialized`)
    }

    public static getInstance(rolesService: RolesService) {
        if (!OIDPRolesUpdater._instance) {
            return new OIDPRolesUpdater(rolesService)
        }
        return OIDPRolesUpdater._instance
    }

    private async updateRolesJob(updatePeriod: number = 5000) {
        while (true && !dev.disableUpdates) {
            const startTime = Date.now()
            try {
                logger.debug('OIDPRolesUpdater starting updateRoles...')
                await this.updateRoles()
            } catch (e) {
                logger.error(e.message)
            } finally {
                logger.debug(`OIDPRolesUpdater finish updateRoles at ${(Date.now() - startTime) / 1000} sec`)
            }
            await sleep(updatePeriod)
        }
    }

    async updateRoles(): Promise<RoleCoreSchema[]> {
        if (OIDPService.authState === OIDPAuthState.Completed) {
            const data = await this.oidpService.fetchRoles()
            if (data) {
                const roles: RoleCoreSchema[] = data.map(({ id, name }) => ({ id, name }))
                if (!roles || roles.length < 1) throw new ErrorApp('internal', 'OIDPRolesUpdater cannot get roles from OIDP')
                else {
                    await this.saveRolesToDb(roles)
                    const missingRoles = await this.findNonExistRolesInDb(roles)
                    await this.deleteNonExistRoles(missingRoles)
                    return roles
                }
            }
        }
        return []
    }

    private async saveRolesToDb(roles: RoleCoreSchema[]) {
        await Promise.all(roles.map(role => this.rolesService.upsertRole(role)))
        logger.debug(`OIDPRolesUpdater updated roles: ${roles.length}`)
    }

    private async findNonExistRolesInDb(inputRoles: RoleCoreSchema[]) {
        const rolesInDb = await this.prismaClient.findMany({ include: { cameras: true } })
        return rolesInDb.filter(
            dbrole => !inputRoles.some(inputRole => dbrole.id === inputRole.id)
        )
    }

    private async deleteNonExistRoles(dbRoles: MissingRolesSchema) {
        const roleIds = dbRoles.map(role => role.id)
        const camerasIds = this.getUniqueCamerasIds(dbRoles)
        await this.prismaClient.deleteMany({
            where: {
                id: {
                    in: roleIds
                }
            }
        })
        await this.cameraService.deleteRoles(camerasIds, roleIds)
        logger.debug(`OIDPRolesUpdater deleted roles: ${roleIds.length}`)
    }

    private getUniqueCamerasIds(dbRoles: MissingRolesSchema) {
        return [...dbRoles.reduce((acc, role) => {
            role.cameraIDs.forEach(id => acc.add(id));
            return acc;
        }, new Set<string>())];
    }
}

export default OIDPRolesUpdater