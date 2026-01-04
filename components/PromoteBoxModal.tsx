import React, { useState } from 'react';
import { X, Rocket, Zap, Crown, CheckCircle, AlertCircle } from 'lucide-react';
import { Box } from '../types';

interface PromoteBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cost: number, plan: string) => void;
  box: Box;
  userPoints: number;
}

const PromoteBoxModal: React.FC<PromoteBoxModalProps> = ({ isOpen, onClose, onConfirm, box, userPoints }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'basic',
      title: 'Basic Boost',
      cost: 100,
      duration: '24 Hours',
      benefit: '+20% Visibility',
      icon: Zap,
      color: 'blue'
    },
    {
      id: 'pro',
      title: 'Pro Feature',
      cost: 500,
      duration: '3 Days',
      benefit: 'Featured on Explore',
      icon: Rocket,
      color: 'indigo',
      popular: true
    },
    {
      id: 'viral',
      title: 'Viral Campaign',
      cost: 1000,
      duration: '1 Week',
      benefit: 'Top of Dashboard',
      icon: Crown,
      color: 'purple'
    }
  ];

  const handlePromote = () => {
    const plan = plans.find(p => p.id === selectedPlan);
    if (plan) {
      onConfirm(plan.cost, plan.title);
      onClose();
    }
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);
  const canAfford = selectedPlanDetails ? userPoints >= selectedPlanDetails.cost : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
             <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Rocket className="text-primary-600" size={20} /> Promote Box
             </h2>
             <p className="text-sm text-slate-500">Boost visibility for <span className="font-bold text-slate-800">{box.title}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
           <div className="flex justify-between items-center mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-sm font-medium text-slate-600">Your Balance</span>
              <span className="font-bold text-slate-900 text-lg">{userPoints} pts</span>
           </div>

           <div className="space-y-3">
              {plans.map((plan) => {
                 const isSelected = selectedPlan === plan.id;
                 const Icon = plan.icon;
                 
                 return (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${isSelected ? `border-${plan.color}-600 bg-${plan.color}-50` : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                       {plan.popular && (
                          <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                             Most Popular
                          </div>
                       )}
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className={`p-3 rounded-full ${isSelected ? `bg-${plan.color}-200 text-${plan.color}-700` : 'bg-slate-100 text-slate-500'}`}>
                                <Icon size={24} />
                             </div>
                             <div>
                                <h3 className="font-bold text-slate-900">{plan.title}</h3>
                                <p className="text-xs text-slate-500">{plan.duration} • {plan.benefit}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="block font-bold text-lg text-slate-900">{plan.cost} pts</span>
                             {isSelected && <CheckCircle size={20} className={`ml-auto text-${plan.color}-600`} />}
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>

           {!canAfford && selectedPlan && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                 <AlertCircle size={16} />
                 <span>Insufficient points. You need {selectedPlanDetails?.cost! - userPoints} more.</span>
              </div>
           )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900">Cancel</button>
           <button 
             onClick={handlePromote}
             disabled={!selectedPlan || !canAfford}
             className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
           >
             <Rocket size={16} />
             Promote Now
           </button>
        </div>
      </div>
    </div>
  );
};

export default PromoteBoxModal;