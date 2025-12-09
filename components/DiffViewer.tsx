'use client';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

export default function DiffViewer({ baseline, current }: { baseline: string, current: string }) {
  return (
    <div className="border-4 border-white shadow-lg rounded-lg overflow-hidden h-[500px]">
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={baseline} alt="Baseline" />}
        itemTwo={<ReactCompareSliderImage src={current} alt="Current" />}
        style={{ height: '100%' }}
      />
      <div className="flex justify-between bg-gray-800 text-white text-xs p-2">
        <span>⬅ Baseline (Old)</span>
        <span>Current (New) ➡</span>
      </div>
    </div>
  );
}