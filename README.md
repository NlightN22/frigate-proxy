# Proxy Frigate features
Work with multiple Frigate hosts.
Native downloading of recordings.
Simple search for recordings.
Based on the roles that you have defined in OIDP (OpenID provider), you can grant access to the cameras on the client in the Access section.

## How it works
I created frigate-proxy server witch proxy requests frigate servers API.
Proxy API at http://your-backend.com:4000/documentation

## Installation
* Installing and configuring the keycloak authorization server
* Create keycloak client for frigate-proxy server. You can test them on https://www.keycloak.org/app/
* Create keycloack user for frigate-proxy server.
* Grant access to the keycloack user for viewing keycloak roles. Role named - 'view-roles'
* You can check access to the roles by POST query to https://your.keycloack.server:8443/admin/realms/frigate-realm/roles, with an access token, of course.
* Create users and assing roles for them at keycloak
* Assing admin role to admin user
* Create folder /opt/frigate
* Download files from [example folder](https://github.com/NlightN22/frigate-proxy/tree/master/example) to /opt/frigate
* Rename `example.docker-compose.yml` to `docker-compose.yml`.
* Define your parameters in the compose file. It has comments and predefined parameters.
* Check the compose config:
```bash 
docker compose config
``` 
* Run containers:
```bash
docker compose up -d
```

## Environment variables in docker-compose.yml:
### necessary:
```yml
SERVER: http://0.0.0.0:4000 # FQDN or IP
DATABASE_URL: "mongodb://username:password@localhost:27017/database-name?retryWrites=true&w=majority&authSource=admin" # Mongo DB at replica set mode
ENCRYPTION_KEY: "YOUR_SUPER_SECRET_KEY_FOR_ENCRYPTED_SETTINGS" # for saving and reading encrypt settings in DB
```
### optional:
```yml
LOG_LEVEL: debug
RATE_LIMIT: 100 # optional, requests rate limit per TIME_WINDOW, default 1000
TIME_WINDOW: 60000 # optional, requsts time window, default 60000
```
log levels: 
* error: 0,
* warn: 1,
* info: 2,
* http: 3,
* verbose: 4,
* debug: 5,
* silly: 6

### Additional information for Proxmox
If you want to use proxmox you must pass through your devices to the LXC container.
Example of an LXC container in the [example folder](https://github.com/NlightN22/frigate-proxy/tree/master/example).
More information can be read in the [frigate discussion](https://github.com/blakeblackshear/frigate/discussions/5773).

### Thanks to
* [Frigate](https://github.com/blakeblackshear/frigate) backend and frontend nvr server.
* [Keycloak](https://github.com/keycloak/keycloak) Open Source Identity and Access Management solution for modern Applications and Services.

### How to build with your features:
* Download the project.
* Install packages: `yarn`
* Build the project: `yarn build`
* Create a `.env` file with all neccessary environments.
* Run in production mode: `yarn prod` or in development mode: `yarn dev`