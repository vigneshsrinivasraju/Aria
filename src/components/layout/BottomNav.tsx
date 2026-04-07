import React from 'react';
import { LayoutDashboard, Map as MapIcon, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  activeTab: 'dashboard' | 'map' | 'aria' | 'blockchain' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'map' | 'aria' | 'blockchain' | 'profile') => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'map', icon: MapIcon, label: 'Map' },
    { id: 'aria', icon: MessageSquare, label: 'ARIA' },
    { id: 'blockchain', icon: ShieldCheck, label: 'DID' },
    { id: 'profile', icon: User, label: 'Profile' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 px-6 py-3 pb-8 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              activeTab === tab.id ? "text-blue-500 scale-110" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <tab.icon className={cn("w-6 h-6", activeTab === tab.id && "fill-blue-500/10")} />
            <span className="text-[10px] font-medium uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
