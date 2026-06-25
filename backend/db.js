const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER || 'LAPTOP-QD2AGOF0',
    database: process.env.DB_DATABASE || 'QLKhachsanBaoLoc',
    driver: 'msnodesqlv8',
    options: {
        trustedConnection: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER || 'LAPTOP-QD2AGOF0'};Database=${process.env.DB_DATABASE || 'QLKhachsanBaoLoc'};Trusted_Connection=yes;`
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server via Windows Authentication!');
    return pool;
  })
  .catch(err => {
    console.log('Database Connection Failed!', err.message);
  });

module.exports = {
  sql, poolPromise
};
