"use client";

import { X, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ImageViewerModalProps {
  src: string;
  onClose: () => void;
}

export function ImageViewerModal({ src, onClose }: ImageViewerModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    // Zoom in/out factor: 10% per tick
    const zoomDirection = Math.sign(-e.deltaY);
    const zoomFactor = zoomDirection > 0 ? 1.1 : 0.9;
    let newScale = scale * zoomFactor;
    
    // Clamp scale
    newScale = Math.min(Math.max(0.1, newScale), 15);
    
    if (newScale === scale) return;

    // Center of screen
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // Mouse position relative to center of screen
    const mx = e.clientX - cx;
    const my = e.clientY - cy;
    
    const scaleRatio = newScale / scale;
    const newPosition = {
      x: mx - (mx - position.x) * scaleRatio,
      y: my - (my - position.y) * scaleRatio
    };

    setScale(newScale);
    setPosition(newPosition);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md overflow-hidden"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onClose}
    >
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--card)]/90 backdrop-blur-xl border border-[var(--border)] p-2 rounded-2xl z-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={() => setScale(s => Math.max(0.1, s - 0.25))} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-white rounded-xl transition-colors"><ZoomOut className="w-5 h-5"/></button>
        <span className="text-white text-sm font-medium w-16 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale(s => Math.min(15, s + 0.25))} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-white rounded-xl transition-colors"><ZoomIn className="w-5 h-5"/></button>
        <div className="w-px h-5 bg-[var(--muted)] mx-1"></div>
        <button onClick={handleReset} className="p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-white rounded-xl transition-colors" title="Reset View"><Maximize className="w-5 h-5"/></button>
      </div>

      <button 
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md z-10"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </button>

      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={src} 
          alt="Preview" 
          draggable={false}
          className="transition-transform duration-75 ease-out select-none shadow-2xl max-w-[90vw] max-h-[90vh]"
          style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`
          }}
        />
      </div>
    </div>,
    document.body
  );
}
