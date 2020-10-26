# db-migrate-mssql-ssis

mssql driver for db-migrate with support for SSIS batch scripts that contain `GO` statements.
These aren't valid T-SQL and requires the client to preprocessor.

## Installation

```
npm install db-migrate-mssql-ssis
```

## Credits

All the heavy lifting is done by https://github.com/ryd0rz/db-migrate-mssql
