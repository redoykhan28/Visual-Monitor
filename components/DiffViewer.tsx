'use client';

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { useState } from 'react';
import { Toggle } from "@/components/ui/toggle"; 
import { Eye, Layers } from "lucide-react";

interface DiffViewerProps {
    baseline: string;
    current: string;
    diffOverlay?: string | null; // New Prop
}

export default function DiffViewer({ baseline, current, diffOverlay }: DiffViewerProps) {
    const [showOverlay, setShowOverlay] = useState(false);

    return (
        <div className="w-full relative group">
            
            {/* Overlay Toggle Control */}
            {diffOverlay && (
                <div className="absolute top-4 right-4 z-50">
                    <Toggle 
                        pressed={showOverlay} 
                        onPressedChange={setShowOverlay}
                        className="bg-white/90 backdrop-blur shadow-sm hover:bg-white data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 border"
                        aria-label="Toggle diff overlay"
                    >
                        <Layers className="h-4 w-4 mr-2" />
                        {showOverlay ? "Hide Changes" : "Highlight Changes"}
                    </Toggle>
                </div>
            )}

            <div className="relative w-full h-auto">
                <ReactCompareSlider
                    itemOne={<ReactCompareSliderImage src={baseline} alt="Baseline Image" />}
                    itemTwo={
                        <div className="relative w-full h-full">
                            <img src={current} alt="Current Version" className="w-full h-auto block" />
                            {/* THE OVERLAY LAYER */}
                            {showOverlay && diffOverlay && (
                                <img 
                                    src={diffOverlay} 
                                    alt="Diff Overlay" 
                                    className="absolute top-0 left-0 w-full h-full opacity-70 pointer-events-none mix-blend-multiply" 
                                />
                            )}
                        </div>
                    }
                    style={{ width: '100%', height: 'auto' }} 
                />
            </div>
            
            <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur pointer-events-none transition-opacity group-hover:opacity-100 opacity-50">
                Original
            </div>
            <div className="absolute bottom-4 right-4 bg-blue-600/50 text-white text-xs px-2 py-1 rounded backdrop-blur pointer-events-none transition-opacity group-hover:opacity-100 opacity-50">
                New Version
            </div>
        </div>
    );
}