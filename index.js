import OracleORDSClient from "oracle-ords-client"
import fs from "fs"
import { randomUUID } from "crypto"

const test = async () => {
    try {
        const oracleORDSClient = new OracleORDSClient({
            "client_id": process.env["client_id"],
            "client_secret": process.env["client_secret"],
            "schema": process.env["schema"],
            "ords_url": process.env["client_secret"],
        })

        const path = randomUUID()
        // 4,367,406 bytes (4.4 MB) max image size
        const blob = fs.readFileSync("./m8.png")
        const item = await oracleORDSClient.putJSONDocument("IMAGE", {
            path,
            blob
        })
        console.log("put", item)
        const query = new URLSearchParams()
        query.append('action', 'query')
        query.append('fields', 'all')
        query.append('limit', '1')
        query.append('totalResults', 'false')
        let collection = await oracleORDSClient.queryJSONDocument("IMAGE", query, {
            path
        })
        console.log("query", collection.items[0].value)
        const result = await oracleORDSClient.deleteJSONObject("IMAGE", item.id)
        console.log("delete", result)
        collection = await oracleORDSClient.queryJSONDocument("IMAGE", query, {
            path
        })
        console.log("query should be empty", collection)
    } catch (error) {
        console.error(error)
    }
}

test()
