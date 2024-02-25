import { dev } from "../../consts"
import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import { sleep } from "../../utils/sleep"
import OIDPService, { OIDPAuthState } from "../oidp/oidp.service"
import CameraService from "../camera/camera.service"
import { ErrorApp } from "../hooks/error.handler"
import { MissingRolesSchema, ResponseRoleSchema, ResponseRolesSchema, RoleCoreSchema } from "./roles.schema"

class RolesService {
    prismaClient = prisma.role
    cameraService = new CameraService()
    oidpService = OIDPService.getInstance()

    constructor() {
        this.updateRoles(60000)
        logger.debug(`ConfigService initialized`)
    }

    async getAllRoles() {
        return await this.prismaClient.findMany({
            include: {
                cameras: true
            }
        })
    }

    async getRoleOrNull(id: string) {
        return await this.prismaClient.findUnique({
            where: { id: id },
            include: { cameras: true }
        })
    }

    async getRoleOrError(id: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: { id: id },
            include: { cameras: true }
        })
    }

    async getRolesByCamera(cameraId: string) {
        return await this.prismaClient.findMany({
            where: {
                cameraIDs: {
                    has: cameraId
                }
            },
            include: { cameras: true }
        })
    }

    async editCameras(roleId: string, inputCamerasID: string[]) {
        if (inputCamerasID.length < 1) throw new ErrorApp('validate', 'Nothing to add')
        const { cameraIDs } = await this.prismaClient.findUniqueOrThrow({ where: { id: roleId } })
        const newIds = inputCamerasID.filter(inputId => !cameraIDs.includes(inputId))
        const notExistIds = cameraIDs.filter(id => !inputCamerasID.some(inputId => id === inputId))
        if (notExistIds.length > 0) await this.deleteCameras(roleId, notExistIds)
        await this.cameraService.addRoles(inputCamerasID, [roleId])
        return await this.prismaClient.update({
            where: { id: roleId },
            data: {
                cameraIDs: { push: newIds }
            },
            include: { cameras: true }
        })
    }

    async deleteCameras(roleId: string, inputCamerasID: string[]) {
        if (inputCamerasID.length < 1) throw new ErrorApp('validate', 'Nothing to delete')
        const { cameraIDs } = await this.prismaClient.findUniqueOrThrow({ where: { id: roleId } })
        const updatedIds = cameraIDs.filter(id => !inputCamerasID.some(inputId => id === inputId))
        await this.cameraService.deleteRoles(inputCamerasID, [roleId])
        return await this.prismaClient.update({
            where: { id: roleId },
            data: {
                cameraIDs: updatedIds
            },
            include: { cameras: true }
        })
    }

    private async updateRoles(updatePeriod: number = 5000) {
        while (true && !dev.disableUpdates) {
            const startTime = Date.now()
            try {
                if (OIDPService.authState === OIDPAuthState.Completed) {
                    logger.debug('Start updateRoles')
                    const data = await this.oidpService.fetchRoles()
                    // logger.debug(JSON.stringify(data))
                    if (data) {
                        const roles: RoleCoreSchema[] = data.map(({ id, name }) => ({ id, name }))
                        if (!roles || roles.length < 1) throw new Error('Cannot get roles from OIDP')
                        else {
                            await this.saveRolesToDb(roles)
                            const missingRoles = await this.findNonExistRolesInDb(roles)
                            await this.deleteNonExistRoles(missingRoles)
                        }
                    }
                }
            } catch (e) {
                logger.error(e.message)
            } finally {
                logger.debug(`Finish updateRoles at ${(Date.now() - startTime) / 1000} sec`)
            }
            await sleep(updatePeriod)
        }
    }

    private async upsertRole(role: RoleCoreSchema) {
        const { id, ...rest } = role
        return this.prismaClient.upsert({
            where: { id: role.id },
            update: { ...rest },
            create: role
        })
    }

    private async saveRolesToDb(roles: RoleCoreSchema[]) {
        await Promise.all(roles.map(role => this.upsertRole(role)))
        logger.debug(`Updated roles: ${roles.length}`)
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
        logger.debug(`Deleted roles: ${roleIds.length}`)
    }

    private getUniqueCamerasIds(dbRoles: MissingRolesSchema) {
        return [...dbRoles.reduce((acc, role) => {
            role.cameraIDs.forEach(id => acc.add(id));
            return acc;
        }, new Set<string>())];
    }
}

export default RolesService