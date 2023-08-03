const Client = require('pg').Client;
const fs = require('fs');

const client = new Client({
    host: '1.1.1.1',
    port: 25565,
    database: '[empty]',
    user: 'postgres',
    password: 'password'
});

client.connect();

client.query('SELECT NOW()', (err, res) => {
    console.log(err, res);
    client.end();
});