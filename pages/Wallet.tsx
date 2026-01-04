import React from 'react';
import { Transaction, User } from '../types';
import { Coins, ArrowUpRight, ArrowDownLeft, Clock, CreditCard } from 'lucide-react';

interface WalletProps {
  user: User;
  transactions: Transaction[];
  onBuyPoints: (points: number, cost: number) => void;
}

const Wallet: React.FC<WalletProps> = ({ user, transactions, onBuyPoints }) => {
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const packs = [
    { points: 500, cost: 4.99, popular: false },
    { points: 1200, cost: 9.99, popular: true },
    { points: 2500, cost: 19.99, popular: false },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Wallet</h1>

      {/* Balance Card */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl mb-10 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="relative z-10">
           <p className="text-slate-400 font-medium mb-1">Current Balance</p>
           <h2 className="text-5xl font-bold flex items-center gap-3">
             {user.points} 
             <span className="text-2xl font-normal text-yellow-400">pts</span>
           </h2>
        </div>
        <div className="mt-6 md:mt-0 relative z-10">
           <div className="flex gap-2">
             <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                <p className="text-xs text-slate-300">Total Earned</p>
                <p className="font-bold text-green-400">+2,400</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                <p className="text-xs text-slate-300">Total Spent</p>
                <p className="font-bold text-red-400">-1,150</p>
             </div>
           </div>
        </div>
        
        {/* Decorative Background */}
        <Coins className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-12" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Buy Points Section */}
        <div className="lg:col-span-2">
           <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
             <CreditCard size={20} className="text-primary-600" /> Top Up Balance
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {packs.map((pack) => (
                <div 
                  key={pack.points} 
                  className={`border rounded-xl p-5 relative cursor-pointer transition-all hover:shadow-md ${pack.popular ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  onClick={() => onBuyPoints(pack.points, pack.cost)}
                >
                  {pack.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wide">
                      Best Value
                    </span>
                  )}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 mb-1">{pack.points} pts</div>
                    <div className="text-slate-500 text-sm mb-4">Starter Pack</div>
                    <button className={`w-full py-2 rounded-lg font-bold text-sm ${pack.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                      ${pack.cost}
                    </button>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Transaction History */}
        <div>
           <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
             <Clock size={20} className="text-slate-400" /> Recent Activity
           </h3>
           <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {sortedTransactions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {sortedTransactions.map(t => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {t.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                         </div>
                         <div>
                           <p className="text-sm font-medium text-slate-900 line-clamp-1">{t.description}</p>
                           <p className="text-xs text-slate-500">{t.timestamp}</p>
                         </div>
                      </div>
                      <span className={`font-bold text-sm ${t.type === 'credit' ? 'text-green-600' : 'text-slate-900'}`}>
                        {t.type === 'credit' ? '+' : '-'}{t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No transactions yet.
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;