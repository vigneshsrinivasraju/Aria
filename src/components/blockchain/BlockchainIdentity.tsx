import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { Shield, Lock, FileText, CheckCircle, Zap, ExternalLink, Copy, RefreshCw, Fingerprint, Key, Upload, AlertCircle, XCircle, Sparkles, Info, ShieldCheck, Phone, MessageSquare, Satellite, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface BlockchainIdentityProps {
  profile: UserProfile | null;
}

export default function BlockchainIdentity({ profile }: BlockchainIdentityProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<'Passport' | 'Aadhaar' | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [viewingZkp, setViewingZkp] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isSatelliteConnecting, setIsSatelliteConnecting] = useState(false);

  const handleSendOtp = () => {
    if (!phoneInput.match(/^\+?[\d\s-]{10,}$/)) {
      alert("Please enter a valid phone number.");
      return;
    }
    
    setIsSendingOtp(true);
    setIsSatelliteConnecting(true);
    
    // Simulate Satellite Uplink
    setTimeout(() => {
      setIsSatelliteConnecting(false);
      
      // Simulate ARIA sending OTP via Satellite
      setTimeout(() => {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setShowOtpInput(true);
        setIsSendingOtp(false);
        alert(`[ARIA SATELLITE SERVICE] Secure verification code sent to ${phoneInput} via StarLink-7: ${otp}`);
      }, 1000);
    }, 2000);
  };

  const handleVerifyOtp = async () => {
    if (otpInput === generatedOtp) {
      setIsVerifyingOtp(true);
      try {
        await updateDoc(doc(db, 'users', profile!.uid), {
          phoneVerified: true,
          phoneNumber: phoneInput
        });
        setIsVerifyingOtp(false);
        setShowOtpInput(false);
      } catch (error) {
        console.error("Error verifying OTP:", error);
        setIsVerifyingOtp(false);
      }
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleGenerateProof = async () => {
    if (!profile || !profile.isVerified) {
      alert("Please complete DID verification first to generate a Zero-Knowledge Proof.");
      return;
    }

    setIsGeneratingProof(true);
    
    // Simulate ZKP computation (e.g., Groth16 or PlonK)
    // This proves the user's age is > 18 without revealing the birthdate
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          ageProofGenerated: true
        });
        setIsGeneratingProof(false);
        setViewingZkp(true);
      } catch (error) {
        console.error("Error generating proof:", error);
        setIsGeneratingProof(false);
      }
    }, 3000);
  };

  const handleVerify = async () => {
    if (!profile) return;
    
    const allVerified = profile.travelDocuments?.every(d => d.status === 'verified');
    const phoneVerified = profile.phoneVerified;
    
    if (!allVerified || !phoneVerified) {
      alert("Please verify both documents and your phone number first.");
      return;
    }

    setIsVerifying(true);
    
    // Simulate blockchain DID generation
    setTimeout(async () => {
      const newDid = `did:safetrail:2026:${Math.random().toString(36).substring(2, 15)}`;
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          did: newDid,
          isVerified: true,
          didMetadata: {
            method: 'safetrail:2026',
            controller: `did:safetrail:admin:${Math.random().toString(36).substring(2, 8)}`,
            createdAt: Date.now(),
            version: '2.0.1'
          }
        });
        setIsVerifying(false);
      } catch (error) {
        console.error("Error updating DID:", error);
        setIsVerifying(false);
      }
    }, 2000);
  };

  const simulateUpload = async (type: 'Passport' | 'Aadhaar') => {
    if (!profile) return;
    setUploadingDoc(type);
    
    // Simulate document processing and verification
    setTimeout(async () => {
      // 20% chance of failure for simulation
      const isSuccess = Math.random() > 0.2;
      const failureReasons = [
        "Image quality too low - details unreadable.",
        "Document expired - please provide a valid ID.",
        "Name mismatch - does not match profile name.",
        "Incomplete document - edges are cut off."
      ];

      const updatedDocs = profile.travelDocuments?.map(d => 
        d.type === type 
          ? { 
              ...d, 
              status: (isSuccess ? 'verified' : 'rejected') as 'verified' | 'rejected', 
              failureReason: isSuccess ? undefined : failureReasons[Math.floor(Math.random() * failureReasons.length)],
              updatedAt: Date.now() 
            } 
          : d
      );
      
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          travelDocuments: updatedDocs
        });
        setUploadingDoc(null);
      } catch (error) {
        console.error("Error uploading doc:", error);
        setUploadingDoc(null);
      }
    }, 2500);
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Blockchain Identity</h1>
        <p className="text-slate-500 text-sm font-medium">Decentralized & Encrypted Travel Security</p>
      </header>

      {/* DID Card */}
      <section className={`p-6 bg-gradient-to-br border rounded-3xl relative overflow-hidden group transition-all duration-500 ${
        profile?.isVerified 
          ? 'from-indigo-900/40 to-slate-900 border-indigo-500/20' 
          : 'from-slate-900 to-slate-950 border-slate-800'
      }`}>
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Fingerprint className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl transition-colors ${profile?.isVerified ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Decentralized ID (DID)</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${profile?.isVerified ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {profile?.isVerified ? 'Active on SafeChain v2.0' : 'Verification Required'}
                  </span>
                </div>
              </div>
            </div>
            {!profile?.isVerified && (
              <button 
                onClick={handleVerify}
                disabled={isVerifying || !profile?.travelDocuments?.every(d => d.status === 'verified')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-900/20"
              >
                {isVerifying ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {isVerifying ? 'Generating DID...' : 'Generate DID'}
              </button>
            )}
            {profile?.isVerified && (
              <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Verified
              </div>
            )}
          </div>

          <div className="p-4 bg-black/40 border border-slate-800 rounded-2xl space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">DID Address</span>
              <div className="flex items-center justify-between">
                <code className="text-xs text-indigo-300 truncate mr-4">
                  {profile?.did || 'did:safetrail:pending_verification_...'}
                </code>
                {profile?.did && (
                  <button className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors">
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            {profile?.didMetadata && (
              <div className="pt-4 border-t border-slate-800/50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">DID Method</span>
                  <span className="block text-[10px] text-indigo-400 font-mono">{profile.didMetadata.method}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">Controller</span>
                  <span className="block text-[10px] text-slate-400 font-mono truncate" title={profile.didMetadata.controller}>
                    {profile.didMetadata.controller}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">Created At</span>
                  <span className="block text-[10px] text-slate-400">
                    {new Date(profile.didMetadata.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">Document Version</span>
                  <span className="block text-[10px] text-slate-400">{profile.didMetadata.version}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Trust Score</span>
              <span className={`text-xl font-bold ${profile?.isVerified ? 'text-green-400' : 'text-slate-500'}`}>
                {profile?.isVerified ? '9.8/10' : 'N/A'}
              </span>
            </div>
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
              <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Verifications</span>
              <span className={`text-xl font-bold ${profile?.isVerified ? 'text-slate-200' : 'text-slate-500'}`}>
                {profile?.isVerified ? '142' : '0'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Phone Verification Section */}
      <section className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${profile?.phoneVerified ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-800 text-slate-500'}`}>
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest">Phone Verification</h3>
              <p className="text-[10px] text-slate-500">Secure your account with ARIA OTP verification.</p>
            </div>
          </div>
          {profile?.phoneVerified && (
            <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </div>
          )}
        </div>

        {!profile?.phoneVerified ? (
          <div className="space-y-4">
            {!showOtpInput ? (
              <div className="flex gap-3">
                <input 
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1 234 567 890"
                  className="flex-1 p-3 bg-black/40 border border-slate-800 rounded-2xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-all"
                />
                <button 
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  {isSendingOtp ? (
                    isSatelliteConnecting ? <Satellite className="w-3 h-3 animate-bounce" /> : <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  {isSatelliteConnecting ? 'Uplink...' : 'ARIA'}
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                  <Globe className="w-4 h-4 text-blue-400 animate-pulse" />
                  <p className="text-[10px] text-blue-200/70">
                    ARIA Satellite Service has transmitted a 6-digit code to <span className="text-blue-400 font-bold">{phoneInput}</span>
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {[...Array(6)].map((_, i) => (
                    <input 
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={otpInput[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value.slice(-1); // Get last character
                        if (val.match(/^\d$/)) {
                          const otpArray = otpInput.split('');
                          // Ensure array has 6 elements
                          while (otpArray.length < 6) otpArray.push('');
                          otpArray[i] = val;
                          const finalOtp = otpArray.join('').slice(0, 6);
                          setOtpInput(finalOtp);
                          if (i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
                        } else if (e.target.value === '') {
                          const otpArray = otpInput.split('');
                          while (otpArray.length < 6) otpArray.push('');
                          otpArray[i] = '';
                          setOtpInput(otpArray.join(''));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otpInput[i] && i > 0) {
                          document.getElementById(`otp-${i - 1}`)?.focus();
                        }
                      }}
                      className="w-10 h-12 bg-black/40 border border-slate-800 rounded-xl text-center text-lg font-bold text-slate-200 focus:outline-none focus:border-blue-500 transition-all"
                    />
                  ))}
                </div>
                <button 
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp || otpInput.length !== 6}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {isVerifyingOtp ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                  Verify OTP
                </button>
                <button 
                  onClick={() => setShowOtpInput(false)}
                  className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hover:text-slate-400"
                >
                  Change Number
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-black/40 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-xl text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-sm font-mono text-slate-300">{profile.phoneNumber}</span>
            </div>
            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Primary Contact</span>
          </div>
        )}
      </section>

      {/* Encrypted Documents */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Identity Documents</h3>
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {profile?.travelDocuments?.filter(d => d.status === 'verified').length} / 2 Verified
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile?.travelDocuments?.map((doc, i) => (
            <div key={i} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between group hover:border-slate-700 transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl transition-colors ${
                  doc.status === 'verified' ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                }`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="block font-bold text-base">{doc.type}</span>
                  <div className="flex flex-col gap-1">
                    {doc.status === 'verified' ? (
                      <span className="text-[10px] text-green-500 uppercase font-bold tracking-widest flex items-center gap-1">
                        <CheckCircle className="w-2 h-2" /> Verified
                      </span>
                    ) : doc.status === 'rejected' ? (
                      <div className="space-y-1">
                        <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest flex items-center gap-1">
                          <XCircle className="w-2 h-2" /> Verification Failed
                        </span>
                        <p className="text-[9px] text-slate-500 leading-tight max-w-[150px]">
                          {doc.failureReason}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-amber-500 uppercase font-bold tracking-widest flex items-center gap-1">
                        <AlertCircle className="w-2 h-2" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {doc.status !== 'verified' ? (
                <button 
                  onClick={() => simulateUpload(doc.type)}
                  disabled={uploadingDoc === doc.type}
                  className={`px-4 py-2 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${
                    doc.status === 'rejected' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                  } disabled:bg-slate-800`}
                >
                  {uploadingDoc === doc.type ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploadingDoc === doc.type ? 'Verifying...' : doc.status === 'rejected' ? 'Re-upload' : 'Upload & Verify'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[8px] font-bold uppercase tracking-widest rounded">Encrypted</div>
                  <button 
                    onClick={() => setViewingDoc(doc.type)}
                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                    title="View Encrypted Document"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Zero-Knowledge Proof Panel */}
      <section className={`p-6 border rounded-3xl space-y-6 transition-all duration-500 ${
        profile?.ageProofGenerated 
          ? 'bg-emerald-900/20 border-emerald-500/30' 
          : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${profile?.ageProofGenerated ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
              <Zap className={`w-5 h-5 ${profile?.ageProofGenerated ? 'fill-current' : ''}`} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest">ZKP Age Verification</h3>
              <p className="text-[10px] text-slate-500">Prove you are &gt;18 without revealing your birthdate.</p>
            </div>
          </div>
          {!profile?.ageProofGenerated ? (
            <button 
              onClick={handleGenerateProof}
              disabled={isGeneratingProof || !profile?.isVerified}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              {isGeneratingProof ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {isGeneratingProof ? 'Computing Proof...' : 'Generate Proof'}
            </button>
          ) : (
            <button 
              onClick={() => setViewingZkp(true)}
              className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest hover:text-emerald-400 transition-colors"
            >
              View Proof Details
            </button>
          )}
        </div>

        {!profile?.isVerified && !profile?.ageProofGenerated && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-200/70 font-medium">
              Complete DID verification to unlock Zero-Knowledge Proof generation.
            </p>
          </div>
        )}
      </section>

      {/* Smart Contracts & Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Safety Insurance</h3>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="block font-bold text-sm">Active Policy</span>
                <span className="text-[10px] text-slate-500">SafeTravel Premium v4</span>
              </div>
              <div className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase tracking-widest rounded">Smart Contract</div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Coverage</span>
              <span className="text-xs font-bold text-slate-200">$50,000 USD</span>
            </div>
            <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
              Claim Portal
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Tamper-proof Logs</h3>
          </div>
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            {[
              { event: 'Location Check-in', time: '10:24 AM', status: 'Verified' },
              { event: 'Safety Score Update', time: '09:15 AM', status: 'Verified' },
              { event: 'DID Verification', time: '08:00 AM', status: 'Verified' },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-purple-500" />
                  <span className="text-slate-300 font-medium">{log.event}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">{log.time}</span>
                  <span className="text-green-500 font-bold uppercase tracking-widest">{log.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      {/* Document Viewer Modal Simulation */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">Secure Document Viewer</h3>
                </div>
                <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600 border-2 border-dashed border-slate-700">
                    <FileText className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-slate-100">{viewingDoc}</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Encrypted on SafeChain Vault</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-black/40 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Encryption Standard</span>
                      <span className="text-blue-400 font-bold">AES-256-GCM</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Storage Node</span>
                      <span className="text-slate-300 font-mono">node-sg-042.ipfs.io</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">IPFS Hash</span>
                      <span className="text-slate-500 font-mono truncate max-w-[150px]">QmXoyp...7VfW</span>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-[10px] text-emerald-200/70 leading-relaxed">
                      This document is end-to-end encrypted. Only your private key can decrypt this content for viewing. No central server has access to the raw data.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setViewingDoc(null)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-widest rounded-2xl transition-all"
                >
                  Close Secure Vault
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ZKP Proof Modal Simulation */}
      <AnimatePresence>
        {viewingZkp && profile?.ageProofGenerated && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] max-w-lg w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <h3 className="font-bold text-lg">Zero-Knowledge Proof</h3>
                </div>
                <button onClick={() => setViewingZkp(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl text-slate-100">Age Verification Proof</h4>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Cryptographically Verified</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-black/40 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Proof Type</span>
                      <span className="text-slate-200 font-bold">Age Verification (&gt;18)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Method</span>
                      <span className="text-blue-400 font-bold">zk-SNARK (Groth16)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Status</span>
                      <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified &gt;18
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Proof Hash (Public Signal)</span>
                        <button className="p-1 hover:bg-slate-800 rounded transition-colors">
                          <Copy className="w-3 h-3 text-slate-600" />
                        </button>
                      </div>
                      <code className="text-[10px] text-emerald-400 break-all leading-relaxed font-mono block p-2 bg-emerald-500/5 rounded border border-emerald-500/10">
                        0x7f8c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c
                      </code>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-3">
                    <Info className="w-5 h-5 text-blue-400 shrink-0" />
                    <p className="text-[10px] text-blue-200/70 leading-relaxed">
                      This zk-SNARK proof cryptographically guarantees you are over 18 years old. Your actual birthdate remains hidden from the verifier, ensuring maximum privacy.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setViewingZkp(false)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-900/20"
                >
                  Close Proof Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
