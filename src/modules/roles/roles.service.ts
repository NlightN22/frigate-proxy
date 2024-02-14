import { dev } from "../../consts"
import { logger } from "../../utils/logger"
import prisma from "../../utils/prisma"
import { sleep } from "../../utils/sleep"
import { OIDPService, OIDPAuthState } from "../auth/oidp.service"
import { ResponseRoleSchema } from "./roles.schema"

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

    async saveRolesToDb(roles: ResponseRoleSchema[]) {
        for (const role of roles) {
            const { id, ...rest } = role
            await this.prismaClient.upsert({
                where: { id: role.id },
                update: { ...rest },
                create: role
            })
        }
    }
}