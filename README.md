# ghost-storage-adapter-oracle-ords

A Oracle Cloud Autonomous JSON Databases storage adapter for Ghost 5.x

## Installation

```shell
npm install ghost-storage-adapter-oracle-ords
mkdir -p ./content/adapters/storage
cp -r ./node_modules/ghost-storage-adapter-oracle-ords ./content/adapters/storage/oracle-ords
```

## Configuration

```json
"storage": {
  "active": "oracle-ords",
  "oracle-ords": {
    "oauthClients": [
        {
            "client_id": "YOUR_ORACLE_AUTONOMOUS_JSON_DATABASE_OAUTH_CLIENT_ID",
            "client_secret": "YOUR_ORACLE_AUTONOMOUS_JSON_DATABASE_OAUTH_CLIENT_SECRET",
            "schema": "YOUR_ORACLE_AUTONOMOUS_JSON_DATABASE_USER",
            "ords_url": "YOUR_ORACLE_AUTONOMOUS_JSON_DATABASE_ORDS_URL",
            "alias": "YOUR_ORACLE_AUTONOMOUS_JSON_DATABASE_COLLECTION_NAME"
        },
    ]
  }
}
```
### Oracle ORDS OAuth Client

[How To Set Up Oracle ORDS OAuth Client](https://lengerrong.blogspot.com/2023/01/how-to-setup-oauth-clients-to-connect.html)

## License

[MIT](./LICENSE)