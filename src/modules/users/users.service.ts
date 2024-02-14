import { OIDPService } from "../auth/oidp.service"

export class UserService {
    private authService: OIDPService

    constructor () {
        this.authService = new OIDPService()
    }

    async getUsers() {
        return await this.authService.fetchUsers()
    }

    async getUsersByRole(roleName: string) {
        return await this.authService.fetchUsersByRole(roleName)
    }
}