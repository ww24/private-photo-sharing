Private Photo Sharing
=====================

仲間内での写真共有サービス

Twitter 認証で、特定の人にだけ写真を共有することが出来ます。

Requirements
------------
* Node.js 0.10
* MongoDB 2.6
* Nginx 1.4+ (option)

Features
--------
* Twitter 認証で新規ユーザ登録不要
* 特定多数への写真共有
* サムネイル自動生成
* EXIF 情報の取得
* スマートフォン対応

Setup
-----
1. `npm install`
1. edit `config/default.yml` or create `config/production.yml` for production environment
1. start mongod process (ex. `mongod -f db/mongod.conf`)

Start
-----
```
npm start
```

or

```
pm2 start processes.json
```

How to use UNIX domain socket
-----------------------------
Set path at `config.port`.

Ex.
```yml
server:
  port: /tmp/pps.sock
```

License
-------
[MIT](LICENSE)
