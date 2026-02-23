import React from 'react';

const ASSET_OPTIONS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'LINKUSDT', 'AVAXUSDT', 'DOGEUSDT', 'XRPUSDT', 'BNBUSDT', 'SUIUSDT'];
const BASE_WEIGHT_OPTIONS = [
  'Inverse Correlation',
  'Inverse Volatility',
  'Risk Parity',
  'Beta Adjusted',
  'Market Cap',
  'Equal Weight',
  'Manual',
];
const ADJUSTMENT_FLAGS = ['Hedge Overlay', 'Circuit Breach', 'Volatility Brake', 'Liquidity Penalty'];
const COST_FIELDS = ['Funding', 'Borrow', 'Trading', 'Slippage'];

export default function SidebarPanel({ controls, onChange }) {
  const normalizeAssets = (values) => Array.from(new Set(values.filter(Boolean)));

  const update = (patch) => {
    onChange((prev) => {
      const resolved = typeof patch === 'function' ? patch(prev) : patch;
      const next = { ...prev, ...resolved };

      const updateLong = Object.prototype.hasOwnProperty.call(resolved, 'longAssets');
      const updateShort = Object.prototype.hasOwnProperty.call(resolved, 'shortAssets');

      let longAssets = normalizeAssets(next.longAssets || []);
      let shortAssets = normalizeAssets(next.shortAssets || []);

      if (updateLong && !updateShort) {
        shortAssets = shortAssets.filter((asset) => !longAssets.includes(asset));
      } else if (updateShort && !updateLong) {
        longAssets = longAssets.filter((asset) => !shortAssets.includes(asset));
      } else {
        shortAssets = shortAssets.filter((asset) => !longAssets.includes(asset));
        longAssets = longAssets.filter((asset) => !shortAssets.includes(asset));
      }

      return {
        ...next,
        longAssets,
        shortAssets,
      };
    });
  };

  const updateMulti = (field, value) =>
    update({
      [field]: Array.from(value.target.selectedOptions, (option) => option.value),
    });

  const toggleAdjustment = (flag) =>
    update((prev) => ({
      riskAdjustments: {
        ...prev.riskAdjustments,
        [flag]: !prev.riskAdjustments?.[flag],
      },
    }));

  const updateCost = (field, value) =>
    update((prev) => ({
      costInputs: {
        ...prev.costInputs,
        [field]: value,
      },
    }));

  return (
    <aside className="panel p-2 flex flex-col gap-2">
      <div className="section-title">Asset Control Panel</div>

      <div className="panel p-2">
        <div className="section-title">Long Assets</div>
        <select
          multiple
          value={controls.longAssets}
          onChange={(event) => updateMulti('longAssets', event)}
          className="mt-1 w-full h-24 bg-[#0c1311] border border-[#25302b] text-[11px] p-1"
        >
          {ASSET_OPTIONS.map((asset) => (
            <option className="h-6" key={asset} value={asset}>
              {asset}
            </option>
          ))}
        </select>
      </div>

      <div className="panel p-2">
        <div className="section-title">Short Assets</div>
        <select
          multiple
          value={controls.shortAssets}
          onChange={(event) => updateMulti('shortAssets', event)}
          className="mt-1 w-full h-24 bg-[#0c1311] border border-[#25302b] text-[11px] p-1"
        >
          {ASSET_OPTIONS.map((asset) => (
            <option className="h-6" key={asset} value={asset}>
              {asset}
            </option>
          ))}
        </select>
      </div>

      <div className="panel p-2">
        <div className="section-title">Gross Exposure</div>
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          <input
            className="w-full accent-[#79d18e]"
            type="range"
            min="0"
            max="150"
            step="1"
            value={controls.grossExposure}
            onChange={(event) => update({ grossExposure: Number(event.target.value) })}
          />
          <span className="w-12 text-right font-mono">{controls.grossExposure}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="panel p-2">
          <div className="section-title">Time Range</div>
          <select
            className="mt-1 w-full border border-[#25302b] bg-[#0c1311] h-7"
            value={controls.timeRange}
            onChange={(event) => update({ timeRange: event.target.value })}
          >
            <option>7D</option>
            <option>30D</option>
            <option>90D</option>
            <option>180D</option>
            <option>1Y</option>
          </select>
        </label>

        <label className="panel p-2">
          <div className="section-title">Rebalance</div>
          <select
            className="mt-1 w-full border border-[#25302b] bg-[#0c1311] h-7"
            value={controls.rebalance}
            onChange={(event) => update({ rebalance: event.target.value })}
          >
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
        </label>
      </div>

      <label className="panel p-2">
        <div className="section-title">Start Date</div>
        <input
          type="date"
          className="mt-1 w-full border border-[#25302b] bg-[#0c1311] h-7 px-2"
          value={controls.startDate}
          onChange={(event) => update({ startDate: event.target.value })}
        />
      </label>

      <div className="panel p-2">
        <div className="section-title">Return View</div>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {['Net', 'Gross'].map((mode) => {
            const active = controls.returnView === mode;
            return (
              <button
                key={mode}
                className={`h-7 border text-[10px] tracking-[0.15em] uppercase ${
                  active
                    ? 'border-[#4f6f5b] glow-active text-[#d9e3de] bg-[#12201b]'
                    : 'border-[#25302b] text-[#9ba9a3] bg-transparent'
                }`}
                type="button"
                onClick={() => update({ returnView: mode })}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      <label className="panel p-2">
        <div className="section-title">Margin</div>
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={controls.margin}
          onChange={(event) => update({ margin: Number(event.target.value) })}
          className="mt-1 w-full h-7 border border-[#25302b] bg-[#0c1311] px-2"
        />
      </label>

      <label className="panel p-2">
        <div className="section-title">Benchmark</div>
        <select
          className="mt-1 w-full border border-[#25302b] bg-[#0c1311] h-7"
          value={controls.benchmark}
          onChange={(event) => update({ benchmark: event.target.value })}
        >
          {ASSET_OPTIONS.slice(0, 5).map((asset) => (
            <option key={asset}>{asset}</option>
          ))}
        </select>
      </label>

      <div className="panel p-2">
        <div className="section-title">Base Weight Selection</div>
        <div className="mt-1 grid grid-cols-1 gap-1">
          {BASE_WEIGHT_OPTIONS.map((option) => (
            <label key={option} className="text-[11px] flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="baseWeight"
                checked={controls.baseWeight === option}
                onChange={() => update({ baseWeight: option })}
              />
              <span className="uppercase tracking-[0.09em]">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="panel p-2">
        <div className="section-title">Risk Adjustment</div>
        <div className="mt-2 grid grid-cols-1 gap-1">
          {ADJUSTMENT_FLAGS.map((flag) => (
            <label key={flag} className="text-[11px] flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(controls.riskAdjustments[flag])}
                onChange={() => toggleAdjustment(flag)}
              />
              <span className="uppercase tracking-[0.09em]">{flag}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="panel p-2">
        <div className="section-title">Cost Assumptions</div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {COST_FIELDS.map((field) => (
            <label key={field} className="text-[10px] flex flex-col">
              <span className="uppercase tracking-[0.11em] text-[#9ba9a3] mb-1">{field}</span>
              <input
                className="h-7 border border-[#25302b] bg-[#0c1311] px-2"
                type="number"
                step="0.0001"
                value={controls.costInputs[field]}
                onChange={(event) => updateCost(field, Number(event.target.value))}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="panel p-2">
        <div className="section-title">Risk Settings</div>
        <div className="mt-2 flex items-center gap-2 text-[11px]">
          <input
            className="w-full accent-[#79d18e]"
            type="range"
            min="0"
            max="100"
            value={controls.riskSetting}
            onChange={(event) => update({ riskSetting: Number(event.target.value) })}
          />
          <span className="w-10 text-right font-mono">{controls.riskSetting}</span>
        </div>
      </div>
    </aside>
  );
}
