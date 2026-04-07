import React, { useState, useEffect } from 'react';
import { auth, db, googleProvider, googleProvider as provider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from './types';
import Dashboard from './components/dashboard/Dashboard';
import SafetyMap from './components/map/SafetyMap';
import AriaAssistant from './components/aria/AriaAssistant';
import BlockchainIdentity from './components/blockchain/BlockchainIdentity';
import Profile from './components/profile/Profile';
import BottomNav from './components/layout/BottomNav';
import { Shield, AlertTriangle, Map as MapIcon, MessageSquare, User, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'aria' | 'blockchain' | 'profile'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          // Create new profile
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Tourist',
            photoURL: firebaseUser.photoURL || '',
            did: '', // No DID until verified
            isVerified: false,
            phoneVerified: false,
            safetyScore: 100,
            role: firebaseUser.email === 'gundrajuvignesh032@gmail.com' ? 'admin' : 'tourist',
            createdAt: serverTimestamp(),
            travelDocuments: [
              { type: 'Passport', status: 'pending', updatedAt: Date.now() },
              { type: 'Aadhaar', status: 'pending', updatedAt: Date.now() }
            ]
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const seedData = async () => {
      if (!user) return;
      
      // Check if we've already seeded
      const seeded = localStorage.getItem('safetrail_seeded');
      if (seeded) return;

      try {
        const { addDoc, collection } = await import('firebase/firestore');
        
        // Seed Zones
        const zones = [
          { name: 'Marina Bay Safe Zone', type: 'safe', geometry: { center: { lat: 1.2823, lng: 103.8587 }, radius: 500 }, riskLevel: 1 },
          { name: 'Geylang Caution Area', type: 'caution', geometry: { center: { lat: 1.3107, lng: 103.8864 }, radius: 800 }, riskLevel: 4 },
          { name: 'Restricted Port Area', type: 'restricted', geometry: { center: { lat: 1.2644, lng: 103.8211 }, radius: 600 }, riskLevel: 8 },
        ];
        for (const z of zones) await addDoc(collection(db, 'safety_zones'), z);

        // Seed Attractions
        const attractions = [
          { name: 'Gardens by the Bay', category: 'historical', location: { lat: 1.2816, lng: 103.8636 }, safetyScore: 98, description: 'Futuristic park with giant tree-like structures.' },
          { name: 'Universal Studios', category: 'entertainment', location: { lat: 1.2540, lng: 103.8238 }, safetyScore: 95, description: 'Movie-themed amusement park.' },
        ];
        for (const a of attractions) await addDoc(collection(db, 'attractions'), a);

        // Seed Hotels
        const hotels = [
          { name: 'Marina Bay Sands', location: { lat: 1.2834, lng: 103.8607 }, priceRange: '$$$$', safetyRating: 5, amenities: ['Pool', 'Gym', 'Safe'], description: 'Iconic luxury hotel.' },
          { name: 'Raffles Hotel', location: { lat: 1.2949, lng: 103.8545 }, priceRange: '$$$$', safetyRating: 5, amenities: ['History', 'Bar'], description: 'Colonial-style luxury hotel.' },
        ];
        for (const h of hotels) await addDoc(collection(db, 'hotels'), h);

        localStorage.setItem('safetrail_seeded', 'true');
      } catch (e) {
        console.error("Seeding failed", e);
      }
    };

    if (user && profile?.role === 'admin') seedData();
  }, [user, profile]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="w-12 h-12 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-500/10 rounded-full border border-blue-500/20">
              <Shield className="w-16 h-16 text-blue-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">SafeTrail 2026</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Your agentic travel safety companion. Real-time monitoring, AI-guided navigation, and decentralized identity for the modern tourist.
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="p-4 border-bottom border-slate-800 flex justify-between items-center bg-slate-950/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <span className="font-bold text-lg tracking-tight">SafeTrail</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400">Safety Score</span>
            <span className="text-sm font-bold text-green-400">{profile?.safetyScore}%</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 overflow-hidden">
            <img src={profile?.photoURL} alt={profile?.displayName} referrerPolicy="no-referrer" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <Dashboard profile={profile} setActiveTab={setActiveTab} />
            </motion.div>
          )}
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <SafetyMap />
            </motion.div>
          )}
          {activeTab === 'aria' && (
            <motion.div
              key="aria"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <AriaAssistant profile={profile} />
            </motion.div>
          )}
          {activeTab === 'blockchain' && (
            <motion.div
              key="blockchain"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <BlockchainIdentity profile={profile} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              <Profile profile={profile} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
