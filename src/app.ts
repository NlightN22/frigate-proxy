import { exec } from "child_process";
import { envHostURL } from "./consts"
import buildServer from "./server"
import { logger } from "./utils/logger"

const server = buildServer()


async function main() {
    try {

        const fastifyOptions = {
            port: Number(envHostURL.port),
            host: envHostURL.hostname
        }
        await server.listen(fastifyOptions)
        logger.info(`Server ready at ${envHostURL.toString()}`)
    } catch (e) {
        logger.error(`main ${e.message}`)
        process.exit(1)
    }
}

main()
