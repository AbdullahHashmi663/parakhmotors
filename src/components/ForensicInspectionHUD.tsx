'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface Checkpoint {
  id: string;
  name: string;
  category: string;
  x: number; // percentage
  y: number; // percentage
  status: 'Passed' | '100% Genuine' | 'Zero Errors';
  reading: string;
  detail: string;
}

const checkpoints: Checkpoint[] = [
  {
    id: 'engine',
    name: 'OBD-II ECU & Compression',
    category: 'Powertrain Forensic',
    x: 24,
    y: 48,
    status: 'Zero Errors',
    reading: 'Compression 175 PSI • 0 Fault Codes',
    detail: 'Full diagnostic scan of engine control modules, variable valve timing, fuel trims, and cylinder balance.',
  },
  {
    id: 'paint',
    name: 'Digital Paint Depth Gauge',
    category: 'Body & Aesthetics',
    x: 42,
    y: 28,
    status: '100% Genuine',
    reading: '118 µm (Factory Original Coating)',
    detail: 'Micron-level digital gauge verification confirming zero repainted panels, zero body filler, and factory clear coat.',
  },
  {
    id: 'chassis',
    name: 'Chassis & Structural Seals',
    category: 'Structural Integrity',
    x: 52,
    y: 52,
    status: 'Passed',
    reading: 'Laser Geometry 100% Factory Spec',
    detail: 'A/B/C pillar spot welds, apron seams, frame rails, and radiator support inspected for collision or repair traces.',
  },
  {
    id: 'gearbox',
    name: 'Drivetrain & Transmission',
    category: 'Mechanical Verification',
    x: 64,
    y: 48,
    status: 'Passed',
    reading: 'Clutch Engagement 99.2% • Smooth Shift',
    detail: 'Electronic clutch calibration, transfer case response, differential backlash, and fluid contamination tests.',
  },
  {
    id: 'underbody',
    name: 'Underbody & Suspension',
    category: 'Subframe & Safety',
    x: 78,
    y: 35,
    status: 'Zero Errors',
    reading: 'Zero Rust • Bushings 100% Firm',
    detail: 'High-definition endoscopic camera examination of floorpan, suspension wishbones, steering rack, and exhaust mountings.',
  },
];

