"use client";

import { useEffect, useState } from "react";

interface ForensicWatermarkProps {
  sessionCode: string;
  peerNickname: string;
}

export default function ForensicWatermark({ sessionCode, peerNickname }: ForensicWatermarkProps) {
  const [position, setPosition] = useState({ top: "25%", left: "30%" });
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    // Update timestamp every minute
    const updateTime = () => {
      setTimestamp(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
          " " +
          new Date().toLocaleDateString()
      );
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 30000);

    // Subtle drift of watermark position every 12 seconds to prevent cropping
    const driftPositions = [
      { top: "20%", left: "25%" },
      { top: "65%", left: "40%" },
      { top: "35%", left: "60%" },
      { top: "70%", left: "20%" },
      { top: "45%", left: "35%" },
    ];

    let index = 0;
    const posInterval = setInterval(() => {
      index = (index + 1) % driftPositions.length;
      setPosition(driftPositions[index]);
    }, 12000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(posInterval);
    };
  }, []);

  return (
    <div
      className="absolute pointer-events-none select-none z-20 transition-all duration-1000 ease-in-out opacity-25 hover:opacity-40"
      style={{ top: position.top, left: position.left, transform: "translate(-50%, -50%)" }}
    >
      <div className="text-center font-mono text-[10px] text-white/70 tracking-widest uppercase leading-tight drop-shadow">
        <div>WE HEAR CONFIDENTIAL • DO NOT RECORD</div>
        <div>
          ROOM: {sessionCode.slice(0, 10)}... • {timestamp}
        </div>
      </div>
    </div>
  );
}
