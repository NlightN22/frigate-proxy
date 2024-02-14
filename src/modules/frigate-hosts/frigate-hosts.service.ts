import axios, { AxiosResponse } from "axios";
import prisma from "../../utils/prisma";
import { ErrorApp } from "../hooks/error.handler";
import { CreateHostSchema, ResponseHostSchema, ResponseHostStatisSchema, UpdateHostSchema, } from "./frigate-hosts.schema";
import { FrigateAPIUrls } from "./frigate-api.urls";
import { logger } from "../../utils/logger";

const prismaClient = prisma.frigateHost

async function fetcher(url: string): Promise<AxiosResponse> {
    const response = await axios.get(url, {
        timeout: 10000,
    })
    return response.data
}


export async function createFrigateHost(input: CreateHostSchema) {
    const frigateHost = await prismaClient.create({
        data: input
    })
    return frigateHost
}
export async function updateFrigateHost(input: UpdateHostSchema) {
    const frigateHost = await prismaClient.update({
        where: {
            id: input.id
        },
        data: mapUpdateToCreateHosts(input)
    })
    return frigateHost
}
export async function getFrigateHosts() {
    const frigateHosts = await prismaClient.findMany()
    return frigateHosts
}
export async function getFrigateHostByHost(host: string) {
    return await prismaClient.findUniqueOrThrow({
        where: {
            host: host
        },
        include: {
            cameras: true
        }
    })
}
export async function getFrigateHostById(id: string) {
    return await prismaClient.findUniqueOrThrow({
        where: {
            id: id
        },
        include: {
            cameras: true
        }
    })
}

export async function getFrigateHostOrNull(id: string) {
    return await prismaClient.findUnique({
        where: {
            id: id
        }
    })
}

export async function deleteFrigateHostById(id: string) {
    return prismaClient.delete({
        where: {
            id: id
        },
        include: {
            cameras: true
        }
    });
}

export async function deleteFrigateHostByHost(host: string): Promise<ResponseHostSchema> {
    return prismaClient.delete({
        where: {
            host: host
        },
    });
}

export async function getHostOnly(host: string): Promise<string> {
    const frigateHost = await getFrigateHostByHost(host)
    return new URL(frigateHost.host).host
}

export async function getHostStatus(id: string): Promise<ResponseHostStatisSchema> {
    const host = await getFrigateHostById(id)
    const hostURL = new URL(host.host)

    const checkURL = hostURL.toString() + FrigateAPIUrls.version
    logger.debug(`Check host ${host.name} status at ${hostURL}`)
    if (!hostURL || !(hostURL instanceof URL)) throw new ErrorApp('validate', `Can not convert host ${host.name} to URL`)

    try {
        const response = await fetcher(checkURL)
        logger.info(`Get response status from host: ${host.name}`)
        if (response) return {
            ...host,
            status: true
        }
    } catch {
        logger.info(`Failed to get response from host: ${host.name}`)
    }
    return {
        ...host,
        status: false
    }
}

const mapUpdateToCreateHosts = (original: UpdateHostSchema): CreateHostSchema => {
    const { id, cameras, ...rest } = original
    const create = cameras?.map(({ frigateHostId, ...restCamera }) => restCamera)
    return { ...rest, create }
}