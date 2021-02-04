#!/usr/bin/env node

const argv = process.argv.slice(2);
const source = argv[0];

if (!source) {
  console.log("usage: nodeos-stats <EOSIO_RPC_ENDPOINT|EOSIO_LOG_FILE_PATH>");
  process.exit(1);
}

if (source.startsWith("http")) {
  require("./lib/rpc-stats")(source);
} else {
  require("./lib/log-stats")(source);
}
