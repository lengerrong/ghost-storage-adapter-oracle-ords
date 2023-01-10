import OracleORDSClient, { Item, ORDSOAuthClientConfig } from 'oracle-ords-client'
import { join } from 'path'
import { Request, Response, NextFunction } from 'express-serve-static-core'
import { Duplex } from 'stream'

export interface OracleDBConfig extends ORDSOAuthClientConfig {
    alias: string
}

interface OracleSODAClient {
    oauthClient: OracleORDSClient
    alias: string
}

class OracleDB {
    private dbPool: OracleSODAClient[]
    private query: URLSearchParams
    private lastClient: OracleSODAClient
    constructor(configs: OracleDBConfig[]) {
        this.dbPool = configs.map(config => {
            return {
                oauthClient: new OracleORDSClient(config),
                alias: config.alias
            }
        })
        const query = new URLSearchParams()
        query.append('action', 'query')
        query.append('fields', 'all')
        query.append('limit', '1')
        query.append('totalResults', 'true')
        this.query = query
        this.lastClient = null
    }

    queryPayload(file: string) {
        return {
            'path': file
        }
    }

    async queryItem(file: string) {
        // not found response
        // {'items':[],'hasMore':false,'count':0}
        // found response
        // {'items':[{'id':'563BE46EC08D42B1950B5CBE81BFC027','etag':'49931A7EF55E48B3807032C0D8470508','lastModified':'2023-01-06T06:32:12.336660000Z','created':'2023-01-06T06:32:12.336660000Z','links':[{'rel':'self','href':'https://gb155dd5f199f4a-image02.adb.us-sanjose-1.oraclecloudapps.com:443/ords/image/soda/latest/IMAGE/563BE46EC08D42B1950B5CBE81BFC027'}],'value':{'path':'/a/1.png','blob':'a1png'}}],'hasMore':false,'count':1}
        let item: Item = null
        const stripLeadingSlash = s => s.indexOf('/') === 0 ? s.substring(1) : s
        for await (const result of this.dbPool.map(oracle => oracle.oauthClient
            .queryJSONDocument(oracle.alias, this.query,
            this.queryPayload(stripLeadingSlash(file))))) {
            if (result.count === 1 && result.items.length === 1) {
                item = result.items[0]
                break
            }
        }
        if (!item) {
            throw new Error(`${file} is not stored in oracle`)
        }
        return item
    }

    async delete(directory: string, fileName: string) {
        try {
            const item = await this.queryItem(join(directory, fileName))
            if (!item) {
                return true
            }
            const itemLink = item.links[0].href
            const oracle = this.dbPool.find(oracle => itemLink.startsWith(oracle.oauthClient.config.ords_url))
            await oracle.oauthClient.deleteJSONObject(oracle.alias, item.id)
            return true
        } catch {
            return false
        }
    }

    async exists(targetDir: string, fileName: string) {
        return this.queryItem(join(targetDir, fileName))
            .then(item => !!item).catch(() => false)
    }

    async save(file: string, blob: Buffer, type: string) {
        let index = this.dbPool.findIndex(oracle => oracle === this.lastClient) + 1
        if (index >= this.dbPool.length) {
            index = 0
        }
        const oracle = this.dbPool[index]
        this.lastClient = oracle
        /**
         * json document schema stored in oracle cloud autonomous json db
         * {
         *   'path': 'the file path',
         *   'blob': 'the file content',
         *   'type': 'the file type'
         * }
         */
        await oracle.oauthClient.putJSONDocument(oracle.alias, {
            'path': file,
            'blob': JSON.stringify(blob),
            'type': type
        })
        return join('/content/images', file)
    }

    async serve(req: Request, res: Response, next: NextFunction) {
        try {
            const item = await this.queryItem(req.path)
            res.set({
                'Content-Type': item.value['type']
            })
            res.status(200)
            const buffer = Buffer.from(JSON.parse(item.value['blob']).data)
            const duplex = new Duplex()
            duplex.push(buffer)
            duplex.push(null)
            duplex.pipe(res)
        } catch (error) {
            res.status(404).json({ name: error.name, message: error.message })
            next(error)
        }
    }

    async read(file: string) {
        return this.queryItem(file).then(item => Buffer.from(JSON.parse(item.value['blob']).data))
    }
}

export default OracleDB