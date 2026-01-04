
import React, { useState } from 'react';
import { User, Lock, AtSign, Building2 } from 'lucide-react';
import { ViewState, User as UserType } from '../types';
import Logo from '../components/Logo';

interface SignupProps {
  onSignup: (user: UserType) => void;
  onNavigate: (view: ViewState) => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onNavigate }) => {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'tutor' | 'institute'>('student');
  const [instituteType, setInstituteType] = useState<UserType['instituteType']>('School');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !handle || !password) return;

    setLoading(true);
    setTimeout(() => {
        // Create new user object
        const newUser: UserType = {
            id: `u-${Date.now()}`,
            name,
            handle: handle.startsWith('@') ? handle : `@${handle}`,
            avatar: role === 'institute' 
              ? "https://images.unsplash.com/photo-1560179707-f14e90ef3dab?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
              : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' style='background-color: %23f1f5f9;'%3E%3Cg stroke='%2394a3b8' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/g%3E%3C/svg%3E",
            role: role,
            instituteType: role === 'institute' ? instituteType : undefined,
            bio: role === 'institute' ? `Official account for ${name}` : 'New member of the community!',
            points: 100, // Starting bonus
            followers: [],
            following: []
        };
        onSignup(newUser);
        setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex bg-white animate-fade-in">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 to-primary-900 z-10" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-10" />
        <div className="relative z-20 text-center px-10 animate-slide-up" style={{animationDelay: '200ms'}}>
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
               <Logo size="xl" theme="dark" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Join the Revolution.</h1>
          <p className="text-indigo-100 text-lg max-w-md mx-auto">
            Create, share, and monetize your knowledge. Or simply learn something new every day.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6 animate-slide-up">
          <div className="text-center lg:text-left">
             <div className="lg:hidden flex justify-center mb-6">
               <Logo size="lg" theme="light" />
             </div>
             <h2 className="text-3xl font-bold text-slate-900">Create Account</h2>
             <p className="text-slate-500 mt-2">Start your learning journey today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {role === 'institute' ? 'Institute Name' : 'Full Name'}
                </label>
                <div className="relative group">
                  {role === 'institute' ? 
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} /> :
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  }
                  <input 
                    type="text" 
                    placeholder={role === 'institute' ? "Global University" : "John Doe"}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Handle (Username)</label>
                <div className="relative group">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="username" 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
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
                    placeholder="Create a password" 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Type</label>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${role === 'student' ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('tutor')}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${role === 'tutor' ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                        Private Tutor
                    </button>
                    <button
                        type="button"
                        onClick={() => setRole('institute')}
                        className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${role === 'institute' ? 'border-primary-600 bg-primary-50 text-primary-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                        Institute
                    </button>
                </div>
            </div>

            {role === 'institute' && (
                <div className="animate-in fade-in slide-in-from-top-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Organization Type</label>
                    <select 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        value={instituteType}
                        onChange={(e) => setInstituteType(e.target.value as any)}
                    >
                        <option value="School">School</option>
                        <option value="University">University</option>
                        <option value="Training Center">Training Center</option>
                        <option value="Ministry">Ministry</option>
                        <option value="Kindergarten">Kindergarten</option>
                        <option value="Company">Company</option>
                    </select>
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg mt-4 flex items-center justify-center gap-2 disabled:opacity-70 hover:scale-[1.02] active:scale-[0.98]"
            >
               {loading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account? <button onClick={() => onNavigate(ViewState.LOGIN)} className="text-primary-600 font-bold hover:underline">Log in</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
