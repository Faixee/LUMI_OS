/**
 * LUMIX OS - Advanced Intelligence-First SMS
 * Created by: Faizain Murtuza
 * © 2025 Faizain Murtuza. All Rights Reserved.
 */

import React, { useState } from 'react';
import { Check, Shield, Zap, Globe, Crown, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { authService } from '../services/auth';

interface SubscriptionViewProps {
  onSuccess?: () => void;
}

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubscribe = async (planName: string) => {
      setProcessing(planName);
      try {
          // Simulate server-side validation delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Call simulation helper
          const success = authService.simulatePaymentSuccess(planName);
          
          if (success) {
              if (onSuccess) {
                  setShowSuccess(true);
                  setTimeout(() => {
                      onSuccess();
                  }, 1500);
              } else {
                  // Fallback for standalone view
                  navigate('/app');
              }
          } else {
              // If not logged in, try real API which will redirect to Stripe or error
              const data = await api.billingCheckout(planName);
              if (!data?.checkout_url) throw new Error('No checkout URL');
              window.location.assign(data.checkout_url);
          }
      } catch (e: any) {
          alert(e?.message || "Subscription failed. Please try again.");
          setProcessing(null);
      }
  };

  if (showSuccess) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black animate-in fade-in duration-500">
            <div className="glass-panel max-w-md w-full p-10 rounded-[2rem] border border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.15)] text-center space-y-8 animate-unlock">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl mx-auto flex items-center justify-center border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <Zap size={48} className="text-emerald-400" />
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold text-white font-sci-fi tracking-widest uppercase text-glow">Access Granted</h2>
                    <p className="text-emerald-400/60 text-xs font-mono tracking-[0.2em] uppercase">
                        Subscription Verified • Initializing...
                    </p>
                </div>
            </div>
        </div>
    );
  }

  const plans = [
    {
        name: 'FOUNDATION',
        price: '199',
        target: 'Startups',
        color: 'text-emerald-400',
        border: 'border-emerald-500',
        bg: 'bg-emerald-500/10',
        features: ['Digital Attendance', 'Basic Gradebook', 'Fee Ledger', 'LumiX Chat (Limited)', '100GB Storage']
    },
    {
        name: 'ASCENSION',
        price: '499',
        target: 'High Schools',
        color: 'text-cyan-400',
        border: 'border-cyan-500',
        bg: 'bg-cyan-500/10',
        popular: true,
        features: ['Everything in Foundation', 'Astra AI Predictions', 'Lumen Analytics', 'Student Gamification', 'Parent Mobile App', '1TB Storage']
    },
    {
        name: 'GOD MODE',
        price: '999',
        target: 'Elite Institutes',
        color: 'text-purple-400',
        border: 'border-purple-500',
        bg: 'bg-purple-500/10',
        features: ['Everything in Ascension', 'Full AI Agent Grid', 'Vision AI Auto-Grader', 'White Label Branding', 'Priority 24/7 Support', 'Unlimited Storage']
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
       <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-white font-sci-fi text-glow">SYSTEM UPGRADE</h2>
          <p className="text-slate-400 font-mono text-sm">Select the operational tier that matches your institution's ambition. Scale your intelligence infrastructure instantly.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {plans.map((plan, idx) => (
              <div key={idx} className={`glass-panel rounded-3xl p-8 border hover:scale-105 transition-transform duration-300 relative ${plan.popular ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]' : 'border-white/10'}`}>
                  {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black font-bold font-sci-fi px-4 py-1 rounded-full text-sm shadow-lg flex items-center gap-2">
                          <Crown size={14} /> MOST POPULAR
                      </div>
                  )}
                  
                  <div className="text-center mb-8">
                      <h3 className={`text-xl font-bold font-sci-fi tracking-widest mb-2 ${plan.color}`}>{plan.name}</h3>
                      <div className="flex items-end justify-center gap-1 mb-2">
                          <span className="text-4xl font-bold text-white">${plan.price}</span>
                          <span className="text-slate-500 font-mono text-xs mb-1">/ mo</span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">{plan.target}</p>
                  </div>

                  <div className="space-y-4 mb-8">
                      {plan.features.map((feat, i) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                              <div className={`mt-0.5 p-0.5 rounded-full ${plan.bg} ${plan.color}`}>
                                  <Check size={10} />
                              </div>
                              <span className={feat.includes('AI') || feat.includes('God') ? 'font-bold text-white' : ''}>{feat}</span>
                          </div>
                      ))}
                  </div>

                  <button 
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={!!processing}
                      className={`w-full py-4 rounded-xl font-bold font-sci-fi tracking-widest transition-all flex items-center justify-center gap-2 ${
                      plan.popular 
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg' 
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}>
                      {processing === plan.name ? <Loader2 className="animate-spin" /> : (plan.popular ? 'DEPLOY SYSTEM' : 'SELECT PLAN')}
                  </button>
              </div>
          ))}
       </div>

       <div className="glass-panel p-8 rounded-2xl border border-white/10 mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/50">
                   <Shield size={32} className="text-indigo-400" />
               </div>
               <div>
                   <h3 className="text-xl font-bold text-white font-sci-fi">ENTERPRISE SOURCE LICENSE</h3>
                   <p className="text-sm text-slate-400 mt-1 max-w-lg">
                       Requires self-hosted infrastructure? Purchase the complete source code and run LumiX OS on your own secure servers.
                   </p>
               </div>
           </div>
           <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold font-sci-fi transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] whitespace-nowrap">
               CONTACT SALES
           </button>
       </div>
    </div>
  );
};

export default SubscriptionView;
