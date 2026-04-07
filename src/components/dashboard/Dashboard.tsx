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
      <header className="flex justify-between items-center py-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
            {profile?.isVerified ? (
              <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Verified DID</span>
              </div>
            ) : (
              <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Unverified DID</span>
              </div>
            )}
            {profile?.phoneVerified && (
              <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-1">
                <Phone className="w-3 h-3 text-blue-500" />
                <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Phone Verified</span>
              </div>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Real-time safety intelligence monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-slate-900 border border-slate-800 rounded-xl relative">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-slate-950 rounded-full" />
          </button>
        </div>
      </header>

      {/* Top Section: Safety Score & Risk Indicator */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              currentSafetyScore > 80 ? 'bg-green-500/10 text-green-500' :
              currentSafetyScore > 50 ? 'bg-yellow-500/10 text-yellow-500' :
              'bg-red-500/10 text-red-500'
            }`}>
              {currentSafetyScore > 80 ? 'Low Risk' : currentSafetyScore > 50 ? 'Moderate Risk' : 'High Risk'}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800 stroke-[3]" />
                <circle cx="18" cy="18" r="16" fill="none" 
                  className={`stroke-[3] transition-all duration-1000 ease-out ${
                    currentSafetyScore > 80 ? 'stroke-green-500' :
                    currentSafetyScore > 50 ? 'stroke-yellow-500' :
                    'stroke-red-500'
                  }`}
                  strokeDasharray={`${currentSafetyScore}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold">{currentSafetyScore}</span>
                <span className="text-[8px] text-slate-500 uppercase font-bold">Score</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold">SafeTrail Index</h3>
              <p className="text-xs text-slate-400 max-w-[200px]">
                Dynamic score based on crime rate, weather, and crowd density.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold">
                  <ArrowUpRight className="w-3 h-3" /> +4.2%
                </div>
                <span className="text-[10px] text-slate-600 uppercase font-bold">vs last hour</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Incidents</h4>
          <div className="space-y-3">
            {[
              { label: 'High/Critical', value: incidentCounts.high, color: 'bg-red-500' },
              { label: 'Medium', value: incidentCounts.medium, color: 'bg-yellow-500' },
              { label: 'Low', value: incidentCounts.low, color: 'bg-blue-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Insights Panel */}
      <section className="p-6 bg-blue-600/5 border border-blue-500/20 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-400">
            <Zap className="w-4 h-4 fill-current" />
            <h3 className="text-xs font-bold uppercase tracking-widest">ARIA AI Insights</h3>
          </div>
          {isGeneratingInsights && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {aiInsights.map((insight, i) => (
            <div key={i} className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl flex gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
                <Info className="w-3 h-3 text-blue-500" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency Quick Action Panel */}
      <section className="grid grid-cols-4 gap-3">
        {[
          { icon: AlertTriangle, label: 'SOS', color: 'bg-red-600 shadow-red-900/40', action: () => setShowReport(true) },
          { icon: Phone, label: 'Police', color: 'bg-blue-600 shadow-blue-900/40', action: () => {} },
          { icon: Heart, label: 'Medical', color: 'bg-rose-600 shadow-rose-900/40', action: () => {} },
          { icon: Shield, label: 'Verify', color: 'bg-indigo-600 shadow-indigo-900/40', action: () => setActiveTab('blockchain') },
        ].map((action, i) => (
          <button 
            key={i} 
            onClick={action.action}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-full aspect-square ${action.color} rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-all`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{action.label}</span>
          </button>
        ))}
      </section>

      {/* Safety Trend Graph */}
      <section className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Safety Trend</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Last 12 Hours</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safetyTrendData}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis domain={[80, 100]} hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

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
          <div className="space-y-3">
            {attractions.map(a => (
              <div key={a.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-sm truncate">{a.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{a.category}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] text-green-500 font-bold">{a.safetyScore}% Safe</span>
                  </div>
                </div>
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
          <div className="space-y-3">
            {hotels.map(h => (
              <div key={h.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-sm truncate">{h.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">{h.priceRange}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                    <div className="flex items-center gap-0.5 text-yellow-500">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span className="text-[10px] font-bold">{h.safetyRating}/5</span>
                    </div>
                  </div>
                </div>
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
