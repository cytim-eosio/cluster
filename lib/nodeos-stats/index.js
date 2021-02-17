#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('./package.json');

program
  .version(pkg.version)
  .option('--static', 'Applicable only for log file. Parse the whole log file to generate the statistics.')
  .arguments('<source>')
  .description('Monitor the nodeos to generate the statistics', {
    source: 'The eosio RPC endpoint, or the nodeos log file',
  })
  .action((source, options) => {
    if (source.startsWith('http')) {
      require('./lib/rpc-stats')(source, options);
    } else {
      require('./lib/log-stats')(source, options);
    }
  });

program.parse(process.argv);
