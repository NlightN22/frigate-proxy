import i18n from 'i18next';
import sinon from 'sinon';
import CameraService from '../modules/camera/camera.service';
import ConfigService from '../modules/config/config.service';
import ConfigOIDPService from '../modules/config/oidp/config.oidp.service';
import FrigateHostsService from '../modules/frigate-hosts/frigate-hosts.service';
import OIDPService from '../modules/oidp/oidp.service';
import RolesService from '../modules/roles/roles.service';
import UserService from '../modules/users/users.service';
import TagService from '../modules/tag/tag.service';

type MockedServices = {
    frigateHostsService?: sinon.SinonStubbedInstance<FrigateHostsService>
    rolesService?: sinon.SinonStubbedInstance<RolesService>; 
    oidpService?:sinon.SinonStubbedInstance<OIDPService>
    userService?: sinon.SinonStubbedInstance<UserService>
    camerasService?: sinon.SinonStubbedInstance<CameraService>
    configService?: sinon.SinonStubbedInstance<ConfigService>
    configOIDPService?: sinon.SinonStubbedInstance<ConfigOIDPService>
    tagService?: sinon.SinonStubbedInstance<TagService>
    i18n?: sinon.SinonStub<any[], any>; // sinon function
};

export const mockServices = (exclude: string[] = []) : MockedServices => {

    const mocks = {}

    const services = {
        frigateHostsService: () => {
            // Create a sinon stub instance for the FrigateHostsService
            const mockInstance = sinon.createStubInstance(FrigateHostsService);
            
            // Mock the static method `getInstance` to return this mock instance
            sinon.stub(FrigateHostsService, "getInstance").returns(mockInstance);
            mockInstance.upsertFrigateHost.restore();
            mockInstance.upsertFrigateHosts.restore();
            mocks['frigateHostsService'] = mockInstance;
            
        },
        rolesService: () => {
            const mockInstance = sinon.createStubInstance(RolesService);
            // Mock the static method `getInstance` to return this mock instance
            sinon.stub(RolesService, "getInstance").returns(mockInstance);
            mocks['rolesService'] = mockInstance;
        },
        oidpService: () => {
            const mockInstance = sinon.createStubInstance(OIDPService);
            // Mock the static method `getInstance` to return this mock instance
            sinon.stub(OIDPService, "getInstance").returns(mockInstance);
            mocks['oidpService'] = mockInstance;
        },
        userService: () => {
            const mockInstance = sinon.createStubInstance(UserService);
            // Mock the static method `getInstance` to return this mock instance
            sinon.stub(UserService, "getInstance").returns(mockInstance);
            mocks['userService'] = mockInstance;
        },
        camerasService: () => {
            const mockInstance = sinon.createStubInstance(CameraService);
            // Mock the static method `getInstance` to return this mock instance
            sinon.stub(CameraService, "getInstance").returns(mockInstance);
            mocks['camerasService'] = mockInstance;
        },
        configService: () => {
            const mockInstance = sinon.createStubInstance(ConfigService);
            // Mock the static method `getInstance` to return this mock instance
            sinon.stub(ConfigService, "getInstance").returns(mockInstance);
            mocks['configService'] = mockInstance;
        },
        configOIDPService: () => {
            const mockInstance = sinon.createStubInstance(ConfigOIDPService);
            // Mock the static method `getInstance` to return this mock instance
            sinon.stub(ConfigOIDPService, "getInstance").returns(mockInstance);
            mocks['configOIDPService'] = mockInstance;
        },
        tagService: () => {
            const mockInstance = sinon.createStubInstance(TagService)
            sinon.stub(TagService, "getInstance").returns(mockInstance)
            mocks['tagService'] = mockInstance
        },
        i18n: () => {
            const mock = sinon.stub(i18n, 'init');
            mocks['i18n'] = mock
        }
    }

    Object.entries(services).forEach(([key, mockFunction]) => {
        if (!exclude.includes(key)) {
            mockFunction();
        }
    })

    return mocks
}