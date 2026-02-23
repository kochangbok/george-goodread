import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const format = (value) => Number(value).toFixed(4);

function RiskTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="border border-[#25302b] bg-[#111a16] p-2 text-[11px]">
      <div className="text-[#9ca89f] mb-1">{item.payload.label || item.payload.day}</div>
      <div className="font-mono text-[#d9e3de] text-right">{format(item.value)}</div>
      <div className="text-[#8a9a93] text-right">{item.name}</div>
    </div>
  );
}

export default function RiskSection({ rollingVolatility, betaVsBtc, zscoreData, riskSnapshot }) {
  return (
    <div className="grid gap-2">
      <div className="grid lg:grid-cols-2 gap-2">
        <section className="panel p-2">
          <div className="section-title">Rolling 7-Day Volatility</div>
          <div className="mt-2 h-[250px]">
            <ResponsiveContainer>
              <LineChart data={rollingVolatility}>
                <CartesianGrid stroke="#27322d" strokeDasharray="2 6" />
                <XAxis dataKey="day" stroke="#9ba9a3" tick={{ fontSize: 10 }} />
                <YAxis stroke="#9ba9a3" tick={{ fontSize: 10 }} tickFormatter={(v) => format(v)} />
                <Tooltip content={RiskTooltip} />
                <Line
                  dataKey="volatility"
                  name="Volatility"
                  stroke="#d9e3de"
                  strokeWidth={1}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel p-2">
          <div className="section-title">Beta vs BTC</div>
          <div className="mt-2 h-[250px]">
            <ResponsiveContainer>
              <BarChart data={betaVsBtc}>
                <CartesianGrid stroke="#27322d" strokeDasharray="2 6" />
                <XAxis dataKey="asset" stroke="#9ba9a3" tick={{ fontSize: 10 }} />
                <YAxis stroke="#9ba9a3" tick={{ fontSize: 10 }} tickFormatter={(v) => format(v)} />
                <Tooltip content={RiskTooltip} />
                <Bar dataKey="beta" name="Beta" fill="#a5ada8" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel p-2">
        <div className="section-title">Z-Score vs 90D Mean</div>
        <div className="mt-2 h-[230px]">
          <ResponsiveContainer>
            <LineChart data={zscoreData}>
              <CartesianGrid stroke="#27322d" strokeDasharray="2 6" />
              <XAxis dataKey="day" stroke="#9ba9a3" tick={{ fontSize: 10 }} />
              <YAxis stroke="#9ba9a3" tick={{ fontSize: 10 }} tickFormatter={(v) => format(v)} />
              <Tooltip content={RiskTooltip} />
              <Line
                dataKey="zscore"
                name="Z-Score"
                stroke="#cfd9d3"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                dataKey="mean"
                name="90D Mean"
                stroke="#7a8a83"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel p-2">
        <div className="section-title">Risk Snapshot</div>
        <div className="mt-2 overflow-x-auto">
          <table className="table-grid text-[11px] min-w-[480px]">
            <thead>
              <tr>
                <th className="uppercase">Metric</th>
                <th className="uppercase text-right">Value</th>
                <th className="uppercase text-right">Threshold</th>
              </tr>
            </thead>
            <tbody>
              {riskSnapshot.map((row) => (
                <tr key={row.metric}>
                  <td>{row.metric}</td>
                  <td className="text-right font-mono">{format(row.value)}</td>
                  <td className="text-right font-mono">{format(row.threshold)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
