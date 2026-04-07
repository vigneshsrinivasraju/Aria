import React from 'react';
import { LayoutDashboard, Map as MapIcon, MessageSquare, User, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

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
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-2xl border-t border-slate-800/40 px-6 py-4 pb-10 z-50">
      <div className="flex justify-between items-center max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-500 relative group",
              activeTab === tab.id ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            )}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="nav-active"
                className="absolute -top-4 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"
              />
            )}
            <tab.icon className={cn(
              "w-6 h-6 transition-transform duration-300 group-active:scale-90", 
              activeTab === tab.id && "fill-indigo-500/10"
            )} />
            <span className="text-[9px] font-bold uppercase tracking-[0.15em]">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
