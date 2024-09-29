import { ImportMock, MockManager } from "ts-mock-imports";
import * as camerasService from '../modules/camera/camera.service';
import FrigateHostsService, * as frigateHostsService from '../modules/frigate-hosts/frigate-hosts.service';
import * as oidpService from '../modules/oidp/oidp.service';
import * as rolesService from '../modules/roles/roles.service';
import * as userService from '../modules/users/users.service';
import { testFrigateHostSchema } from "./test.schemas";
import sinon from 'sinon'

type MockedServices = {
    frigateHostsService?: sinon.SinonStubbedInstance<FrigateHostsService>
    rolesService?: MockManager<any>;
    oidpService?: MockManager<any>;
    userService?: MockManager<any>;
    camerasService?: MockManager<any>;
};

export const mockServices = (exclude: string[] = []) : MockedServices => {

    const mocks = {}

    const services = {
        frigateHostsService: () => {
            // Create a sinon stub instance for the FrigateHostsService
            const mockInstance = sinon.createStubInstance(FrigateHostsService);
            
            // Mock the static method `getInstance` to return this mock instance
            ImportMock.mockFunction(FrigateHostsService, 'getInstance', mockInstance);
            mockInstance.upsertFrigateHost.restore();
            mockInstance.upsertFrigateHosts.restore();
            mocks['frigateHostsService'] = mockInstance;
            
        },
        rolesService: () => {
            const mock = ImportMock.mockClass(rolesService, 'default')
            mocks['rolesService'] = mock;
        },
        oidpService: () => {
            const mock = ImportMock.mockClass(oidpService, 'default')
            mocks['oidpService'] = mock;
        },
        userService: () => {
            const mock = ImportMock.mockClass(userService, 'UserService')
            mocks['userService'] = mock;
        },
        camerasService: () => {
            const mock = ImportMock.mockClass(camerasService, 'default')
            mocks['camerasService'] = mock;
        }
    }

    Object.entries(services).forEach(([key, mockFunction]) => {
        if (!exclude.includes(key)) {
            mockFunction();
        }
    })

    return mocks
}