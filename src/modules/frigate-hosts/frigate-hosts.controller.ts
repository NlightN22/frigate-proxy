import { FastifyReply, FastifyRequest } from "fastify";
import { CreateHostSchema, DeleteHostSchema, UpdateHostSchema, createHostSchema, deleteHostSchema, responseHostSchema, updateHostSchema } from "./frigate-hosts.schema";
import { withErrorHandler } from "../hooks/error.handler";
import { frigateHostsService } from "../shared.service";

export const createHostHandler = withErrorHandler(async (req: FastifyRequest<{
    Body: CreateHostSchema
}>, rep: FastifyReply) => {
    const parsed = createHostSchema.parse(req.body);
    const frigateHost = await frigateHostsService.createFrigateHost(parsed);
    rep.code(201).send(frigateHost);
});

export const putHostHandler = withErrorHandler(async (req: FastifyRequest<{
    Body: UpdateHostSchema
}>, rep: FastifyReply) => {
    const data = updateHostSchema.parse(req.body)
    const frigateHost = await frigateHostsService.updateFrigateHost(data)
    rep.code(201).send(frigateHost)
})

export const getHostsHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
    const servers = await frigateHostsService.getAllFrigateHosts()
    rep.send(servers)
})

export const getHostHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
}>, rep: FastifyReply) => {
    const { id } = req.params
    const frigateHost = await frigateHostsService.getFrigateHostById(id)
    rep.send(frigateHost)
})

export const getHostStatusHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
}>, rep: FastifyReply) => {
    const { id } = req.params
    const status = await frigateHostsService.getHostStatus(id)
    rep.send(status)
})

export const deleteHostByIdHandler = withErrorHandler(async (req: FastifyRequest<{
    Params: { id: string }
}>, rep: FastifyReply) => {
    const { id } = req.params
    const frigateHost = await frigateHostsService.deleteFrigateHostById(id)
    rep.send(frigateHost)
})

export const deleteHostHandler = withErrorHandler(async (req: FastifyRequest<{
    Body: DeleteHostSchema
}>, rep: FastifyReply) => {
    deleteHostSchema.parse(req.body)
    if (req.body.host) rep.send(await frigateHostsService.deleteFrigateHostByHost(req.body.host))
    if (req.body.id) rep.send(await frigateHostsService.deleteFrigateHostById(req.body.id))
})