import React from 'react';
interface MobileLayoutProps {
  children: React.ReactNode;
}
export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FFF7ED] transition-colors duration-500 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-8 h-full flex justify-center">
        <div className="relative w-full max-w-md bg-background min-h-screen flex flex-col shadow-[0_0_80px_-12px_rgba(0,0,0,0.12)] ring-1 ring-orange-100/50 overflow-hidden border-x border-orange-100/30">
          {/* Paper Texture Overlay: Ensuring it doesn't block clicks */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-[100] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
          {/* Main Content Area: Use 100dvh for consistent mobile height */}
          <main className="flex-1 bg-inherit flex flex-col h-[100dvh] overflow-hidden relative z-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
              {children}
            </div>
          </main>
          {/* Subtle Bottom Glow: Adjusted height for better content visibility */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FFF7ED] via-[#FFF7ED]/40 to-transparent pointer-events-none z-10 opacity-70" />
        </div>
      </div>
    </div>
  );
}