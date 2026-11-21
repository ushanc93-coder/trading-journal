"use client";

import { useEffect } from "react";
import ForexClockWidget from "@/components/ForexClockWidget";

export default function ClockPage() {
  useEffect(() => {
    document.title = "Forex & ICT StandBy Clock";
  }, []);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.focus();
          window.opener.location.href = "/";
        } else {
          window.open("/", "_blank");
        }
      } catch {
        window.open("/", "_blank");
      }
      window.close();
    }
  };

  return (
    <main 
      className="w-screen h-screen bg-[#05070B] text-white p-1.5 flex items-center justify-center select-none overflow-hidden m-0"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="w-[450px] h-[236px] max-w-[450px] max-h-[236px] overflow-hidden select-none">
        <ForexClockWidget 
          isStandalone={true} 
          showSessionsList={false} 
          onClose={handleClose}
          className="w-full h-full border-0 shadow-none p-0 bg-transparent"
        />
      </div>
    </main>
  );
}
