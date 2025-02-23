import CameraService from "../modules/camera/camera.service";
import ConfigService from "../modules/config/config.service";
import ConfigOIDPService from "../modules/config/oidp/config.oidp.service";
import FrigateHostsService from "../modules/frigate-hosts/frigate-hosts.service";
import OIDPService from "../modules/oidp/oidp.service";
import RolesService from "../modules/roles/roles.service";
import TagService from "../modules/tag/tag.service";
import UserService from "../modules/users/users.service";

export type MockedServices = {
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