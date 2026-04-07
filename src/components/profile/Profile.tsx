import React from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { UserProfile } from '../../types';
import { User, Shield, QrCode, LogOut, ChevronRight, History, Fingerprint, Lock, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  profile: UserProfile | null;
}

export default function Profile({ profile }: ProfileProps) {
  const handleLogout = () => {
    signOut(auth);
  };

  const logs = [
    { type: 'Checkpoint', location: 'Changi Airport T3', time: '2h ago', status: 'Verified' },
    { type: 'Hotel Check-in', location: 'Marina Bay Sands', time: '5h ago', status: 'Verified' },
    { type: 'Identity Sync', location: 'Blockchain Network', time: '1d ago', status: 'Success' },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <section className="flex flex-col items-center text-center space-y-4 py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-blue-500/10 border-2 border-blue-500/30 p-1 overflow-hidden">
            <img 
              src={profile?.photoURL} 
              alt={profile?.displayName} 
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute bottom-0 right-0 p-1.5 bg-green-500 rounded-full border-2 border-slate-950">
            <Shield className="w-3 h-3 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase">{profile?.displayName}</h2>
          <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">{profile?.role} Profile</p>
        </div>
      </section>

      {/* DID Card */}
      <section className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-2xl shadow-indigo-900/40 space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
          <Globe className="w-32 h-32" />
        </div>
        
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/70">Decentralized Identity (DID)</span>
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-indigo-200" />
              <span className="text-xs font-mono text-white/90 truncate max-w-[180px] tracking-wider">{profile?.did}</span>
            </div>
          </div>
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
            <QrCode className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex justify-between items-end relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200/70">Safety Score</span>
            <span className="text-3xl font-bold text-white tracking-tight">{profile?.safetyScore}%</span>
          </div>
          <div className="px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">Verified 2026</span>
          </div>
        </div>
      </section>

      {/* Settings List */}
      <section className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2 mb-3">Security & Identity</h3>
        
        <button className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between group hover:bg-slate-900 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-slate-300">Phone Verification</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${profile?.phoneVerified ? 'text-green-500' : 'text-amber-500'}`}>
              {profile?.phoneVerified ? 'Verified' : 'Pending'}
            </span>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between group hover:bg-slate-900 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-slate-300">Biometric Auth</span>
          </div>
          <div className="w-10 h-6 bg-blue-600 rounded-full relative p-1">
            <div className="w-4 h-4 bg-white rounded-full absolute right-1" />
          </div>
        </button>

        <button className="w-full p-4 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between group hover:bg-slate-900 transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
              <History className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-slate-300">Verification Logs</span>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
        </button>
      </section>

      {/* Verification Logs */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-2">Recent Verifications</h3>
        <div className="space-y-3">
          {logs.map((log, i) => (
            <div key={i} className="p-4 bg-slate-900/30 border border-slate-800/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <div>
                  <span className="block font-bold text-sm text-slate-300">{log.type}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">{log.location}</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{log.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section className="pt-4">
        <button
          onClick={handleLogout}
          className="w-full p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-center gap-3 text-red-500 font-bold hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </section>

      <div className="text-center py-8">
        <p className="text-[10px] text-slate-700 uppercase tracking-[0.2em] font-bold">SafeTrail v1.0.26 — Agentic Safety Platform</p>
      </div>
    </div>
  );
}
