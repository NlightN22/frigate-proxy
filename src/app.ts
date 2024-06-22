import { exec } from "child_process";
import { hostURL } from "./consts"
import buildServer from "./server"
import { logger } from "./utils/logger"

const server = buildServer()

async function runMigrations(): Promise<void> {
    logger.info(`Start update MongoDB schema process`)
    return new Promise((resolve, reject) => {
        exec('npx prisma db push', (err, stdout, stderr) => {
            if (err) {
                logger.error(`Error on update MongoDB schema: ${stderr}`)
                return reject(err);
            }
            logger.info(`Update MongoDB schema result: ${stdout}`)
            resolve()
        })
    })
}

async function main() {
    try {

        await runMigrations();
        
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
