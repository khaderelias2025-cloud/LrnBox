import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { ViewState } from '../types';
import Logo from '../components/Logo';

interface LoginProps {
  onLogin: (handle: string) => Promise<void>;
  onNavigate: (view: ViewState) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigate }) => {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!handle || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // Small artificial delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));

      if (password.length < 3) {
        throw new Error('Invalid credentials');
      }

      await onLogin(handle);
      // Success navigation is handled by parent App state change
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white animate-fade-in">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-indigo-900/40 z-10" />
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80" 
          alt="Learning" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 animate-scale-in"
          style={{animationDuration: '10s'}}
        />
        <div className="relative z-20 text-center px-10 animate-slide-up" style={{animationDelay: '200ms'}}>
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
               <Logo size="xl" theme="dark" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Master new skills in minutes.</h1>
          <p className="text-indigo-100 text-lg max-w-md mx-auto">
            Join the world's largest micro-learning community. Connect, share, and grow with bite-sized content powered by AI.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-slide-up">
          <div className="text-center lg:text-left">
             <div className="lg:hidden flex justify-center mb-6">
               <Logo size="lg" theme="light" />
             </div>
             <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
             <p className="text-slate-500 mt-2">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username or Handle</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="@username" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <button 
                    type="button"
                    onClick={() => onNavigate(ViewState.FORGOT_PASSWORD)}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium border border-red-100 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Don't have an account?</span>
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={() => onNavigate(ViewState.SIGNUP)}
              className="text-primary-600 font-bold hover:underline"
            >
              Create free account
            </button>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-xs text-slate-400">
                Demo Accounts: <span className="font-mono bg-slate-100 px-1 rounded">@alex_j</span>, <span className="font-mono bg-slate-100 px-1 rounded">@sarah_dev</span> (Pass: any)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;