export function ForensicInspectionHUD() {
  const [activeCheckpoint, setActiveCheckpoint] = useState<Checkpoint>(checkpoints[0]);

  return (
    <div className="relative rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] p-6 md:p-10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md">
      {/* Ambient decorative lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[var(--glow-color)] rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10 border-b border-[var(--border-color)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span className="text-xs uppercase font-bold tracking-widest text-[var(--primary)]">
              Interactive Forensic Telemetry
            </span>
          </div>
          <h3 className="font-display text-3xl md:text-4xl text-white">
            200+ POINT FORENSIC CAR SCANNER
          </h3>
          <p className="text-sm text-gray-300 mt-1 max-w-xl">
            Hover over the radar checkpoints to inspect the multi-stage diagnostics performed on every Parakh Motors vehicle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-[var(--background)]/80 border border-[var(--border-color)] text-xs font-semibold text-zinc-300">
            SYSTEM: <span className="text-emerald-400">ACTIVE OBD-II</span>
          </div>
          <Link
            href="/client/inspection"
            className="btn-primary py-2.5 px-5 text-xs font-bold uppercase tracking-wider"
          >
            Book This Inspection
          </Link>
        </div>
      </div>

      {/* Main Grid: Blueprint Car Interactive Area + Telemetry Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Wireframe Interactive Car Graphic */}
        <div className="lg:col-span-7 relative h-72 sm:h-96 w-full rounded-xl bg-[var(--background)]/70 border border-[var(--border-color)] p-4 flex items-center justify-center overflow-hidden">
          {/* Blueprint Grid Lines */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(to right, var(--border-color) 1px, transparent 1px), linear-gradient(to bottom, var(--border-color) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Stylized Supercar SVG Outline */}
          <svg
            className="w-full h-full max-w-lg opacity-85"
            viewBox="0 0 600 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 50 160 L 90 160 Q 110 120 140 120 Q 170 120 190 160 L 380 160 Q 400 120 430 120 Q 460 120 480 160 L 550 160 L 560 140 L 530 110 L 410 70 L 260 70 L 160 100 L 90 120 L 50 140 Z"
              stroke="var(--border-color)"
              strokeWidth="2"
              fill="var(--glow-color)"
            />
            <path
              d="M 180 105 L 260 75 L 400 75 L 480 110"
              stroke="var(--primary)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Wheels */}
            <circle cx="140" cy="160" r="32" stroke="var(--primary)" strokeWidth="2.5" fill="var(--background)" />
            <circle cx="140" cy="160" r="14" stroke="var(--border-color)" strokeWidth="1.5" />
            <circle cx="430" cy="160" r="32" stroke="var(--primary)" strokeWidth="2.5" fill="var(--background)" />
            <circle cx="430" cy="160" r="14" stroke="var(--border-color)" strokeWidth="1.5" />
            {/* Aerodynamic contours */}
            <path d="M 160 130 Q 300 135 440 130" stroke="var(--border-color)" strokeWidth="1.5" />
            <path d="M 230 105 L 240 150 M 350 105 L 340 150" stroke="var(--border-color)" strokeWidth="1.5" />
          </svg>

          {/* Interactive Checkpoint Radar Hotspots */}
          {checkpoints.map((cp) => {
            const isActive = activeCheckpoint.id === cp.id;
            return (
              <button
                key={cp.id}
                type="button"
                onMouseEnter={() => setActiveCheckpoint(cp)}
                onClick={() => setActiveCheckpoint(cp)}
                style={{ top: `${cp.y}%`, left: `${cp.x}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-all transform-gpu will-change-transform ${
                  isActive ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                }`}
              >
                {/* Pulsing ring */}
                <span
                  className={`absolute inset-0 rounded-full animate-ping opacity-75 transform-gpu ${
                    isActive ? 'bg-[var(--primary)]' : 'bg-[var(--border-color)]'
                  }`}
                />
                {/* Core dot */}
                <span
                  className={`relative flex items-center justify-center w-7 h-7 rounded-full border shadow-lg font-bold text-[10px] transition-colors ${
                    isActive
                      ? 'bg-[var(--primary)] border-white text-white shadow-[0_0_15px_var(--glow-color)]'
                      : 'bg-[var(--card-bg)] border-[var(--border-color)] text-zinc-300 hover:border-[var(--primary)]'
                  }`}
                >
                  ✓
                </span>
                {/* Floating label */}
                <span className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded bg-[var(--background)]/95 border border-[var(--border-color)] text-[10px] whitespace-nowrap text-zinc-200 font-semibold pointer-events-none shadow-md">
                  {cp.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Telemetry Card (Displays Selected Checkpoint Data) */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full bg-[var(--background)]/90 border border-[var(--border-color)] rounded-xl p-6 transition-all shadow-inner">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--primary)] px-2.5 py-1 rounded bg-[var(--primary)]/10 border border-[var(--border-color)]">
                {activeCheckpoint.category}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeCheckpoint.status}
              </span>
            </div>

            <h4 className="font-display text-2xl text-white mb-2">
              {activeCheckpoint.name}
            </h4>

            {/* Diagnostic meter display */}
            <div className="p-3.5 rounded-lg bg-[var(--card-bg)] border border-[var(--border-color)] mb-4">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                Diagnostic Telemetry Reading:
              </span>
              <p className="font-mono text-sm text-[var(--primary)] font-bold">
                {activeCheckpoint.reading}
              </p>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              {activeCheckpoint.detail}
            </p>
          </div>

          {/* Quick checkpoint selector tabs */}
          <div className="border-t border-[var(--border-color)] pt-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 block mb-2">
              Select Assessment Subsystem:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {checkpoints.map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => setActiveCheckpoint(cp)}
                  className={`px-2.5 py-1 rounded text-xs transition-all ${
                    activeCheckpoint.id === cp.id
                      ? 'bg-[var(--primary)] text-white font-bold shadow-md'
                      : 'bg-[var(--card-bg)] text-zinc-300 hover:text-white border border-[var(--border-color)]'
                  }`}
                >
                  {cp.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
