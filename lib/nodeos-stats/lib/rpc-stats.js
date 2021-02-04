const axios = require('axios');
const http = require('http');
const https = require('https');
const { nanoid } = require('nanoid');

module.exports = (cluster_rpc_endpoint) => {
  const request = axios.create({
    baseURL: cluster_rpc_endpoint,
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    timeout: 800,
  });

  const id = nanoid(10);
  let trial = 0;
  let idx_15 = 0;
  let rpc_arr_15 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let rpc_sum_15 = 0;
  let rpc_max_avg_15 = 0;
  let rpc_max_abs = 0;
  let tps_arr_15 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let tps_sum_15 = 0;
  let tps_max_avg_15 = 0;
  let tps_max_abs = 0;
  let apt_arr_15 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let apt_sum_15 = 0;
  let apt_max_avg_15 = 0;
  let apt_max_abs = 0;

  setInterval(async () => {
    trial++;
    const start = new Date();
    try {
      const { data: info } = await request.post('/v1/chain/get_info');
      const { data: block } = await request.post('/v1/chain/get_block', {
        block_num_or_id: info.head_block_num,
      });
      const end = new Date();

      const rpc = Math.round((end.getTime() - start.getTime()) / 2);
      rpc_sum_15 = rpc_sum_15 - rpc_arr_15[idx_15] + rpc;
      rpc_arr_15[idx_15] = rpc;
      const rpc_avg_15 = Math.round((rpc_sum_15 / 15) * 10) / 10;
      rpc_max_avg_15 = Math.max(rpc_max_avg_15, rpc_avg_15);
      rpc_max_abs = Math.max(rpc_max_abs, rpc);

      const txn_count = block.transactions.length;
      const act_count = txn_count
        ? block.transactions.reduce((count, t) => (count += t.trx.transaction.actions.length), 0)
        : 0;

      const tps = txn_count * 2;
      tps_sum_15 = tps_sum_15 - tps_arr_15[idx_15] + tps;
      tps_arr_15[idx_15] = tps;
      const tps_avg_15 = Math.round((tps_sum_15 / 15) * 10) / 10;
      tps_max_avg_15 = Math.max(tps_max_avg_15, tps_avg_15);
      tps_max_abs = Math.max(tps_max_abs, tps);

      const apt = txn_count ? Math.round(act_count / txn_count) : 0;
      apt_sum_15 = apt_sum_15 - apt_arr_15[idx_15] + apt;
      apt_arr_15[idx_15] = apt;
      const apt_avg_15 = Math.round((apt_sum_15 / 15) * 10) / 10;
      apt_max_avg_15 = Math.max(apt_max_avg_15, apt_avg_15);
      apt_max_abs = Math.max(apt_max_abs, apt);

      idx_15 = (idx_15 + 1) % 15;

      console.log(
        JSON.stringify({
          time: start.toISOString(),
          id,
          trial,
          rpc: {
            max_abs: rpc_max_abs,
            max_avg_15: rpc_max_avg_15,
            avg_15: rpc_avg_15,
            current: rpc,
          },
          tps: {
            max_abs: tps_max_abs,
            max_avg_15: tps_max_avg_15,
            avg_15: tps_avg_15,
            current: tps,
          },
          apt: {
            max_abs: apt_max_abs,
            max_avg_15: apt_max_avg_15,
            avg_15: apt_avg_15,
            current: apt,
          },
        })
      );
    } catch (err) {
      console.error(err.message);
      console.log(
        JSON.stringify({
          time: start.toISOString(),
          rpc_error: true,
        })
      );
    }
  }, 500);
};
