import { hostURL } from "./consts"
import buildServer from "./server"
import { logger } from "./utils/logger"

const server = buildServer()

async function main() {
    try {
        
        const fastifyOptions = {
            port: Number(hostURL.port),
            host: hostURL.hostname
        }
        await server.listen(fastifyOptions)
        logger.info(`Server ready at ${hostURL.toString()}`)
    } catch (e) {
        logger.error(`main ${e.message}`)
        process.exit(1)
    }
}

main()
