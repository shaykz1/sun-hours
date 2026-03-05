import React from "react";
import { Compass, ArrowUpDown } from "lucide-react";

function getCardinalDirection(azimuth) {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(azimuth / 22.5) % 16;
  return dirs[index];
}

export default function OrientationHUD({ azimuth, pitch, hasOrientation }) {
  const azDisplay = azimuth !== null ? azimuth.toFixed(1) : "---";
  const pitchDisplay = pitch !== null ? pitch.toFixed(1) : "---";
  const cardinal = azimuth !== null ? getCardinalDirection(azimuth) : "--";

  return (
    <>
      {/* Top bar - Azimuth */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="flex justify-center pt-6">
          <div className="bg-background/70 backdrop-blur-md rounded-xl px-6 py-3 border border-primary/20">
            <div className="flex items-center gap-4">
              <Compass className="w-5 h-5 text-primary opacity-80" />
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold tracking-wider text-primary">
                  {azDisplay}°
                </span>
                <span className="text-sm font-semibold text-primary/70 tracking-widest">
                  {cardinal}
                </span>
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center mt-1">
              Azimuth
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Pitch */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="bg-background/70 backdrop-blur-md rounded-l-xl px-4 py-3 border border-primary/20 border-r-0">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-primary opacity-80" />
            <span className="text-xl font-mono font-bold tracking-wider text-primary">
              {pitchDisplay}°
            </span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground text-center mt-1">
            Pitch
          </div>
        </div>
      </div>

      {/* No orientation warning */}
      {!hasOrientation && (
        <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div className="bg-destructive/80 backdrop-blur-md rounded-lg px-4 py-2 text-destructive-foreground text-xs">
            Device orientation not available — values simulated
          </div>
        </div>
      )}

      {/* Compass strip at top */}
      {azimuth !== null && (
        <div className="absolute top-[88px] left-0 right-0 z-20 pointer-events-none overflow-hidden">
          <CompassStrip azimuth={azimuth} />
        </div>
      )}
    </>
  );
}

function CompassStrip({ azimuth }) {
  const marks = [];
  for (let i = -30; i <= 30; i += 5) {
    const deg = ((azimuth + i) % 360 + 360) % 360;
    const isMajor = deg % 30 === 0 || Math.round(deg) % 30 === 0;
    const roundedDeg = Math.round(deg);
    const label = roundedDeg === 0 ? "N" : roundedDeg === 90 ? "E" : roundedDeg === 180 ? "S" : roundedDeg === 270 ? "W" : null;

    marks.push(
      <div
        key={i}
        className="flex flex-col items-center"
        style={{ position: "absolute", left: `${50 + (i / 60) * 100}%`, transform: "translateX(-50%)" }}
      >
        <div
          className={`w-px ${isMajor ? "h-3 bg-primary/60" : "h-2 bg-primary/30"}`}
        />
        {label && (
          <span className="text-[9px] font-mono font-bold text-primary/70 mt-0.5">
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-8 mx-12">
      {marks}
      {/* Center indicator */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-4 bg-primary" />
    </div>
  );
}