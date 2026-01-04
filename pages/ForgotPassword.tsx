
import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { ViewState } from '../types';
import Logo from '../components/Logo';

interface ForgotPasswordProps {
  onNavigate: (view: ViewState) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Simulate API call
    setTimeout(() => {
        setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
            <div className="inline-flex bg-primary-50 p-4 rounded-xl mb-4">
                <Logo size="lg" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
            <p className="text-slate-500 mt-2">Enter your email and we'll send you a link to get back into your account.</p>
        </div>

        {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="email" 
                            placeholder="you@example.com" 
                            required
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
                >
                    Send Reset Link
                </button>
            </form>
        ) : (
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Check your inbox</h3>
                <p className="text-slate-500 mt-2 text-sm">We've sent a password reset link to <span className="font-medium text-slate-900">{email}</span>.</p>
            </div>
        )}

        <div className="mt-8 text-center">
            <button 
                onClick={() => onNavigate(ViewState.LOGIN)}
                className="text-slate-500 font-medium hover:text-slate-900 flex items-center justify-center gap-2 mx-auto"
            >
                <ArrowLeft size={16} /> Back to Login
            </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
