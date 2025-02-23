import sinon from 'sinon';
import { ImportMock, MockManager } from "ts-mock-imports";
import * as camerasService from '../modules/camera/camera.service';
import FrigateHostsService from '../modules/frigate-hosts/frigate-hosts.service';
import OIDPService, * as oidpService from '../modules/oidp/oidp.service';
import * as rolesService from '../modules/roles/roles.service';
import * as userService from '../modules/users/users.service';
import ConfigService from '../modules/config/config.service';
import ConfigOIDPService from '../modules/config/oidp/config.oidp.service';

type MockedServices = {
    frigateHostsService?: sinon.SinonStubbedInstance<FrigateHostsService> // sinon
    rolesService?: MockManager<any>; // ts-mock
    oidpService?: MockManager<any>; // ts-mock
    userService?: MockManager<any>; // ts-mock
    camerasService?: MockManager<any>; // ts-mock
    configService?: MockManager<any>; // ts-mock
    configOIDPService?: sinon.SinonStubbedInstance<ConfigOIDPService> // sinon
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
        },
        configService: () => {
            const mockInstance = sinon.createStubInstance(ConfigService);
            // Mock the static method `getInstance` to return this mock instance
            const mock = ImportMock.mockFunction(ConfigService, 'getInstance', mockInstance);
            mocks['configService'] = mock;
        },
        configOIDPService: () => {
            const mockInstance = sinon.createStubInstance(ConfigOIDPService);
            // Mock the static method `getInstance` to return this mock instance
            sinon.stub(ConfigOIDPService, "getInstance").returns(mockInstance);
            mocks['configOIDPService'] = mockInstance;
        }
    }

    Object.entries(services).forEach(([key, mockFunction]) => {
        if (!exclude.includes(key)) {
            mockFunction();
        }
    })

    return mocks
}