import { dev } from "../../consts"
import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import { sleep } from "../../utils/sleep"
import { OIDPService, OIDPAuthState } from "../auth/oidp.service"
import { MissingRolesSchema, ResponseRoleSchema, ResponseRolesSchema } from "./roles.schema"

export class RolesService {
    private authService: OIDPService
    prismaClient = prisma.roles

    constructor() {
        this.authService = new OIDPService()
        this.updateRoles(60000)
    }

    async getRoles() {
        return await this.prismaClient.findMany()
    }

    async getRoleOrNull(id: string) {
        return await this.prismaClient.findUnique({
            where: { id: id }
        })
    }

    async getRoleOrError(id: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: { id: id }
        })
    }

    async updateRoles(updatePeriod: number = 5000) {
        while (true && !dev.disableUpdates) {
            const startTime = Date.now()
            try {
                if (OIDPService.authState === OIDPAuthState.Completed) {
                    logger.debug('Start updateRoles')
                    const data = await this.authService.fetchRoles()
                    // logger.debug(JSON.stringify(data))
                    if (data) {
                        const roles: ResponseRoleSchema[] = data.map(({ id, name }) => ({ id, name }))
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

    async upsertRole(role: ResponseRoleSchema) {
        const { id, ...rest } = role
        return this.prismaClient.upsert({
            where: { id: role.id },
            update: { ...rest },
            create: role
        })
    }

    async deleteRole(role: ResponseRoleSchema) {
        return this.prismaClient.delete({
            where: { id: role.id }
        })
    }

    async saveRolesToDb(roles: ResponseRolesSchema) {
        await Promise.all(roles.map(role => this.upsertRole(role)))
    }

    async findNonExistRolesInDb(inputRoles: ResponseRolesSchema) {
        const rolesInDb = await this.prismaClient.findMany({ include: { cameras: true } })
        return rolesInDb.filter(
            dbrole => !inputRoles.some(inputRole => dbrole.id === inputRole.id)
        )
    }

    async deleteNonExistRoles(dbRoles: MissingRolesSchema) {
        dbRoles.map(async role => {
            await this.prismaClient.delete({
                where: { id: role.id }
            })
            logger.debug(`Deleted role: ${JSON.stringify(role)}`)
        })
    }
}