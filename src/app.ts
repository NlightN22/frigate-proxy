import buildServer from "./server"
import { logger } from "./utils/logger"

const server = buildServer()

async function main() {
    try {
        const fastifyOptions = {
            port: 4000,
            host: 'localhost'
        }
        await server.listen(fastifyOptions)
        logger.info(`Server ready at ${JSON.stringify(fastifyOptions)}`)
    } catch (e) {
        logger.error(e.message)
        process.exit(1)
    }
}

main()
