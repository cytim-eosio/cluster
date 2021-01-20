const { execSync } = require('child_process');
const { nanoid } = require('nanoid');

module.exports = (filePath) => {
  const id = nanoid(10);
  let trial = 0;
  let idx_15 = 0;
  let tps_arr_15 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let tps_sum_15 = 0;
  let tps_max_avg_15 = 0;
  let tps_max_abs = 0;

  setInterval(() => {
    trial++;
    const now = new Date();
    const line = execSync(`tail -n 1000 ${filePath} | grep '\\[trxs:' | tail -n 1`).toString();
    if (!line) {
      return;
    }

    const matches = line.match(/\[trxs: (\d+), lib: \d+,/);
    if (!matches) {
      return;
    }

    const tps = parseInt(matches[1]) * 2;
    tps_sum_15 = tps_sum_15 - tps_arr_15[idx_15] + tps;
    tps_arr_15[idx_15] = tps;
    const tps_avg_15 = Math.round((tps_sum_15 / 15) * 10) / 10;
    tps_max_avg_15 = Math.max(tps_max_avg_15, tps_avg_15);
    tps_max_abs = Math.max(tps_max_abs, tps);

    idx_15 = (idx_15 + 1) % 15;

    console.log(
      JSON.stringify({
        time: now.toISOString(),
        id,
        trial,
        tps: {
          max_abs: tps_max_abs,
          max_avg_15: tps_max_avg_15,
          avg_15: tps_avg_15,
          current: tps,
        },
      })
    );
  }, 2000);
};
