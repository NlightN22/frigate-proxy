import { logger } from "../../utils/logger"
import { AuthUser, UserByRole } from "../oidp/oidp.schema"
import OIDPService from "../oidp/oidp.service"

class UserService {
    private static _instance: UserService

    oidpService = OIDPService.getInstance()

    public static getInstance() {
        if (!UserService._instance) {
            UserService._instance = new UserService()
        }
        return UserService._instance
    }

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

export default UserService