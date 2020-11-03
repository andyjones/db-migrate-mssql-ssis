# db-migrate-mssql-ssis

mssql driver for db-migrate with support for SSMS batch scripts that contain `GO` statements.
These aren't valid [T-SQL and requires the client to preprocess](https://docs.microsoft.com/en-us/sql/t-sql/language-elements/sql-server-utilities-statements-go?view=sql-server-ver15#remarks).

This is intended to help teams that manually make changes to SQL Server through SSMS. If you are an
app developer then Entity Framework migrations may be more suitable.

## Installation

```
npm install db-migrate-mssql-ssis
```

## Running the tests

### Unit tests

```
npm test
```

### Integration tests against a SQL server

Set the following environment variables and then run `npm test`:

 * `MSSQL_HOST`
 * `MSSQL_PORT`
 * `MSSQL_DATABASE`
 * `MSSQL_USERNAME`
 * `MSSQL_PASSWORD`

## See also

 * Mssql Driver: https://github.com/ryd0rz/db-migrate-mssql
 * db-migrate: https://github.com/db-migrate/node-db-migrate

## Credits

All the heavy lifting is done by https://github.com/ryd0rz/db-migrate-mssql

Integration test pinched from https://github.com/db-migrate/mysql
