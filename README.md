
# ACL Frigate features
Work with multiple frigate hosts.
Native downloading recordings.
Simple search recordings.
Based on the roles you have defined, you can grant access on the client in the Access section.

## How it works
I created frigate-proxy server witch modify answers from frigate API. 
And that is the reason for set frigate server to private localhost (127.0.0.1) and must be closed from external connections!
I don't want to modify frigate backend and frontend too much, and i added only two pages on frontend.
I can't make normal build for frontend, because vite builder had too much modifications, and it does not work correctly. 
And the one more reason to not use builder - frigate production version works on docker with root rights, like node.
I mainly use nestjs, mongodb, mongo-express. Mongo-express is optional


## Installation
* Installing and configuring the keycloak authorization server
* Create keycloak client for frigate-proxy server. You can test them on https://www.keycloak.org/app/
* Create keycloack user for frigate-proxy server.
* Grant access to the keycloack user for viewing keycloak roles. Role named - 'view-roles'
* You can check access to the roles by POST query to https://your.keycloack.server:8443/admin/realms/frigate-realm/roles. With access_token, of course.
* Create users and assing roles for them at keycloak
* Assing admin role to admin user
* Create folder /opt/frigate
* Download docker-compose.example.yml from [example folder](https://github.com/NlightN22/frigate-acl/tree/master/example) to /opt/frigate
* Download config.example.yml from [example folder](https://github.com/NlightN22/frigate-acl/tree/master/example) to /opt/frigate
* Define your params at compose and config files. They have comments and predefined params.
* Check compose config
```bash 
docker compose config
``` 
* Run containers 
```bash
docker compose up -d
```

## Necessary environment variables:
```bash
SERVER=http://localhost:4000 # FQDN or IP
DATABASE_URL="mongodb://username:password@localhost:27017/database-name?retryWrites=true&w=majority&authSource=admin" # Mongo DB at cluster mode
ENCRYPTION_KEY="YOUR_SUPER_SECRET_KEY_FOR_ENCRYPTED_SETTINGS"
```

### Additional for Proxmox
If you want to use proxmox you must passing through lxc container your devices.
Example of lxc container at [example folder](https://github.com/NlightN22/frigate-acl/tree/master/example).
More information you can read at [frigate discussion](https://github.com/blakeblackshear/frigate/discussions/5773).

### Thanks to
* [Frigate](https://github.com/blakeblackshear/frigate) backend and frontend nvr server.
* [Keycloak](https://github.com/keycloak/keycloak) Open Source Identity and Access Management solution for modern Applications and Services.