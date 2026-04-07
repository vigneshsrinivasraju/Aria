import React, { useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, AlertTriangle, MapPin, Camera, Send, ShieldAlert, Activity, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportIncidentProps {
  onClose: () => void;
}

export default function ReportIncident({ onClose }: ReportIncidentProps) {
  const [type, setType] = useState<string>('theft');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incidentTypes = [
    { id: 'theft', label: 'Theft / Robbery' },
    { id: 'lost_item', label: 'Lost Item' },
    { id: 'medical', label: 'Medical Emergency' },
    { id: 'unsafe_zone', label: 'Unsafe Area' },
    { id: 'harassment', label: 'Harassment' },
    { id: 'natural_hazard', label: 'Natural Hazard' },
    { id: 'suspicious', label: 'Suspicious Activity' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'incidents'), {
        reporterUid: auth.currentUser.uid,
        type,
        severity,
        description,
        location: {
          lat: 1.290270, // Mocked Singapore location
          lng: 103.851959,
          address: 'Downtown Core, Singapore'
        },
        status: 'reported',
        blockchainHash: `0x${Math.random().toString(16).substring(2, 42)}`,
        createdAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      console.error("Failed to report incident", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-lg bg-slate-950 border border-slate-800/60 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl"
      >
        <div className="p-6 border-b border-slate-800/60 flex justify-between items-center bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/5">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">Report Incident</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">SafeTrail Emergency Response</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-900 rounded-full transition-all active:scale-90">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar pb-16">
          {/* Incident Type */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Incident Type</label>
            <div className="grid grid-cols-2 gap-3">
              {incidentTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`p-4 text-xs font-bold rounded-2xl border transition-all text-left flex items-center justify-between group ${
                    type === t.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-900/40 scale-[1.02]'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                  {type === t.id && <CheckCircle className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Severity Level</label>
            <div className="flex gap-3">
              {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl border transition-all ${
                    severity === s
                      ? s === 'critical' ? 'bg-rose-600 text-white border-rose-500 shadow-xl shadow-rose-900/40 scale-105' :
                        s === 'high' ? 'bg-amber-600 text-white border-amber-500 shadow-xl shadow-amber-900/40 scale-105' :
                        s === 'medium' ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-900/40 scale-105' :
                        'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-900/40 scale-105'
                      : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Location (Auto-detected) */}
          <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl flex items-center gap-5 backdrop-blur-sm">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="block text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-1">Auto-Detected Location</span>
              <span className="text-sm font-bold text-slate-200">Downtown Core, Singapore</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              className="w-full p-5 bg-slate-900/50 border border-slate-800/60 rounded-3xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:bg-slate-900 transition-all min-h-[140px] resize-none placeholder:text-slate-600 shadow-inner"
              required
            />
          </div>

          {/* Image Upload (Mock) */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 ml-1">Evidence (Optional)</label>
            <div className="w-full h-36 border-2 border-dashed border-slate-800/60 rounded-3xl flex flex-col items-center justify-center gap-3 text-slate-600 hover:text-indigo-400 hover:border-indigo-500/30 cursor-pointer transition-all bg-slate-900/20 group">
              <div className="p-3 bg-slate-900/50 rounded-2xl border border-slate-800/60 group-hover:border-indigo-500/30 transition-all">
                <Camera className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Tap to upload photo</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            disabled={isSubmitting}
            className="w-full py-5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-3xl font-bold transition-all shadow-2xl shadow-rose-900/40 flex items-center justify-center gap-4 active:scale-95 border border-rose-400/20"
          >
            {isSubmitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Activity className="w-6 h-6" />
              </motion.div>
            ) : (
              <>
                <Send className="w-6 h-6" />
                Submit Incident Report
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
