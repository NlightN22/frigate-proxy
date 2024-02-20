import { logger } from "../../utils/logger"
import OIDPService from "../oidp/oidp.service"

export class UserService {
    oidpService = OIDPService.getInstance()

    constructor () {
        logger.debug(`UserService initialized`)
    }
    async getUsers() {
        return await this.oidpService.fetchUsers()
    }

    async getUsersByRole(roleName: string) {
        return await this.oidpService.fetchUsersByRole(roleName)
    }
}