import { logger } from "../../utils/logger"
import { AuthUser, UserByRole } from "../oidp/oidp.schema"
import OIDPService from "../oidp/oidp.service"

export class UserService {
    oidpService = OIDPService.getInstance()

    constructor () {
        logger.debug(`UserService initialized`)
    }
    async getUsers(): Promise<AuthUser[]> {
        return await this.oidpService.fetchUsers()
    }

    async getUsersByRole(roleName: string): Promise<UserByRole[]> {
        return await this.oidpService.fetchUsersByRole(roleName)
    }
}