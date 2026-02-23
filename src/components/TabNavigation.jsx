import React from 'react';

const TABS = ['PERFORMANCE', 'WEIGHTS', 'RISK', 'CORRELATION'];

export default function TabNavigation({ activeTab, onChange }) {
  return (
    <div className="panel p-1">
      <div className="grid grid-cols-4 gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              className={`h-8 border ${
                isActive ? 'border-[#4f6f5b] bg-[#12201b] glow-active text-[#d9e3de]' : 'border-[#25302b] bg-transparent text-[#9ba9a3]'
              } uppercase text-[10px] tracking-[0.16em] font-semibold rounded-none transition-[background-color,border-color,color] duration-[150ms]`}
              type="button"
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
