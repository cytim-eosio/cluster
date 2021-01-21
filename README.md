# EOSIO: Clusters

> This repo contains the scripts to bootstrap and manage the EOSIO clusters on Mac.

## IMPORTANT NOTES

- Although we use the term **cluster** and **nodes** to describe the EOSIO blockchain infrastructure, the cluster name and
  node names have NOTHING to do with the blockchain itself. They are just some names for easier management.

- The only thing that matters is the **account** names.

## Prerequisite

1. Install [Node.js](https://nodejs.org/).

2. Install [eosio](https://github.com/eosio/eos).

3. Install [eosio.cdt](https://github.com/eosio/eosio.cdt).

4. Prepare [eosio.contracts](https://github.com/eosio/eosio.contracts).

## Installation

1. Clone the repository.

2. Run `./install`.

3. Optionally, add the repository to your `PATH` variable so you can run the executables anywhere.

   ```sh
   export PATH=/path/to/eosio-clusters/bin:$PATH
   ```

## Bootstrap A New Cluster

1. Configure the cluster by copying the directory `clusters/template` to `clusters/<CLUSTER_NAME>.<NODE_NAME>` for each
   of your nodes.

   For example, you will have the following directories for the cluster `fruits` with 3 nodes `apple`, `banana` and
   `cherry`.

   - `clusters/fruits.apple`
   - `clusters/fruits.banana`
   - `clusters/fruits.cherry`

2. Update `clusters/<CLUSTER_NAME>.<NODE_NAME>/nodeos/config/config.ini` for each of the nodes accordingly.

3. If you want to change the initial state of the blockchain, update
   `clusters/<CLUSTER_NAME>.<NODE_NAME>/nodeos/config/genesis.ini` for all of the nodes.

4. Copy `bootstrap/templates/nodeos.json` to `bootstrap/nodeos.json`, and edit the configuration.

5. Run `./bin/nodeos-bootstrap` to bootstrap the cluster. The bootstrap command will do the following...

   1. Start the cluster.

   2. Deploy the `boot` contract to the `eosio` account.

   3. Deploy the `bios` contract to the `eosio` account.

   4. Create all the producer accounts.

   5. Update the producer schedule to include all the producer accounts.

   6. Create all the system accounts.

   7. Deploy the system contracts.

6. Run `./bin/nodeos-log <CLUSTER_NAME> <NODE_NAME> -f` to follow the logs for a particular node.

7. Run `cleos -u <CLUSTER_URL> get info` to get the blockchain information.

## Manage An Existing Cluster

You can run the following commands to manage the cluster. Running the command without any argument will print the usage.

| Name              | Description |
|-------------------|-------------|
| `cleos-load-test` | Repeat the cleos command to load cluster. |
| `nodeos-stats`    | Print the blockchain statistics. |
| `nodeos-ps`       | List the nodes and their status. |
| `nodeos-start`    | Start the whole cluster or one of the nodes. |
| `nodeos-stop`     | Stop the whole cluster or one of the nodes. |
| `nodeos-clean`    | Clean up the data and logs for the target node. |
| `nodeos-log`      | Print the logs for the target node. | 

## Visualizing the nodeos-stats

If you have a running Elasticsearch and Kibana, you can visualize the `nodeos-stats` logs by transferring the logs to
Elasticsearch through Filebeat.

1. Run `nodeos-stats` and redirect the output to a log file. For example:

    ```sh
    nodeos-stats http://127.0.0.1:8888 > logs/nodeos-stats.log
    ```

2. Copy `filebeat/filebeat.template.yml` to `filebeat/filebeat.yml`, and edit the configuration.

3. Run filebeat to transfer the logs.

    ```sh
    cd filebeat/
    filebeat -c filebeat.yml -e
    ```

4. Visualize the logs on Kibana.

## References

### Example Folder Structure for A Running Node

The `data` directory, `runtime.log` and `runtime.pid` are created automatically when the node is started.

```
└── fruits.apple
    └── nodeos
        ├── config
        │   ├── config.ini
        │   ├── genesis.json
        │   └── protocol_features/
        ├── data
        │   ├── blocks
        │   │   ├── archive
        │   │   ├── blocks.index
        │   │   ├── blocks.log
        │   │   └── reversible
        │   │       └── shared_memory.bin
        │   ├── snapshots
        │   └── state
        │       ├── fork_db.dat
        │       └── shared_memory.bin
        ├── runtime.log
        └── runtime.pid
```
