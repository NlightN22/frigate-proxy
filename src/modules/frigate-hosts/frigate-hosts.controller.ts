import { FastifyReply, FastifyRequest } from "fastify";
import * as schemas from "./frigate-hosts.schema";
import { withErrorHandler } from "../hooks/error.handler";
import FrigateHostsService from "./frigate-hosts.service";
import { z } from "zod";

class FrigateHostController {
    frigateHostsService = FrigateHostsService.getInstance()

    createHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: schemas.CreateHostsSchema
    }>, rep: FastifyReply) => {
        const parsed = schemas.createHostsSchema.parse(req.body);
        const frigateHost = await this.frigateHostsService.createFrigateHosts(parsed);
        rep.code(201).send(frigateHost);
    });

    putHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
        Body: schemas.UpdateHostSchema
    }>, rep: FastifyReply) => {
        const data = schemas.updateHostSchema.parse(req.body)
        const frigateHost = await this.frigateHostsService.upsertFrigateHost(data)
        rep.code(201).send(frigateHost)
    })
    putHostsHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: schemas.UpdateHostsSchema
    }>, rep: FastifyReply) => {
        const data = schemas.updateHostsSchema.parse(req.body)
        const frigateHosts = await this.frigateHostsService.upsertFrigateHosts(data)
        rep.code(201).send(frigateHosts)
    })

    getHostsHandler = withErrorHandler(async (req: FastifyRequest<{
        Querystring: { include: string }
    }>, rep: FastifyReply) => {
        const { include }= req.query
        if (include === 'cameras') return rep.send(await this.frigateHostsService.getAllFrigateHostsWithCameras())
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

    getHostByNameHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { name: string }
    }>, rep: FastifyReply) => {
        const { name } = req.params
        const pasredName = z.string().parse(name)
        const frigateHost = await this.frigateHostsService.getFrigateHostByName(pasredName)
        rep.send(frigateHost)
    })

    getHostStatusHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: { id: string }
    }>, rep: FastifyReply) => {
        const { id } = req.params
        const status = await this.frigateHostsService.getHostState(id)
        rep.send(status)
    })

    deleteHostHandler = withErrorHandler(async (req: FastifyRequest<{
        Params: schemas.DeleteHostSchema
    }>, rep: FastifyReply) => {
        const { id } = req.params
        rep.send(await this.frigateHostsService.deleteFrigateHostById(id))
    })
    deleteHostsHandler = withErrorHandler(async (req: FastifyRequest<{
        Body: schemas.DeleteHostsSchema
    }>, rep: FastifyReply) => {
        const parsed = schemas.deleteHostsSchema.parse(req.body)
        const ids = parsed.map(host => host.id)
        rep.send(await this.frigateHostsService.deleteFrigateHostsById(ids))
    })
}

export default FrigateHostController