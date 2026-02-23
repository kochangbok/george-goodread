import React from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const format = (value) => Number(value).toFixed(4);

function TooltipMono({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="border border-[#25302b] bg-[#111a16] p-2 text-[11px]">
      <div className="text-[#9ca89f]">{item.name}</div>
      <div className="font-mono text-[#d9e3de] text-right">{format(item.value)}</div>
    </div>
  );
}

function grayTone(value, invert = true) {
  const v = Math.max(0, Math.min(1, value));
  const base = invert ? Math.round(230 - v * 120) : Math.round(170 + v * 60);
  return `rgb(${base}, ${base}, ${base})`;
}

export default function WeightsSection({ currentWeights, weightDistData, weightComparison, methodHeatmap }) {
  return (
    <div className="grid gap-2">
      <div className="grid lg:grid-cols-2 gap-2">
        <section className="panel p-2">
          <div className="section-title">Current Weights</div>
          <div className="mt-2 overflow-x-auto">
            <table className="table-grid text-[11px] min-w-[320px]">
              <thead>
                <tr>
                  <th className="uppercase">Asset</th>
                  <th className="uppercase text-right">Current</th>
                  <th className="uppercase text-right">Target</th>
                  <th className="uppercase text-right">Gap</th>
                </tr>
              </thead>
              <tbody>
                {currentWeights.map((row) => (
                  <tr key={row.asset}>
                    <td>{row.asset}</td>
                    <td className="text-right font-mono">{format(row.current)}</td>
                    <td className="text-right font-mono">{format(row.target)}</td>
                    <td className={`text-right font-mono ${row.gap >= 0 ? 'text-[#8ed39a]' : 'text-[#d28b8b]'}`}>
                      {format(row.gap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel p-2">
          <div className="section-title">Weight Distribution</div>
          <div className="mt-2 h-[248px]">
            <ResponsiveContainer>
              <BarChart data={weightDistData}>
                <CartesianGrid stroke="#27322d" strokeDasharray="2 6" />
                <XAxis dataKey="asset" stroke="#9ba9a3" tick={{ fontSize: 10 }} />
                <YAxis
                  stroke="#9ba9a3"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => format(value)}
                />
                <Tooltip content={TooltipMono} />
                <Bar dataKey="weight" name="weight" isAnimationActive={false}>
                  {weightDistData.map((entry) => (
                    <Cell key={`c-${entry.asset}`} fill="#a5ada8" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel p-2">
        <div className="section-title">Weight Comparison Matrix</div>
        <div className="mt-2 overflow-x-auto">
          <table className="table-grid text-[11px] min-w-[520px]">
            <thead>
              <tr>
                <th className="uppercase">Asset</th>
                <th className="uppercase text-right">Base</th>
                <th className="uppercase text-right">Inverted Correlation</th>
                <th className="uppercase text-right">Risk Parity</th>
                <th className="uppercase text-right">Manual</th>
              </tr>
            </thead>
            <tbody>
              {weightComparison.map((row) => (
                <tr key={row.asset}>
                  <td>{row.asset}</td>
                  <td className="text-right font-mono">{format(row.base)}</td>
                  <td className="text-right font-mono">{format(row.inverseCorrelation)}</td>
                  <td className="text-right font-mono">{format(row.riskParity)}</td>
                  <td className="text-right font-mono">{format(row.manual)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-2">
        <div className="section-title">Method Heatmap</div>
        <div className="mt-2 overflow-x-auto">
          <table className="table-grid text-[11px] min-w-[520px]">
            <thead>
              <tr>
                <th className="uppercase">Method</th>
                <th className="uppercase text-right">Liquidity</th>
                <th className="uppercase text-right">Turnover</th>
                <th className="uppercase text-right">Stability</th>
                <th className="uppercase text-right">Tail Risk</th>
              </tr>
            </thead>
            <tbody>
              {methodHeatmap.map((row) => {
                const values = [row.liquidity, row.turnover, row.stability, row.tailRisk];
                return (
                  <tr key={row.method}>
                    <td>{row.method}</td>
                    {values.map((value, idx) => (
                      <td
                        key={idx}
                        className="text-right font-mono"
                        style={{ background: grayTone(value), color: value > 0.62 ? '#0c1311' : '#d9e3de' }}
                      >
                        {format(value)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
