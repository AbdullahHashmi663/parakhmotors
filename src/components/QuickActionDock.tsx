'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Shield, Sparkles, Check, ChevronUp } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function QuickActionDock() {
  const pathname = usePathname();
  const { currentTheme, themes, setTheme } = useTheme();
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Theme Drawer Popover */}
      {isThemePickerOpen && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[99999] w-[min(480px,94vw)] p-4 rounded-2xl shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          style={{
            backgroundColor: 'var(--card-bg, #1a1a24)',
            borderColor: 'var(--border-color, rgba(255,255,255,0.15))',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 35px var(--glow-color, rgba(242,89,18,0.25))',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-sm font-bold tracking-wide uppercase text-white">
                8 Trending Themes
              </span>
            </div>
            <Link
              href="/admin"
              onClick={() => setIsThemePickerOpen(false)}
              className="text-[11px] font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Admin Studio
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
            {themes.map((t) => {
              const isActive = t.id === currentTheme.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                    isActive
                      ? 'border-[var(--primary)] bg-white/10 shadow-sm'
                      : 'border-white/5 hover:border-white/20 bg-white/5 hover:bg-white/[0.08]'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border border-white/20"
                    style={{ backgroundColor: t.background }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.primary }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate flex items-center justify-between">
                      <span>{t.name}</span>
                      {isActive && <Check className="w-3 h-3 text-[var(--primary)] shrink-0 ml-1" />}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {t.category}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Action Dock */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99998,
          maxWidth: 'calc(100vw - 1.5rem)',
          pointerEvents: 'auto',
        }}
      >
        <div
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: 'var(--card-bg, rgba(20, 20, 26, 0.9))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderColor: 'var(--border-color, rgba(242, 89, 18, 0.35))',
            borderWidth: '1px',
            borderStyle: 'solid',
            boxShadow: '0 12px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px -5px var(--glow-color, rgba(242, 89, 18, 0.25))',
          }}
        >
          {/* Brand Beacon Dot */}
          <div className="hidden md:flex items-center gap-2 pl-1 pr-2 border-r border-white/10">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: 'var(--primary, #F25912)' }}
              ></span>
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: 'var(--primary, #F25912)' }}
              ></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-300">
              PARAKH <span style={{ color: 'var(--primary, #F25912)' }}>LIVE</span>
            </span>
          </div>

          {/* Find Car Link */}
          <Link
            href="/client/car-finding"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 group ${
              pathname === '/client/car-finding'
                ? 'text-white bg-white/10'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="hidden sm:inline">Find Car</span>
          </Link>

          {/* Book Inspection Link */}
          <Link
            href="/client/inspection"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 group ${
              pathname === '/client/inspection'
                ? 'text-white bg-white/10'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">200+ Inspection</span>
            <span className="sm:hidden">Inspect</span>
          </Link>

          {/* Sell Car Link */}
          <Link
            href="/client/sell-my-car"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 group ${
              pathname === '/client/sell-my-car'
                ? 'text-white bg-white/10'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline">Sell Fast</span>
            <span className="sm:hidden">Sell</span>
          </Link>

          {/* Theme Switcher Toggle Pill */}
          <button
            onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
            title="Switch Theme"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
              isThemePickerOpen
                ? 'bg-white/20 border-white/40 text-white'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="hidden md:inline">{currentTheme.name}</span>
          </button>

          {/* Admin Direct Shortcut */}
          <Link
            href="/admin"
            title="Admin Portal"
            className={`p-1.5 rounded-full transition-colors ${
              pathname.startsWith('/admin')
                ? 'text-[var(--primary)] bg-white/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
          </Link>

          {/* Direct WhatsApp Call-to-Action Pill */}
          <a
            href="https://wa.me/923218466662?text=Hello%20Parakh%20Motors%20Team%2C%20I%20would%20like%20to%20inquire%20about%20a%20vehicle%20service."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white shadow-md transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-95"
            style={{
              backgroundColor: 'var(--primary, #F25912)',
              boxShadow: '0 4px 14px var(--glow-color, rgba(242, 89, 18, 0.4))',
            }}
          >
            <span>WhatsApp</span>
          </a>

          {/* Scroll Top Button */}
          <button
            onClick={scrollToTop}
            title="Scroll to top"
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors duration-200"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
