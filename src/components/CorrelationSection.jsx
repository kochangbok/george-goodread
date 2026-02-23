import React from 'react';

const format = (value) => Number(value).toFixed(4);

function correlationColor(value) {
  const clamped = Math.max(-1, Math.min(1, value));
  const normalized = (clamped + 1) / 2;
  const shade = Math.round(210 - normalized * 110);
  return `rgb(${shade}, ${shade}, ${shade})`;
}

export default function CorrelationSection({ correlationMatrix, correlationSummary }) {
  return (
    <div className="grid gap-2">
      <section className="panel p-2">
        <div className="section-title">Correlation Matrix Heatmap</div>
        <div className="mt-2 overflow-x-auto">
          <div className="inline-block border border-[#25302b]">
            <div className="grid" style={{ gridTemplateColumns: `120px repeat(${correlationMatrix.length}, 1fr)` }}>
              <div className="panel bg-[#101b17] border-b border-b-[#25302b]" />
              {correlationMatrix.map((col) => (
                <div key={`header-${col.asset}`} className="h-7 border-b border-b-[#25302b] border-l border-l-[#25302b] px-2 text-[10px] uppercase tracking-[0.09em] text-[#9ba9a3] flex items-center justify-center">
                  {col.asset}
                </div>
              ))}

              {correlationMatrix.map((row) => (
                <React.Fragment key={`row-${row.asset}`}>
                  <div className="h-7 border-l border-l-[#25302b] border-r border-r-[#25302b] px-2 text-[10px] uppercase tracking-[0.09em] text-[#a8b4ad] flex items-center justify-start">
                    {row.asset}
                  </div>
                  {correlationMatrix.map((col) => {
                    const value = row[row.asset][col.asset];
                    return (
                      <div
                        key={`${row.asset}-${col.asset}`}
                        className="h-7 border-l border-l-[#25302b] border-r border-r-[#25302b] border-b border-b-[#25302b] text-right px-2 text-[10px] font-mono flex items-center justify-end"
                        style={{ backgroundColor: correlationColor(value) }}
                      >
                        {format(value)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel p-2">
        <div className="section-title">Correlation Summary</div>
        <div className="mt-2 overflow-x-auto">
          <table className="table-grid text-[11px] min-w-[520px]">
            <thead>
              <tr>
                <th className="uppercase">Asset</th>
                <th className="uppercase text-right">Max Corr</th>
                <th className="uppercase text-right">Min Corr</th>
                <th className="uppercase text-right">Avg Corr</th>
              </tr>
            </thead>
            <tbody>
              {correlationSummary.map((row) => (
                <tr key={row.asset}>
                  <td>{row.asset}</td>
                  <td className="text-right font-mono">{format(row.max)}</td>
                  <td className="text-right font-mono">{format(row.min)}</td>
                  <td className="text-right font-mono">{format(row.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
