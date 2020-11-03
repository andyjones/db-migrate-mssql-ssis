'use strict';

const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const lab = (exports.lab = Lab.script());

const Promise = require('bluebird');
const { dataType, log } = require('db-migrate-shared');
const driver = require('../');

const config = {
    driver: 'mssql-ssis',
    multipleStatements: true,
    host: process.env.MSSQL_HOST,
    port: process.env.MSSQL_PORT,
    database: process.env.MSSQL_DATABASE,
    user: process.env.MSSQL_USERNAME,
    password: process.env.MSSQL_PASSWORD,
};

const options = {
    skip: !config.host,
};

const internals = {};
internals.migrationTable = 'migrations';
internals.mod = {
    log: log,
    type: dataType,
};
internals.interfaces = {
    SeederInterface: {},
    MigratorInterface: {},
};
log.silence(true);

const dbName = config.database;
let db;

lab.experiment('runSql', options, function () {
    lab.before(async () => {
        db = await Promise.promisify(driver.connect)(config, internals);
    });

    lab.after(() => db.close());

    lab.experiment('runs native scripts as batch()', () => {
        let result;
        lab.before(async () => {
            const script = `
                CREATE FUNCTION dbo.Foo (@string nvarchar(max)) RETURNS @ids TABLE (id int)
                AS
                BEGIN
                    SET @string = (SELECT dbo.fnNormalizeDatastring(@string));
                    DECLARE @pos int = 1;
                    DECLARE @len int = LEN(@string) - 4;

                    IF @len <= 0
                        RETURN;

                    WHILE @pos <= @len
                    BEGIN
                        INSERT INTO @ids (id)
                        SELECT dbo.fnCalculateIndex(SUBSTRING(@string, @pos, 4));

                        SET @pos = @pos + 1;
                    END

                    RETURN;
                END;
                `;

            await db.runSql(script);

            result = await db.connection.query(`
                SELECT  1
                FROM    Information_schema.Routines
                WHERE   Specific_schema = 'dbo'
                        AND specific_name = 'Foo'
                        AND Routine_Type = 'FUNCTION'
            `);
        });

        lab.test('has created a function', () => {
            Code.expect(result.recordsets.length).to.equal(1);
        });

        lab.after(async () => {
            await db.connection.query('DROP FUNCTION dbo.Foo');
        });
    });

    lab.experiment('runs parameterised queries using query()', () => {
        let result;
        lab.before(async () => {
            await db.createTable('event', {
                columns: {
                    id: {
                        type: dataType.INTEGER,
                        primaryKey: true,
                        autoIncrement: true,
                    },
                },
                charset: 'utf8',
            });
            result = await db.connection.query(`SELECT *
                 FROM INFORMATION_SCHEMA.TABLES
                 WHERE TABLE_SCHEMA = 'dbo'
                 AND  TABLE_NAME = 'event'`);
        });

        lab.test('has table metadata containing the event table', () => {
            Code.expect(result.recordsets.length).to.equal(1);
        });

        lab.after(() => db.dropTable('event'));
    });
});
