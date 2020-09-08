#!/bin/bash

cd /var/www/html/en/server
npm i
npm i socket.io-client@1.4.8
service apache2 restart
node index.js
