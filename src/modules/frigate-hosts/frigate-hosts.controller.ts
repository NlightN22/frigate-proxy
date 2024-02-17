import { FastifyReply, FastifyRequest } from "fastify";
import { CreateHostSchema, DeleteHostSchema, UpdateHostSchema, createHostSchema, deleteHostSchema, responseHostSchema, updateHostSchema } from "./frigate-hosts.schema";
import { withErrorHandler } from "../hooks/error.handler";
import FrigateHostsService from "./frigate-hosts.service";

class FrigateHostController {
    frigateHostsService = new FrigateHostsService()

    createHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: CreateHostSchema
    }>, rep: FastifyReply) => {
        const parsed = createHostSchema.parse(req.body);
        const frigateHost = await this.frigateHostsService.createFrigateHost(parsed);
        rep.code(201).send(frigateHost);
    });

    putHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: UpdateHostSchema
    }>, rep: FastifyReply) => {
        const data = updateHostSchema.parse(req.body)
        const frigateHost = await this.frigateHostsService.updateFrigateHost(data)
        rep.code(201).send(frigateHost)
    })

    getHostsHandler = withErrorHandler(async (req: FastifyRequest, rep: FastifyReply) => {
        const servers = await this.frigateHostsService.getAllFrigateHosts()
        rep.send(servers)
    })

    getHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const frigateHost = await this.frigateHostsService.getFrigateHostById(id)
        rep.send(frigateHost)
    })

    getHostStatusHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const status = await this.frigateHostsService.getHostStatus(id)
        rep.send(status)
    })

    deleteHostByIdHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const frigateHost = await this.frigateHostsService.deleteFrigateHostById(id)
        rep.send(frigateHost)
    })

    deleteHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: DeleteHostSchema
    }>, rep: FastifyReply) => {
        deleteHostSchema.parse(req.body)
        if (req.body.host) rep.send(await this.frigateHostsService.deleteFrigateHostByHost(req.body.host))
        if (req.body.id) rep.send(await this.frigateHostsService.deleteFrigateHostById(req.body.id))
    })
}

export default FrigateHostController