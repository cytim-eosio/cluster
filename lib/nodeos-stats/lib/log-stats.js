const { max, min, round } = require('lodash');
const { resolve } = require('path');
const { nanoid } = require('nanoid');
const { Tail } = require('tail');

const realtime = (filePath) => {
  const id = nanoid(10);
  const ctx = {
    count: 0,
    overall: {
      tps: {
        sum: 0,
        max: Number.NEGATIVE_INFINITY,
        min: Number.POSITIVE_INFINITY,
      },
    },
    cont_30: {
      _idx: 0,
      tps: {
        _arr: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        sum: 0,
        avg_max: Number.NEGATIVE_INFINITY,
        avg_min: Number.POSITIVE_INFINITY,
      },
    },
  };

  const tail = new Tail(resolve(process.cwd(), filePath));

  tail.on('line', (line) => {
    const matches = line.match(/\[trxs: (\d+), lib: \d+,/);
    if (!matches) {
      return;
    }
      
    ctx.count++;

    const now = new Date();
    const tps = parseInt(matches[1]) * 2;

    ctx.overall.tps.sum += tps;
    ctx.overall.tps.max = Math.max(ctx.overall.tps.max, tps);
    ctx.overall.tps.min = Math.min(ctx.overall.tps.min, tps);

    ctx.cont_30.tps.sum = ctx.cont_30.tps.sum - ctx.cont_30.tps._arr[ctx.cont_30._idx] + tps;
    ctx.cont_30.tps._arr[ctx.cont_30._idx] = tps;
    const cont_30_avg = round(ctx.cont_30.tps.sum / 30, 2);
    ctx.cont_30.tps.avg_max = Math.max(ctx.cont_30.tps.avg_max, cont_30_avg);
    ctx.cont_30.tps.avg_min = Math.min(ctx.cont_30.tps.avg_min, cont_30_avg);

    ctx.cont_30._idx = (ctx.cont_30._idx + 1) % 30;

    console.log(
      JSON.stringify({
        time: now.toISOString(),
        id,
        count: ctx.count,
        overall: {
          tps: {
            max: ctx.overall.tps.max,
            min: ctx.overall.tps.min,
            avg: round(ctx.overall.tps.sum / ctx.count, 2),
          }
        },
        cont_30: {
          tps: {
            max: max(ctx.cont_30.tps._arr),
            min: min(ctx.cont_30.tps._arr),
            avg: cont_30_avg,
            avg_max: ctx.cont_30.tps.avg_max,
            avg_min: ctx.cont_30.tps.avg_min,
          }
        }
      })
    );
  });

  tail.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
};

module.exports = (filePath, options) => {
  if (options.static) {
    // TODO
  } else {
    realtime(filePath);
  }
};
