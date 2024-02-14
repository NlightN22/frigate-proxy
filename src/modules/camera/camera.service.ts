import prisma from "../../utils/prisma";
import { getFrigateHostById, getFrigateHostOrNull } from "../frigate-hosts/frigate-hosts.service";
import { ErrorApp } from "../hooks/error.handler";
import { CreateCameraSchema, UpdateCameraSchema } from "./camera.schema";


const prismaClient = prisma.camera

export async function createCamera(input: CreateCameraSchema) {
    if (input.frigateHostId) {
        await getFrigateHostById(input.frigateHostId)
    }
    return await prismaClient.create({
        data: {
            name: 'string;',
            frigateHostId: 'string ',
        }
    })
}

export async function getCameras() {
    return await prismaClient.findMany()
}
export async function getCamera(id: string) {
    return await prismaClient.findUniqueOrThrow({
        where: {
            id: id
        }
    })
}
export async function editCamera(input: UpdateCameraSchema) {
    const { id, ...rest } = input
    return await prismaClient.update({
        where: {
            id: id
        },
        data: rest
    })
}

export async function deleteCamera(id: string) {
    const camera = await getCamera(id)
    let host
    if (camera.frigateHostId) {
        host = await getFrigateHostOrNull(camera.frigateHostId)
    }
    if (host) throw new ErrorApp('validate', 'Cannot delete frigate camera. Host is exist')
    return await prismaClient.delete({
        where: {
            id: id
        }
    })
}