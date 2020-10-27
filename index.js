var MssqlDriver = require('db-migrate-mssql');
var Promise = require('bluebird');
var mssql = require('mssql');

const GO_DELIMITER = /^\s*GO\s*$/im

// db-migrate uses https://johnresig.com/blog/simple-javascript-inheritance/
var MssqlSsisDriver = MssqlDriver.base.extend({
  runSql: function (...args) {
    if (this._looksLikeBatchScript(args[0])) {
      return this._runBatchScript(...args)
    }
    else {
      return this._super(...args)
    }
  },

  _looksLikeBatchScript: function (script) {
      return script.match(GO_DELIMITER);
  },

  _scriptToBulkStatements: function (script) {
      return scripts.split(GO_DELIMITER).filter(s => s);
  },

  _runBatchScript: function () {
    var callback;
    var params;

    if (typeof arguments[arguments.length - 1] === 'function') {
      callback = arguments[arguments.length - 1];
    }

    const statements = this._scriptToBulkStatements(params[0]);

    // Run each statement in order
    // using a promiseChain to ensure that a statement only starts running after the previous statement has completed
    // Note: promiseChain === initialPromise
    // on the first time through this function
    const transaction = new db.connection.Transaction();
    return transaction.begin()
      .then(_ => {
          const request = new db.connection.Request(transaction);
          request.multiple = true;

          const initialPromise = Promise.resolve([]);
          return statements.reduce((previousPromise, statement) => {
              return previousPromise.then(_ => {
                  return request.batch(statement);
              });
          }, initialPromise)
      })
      .then(_ => {
          return transaction.commit();
      }).nodeify(callback);
  }
});

Promise.promisifyAll(MssqlSsisDriver);

exports.connect = function (config, intern, callback) {
  if (!config.database) {
    config.database = 'mssql';
  }
  config.server = config.server || config.host;


  mssql.connect(config)
    .then(pool => {
      callback(null, new MssqlSsisDriver(mssql, config.schema, intern));
    })
    .catch(err => {
      callback(err);
    });
};

exports.base = MssqlSsisDriver;
