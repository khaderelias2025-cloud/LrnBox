
import React from 'react';
import { Box } from '../types';
import { Users, BookOpen, Plus, Lock, Check, Signal, User, Star, Share2, Unlock, X, Globe, Link as LinkIcon, EyeOff } from 'lucide-react';

interface BoxCardProps {
  box: Box;
  onClick: (boxId: string) => void;
  onSubscribe?: (boxId: string) => void;
  onUnsubscribe?: (boxId: string) => void; // New prop for unjoining
  subscribed?: boolean;
  onShare?: (boxId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (boxId: string) => void;
}

const BoxCard: React.FC<BoxCardProps> = ({ 
    box, 
    onClick, 
    onSubscribe,
    onUnsubscribe,
    subscribed = false, 
    onShare, 
    isFavorite = false, 
    onToggleFavorite 
}) => {
  // Determine actual access level, falling back to legacy isPrivate if needed
  const accessLevel = box.accessLevel || (box.isPrivate ? (box.price && box.price > 0 ? 'premium' : 'invite_only') : 'public');
  const isPaid = accessLevel === 'premium';

  const getDifficultyColor = (level?: string) => {
    switch(level) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
        onToggleFavorite(box.id);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onShare) {
        onShare(box.id);
    } else {
        const url = `${window.location.origin}/box/${box.id}`;
        if (navigator.share) {
            navigator.share({
                title: box.title,
                text: `Check out "${box.title}" on LrnBox!`,
                url: url
            }).catch(() => {}); // Ignore abort errors
        } else {
            navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
        }
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (subscribed) {
          if (onUnsubscribe) {
             onUnsubscribe(box.id); // Trigger unjoin logic if handler provided
          } else {
             onClick(box.id); // Fallback to view
          }
      } else if (onSubscribe) {
          onSubscribe(box.id); // Trigger subscription/payment flow
      } else {
          onClick(box.id); // Fallback
      }
  };

  return (
    <div 
      className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full will-change-transform"
      onClick={() => onClick(box.id)}
    >
      <div className="h-36 w-full overflow-hidden relative">
        <img 
          src={box.coverImage} 
          alt={box.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Action Buttons (Favorite & Share) */}
        <div className="absolute top-2 left-2 flex gap-2 z-10">
            <button
                onClick={handleFavoriteClick}
                className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-400 hover:text-yellow-500 shadow-sm transition-all hover:scale-110 active:scale-95"
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                <Star 
                size={16} 
                fill={isFavorite ? "currentColor" : "none"} 
                className={isFavorite ? "text-yellow-500" : ""} 
                />
            </button>
            
            {/* Share available for all except strictly private items (unless shared) */}
            {accessLevel !== 'private' && (
                <button
                    onClick={handleShareClick}
                    className="p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-slate-400 hover:text-blue-600 shadow-sm transition-all hover:scale-110 active:scale-95"
                    title="Share with friend"
                >
                    <Share2 size={16} />
                </button>
            )}
        </div>

        <div className="absolute top-2 right-2 flex gap-1">
          <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-slate-700 shadow-sm">
            {box.category}
          </div>
          
          {/* Access Level Badge */}
          {accessLevel === 'premium' && (
            <div className="bg-yellow-400/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-yellow-900 flex items-center shadow-sm gap-1">
              <Lock size={10} /> Premium
            </div>
          )}
          {accessLevel === 'invite_only' && (
            <div className="bg-indigo-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-white flex items-center shadow-sm gap-1">
              <LinkIcon size={10} /> Invite Only
            </div>
          )}
          {accessLevel === 'private' && (
            <div className="bg-slate-800/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-semibold text-white flex items-center shadow-sm gap-1">
              <EyeOff size={10} /> Private
            </div>
          )}
        </div>
        
        {/* Price/Free Badge (Bottom Right) */}
        <div className="absolute bottom-2 right-2">
            {isPaid ? (
                <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                   {box.price} pts
                </div>
            ) : (
                <div className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                    Free
                </div>
            )}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        {/* Creator Info */}
        <div className="flex items-center gap-2 mb-2">
            <img src={box.creatorAvatar} className="w-5 h-5 rounded-full object-cover border border-slate-100" alt={box.creatorName} />
            <span className="text-xs text-slate-500 font-medium truncate">{box.creatorName}</span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{box.title}</h3>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2 flex-1">{box.description}</p>
        
        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
           {box.difficulty && (
             <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 ${getDifficultyColor(box.difficulty)}`}>
               <Signal size={10} /> {box.difficulty}
             </span>
           )}
           {box.ageGroup && (
             <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
               <User size={10} /> {box.ageGroup}
             </span>
           )}
           {box.region && box.region !== 'Global' && (
             <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
               {box.region}
             </span>
           )}
        </div>

        {/* Tags */}
        {box.tags && box.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">
            {box.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
          <div className="flex items-center text-xs text-slate-500 gap-3">
             <div className="flex items-center gap-1">
               <Users size={14} />
               <span>{box.subscribers}</span>
             </div>
             <div className="flex items-center gap-1">
               <BookOpen size={14} />
               <span>{box.lessons.length}</span>
             </div>
          </div>
          
          <button 
            className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1 text-xs font-bold hover:scale-105 active:scale-95 shadow-sm group-button ${
              subscribed 
                ? onUnsubscribe ? 'bg-green-50 text-green-600 border border-green-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600' : 'bg-green-50 text-green-600 border border-green-200' 
                : isPaid
                    ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border border-yellow-500'
                    : 'bg-primary-600 text-white hover:bg-primary-700 border border-primary-600'
            }`}
            onClick={handleButtonClick}
          >
            {subscribed ? (
                <>
                    {onUnsubscribe ? (
                        <>
                            <span className="flex items-center gap-1 group-button-hover:hidden"><Check size={14} /> Joined</span>
                            <span className="hidden items-center gap-1 group-button-hover:flex"><X size={14} /> Unjoin</span>
                        </>
                    ) : (
                        <><Check size={14} /> Joined</>
                    )}
                </>
            ) : isPaid ? (
                <>
                    <Unlock size={14} /> Unlock
                </>
            ) : (
                <>
                    <Plus size={14} /> Join
                </>
            )}
          </button>
        </div>
      </div>
      
      {/* Helper style for nested hover effect without extra CSS file */}
      <style>{`
        .group-button:hover .group-button-hover\\:hidden { display: none; }
        .group-button:hover .group-button-hover\\:flex { display: flex; }
      `}</style>
    </div>
  );
};

export default BoxCard;
