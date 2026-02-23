import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const format = (value) => Number(value).toFixed(4);

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="border border-[#25302b] bg-[#111a16] p-2 text-[11px]">
      <div className="text-[#9ca89f] mb-1">{label}</div>
      {payload.map((item) => (
        <div className="text-right" key={item.dataKey}>
          <span className="inline-block w-28 text-[#9ca89f] text-right">{item.name}</span>{' '}
          <span className="font-mono text-[#d9e3de]">{format(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function BenchmarkTable({ data }) {
  return (
    <section className="panel p-2">
      <div className="section-title">Benchmark Analytics</div>
      <div className="mt-2 overflow-x-auto">
        <table className="table-grid text-[11px] min-w-[280px]">
          <thead>
            <tr>
              <th className="uppercase">Metric</th>
              <th className="uppercase text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.metric}>
                <td>{row.metric}</td>
                <td className="text-right font-mono">{format(row.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PerformanceCharts({ performanceData, assetPerfData, benchmarkAnalytics }) {
  return (
    <div className="grid gap-2">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-2">
        <section className="panel p-2">
          <div className="section-title">Net Return Curve</div>
          <div className="mt-2 h-[290px]">
            <ResponsiveContainer>
              <LineChart data={performanceData}>
                <CartesianGrid stroke="#27322d" strokeDasharray="2 6" />
                <XAxis dataKey="day" stroke="#9ba9a3" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis stroke="#9ba9a3" tick={{ fontSize: 10 }} tickFormatter={(value) => format(value)} />
                <Tooltip content={ChartTooltip} />
                <ReferenceLine y={0} stroke="#546056" strokeDasharray="4 4" />
                <Line
                  dataKey="netReturn"
                  name="Net Return"
                  stroke="#ececec"
                  strokeWidth={1}
                  dot={false}
                  type="monotone"
                  isAnimationActive={false}
                />
                <Line
                  dataKey="fundingDrag"
                  name="Funding Drag"
                  stroke="#a5b1ab"
                  strokeWidth={1}
                  dot={false}
                  type="monotone"
                  isAnimationActive={false}
                />
                <Line
                  dataKey="tradingCost"
                  name="Trading Cost"
                  stroke="#77807b"
                  strokeWidth={1}
                  dot={false}
                  type="monotone"
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <BenchmarkTable data={benchmarkAnalytics} />
      </div>

      <section className="panel p-2">
        <div className="section-title">Drawdown Watermark</div>
        <div className="mt-2 h-[180px]">
          <ResponsiveContainer>
            <AreaChart data={performanceData}>
              <CartesianGrid stroke="#27322d" strokeDasharray="2 6" />
              <XAxis dataKey="day" stroke="#9ba9a3" tick={{ fontSize: 10 }} />
              <YAxis
                stroke="#9ba9a3"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => format(value)}
              />
              <Tooltip content={ChartTooltip} />
              <ReferenceLine y={0} stroke="#546056" strokeDasharray="4 4" />
              <Area
                dataKey="drawdown"
                name="Drawdown"
                stroke="#a0a7a3"
                fill="#a0a7a3"
                fillOpacity={0.14}
                strokeWidth={1}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel p-2">
        <div className="section-title">Individual Asset Performance</div>
        <div className="mt-2 h-[200px]">
          <ResponsiveContainer>
            <BarChart data={assetPerfData} margin={{ top: 6, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="#27322d" strokeDasharray="2 6" />
              <XAxis dataKey="asset" stroke="#9ba9a3" tick={{ fontSize: 10 }} />
              <YAxis
                stroke="#9ba9a3"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => format(value)}
              />
              <Tooltip content={ChartTooltip} />
              <Bar dataKey="return" name="Return" fill="#a5ada8" radius={0} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
