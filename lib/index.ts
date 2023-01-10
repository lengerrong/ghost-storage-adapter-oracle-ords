import OracleDB, { OracleDBConfig } from "./oracledb"
import StorageBase, { Image, ReadOptions } from 'ghost-storage-base'
import { readFile } from 'fs'
import { Request, Response, NextFunction } from 'express-serve-static-core'

interface OracleImagesStorageConfig {
    oauthClients: OracleDBConfig[]
}

class OracleImagesStorage extends StorageBase {
    private oracle: OracleDB
    constructor(config: OracleImagesStorageConfig) {
        super()
        const {
            oauthClients
        } = config
        this.oracle = new OracleDB(oauthClients)
    }

    delete(fileName: string, targetDir: string) {
        const directory = targetDir || this.getTargetDir()
        return this.oracle.delete(directory, fileName)
    }

    exists(fileName: string, targetDir: string) {
        return this.oracle.exists(targetDir, fileName)
    }

    async save(image: Image, targetDir: string) {
        const directory = targetDir || this.getTargetDir()
        const readFileAsync = fp => new Promise((resolve, reject) =>
            readFile(fp, (err, data) => err ? reject(err) : resolve(data)))

        const [fileName, file] = await Promise.all([
            this.getUniqueFileName(image, directory),
            readFileAsync(image.path)
        ])
        return await this.oracle.save(fileName, file as Buffer, image.type)
    }

    serve() {
        return (req: Request, res: Response, next: NextFunction) => {
            this.oracle.serve(req, res, next)
        }
    }

    read(options: ReadOptions) {
        let path = (options.path || '').replace(/\/$|\\$/, '')
        return this.oracle.read(path)
    }
}

export default OracleImagesStorage