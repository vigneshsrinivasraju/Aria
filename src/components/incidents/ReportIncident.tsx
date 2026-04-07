import React, { useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, AlertTriangle, MapPin, Camera, Send, ShieldAlert, Activity } from 'lucide-react';
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
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-xl text-red-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Report Incident</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">SafeTrail Emergency Response</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar pb-12">
          {/* Incident Type */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Incident Type</label>
            <div className="grid grid-cols-2 gap-2">
              {incidentTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`p-3 text-xs font-semibold rounded-xl border transition-all text-left ${
                    type === t.id
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Severity Level</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all ${
                    severity === s
                      ? s === 'critical' ? 'bg-red-500 text-white border-red-500' :
                        s === 'high' ? 'bg-orange-500 text-white border-orange-500' :
                        s === 'medium' ? 'bg-yellow-500 text-white border-yellow-500' :
                        'bg-blue-500 text-white border-blue-500'
                      : 'bg-slate-800/50 border-slate-700 text-slate-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Location (Auto-detected) */}
          <div className="p-4 bg-slate-800/30 border border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Auto-Detected Location</span>
              <span className="text-sm font-medium text-slate-300">Downtown Core, Singapore</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened..."
              className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors min-h-[120px] resize-none"
              required
            />
          </div>

          {/* Image Upload (Mock) */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Evidence (Optional)</label>
            <div className="w-full h-32 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-slate-500 hover:border-slate-700 cursor-pointer transition-all">
              <Camera className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Tap to upload photo</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            disabled={isSubmitting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <Activity className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Incident Report
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
