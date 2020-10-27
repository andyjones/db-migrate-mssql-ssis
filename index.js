var MssqlDriver = require('db-migrate-mssql');
var Promise = require('bluebird');
var mssql = require('mssql');

const GO_DELIMITER = /^\s*GO\s*$/im

const looksLikeBatchScript = function (script) {
    return script.match(GO_DELIMITER);
}

const scriptToBulkStatements = function (script) {
    return script.split(GO_DELIMITER).map(s => s.trim()).filter(s => s);
}
exports.scriptToBulkStatements = scriptToBulkStatements;

// db-migrate uses https://johnresig.com/blog/simple-javascript-inheritance/
var MssqlSsisDriver = MssqlDriver.base.extend({
  runSql: function (...args) {
    if (looksLikeBatchScript(args[0])) {
      return this._runBatchScript(...args)
    }
    else {
      return this._super(...args)
    }
  },

  _runBatchScript: function (script, ...args) {
    var callback;

    if (typeof args[args.length - 1] === 'function') {
      callback = args[args.length - 1];
    }

    const statements = scriptToBulkStatements(script);

    // Run each statement in order
    // using a promiseChain to ensure that a statement only starts running after the previous statement has completed
    // Note: promiseChain === initialPromise
    // on the first time through this function
    const transaction = new this.connection.Transaction();
    return Promise.resolve(transaction.begin())
      .then(_ => {
          const request = new this.connection.Request(transaction);
          request.multiple = true;

          const initialPromise = Promise.resolve([]);
          return statements.reduce((previousPromise, statement) => {
              return previousPromise.then(_ => {
                  this.log.sql(statement);
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
