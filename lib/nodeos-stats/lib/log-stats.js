const { createReadStream } = require('fs');
const { max, min, round } = require('lodash');
const { resolve } = require('path');
const { nanoid } = require('nanoid');
const readline = require('readline');
const { Tail } = require('tail');

const createContext = () => {
  return {
    time: new Date(),
    id: nanoid(10),
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
};

const addLogLineToMetrics = (ctx, options = {}) => {
  options = {
    skipZeros: false,
    printMetrics: false,
    ...options,
  };;
  return (line) => {
    const matches = line.match(/\[trxs: (\d+), lib: \d+,/);
    if (!matches) {
      return;
    }

    const tps = parseInt(matches[1]) * 2;
    if (options.skipZeros && tps === 0) {
      return;
    }

    ctx.count++;

    ctx.overall.tps.sum += tps;
    ctx.overall.tps.max = Math.max(ctx.overall.tps.max, tps);
    ctx.overall.tps.min = Math.min(ctx.overall.tps.min, tps);

    ctx.cont_30.tps.sum = ctx.cont_30.tps.sum - ctx.cont_30.tps._arr[ctx.cont_30._idx] + tps;
    ctx.cont_30.tps._arr[ctx.cont_30._idx] = tps;
    const cont_30_avg = round(ctx.cont_30.tps.sum / 30, 2);
    ctx.cont_30.tps.avg_max = Math.max(ctx.cont_30.tps.avg_max, cont_30_avg);
    ctx.cont_30.tps.avg_min = Math.min(ctx.cont_30.tps.avg_min, cont_30_avg);

    ctx.cont_30._idx = (ctx.cont_30._idx + 1) % 30;

    if (options.printMetrics) {
      console.log(
        JSON.stringify({
          time: ctx.time.toISOString(),
          id: ctx.id,
          count: ctx.count,
          overall: {
            tps: {
              max: ctx.overall.tps.max,
              min: ctx.overall.tps.min,
              avg: round(ctx.overall.tps.sum / ctx.count, 2),
            },
          },
          cont_30: {
            tps: {
              max: max(ctx.cont_30.tps._arr),
              min: min(ctx.cont_30.tps._arr),
              avg: cont_30_avg,
              avg_max: ctx.cont_30.tps.avg_max,
              avg_min: ctx.cont_30.tps.avg_min,
            },
          },
        })
      );
    }
  };
};

const calcStaticMetrics = async (filePath) => {
  const ctx = createContext();

  const rl = readline.createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  const onLine = addLogLineToMetrics(ctx, { skipZeros: true });
  for await (const line of rl) {
    onLine(line);
  }

  console.log(
    JSON.stringify({
      time: ctx.time.toISOString(),
      id: ctx.id,
      count: ctx.count,
      overall: {
        tps: {
          max: ctx.overall.tps.max,
          min: ctx.overall.tps.min,
          avg: round(ctx.overall.tps.sum / ctx.count, 2),
        },
      },
      cont_30: {
        tps: {
          avg_max: ctx.cont_30.tps.avg_max,
          avg_min: ctx.cont_30.tps.avg_min,
        },
      },
    })
  );
};

const calcRealtimeMetrics = (filePath) => {
  const ctx = createContext();
  const tail = new Tail(resolve(process.cwd(), filePath));

  tail.on('line', addLogLineToMetrics(ctx, { printMetrics: true }));

  tail.on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
};

module.exports = (filePath, options) => {
  if (options.static) {
    calcStaticMetrics(filePath);
  } else {
    calcRealtimeMetrics(filePath);
  }
};
