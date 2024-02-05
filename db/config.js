const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'apartmentSearch',
  password: 'C@ffe1ne1310',
  port: 5432,
});

module.exports = pool;
