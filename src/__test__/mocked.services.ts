import { ImportMock } from "ts-mock-imports"
import * as oidpService from '../modules/oidp/oidp.service';
import * as frigateHostsService from '../modules/frigate-hosts/frigate-hosts.service';
import * as rolesService from '../modules/roles/roles.service';
import * as camerasService from '../modules/camera/camera.service';
import * as userService from '../modules/users/users.service';
import sinon from 'sinon';

export const mockServices = (exclude: string[] = []) => {
    const services = {
        frigateHostsService: () => {
            const service = ImportMock.mockStaticClass(frigateHostsService, 'default')
            service.mock('getInstance', service.getMockInstance())
        },
        rolesService: () => ImportMock.mockClass(rolesService, 'default'),
        oidpService: () => ImportMock.mockClass(oidpService, 'default'),
        userService: () => ImportMock.mockClass(userService, 'UserService'),
        camerasService: () => ImportMock.mockClass(camerasService, 'default'),
    };

    Object.entries(services).forEach(([key, mockFunction]) => {
        if (!exclude.includes(key)) {
            mockFunction();
        }
    });
}