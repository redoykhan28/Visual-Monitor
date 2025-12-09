'use client';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

export default function DiffViewer({ baseline, current }: { baseline: string, current: string }) {
  return (
    // Changed h-[500px] to h-[80vh] (80% of screen height) and added overflow-y-auto
    <div className="border-4 border-white shadow-lg rounded-lg overflow-y-auto h-[80vh] w-full relative bg-gray-900">
      
      {/* Added styles to ensure images load at full width */}
      <ReactCompareSlider
        itemOne={<ReactCompareSliderImage src={baseline} alt="Baseline" />}
        itemTwo={<ReactCompareSliderImage src={current} alt="Current" />}
        style={{ width: '100%', height: 'auto' }} 
      />
      
      <div className="sticky bottom-0 z-50 flex justify-between bg-gray-800 text-white text-xs p-2 opacity-90">
        <span>⬅ Baseline (Old)</span>
        <span>Current (New) ➡</span>
      </div>
    </div>
  );
}