
import React, { useState } from 'react';
import { User, Event, Group } from '../types';
import { X, Search, Check, UserPlus, Users } from 'lucide-react';

interface InviteUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  users: User[];
  groups?: Group[];
  onInvite: (userIds: string[]) => void;
}

const InviteUsersModal: React.FC<InviteUsersModalProps> = ({ isOpen, onClose, event, users, groups = [], onInvite }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(event.invitedUserIds || []);
  const [viewMode, setViewMode] = useState<'people' | 'groups'>('people');

  if (!isOpen) return null;

  // Filter users: Exclude the creator (who is inviting) from the list
  const filteredUsers = users.filter(u => 
    u.id !== event.creatorId &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.handle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredGroups = groups.filter(c => 
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
      // Check if all members are selected
      const allSelected = group.memberIds.every(id => selectedUserIds.includes(id));
      
      if (allSelected) {
          // Deselect all
          setSelectedUserIds(selectedUserIds.filter(id => !group.memberIds.includes(id)));
      } else {
          // Select all (merge unique)
          setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...group.memberIds])));
      }
  };

  const handleSendInvites = () => {
    onInvite(selectedUserIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
              <h2 className="font-bold text-lg text-slate-800">Invite to Event</h2>
              <p className="text-xs text-slate-500 truncate max-w-[250px]">{event.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-slate-50">
           <div className="flex gap-2 mb-3">
                <button 
                    onClick={() => setViewMode('people')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'people' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    People
                </button>
                <button 
                    onClick={() => setViewMode('groups')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'groups' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    Groups
                </button>
           </div>
           <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text" 
                    placeholder={viewMode === 'people' ? "Search people..." : "Search groups..."}
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-500 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
           {viewMode === 'people' ? (
               filteredUsers.length > 0 ? (
                   filteredUsers.map(user => {
                       const isSelected = selectedUserIds.includes(user.id);
                       
                       return (
                           <div 
                             key={user.id} 
                             onClick={() => toggleUser(user.id)}
                             className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
                           >
                               <div className="flex items-center gap-3">
                                   <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
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
                       No users found.
                   </div>
               )
           ) : (
               filteredGroups.length > 0 ? (
                   filteredGroups.map(group => {
                       const isFullySelected = group.memberIds.length > 0 && group.memberIds.every(id => selectedUserIds.includes(id));
                       const isPartiallySelected = !isFullySelected && group.memberIds.some(id => selectedUserIds.includes(id));
                       
                       return (
                           <div 
                               key={group.id} 
                               onClick={() => toggleGroup(group)}
                               className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors mb-1 ${isFullySelected ? 'bg-primary-50' : 'hover:bg-slate-50'}`}
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
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${isFullySelected ? 'bg-primary-600 border-primary-600 text-white' : isPartiallySelected ? 'bg-primary-200 border-primary-200 text-primary-700' : 'border-slate-300 text-transparent'}`}>
                                   {isFullySelected && <Check size={14} />}
                                   {isPartiallySelected && <div className="w-2 h-2 bg-primary-600 rounded-full" />}
                               </div>
                           </div>
                       );
                   })
               ) : (
                   <div className="p-8 text-center text-slate-500 text-sm">
                       No groups found.
                   </div>
               )
           )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
            <span className="text-xs text-slate-500">{selectedUserIds.length} selected</span>
            <div className="flex gap-3">
                <button onClick={onClose} className="text-slate-600 px-4 py-2 text-sm font-medium hover:text-slate-900">Cancel</button>
                <button 
                    onClick={handleSendInvites}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 flex items-center gap-2"
                >
                    <UserPlus size={16} />
                    {selectedUserIds.length > 0 ? `Invite ${selectedUserIds.length}` : 'Save'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InviteUsersModal;
