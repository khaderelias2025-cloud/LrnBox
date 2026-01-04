
import React, { useState } from 'react';
import { User, Group } from '../types';
import { X, Search, Check, Share2, Users, Link as LinkIcon, Copy } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
      id: string;
      title: string;
      type: 'Box' | 'Event' | 'Lesson';
      sharedWithUserIds?: string[]; // Optional for backward compatibility/events
      sharedWithGroupIds?: string[];
  };
  allUsers: User[];
  currentUser: User;
  groups?: Group[];
  onShare: (itemId: string, userIds: string[], groupIds: string[]) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, item, allUsers, currentUser, groups = [], onShare }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(item.sharedWithUserIds || []);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(item.sharedWithGroupIds || []);
  
  const [activeTab, setActiveTab] = useState<'invite' | 'link'>('invite');
  const [inviteView, setInviteView] = useState<'friends' | 'groups'>('friends');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Filter users
  const friends = allUsers.filter(u => currentUser.following.includes(u.id));
  
  // If searching, search everyone (except self). If not, show friends first.
  const displayUsers = searchTerm 
    ? allUsers.filter(u => 
        u.id !== currentUser.id && 
        (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.handle.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : friends;

  // Show all groups user is part of (creator or member)
  const displayGroups = groups.filter(c => 
      (c.creatorId === currentUser.id || c.memberIds.includes(currentUser.id)) && 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const toggleGroup = (group: Group) => {
      // Toggle the group ID itself for persistence
      let newGroupIds = [...selectedGroupIds];
      if (newGroupIds.includes(group.id)) {
          newGroupIds = newGroupIds.filter(id => id !== group.id);
      } else {
          newGroupIds.push(group.id);
      }
      setSelectedGroupIds(newGroupIds);

      // Also toggle all members for immediate access control
      const allSelected = group.memberIds.every(id => selectedUserIds.includes(id));
      
      if (allSelected) {
          // Deselect all members (optional: maybe we want to keep them? For now, simple toggle)
          setSelectedUserIds(selectedUserIds.filter(id => !group.memberIds.includes(id)));
      } else {
          // Select all members (merge unique)
          setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...group.memberIds])));
      }
  };

  const handleShareSubmit = () => {
    onShare(item.id, selectedUserIds, selectedGroupIds);
    onClose();
  };

  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    let path = '';
    if (item.type === 'Box') path = `/box/${item.id}`;
    else if (item.type === 'Event') path = `/event/${item.id}`;
    else path = `/post/${item.id}`; // Lesson/Post URL

    navigator.clipboard.writeText(`${baseUrl}${path}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  <Share2 size={18} className="text-primary-600" /> Share {item.type}
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[250px]">{item.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
            <button 
                onClick={() => setActiveTab('invite')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'invite' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Invite Friends
            </button>
            <button 
                onClick={() => setActiveTab('link')}
                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'link' ? 'border-primary-600 text-primary-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
                Copy Link
            </button>
        </div>

        {activeTab === 'invite' ? (
            <>
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex gap-2 mb-3">
                        <button 
                            onClick={() => setInviteView('friends')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${inviteView === 'friends' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                        >
                            Friends
                        </button>
                        <button 
                            onClick={() => setInviteView('groups')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${inviteView === 'groups' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                        >
                            Groups
                        </button>
                    </div>
                    <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder={inviteView === 'friends' ? "Search users..." : "Search groups..."}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500 bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {inviteView === 'friends' ? (
                        <div className="p-2">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                                {searchTerm ? 'Search Results' : 'Suggested Friends'}
                            </p>
                            {displayUsers.length > 0 ? (
                                displayUsers.map(user => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    return (
                                        <div 
                                            key={user.id} 
                                            onClick={() => toggleUser(user.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors mb-1 ${isSelected ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{user.name}</p>
                                                    <p className="text-xs text-slate-500">{user.handle}</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 text-transparent'}`}>
                                                <Check size={14} />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    {searchTerm ? 'No users found.' : 'You are not following anyone yet.'}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-2">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">My Groups</p>
                            {displayGroups.length > 0 ? (
                                displayGroups.map(group => {
                                    const isGroupMarked = selectedGroupIds.includes(group.id);
                                    
                                    return (
                                        <div 
                                            key={group.id} 
                                            onClick={() => toggleGroup(group)}
                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors mb-1 ${isGroupMarked ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{group.name}</p>
                                                    <p className="text-xs text-slate-500">{group.memberIds.length} members</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${isGroupMarked ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 text-transparent'}`}>
                                                <Check size={14} />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    {searchTerm ? 'No groups found.' : 'You haven\'t created or joined any groups yet.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                    <span className="text-xs text-slate-500">{selectedUserIds.length} users, {selectedGroupIds.length} groups</span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="text-slate-600 px-4 py-2 text-sm font-medium hover:text-slate-900">Cancel</button>
                        <button 
                            onClick={handleShareSubmit}
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center gap-2"
                        >
                            <Users size={16} />
                            Share
                        </button>
                    </div>
                </div>
            </>
        ) : (
            <div className="p-6 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-slate-100 rounded-full text-slate-500">
                    <LinkIcon size={32} />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-slate-900">Share via Link</h3>
                    <p className="text-sm text-slate-500">Anyone with the link can view this content.</p>
                </div>
                <button 
                    onClick={handleCopyLink}
                    className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? 'Copied!' : 'Copy Link'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
