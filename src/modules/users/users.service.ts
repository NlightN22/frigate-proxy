import { oidpService } from "../shared.service"

export class UserService {
    async getUsers() {
        return await oidpService.fetchUsers()
    }

    async getUsersByRole(roleName: string) {
        return await oidpService.fetchUsersByRole(roleName)
    }
}