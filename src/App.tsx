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
          { 
            name: 'Gardens by the Bay', 
            category: 'nature', 
            location: { lat: 1.2816, lng: 103.8636 }, 
            safetyScore: 98, 
            description: 'Futuristic park with giant tree-like structures and bio-domes.',
            imageUrl: 'https://images.unsplash.com/photo-1528181304800-2f140819ad9c?auto=format&fit=crop&q=80&w=800'
          },
          { 
            name: 'Universal Studios', 
            category: 'entertainment', 
            location: { lat: 1.2540, lng: 103.8238 }, 
            safetyScore: 95, 
            description: 'Movie-themed amusement park on Sentosa Island.',
            imageUrl: 'https://images.unsplash.com/photo-1503221043305-f7498f8b7888?auto=format&fit=crop&q=80&w=800'
          },
          { 
            name: 'Marina Bay Sands SkyPark', 
            category: 'landmark', 
            location: { lat: 1.2834, lng: 103.8607 }, 
            safetyScore: 99, 
            description: 'Iconic observation deck with panoramic city views.',
            imageUrl: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&q=80&w=800'
          },
        ];
        for (const a of attractions) await addDoc(collection(db, 'attractions'), a);

        // Seed Hotels
        const hotels = [
          { 
            name: 'Marina Bay Sands', 
            location: { lat: 1.2834, lng: 103.8607 }, 
            priceRange: '$$$$', 
            safetyRating: 5, 
            amenities: ['Infinity Pool', 'Gym', '24/7 Security', 'Smart Locks'], 
            description: 'World-renowned luxury hotel with the iconic rooftop pool.',
            imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'
          },
          { 
            name: 'Raffles Hotel Singapore', 
            location: { lat: 1.2949, lng: 103.8545 }, 
            priceRange: '$$$$', 
            safetyRating: 5, 
            amenities: ['Heritage Tour', 'Butler Service', 'High Security'], 
            description: 'Historic colonial-style hotel known for its timeless elegance.',
            imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'
          },
          { 
            name: 'The Fullerton Hotel', 
            location: { lat: 1.2861, lng: 103.8532 }, 
            priceRange: '$$$', 
            safetyRating: 5, 
            amenities: ['Spa', 'Business Center', 'Concierge'], 
            description: 'Luxury hotel housed in a historic post office building.',
            imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=800'
          },
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
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="w-12 h-12 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-50 p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md relative z-10"
        >
          <div className="flex justify-center mb-8">
            <div className="p-5 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
              <Shield className="w-16 h-16 text-indigo-500" />
            </div>
          </div>
          <h1 className="text-6xl font-black mb-4 tracking-tighter bg-gradient-to-r from-white via-indigo-400 to-purple-500 bg-clip-text text-transparent">SAFETRAIL 2026</h1>
          <p className="text-slate-500 mb-12 leading-relaxed text-lg font-bold uppercase tracking-widest">
            Next-Gen Agentic Safety Intelligence
          </p>
          <button
            onClick={handleLogin}
            className="w-full py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-bold transition-all shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-4 active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 overflow-hidden">
      {/* Header */}
      <header className="p-6 border-b border-slate-800/40 flex justify-between items-center bg-slate-950/80 backdrop-blur-2xl z-50">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-900/40 border border-indigo-400/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white leading-none">SAFETRAIL</span>
            <span className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.3em] mt-1">v2026.4.7</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Safety Score</span>
            <span className="text-sm font-bold text-indigo-400">{profile?.safetyScore}%</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 overflow-hidden p-0.5">
            <img src={profile?.photoURL} alt={profile?.displayName} className="w-full h-full rounded-[14px] object-cover" referrerPolicy="no-referrer" />
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
