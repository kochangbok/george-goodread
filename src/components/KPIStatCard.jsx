import React from 'react';

export default function KPIStatCard({ title, value, helper }) {
  return (
    <div className="panel p-2 min-h-[56px]">
      <div className="section-title">{title}</div>
      <div className="flex justify-end items-end gap-2 mt-2">
        <div className="text-right font-semibold font-mono text-[14px] leading-none">{value}</div>
        {helper ? <div className="text-[10px] text-[#8fa79d]">{helper}</div> : null}
      </div>
    </div>
  );
}
