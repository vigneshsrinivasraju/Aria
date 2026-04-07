import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { UserProfile, Incident, SafetyZone, Attraction, Hotel, WeatherInfo } from '../../types';
import { Shield, AlertTriangle, MapPin, Users, TrendingUp, Plus, ChevronRight, Activity, Bell, Zap, Info, Thermometer, Navigation, Calendar, Star, Phone, Building2, Landmark, MoreHorizontal, ArrowUpRight, ArrowDownRight, Heart, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ReportIncident from '../incidents/ReportIncident';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  profile: UserProfile | null;
  setActiveTab: (tab: 'dashboard' | 'map' | 'aria' | 'blockchain' | 'profile') => void;
}

const safetyTrendData = [
  { time: '08:00', score: 92 },
  { time: '10:00', score: 88 },
  { time: '12:00', score: 95 },
  { time: '14:00', score: 91 },
  { time: '16:00', score: 89 },
  { time: '18:00', score: 94 },
  { time: '20:00', score: 92 },
];

export default function Dashboard({ profile, setActiveTab }: DashboardProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zones, setZones] = useState<SafetyZone[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>(['Analyzing real-time safety data...', 'Monitoring crowd density patterns...']);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'incidents'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIncidents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident)));
    });

    const zq = query(collection(db, 'safety_zones'), limit(10));
    const unsubscribeZones = onSnapshot(zq, (snapshot) => {
      setZones(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SafetyZone)));
    });

    const aq = query(collection(db, 'attractions'), limit(3));
    const unsubscribeAttractions = onSnapshot(aq, (snapshot) => {
      setAttractions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attraction)));
    });

    const hq = query(collection(db, 'hotels'), limit(3));
    const unsubscribeHotels = onSnapshot(hq, (snapshot) => {
      setHotels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hotel)));
    });

    return () => {
      unsubscribe();
      unsubscribeZones();
      unsubscribeAttractions();
      unsubscribeHotels();
    };
  }, []);

  const generateAiInsights = async () => {
    if (isGeneratingInsights) return;
    setIsGeneratingInsights(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      const prompt = `Analyze current safety data:
      Incidents: ${incidents.map(i => i.type).join(', ')}
      Zones: ${zones.map(z => `${z.name} (${z.type})`).join(', ')}
      
      Generate 3 concise, actionable safety insights for a tourist in 2026.
      Return as a JSON array of strings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || "[]");
      setAiInsights(data);
    } catch (e) {
      console.error("AI Insights failed", e);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  useEffect(() => {
    if (incidents.length > 0) generateAiInsights();
  }, [incidents.length]);

  const incidentCounts = useMemo(() => {
    return {
      low: incidents.filter(i => i.severity === 'low').length,
      medium: incidents.filter(i => i.severity === 'medium').length,
      high: incidents.filter(i => i.severity === 'high' || i.severity === 'critical').length,
    };
  }, [incidents]);

  const currentSafetyScore = useMemo(() => {
    let score = 100;
    incidents.forEach(i => {
      score -= i.severity === 'critical' ? 15 : i.severity === 'high' ? 10 : 5;
    });
    zones.forEach(z => {
      if (z.type === 'restricted') score -= 20;
      if (z.type === 'caution') score -= 10;
    });
    return Math.max(0, score);
  }, [incidents, zones]);

  return (
    <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Welcome Header */}
      <header className="flex justify-between items-start py-4 border-b border-slate-800/40 mb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">COMMAND CENTER</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-[0.2em]">System Online</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {currentTime.toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Navigation className="w-3 h-3" />
              Singapore Node-01
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[9px] text-slate-600 uppercase font-black tracking-[0.2em]">Network Latency</span>
            <span className="text-xs font-mono text-emerald-400">24ms</span>
          </div>
          <button className="p-3 bg-slate-950 border border-slate-800/60 rounded-2xl relative group hover:border-indigo-500/50 transition-all">
            <Bell className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-slate-950 rounded-full" />
          </button>
        </div>
      </header>

      {/* Live Ticker */}
      <div className="w-full bg-slate-950 border-y border-slate-800/40 py-2 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-950 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-950 to-transparent z-10" />
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-12 whitespace-nowrap"
        >
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-rose-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500">Alert:</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Heavy rain detected in Marina Bay area. Safety score adjusted.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Update:</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">Crowd density at Gardens by the Bay is optimal for visiting.</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-500">Info:</span>
                <span className="text-[9px] font-medium text-slate-400 uppercase tracking-widest">New safety zone established near Raffles Place.</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Top Section: Safety Score & Risk Indicator */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 p-8 bg-slate-950 border border-slate-800/60 rounded-[2.5rem] relative overflow-hidden shadow-2xl group"
        >
          <div className="absolute top-0 right-0 p-6">
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${
              currentSafetyScore > 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              currentSafetyScore > 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              {currentSafetyScore > 80 ? 'Optimal Safety' : currentSafetyScore > 50 ? 'Elevated Caution' : 'Critical Warning'}
            </div>
          </div>

          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-700" />
          
          <div className="flex items-center gap-10 relative z-10">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-900 stroke-[4]" />
                <motion.circle 
                  cx="18" cy="18" r="16" fill="none" 
                  initial={{ strokeDasharray: "0, 100" }}
                  animate={{ strokeDasharray: `${currentSafetyScore}, 100` }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className={`stroke-[4] transition-all duration-1000 ease-out ${
                    currentSafetyScore > 80 ? 'stroke-emerald-500' :
                    currentSafetyScore > 50 ? 'stroke-amber-500' :
                    'stroke-rose-500'
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white tracking-tighter">{currentSafetyScore}</span>
                <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Index</span>
              </div>
            </div>
            
            <div className="space-y-3 flex-1">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white tracking-tight">SAFETRAIL INDEX</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs">
                  Advanced multi-vector analysis of environmental, social, and infrastructure safety parameters.
                </p>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="space-y-1">
                  <span className="block text-[8px] text-slate-600 uppercase font-black tracking-widest">Trend</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <ArrowUpRight className="w-4 h-4" /> +4.2%
                  </div>
                </div>
                <div className="w-px h-8 bg-slate-800/60" />
                <div className="space-y-1">
                  <span className="block text-[8px] text-slate-600 uppercase font-black tracking-widest">Reliability</span>
                  <div className="text-xs font-bold text-indigo-400">99.8%</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-8 bg-slate-950 border border-slate-800/60 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Shield className="w-24 h-24 text-slate-500" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Incident Matrix</h4>
          <div className="space-y-5 relative z-10">
            {[
              { label: 'Critical', value: incidentCounts.high, color: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
              { label: 'Moderate', value: incidentCounts.medium, color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
              { label: 'Minimal', value: incidentCounts.low, color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.label}</span>
                  <span className="text-sm font-black text-white">{item.value}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / Math.max(1, incidents.length)) * 100}%` }}
                    transition={{ duration: 1.5, delay: 0.5 + i * 0.1 }}
                    className={`h-full ${item.color} ${item.shadow} shadow-lg`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* AI Insights Panel */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8">
          <Zap className="w-32 h-32 text-indigo-500/5" />
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3 text-indigo-400">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">ARIA INTELLIGENCE</h3>
              <p className="text-[10px] text-indigo-500/60 font-bold uppercase tracking-widest">Real-time threat analysis active</p>
            </div>
          </div>
          {isGeneratingInsights && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          {aiInsights.map((insight, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="p-5 bg-slate-950/80 border border-slate-800/60 rounded-3xl flex flex-col gap-4 group hover:border-indigo-500/40 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <Info className="w-4 h-4 text-indigo-500" />
                </div>
                <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Insight-0{i+1}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-bold">{insight}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Emergency Quick Action Panel */}
      <section className="grid grid-cols-4 gap-4">
        {[
          { icon: AlertTriangle, label: 'SOS', color: 'bg-rose-600 shadow-rose-900/40', action: () => setShowReport(true) },
          { icon: Phone, label: 'Police', color: 'bg-indigo-600 shadow-indigo-900/40', action: () => {} },
          { icon: Heart, label: 'Medical', color: 'bg-emerald-600 shadow-emerald-900/40', action: () => {} },
          { icon: Shield, label: 'Verify', color: 'bg-slate-800 shadow-black/40', action: () => setActiveTab('blockchain') },
        ].map((action, i) => (
          <motion.button 
            key={i} 
            onClick={action.action}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-3 group"
          >
            <div className={`w-full aspect-square ${action.color} rounded-[2rem] flex items-center justify-center shadow-2xl transition-all border border-white/10`}>
              <action.icon className="w-8 h-8 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-300 transition-colors">{action.label}</span>
          </motion.button>
        ))}
      </section>

      {/* Safety Trend Graph */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-8 bg-slate-950 border border-slate-800/60 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">SAFETY TELEMETRY</h3>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Real-time data streaming</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Live</span>
          </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safetyTrendData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[80, 100]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#10b981' }}
                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Travel Intelligence Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attractions Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Nearby Attractions</h3>
            </div>
            <button className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Explore</button>
          </div>
          <div className="space-y-4">
            {attractions.map(a => (
              <div key={a.id} className="group p-3 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4 hover:bg-slate-900 hover:border-blue-500/30 transition-all">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-800 shadow-lg">
                  {a.imageUrl ? (
                    <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <MapPin className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-sm truncate text-slate-100">{a.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{a.category}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">{a.safetyScore}% SAFE</span>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors mr-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Hotels Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Safe Stays</h3>
            </div>
            <button className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Book</button>
          </div>
          <div className="space-y-4">
            {hotels.map(h => (
              <div key={h.id} className="group p-3 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-4 hover:bg-slate-900 hover:border-indigo-500/30 transition-all">
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-800 shadow-lg">
                  {h.imageUrl ? (
                    <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-sm truncate text-slate-100">{h.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{h.priceRange}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <div className="flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-indigo-400" />
                      <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{h.safetyRating}/5</span>
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors mr-2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Geo-Fenced Zones */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Active Monitoring Zones</h3>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {zones.map((zone) => (
            <div key={zone.id} className="min-w-[180px] p-4 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest w-fit ${
                zone.type === 'safe' ? 'bg-green-500/10 text-green-500' :
                zone.type === 'caution' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {zone.type} Zone
              </div>
              <div>
                <span className="block font-bold text-sm truncate">{zone.name}</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Confidence</span>
                  <span className="text-[10px] text-slate-300 font-bold">98%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                  <div className="bg-blue-500 h-full w-[98%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showReport && <ReportIncident onClose={() => setShowReport(false)} />}
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return <Activity className={`${className} animate-pulse`} />;
}
