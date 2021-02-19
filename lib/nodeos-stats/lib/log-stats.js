const { createReadStream } = require('fs');
const { max, min, round, pick } = require('lodash');
const { resolve } = require('path');
const { nanoid } = require('nanoid');
const readline = require('readline');
const { Tail } = require('tail');

const createContextMetrics = () => ({
  overall: {
    sum: 0,
    avg: 0,
    max: Number.NEGATIVE_INFINITY,
    min: Number.POSITIVE_INFINITY,
  },
  cont_30: {
    _idx: 0,
    _arr: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    sum: 0,
    avg: 0,
    avg_max: Number.NEGATIVE_INFINITY,
    avg_min: Number.POSITIVE_INFINITY,
  },
});

const createContext = () => {
  return {
    time: new Date(),
    id: nanoid(10),
    produced: {
      count: 0,
      tpb: createContextMetrics(),
    },
    received: {
      count: 0,
      tpb: createContextMetrics(),
      latency: createContextMetrics(),
    },
  };
};

const setMetrics = (metricset, metrics) => {
  metricset.count++;

  for (const key of Object.keys(metrics)) {
    const val = metrics[key];

    const overall = metricset[key].overall;
    overall.sum += val;
    overall.avg = round(overall.sum / metricset.count, 2);
    overall.max = Math.max(overall.max, val);
    overall.min = Math.min(overall.min, val);

    const cont_30 = metricset[key].cont_30;
    cont_30.sum = cont_30.sum - cont_30._arr[cont_30._idx] + val;
    cont_30._arr[cont_30._idx] = val;
    cont_30.avg = round(cont_30.sum / 30, 2);
    cont_30.avg_max = Math.max(cont_30.avg_max, cont_30.avg);
    cont_30.avg_min = Math.min(cont_30.avg_min, cont_30.avg);
    cont_30._idx = (cont_30._idx + 1) % 30;
  }
};

const parseLogLine = (line) => {
  let matches = line.match(/Produced block.+\[trxs: (\d+)/);
  if (matches) {
    const tpb = parseInt(matches[1]);
    return { type: 'produced', metrics: { tpb } };
  }

  matches = line.match(/Received block.+\[trxs: (\d+).+, latency: (\d+)/);
  if (matches) {
    const tpb = parseInt(matches[1]);
    const latency = parseInt(matches[2]);
    return { type: 'received', metrics: { tpb, latency } };
  }

  return null;
};

const addLogLineToMetrics = (ctx, options = {}) => {
  options = {
    skipZeroTpb: false,
    printMetrics: false,
    ...options,
  };
  return (line) => {
    const info = parseLogLine(line);
    if (info) {
      if (!(options.skipZeroTpb && tpb === 0)) {
        setMetrics(ctx[info.type], info.metrics);
      }
    }

    if (options.printMetrics) {
      console.log(
        JSON.stringify({
          time: ctx.time.toISOString(),
          id: ctx.id,
          produced: {
            count: ctx.produced.count,
            tpb: {
              overall: pick(ctx.produced.tpb.overall, ['max', 'min', 'avg']),
              cont_30: pick(ctx.produced.tpb.cont_30, ['max', 'min', 'avg', 'avg_max', 'avg_min']),
            },
          },
          received: {
            count: ctx.received.count,
            tpb: {
              overall: pick(ctx.received.tpb.overall, ['max', 'min', 'avg']),
              cont_30: pick(ctx.received.tpb.cont_30, ['max', 'min', 'avg', 'avg_max', 'avg_min']),
            },
            latency: {
              overall: pick(ctx.received.latency.overall, ['max', 'min', 'avg']),
              cont_30: pick(ctx.received.latency.cont_30, ['max', 'min', 'avg', 'avg_max', 'avg_min']),
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

  const onLine = addLogLineToMetrics(ctx, { skipZeroTpb: true });
  for await (const line of rl) {
    onLine(line);
  }

  console.log(
    JSON.stringify({
      time: ctx.time.toISOString(),
      id: ctx.id,
      produced: {
        count: ctx.produced.count,
        tpb: {
          overall: pick(ctx.produced.tpb.overall, ['max', 'min', 'avg']),
          cont_30: pick(ctx.produced.tpb.cont_30, ['avg_max', 'avg_min']),
        },
      },
      received: {
        count: ctx.received.count,
        tpb: {
          overall: pick(ctx.received.tpb.overall, ['max', 'min', 'avg']),
          cont_30: pick(ctx.received.tpb.cont_30, ['avg_max', 'avg_min']),
        },
        latency: {
          overall: pick(ctx.received.latency.overall, ['max', 'min', 'avg']),
          cont_30: pick(ctx.received.latency.cont_30, ['avg_max', 'avg_min']),
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
