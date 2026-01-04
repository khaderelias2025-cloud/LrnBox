
import React, { useState } from 'react';
import { X, CreditCard, Lock, Calendar, CheckCircle, Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  cost: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onConfirm, amount, cost }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    setLoading(true);
    
    // Simulate payment gateway delay
    setTimeout(() => {
        setLoading(false);
        setStep('success');
        setTimeout(() => {
            onConfirm();
            setStep('form'); // Reset for next time
        }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {step === 'success' ? (
            <div className="p-10 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="text-green-600 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
                <p className="text-slate-500">You have added <span className="font-bold text-slate-900">{amount} pts</span> to your wallet.</p>
            </div>
        ) : (
            <>
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Lock size={20} className="text-green-600" /> Secure Checkout
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Complete your purchase</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide">Item</p>
                            <p className="font-bold text-indigo-900">{amount} LrnBox Points</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide">Total</p>
                            <p className="text-xl font-bold text-indigo-900">${cost}</p>
                        </div>
                    </div>

                    {step === 'processing' ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                            <p className="font-medium text-slate-900">Processing Payment...</p>
                            <p className="text-xs text-slate-500 mt-1">Please do not close this window</p>
                        </div>
                    ) : (
                        <form onSubmit={handlePay} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Card Number</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        required
                                        type="text" 
                                        placeholder="0000 0000 0000 0000"
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expiry Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="MM / YY"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CVC</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            required
                                            type="text" 
                                            placeholder="123"
                                            maxLength={4}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cardholder Name</label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g. John Doe"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
                            >
                                <Lock size={16} /> Pay ${cost}
                            </button>
                            
                            <p className="text-[10px] text-center text-slate-400 mt-2">
                                Encrypted by 256-bit SSL security.
                            </p>
                        </form>
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
