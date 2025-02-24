import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import CameraService from "../camera/camera.service"
import OIDPRolesUpdater from "./oidp.roles.updater"
import { RoleCoreSchema } from "./roles.schema"

class RolesService {
    private static _instance: RolesService
    private oidpRolesUpdater: OIDPRolesUpdater

    prismaClient = prisma.role
    cameraService = CameraService.getInstance()

    public static getInstance() {
        if (!RolesService._instance) {
            RolesService._instance = new RolesService()
        }
        return RolesService._instance
    }

    constructor() {
        this.oidpRolesUpdater = OIDPRolesUpdater.getInstance(this)
        logger.debug(`RolesService initialized`)
    }

    async getAllRoles() {
        return await this.prismaClient.findMany({
            include: {
                cameras: true
            }
        })
    }

    async getRoleOrError(id: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: { id: id },
            include: { cameras: true }
        })
    }

    async upsertCameras(roleId: string, inputCamerasID: string[]) {
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

    async upsertRole(role: RoleCoreSchema) {
        const { id, ...rest } = role
        return this.prismaClient.upsert({
            where: { id: role.id },
            update: { ...rest },
            create: role
        })
    }

    updateRoles() { return this.oidpRolesUpdater.updateRoles() }
}

export default RolesService