import axios from "axios";
import prisma from "../../utils/prisma";
import { ErrorApp } from "../hooks/error.handler";
import { CreateHostsSchema, ResponseHostStatisSchema, UpdateHostSchema, UpdateHostsSchema, createHostSchema, } from "./frigate-hosts.schema";
import { FrigateAPIUrls } from "./frigate-api.urls";
import { logger } from "../../utils/logger";
import FrigateHostUpdater from "./frigatehost.updater";
import FrigateCamerasUpdater from "./frigate.cameras.updater";

class FrigateHostsService {
    private static _instance: FrigateHostsService
    private prismaClient = prisma.frigateHost

    private constructor() {
        logger.debug(`FrigateHostsService initialize update service...`)
        FrigateHostUpdater.initialize(this)
        FrigateCamerasUpdater.initialize(this)
        logger.debug(`FrigateHostsService initialized`)
    }

    public static getInstance() {
        if (!FrigateHostsService._instance) {
            FrigateHostsService._instance = new FrigateHostsService()
        }
        return FrigateHostsService._instance
    }

    private async fetcher<T>(url: string): Promise<T> {
        const response = await axios.get<T>(url, {
            timeout: 10000,
        })
        return response.data
    }

    async createFrigateHosts(input: CreateHostsSchema) {
        return await this.prismaClient.createMany({
            data: input
        })
    }
    async updateFrigateHost(id: string, input: UpdateHostSchema) {
        return await this.prismaClient.update({
            where: {
                id: id
            },
            data: input
        })
    }
    async updateFrigateHosts(input: UpdateHostsSchema) {
        const hostsIds = input.map(host => host.id)
        return await this.prismaClient.updateMany({
            where: {
                id: { in: hostsIds }
            },
            data: input
        })
    }


    async upsertFrigateHost(input: UpdateHostSchema) {
        const parsedHost = createHostSchema.parse(input)
        return await this.prismaClient.upsert({
            where: { id: input.id },
            update: parsedHost,
            create: parsedHost
        })
    }

    async upsertFrigateHosts(input: UpdateHostsSchema) {
        return await Promise.all(input.map(host => this.upsertFrigateHost(host)))
    }

    async getAllFrigateHosts() {
        return await this.prismaClient.findMany()
    }

    async getAllFrigateHostsWithCameras() {
        return await this.prismaClient.findMany({ include: { cameras: true } })
    }
    async getFrigateHostByHost(host: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: {
                host
            },
            include: {
                cameras: true
            }
        })
    }

    async getFrigateHostByName(name: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: {
                name
            },
            include: {
                cameras: true
            }
        })
    }

    async getFrigateHostById(id: string) {
        return await this.prismaClient.findUniqueOrThrow({
            where: {
                id: id
            },
            include: {
                cameras: true
            }
        })
    }

    async getFrigateHostOrNull(id: string) {
        return await this.prismaClient.findUnique({
            where: {
                id: id
            }
        })
    }

    async deleteFrigateHostById(id: string) {
        return this.prismaClient.delete({
            where: {
                id: id,
                cameras: {}
            },
            include: {
                cameras: true
            }
        });
    }
    async deleteFrigateHostsById(ids: string[]) {
        const cameras = this.prismaClient.findMany({
            where: {
                id: { in: ids}
            },
            include: {
                cameras: true
            }
        })
        this.prismaClient.deleteMany({
            where: {
                id: { in: ids },
                cameras: {}
            },
        });
        return cameras
    }

    async getHostOnly(host: string): Promise<string> {
        const frigateHost = await this.getFrigateHostByHost(host)
        return new URL(frigateHost.host).host
    }

    async getHostState(id: string): Promise<ResponseHostStatisSchema> {
        const host = await this.getFrigateHostById(id)
        const hostURL = new URL(host.host)

        const checkURL = hostURL.toString() + FrigateAPIUrls.version
        logger.silly(`FrigateHostsService Check host ${host.name} status at ${hostURL}`)
        if (!hostURL || !(hostURL instanceof URL)) throw new ErrorApp('validate', `FrigateHostsService can not convert host ${host.name} to URL`)

        try {
            const response = await this.fetcher(checkURL)
            logger.silly(`FrigateHostsService Get response status from host: ${host.name}`)
            if (response) return {
                ...host,
                status: true
            }
        } catch {
            logger.debug(`FrigateHostsService getHostState: ${host.name}`)
        }
        return {
            ...host,
            status: false
        }
    }


}

export default FrigateHostsService