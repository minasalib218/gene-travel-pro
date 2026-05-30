import type { ReactNode } from "react";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.18))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}
