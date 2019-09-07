var MongoClient = require('mongodb').MongoClient;

var client;
var conf;


module.exports.refresh = async function refresh(metrics, refresh_rate) {
  var mongoClient = await MongoClient.connect(`mongodb://${conf.username}:${conf.password}@${conf.host}:${conf.port}/${conf.database}` || 'mongodb://localhost:27017/', {
    useNewUrlParser: true
  });
  // Client returned
  var db = mongoClient.db(process.env.DB_NAME || conf.DB_NAME);
  client = db.admin();
  var data = await client.serverStatus();
  metrics.mapped.set(data.mem.mapped);
  metrics.vsize.set(data.mem.virtual);
  metrics.conn.set(data.connections.current);
  if (typeof lastInsert != 'undefined') {
    metrics.insert.set(Math.round((data.opcounters.insert - lastInsert) * 1000 / refresh_rate));
    metrics.query.set(Math.round((data.opcounters.query - lastQuery) * 1000 / refresh_rate));
    metrics.update.set(Math.round((data.opcounters.update - lastUpdate) * 1000 / refresh_rate));
    metrics.deleted.set(Math.round((data.opcounters.delete - lastDelete) * 1000 / refresh_rate));
    metrics.command.set(Math.round((data.opcounters.command - lastCommand) * 1000 / refresh_rate));
    metrics.netIn.set(Math.round((data.network.bytesIn - lastBytesIn) * 1000 / refresh_rate));
    metrics.netOut.set(Math.round((data.network.bytesOut - lastBytesOut) * 1000 / refresh_rate));
  }
  lastInsert = data.opcounters.insert;
  lastQuery = data.opcounters.query;
  lastUpdate = data.opcounters.update;
  lastDelete = data.opcounters.delete;
  lastCommand = data.opcounters.command;
  lastBytesIn = data.network.bytesIn;
  lastBytesOut = data.network.bytesOut;

  if (data.repl) {
    metrics.replName.set(data.repl.setName);
    if (data.repl.ismaster)
      metrics.replStatus.set("PRIMARY");
    else if (data.repl.secondary)
      metrics.replStatus.set("SECONDARY");
    else
      metrics.replStatus.set("UNKNOWN");
  }
  mongoClient.close();
};

module.exports.init = function init(config, done) {
  conf = config;
  done();
};