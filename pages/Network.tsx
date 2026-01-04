
import React, { useState, useMemo } from 'react';
import { User, Event, Group, Box, Conversation, TutorSession } from '../types';
import { Users, UserPlus, Calendar, Hash, User as UserIcon, X, MapPin, Search, UserMinus, MessageCircle, Check, Plus, Lock, UserCheck, MoreHorizontal, Mail, Share2, Building2, Trash2, Edit, ExternalLink, Clock, Star } from 'lucide-react';
import { MOCK_FOLLOWED_TAGS } from '../constants';
import CreateEventModal from '../components/CreateEventModal';
import InviteUsersModal from '../components/InviteUsersModal';
import EventDetailModal from '../components/EventDetailModal';
import ShareModal from '../components/ShareBoxModal';
import CohortModal from '../components/CohortModal';
import CohortDetailModal from '../components/CohortDetailModal';

interface NetworkProps {
  currentUser: User;
  allUsers: User[];
  onToggleFollow: (userId: string) => void;
  onMessage: (userId: string) => void;
  onNotify?: (type: string, content: string) => void;
  events: Event[];
  onJoinEvent: (eventId: string) => void;
  onCreateEvent: (event: Event) => void;
  onUpdateEvent: (event: Event) => void;
  groups: Group[];
  onCreateGroup: (group: Group) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (groupId: string) => void;
  boxes?: Box[]; 
  conversations?: Conversation[]; 
  onGroupMessage?: (groupId: string, text: string) => void;
  onGroupViewBox?: (boxId: string) => void;
}

type SectionType = 'discover' | 'connections' | 'following' | 'institutes' | 'events' | 'hashtags' | 'find_people' | 'groups';

const Network: React.FC<NetworkProps> = ({ 
    currentUser, 
    allUsers, 
    onToggleFollow, 
    onMessage, 
    onNotify,
    events,
    onJoinEvent,
    onCreateEvent,
    onUpdateEvent,
    groups,
    onCreateGroup,
    onUpdateGroup,
    onDeleteGroup,
    boxes = [],
    conversations = [],
    onGroupMessage,
    onGroupViewBox
}) => {
  const [activeSection, setActiveSection] = useState<SectionType>('discover');
  const [ignoredIds, setIgnoredIds] = useState<string[]>([]);
  const [followingTab, setFollowingTab] = useState<'following' | 'followers'>('following');
  const [findPeopleSearchTerm, setFindPeopleSearchTerm] = useState('');
  const [connectionSearch, setConnectionSearch] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState<'all' | 'people' | 'institutes'>('all');
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const [selectedEventForInviteId, setSelectedEventForInviteId] = useState<string | null>(null);
  const [viewEventId, setViewEventId] = useState<string | null>(null);
  const [sharingEventId, setSharingEventId] = useState<string | null>(null);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null);

  const selectedEventForInvite = selectedEventForInviteId ? events.find(e => e.id === selectedEventForInviteId) : null;
  const viewEvent = viewEventId ? events.find(e => e.id === viewEventId) : null;
  const sharingEvent = sharingEventId ? events.find(e => e.id === sharingEventId) : null;
  const editingGroup = editingGroupId ? groups.find(c => c.id === editingGroupId) : null;
  const viewingGroup = viewingGroupId ? groups.find(c => c.id === viewingGroupId) : null;

  const myGroups = groups.filter(c => c.creatorId === currentUser.id || c.memberIds.includes(currentUser.id));

  const followingIds = currentUser.following || [];
  const followerIds = currentUser.followers || [];

  const connections = allUsers.filter(u => followingIds.includes(u.id) && followerIds.includes(u.id));
  const peopleFollowing = allUsers.filter(u => followingIds.includes(u.id) && u.role !== 'institute');
  const peopleFollowers = allUsers.filter(u => followerIds.includes(u.id));
  const institutesFollowing = allUsers.filter(u => followingIds.includes(u.id) && u.role === 'institute');

  const pendingFollowBacks = allUsers.filter(u => 
    followerIds.includes(u.id) && 
    !followingIds.includes(u.id) && 
    u.id !== currentUser.id &&
    !ignoredIds.includes(u.id)
  );

  const peopleToDiscover = allUsers.filter(u => 
    !followingIds.includes(u.id) && 
    u.id !== currentUser.id && 
    !followerIds.includes(u.id) &&
    !ignoredIds.includes(u.id)
  );

  const visibleEvents = useMemo(() => {
      return events.filter(ev => {
          if (!ev.isPrivate) return true;
          return ev.creatorId === currentUser.id || 
                 ev.invitedUserIds?.includes(currentUser.id) ||
                 ev.isJoined;
      });
  }, [events, currentUser.id]);

  const handleIgnore = (id: string) => {
      setIgnoredIds([...ignoredIds, id]);
  };

  const handleJoinEvent = (eventId: string) => {
      const ev = events.find(e => e.id === eventId);
      if (ev && !ev.isJoined && onNotify) {
          onNotify('event_join', `joined the event "${ev.title}"`);
      }
      onJoinEvent(eventId);
  };

  const handleCreateEvent = (newEvent: Event) => {
      onCreateEvent(newEvent);
  };

  const openInviteModal = (event: Event) => {
      setSelectedEventForInviteId(event.id);
      setIsInviteModalOpen(true);
  };

  const handleInviteUsers = (userIds: string[]) => {
      if (!selectedEventForInvite) return;
      const updatedEvent = { ...selectedEventForInvite, invitedUserIds: userIds };
      onUpdateEvent(updatedEvent);
  };

  const handleShareEvent = (eventId: string, userIds: string[], groupIds: string[]) => {
      const eventToUpdate = events.find(e => e.id === eventId);
      if (eventToUpdate) {
          const updatedEvent = {
              ...eventToUpdate,
              invitedUserIds: Array.from(new Set([...(eventToUpdate.invitedUserIds || []), ...userIds])),
              sharedWithGroupIds: Array.from(new Set([...(eventToUpdate.sharedWithGroupIds || []), ...groupIds]))
          };
          onUpdateEvent(updatedEvent);
          alert("Event shared successfully!");
      }
  };

  const handleSaveGroup = (group: Group) => {
      if (editingGroupId) onUpdateGroup(group);
      else onCreateGroup(group);
      setIsGroupModalOpen(false);
      setEditingGroupId(null);
  };

  const handleEditGroup = (group: Group) => {
      setEditingGroupId(group.id);
      setIsGroupModalOpen(true);
  };

  const handleGroupMessageSend = (text: string) => {
      if (viewingGroupId && onGroupMessage) onGroupMessage(viewingGroupId, text);
  };

  const SidebarItem = ({ id, icon: Icon, label, count }: { id: SectionType, icon: any, label: string, count?: number }) => (
     <button 
        onClick={() => setActiveSection(id)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-colors border-l-4 ${activeSection === id ? 'bg-slate-50 border-primary-600 text-primary-900' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
     >
        <div className="flex items-center gap-3">
           <Icon size={20} className={activeSection === id ? 'text-primary-600' : 'text-slate-500'} />
           <span className={`text-sm font-medium ${activeSection === id ? 'font-bold' : ''}`}>{label}</span>
        </div>
        {count !== undefined && <span className="text-sm text-slate-500">{count}</span>}
     </button>
  );

  const MobileNavItem = ({ id, icon: Icon, label }: { id: SectionType, icon: any, label: string }) => (
    <button
        onClick={() => setActiveSection(id)}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
            activeSection === id ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200'
        }`}
    >
        <Icon size={16} />
        {label}
    </button>
  );

  const renderGroups = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-900">Your Groups</h2>
              <button onClick={() => { setEditingGroupId(null); setIsGroupModalOpen(true); }} className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1"><Plus size={16} /> Create Group</button>
          </div>
          {myGroups.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myGroups.map(group => {
                      const members = allUsers.filter(u => group.memberIds.includes(u.id));
                      const isCreator = group.creatorId === currentUser.id;
                      return (
                          <div key={group.id} onClick={() => setViewingGroupId(group.id)} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all relative group flex flex-col cursor-pointer hover:-translate-y-1">
                              <div className="h-24 bg-slate-100 relative">{group.image ? <img src={group.image} alt={group.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200"><Users size={32} /></div>}{isCreator && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm" onClick={e => e.stopPropagation()}><button onClick={() => handleEditGroup(group)} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"><Edit size={14} /></button><button onClick={() => { if (window.confirm('Delete this group?')) onDeleteGroup(group.id); }} className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"><Trash2 size={14} /></button></div>}</div>
                              <div className="p-4 flex-1 flex flex-col"><div className="flex justify-between items-start mb-1"><h3 className="font-bold text-slate-900 text-lg group-hover:text-primary-600 transition-colors">{group.name}</h3><ExternalLink size={14} className="text-slate-300 group-hover:text-primary-400" /></div><p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{group.description || "No description provided."}</p><div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto"><div className="flex items-center gap-2"><div className="flex -space-x-2">{members.slice(0, 3).map((m, i) => (<img key={i} src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full border-2 border-white object-cover" />))}{members.length > 3 && (<span className="text-xs text-slate-400 font-medium">+{members.length - 3}</span>)}</div></div><div className="text-xs font-bold text-slate-400 uppercase">{members.length} Members</div></div></div>
                          </div>
                      );
                  })}
              </div>
          ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200"><Users size={32} className="mx-auto mb-2 text-slate-300" /><h3 className="text-lg font-bold text-slate-700">No groups yet</h3><p className="text-slate-500 mb-4 text-sm">Create groups to organize your connections.</p><button onClick={() => { setEditingGroupId(null); setIsGroupModalOpen(true); }} className="bg-primary-600 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-primary-700 transition-colors">Create First Group</button></div>
          )}
      </div>
  );

  const renderDiscover = () => {
    const filteredRecommendations = peopleToDiscover.filter(user => {
        if (recommendationFilter === 'people') return user.role !== 'institute';
        if (recommendationFilter === 'institutes') return user.role === 'institute';
        return true;
    });
    return (
        <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2"><h2 className="text-xl font-bold text-slate-900">People & Institutes you may know</h2><div className="flex bg-slate-100 p-1 rounded-lg self-start sm:self-auto">{(['all', 'people', 'institutes'] as const).map(filter => (<button key={filter} onClick={() => setRecommendationFilter(filter)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${recommendationFilter === filter ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{filter}</button>))}</div></div>
        {filteredRecommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecommendations.slice(0, 9).map(user => {
                const isInstitute = user.role === 'institute';
                return (
                    <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center relative group hover:shadow-md transition-shadow"><button onClick={() => handleIgnore(user.id)} className="absolute top-2 right-2 text-slate-300 hover:text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} /></button><img src={user.avatar} className={`w-16 h-16 mb-2 object-cover ${isInstitute ? 'rounded-2xl shadow-sm border border-slate-100' : 'rounded-full'}`} alt={user.name} /><div className="flex items-center gap-1.5"><h3 className="font-bold text-slate-900">{user.name}</h3>{isInstitute && <Building2 size={14} className="text-indigo-600" />}</div><p className={`text-xs mb-3 font-medium ${isInstitute ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded' : 'text-slate-500'}`}>{isInstitute ? (user.instituteType || 'Organization') : user.role}</p><button onClick={() => onToggleFollow(user.id)} className={`mt-auto bg-white border px-4 py-1.5 rounded-full text-sm font-bold transition-colors w-full flex items-center justify-center gap-1 ${isInstitute ? 'border-indigo-600 text-indigo-600 hover:bg-indigo-50' : 'border-primary-600 text-primary-600 hover:bg-primary-50'}`}>{isInstitute ? <Plus size={14} /> : <UserPlus size={14} />}{isInstitute ? 'Follow' : 'Connect'}</button></div>
                );
            })}
            </div>
        ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200"><Search size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-slate-500 font-medium">No recommendations found.</p><p className="text-xs text-slate-400">Try changing the filter.</p></div>
        )}
        </div>
    );
  };

  const renderConnections = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">My Connections ({connections.length})</h2>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" placeholder="Search connections" className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm bg-white" value={connectionSearch} onChange={(e) => setConnectionSearch(e.target.value)}/></div>
          </div>
          {connections.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {connections.filter(u => u.name.toLowerCase().includes(connectionSearch.toLowerCase())).map(user => (
                      <div key={user.id} className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt={user.name} /><div><h3 className="font-bold text-slate-900 text-sm">{user.name}</h3><p className="text-xs text-slate-500">{user.bio || user.role}</p></div></div><div className="flex gap-2"><button onClick={() => onMessage(user.id)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><MessageCircle size={18} /></button><button onClick={() => onToggleFollow(user.id)} className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-full"><UserMinus size={18} /></button></div></div>
                  ))}
              </div>
          ) : <p className="text-slate-500">You don't have any connections yet.</p>}
      </div>
  );

  const renderFollowing = () => (
      <div className="space-y-4">
          <div className="flex gap-4 border-b border-slate-200"><button onClick={() => setFollowingTab('following')} className={`pb-2 font-bold text-sm ${followingTab === 'following' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`}>Following ({peopleFollowing.length})</button><button onClick={() => setFollowingTab('followers')} className={`pb-2 font-bold text-sm ${followingTab === 'followers' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500'}`}>Followers ({peopleFollowers.length})</button></div>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {(followingTab === 'following' ? peopleFollowing : peopleFollowers).map(user => (
                  <div key={user.id} className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt={user.name} /><div><h3 className="font-bold text-slate-900 text-sm">{user.name}</h3><p className="text-xs text-slate-500">{user.handle}</p></div></div><button onClick={() => onToggleFollow(user.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${followingIds.includes(user.id) ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'}`}>{followingIds.includes(user.id) ? 'Following' : 'Follow Back'}</button></div>
              ))}
              {(followingTab === 'following' ? peopleFollowing : peopleFollowers).length === 0 && (<div className="p-8 text-center text-slate-500">List is empty.</div>)}
          </div>
      </div>
  );

  const renderInstitutes = () => (
      <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Institutes I Follow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {institutesFollowing.map(inst => (
                  <div key={inst.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4"><img src={inst.avatar} className="w-12 h-12 rounded-lg object-cover" alt={inst.name} /><div className="flex-1 min-w-0"><h3 className="font-bold text-slate-900 truncate">{inst.name}</h3><p className="text-xs text-slate-500">{inst.instituteType}</p></div><button onClick={() => onToggleFollow(inst.id)} className="text-xs font-bold text-slate-500 border border-slate-300 px-3 py-1 rounded-full hover:bg-slate-50">Following</button></div>
              ))}
              {institutesFollowing.length === 0 && <p className="text-slate-500">You are not following any institutes.</p>}
          </div>
      </div>
  );

  const renderEvents = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center mb-2"><h2 className="text-xl font-bold text-slate-900">Events</h2><button onClick={() => { setSelectedEventForInviteId(null); setIsEventModalOpen(true); }} className="text-sm font-bold text-primary-600 hover:underline flex items-center gap-1"><Plus size={16} /> Create Event</button></div>
          <div className="space-y-3">
              {visibleEvents.map(event => (
                  <div key={event.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewEventId(event.id)}><div className="w-16 h-16 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-indigo-700 flex-shrink-0"><span className="text-xs font-bold uppercase">{event.date.split(' ')[0]}</span><span className="text-xl font-bold">{event.date.split(' ')[1].replace(',', '')}</span></div><div className="flex-1"><div className="flex justify-between items-start"><div><h3 className="font-bold text-slate-900">{event.title}</h3><p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Clock size={12} /> {event.time} • <MapPin size={12} /> {event.isOnline ? 'Online' : event.location}</p></div>{event.isPrivate && <Lock size={14} className="text-slate-400" />}</div><div className="flex justify-between items-center mt-3"><div className="text-xs text-slate-500">{event.attendees} attendees</div><div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); setSharingEventId(event.id); }} className="text-slate-400 hover:text-blue-600 p-1"><Share2 size={16} /></button><button onClick={(e) => { e.stopPropagation(); handleJoinEvent(event.id); }} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${event.isJoined ? 'bg-green-100 text-green-700' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>{event.isJoined ? 'Going' : 'Join'}</button>{event.creatorId === currentUser.id && (<button onClick={(e) => { e.stopPropagation(); openInviteModal(event); }} className="text-xs font-bold text-primary-600 hover:bg-primary-50 px-3 py-1 rounded-full border border-primary-200">Invite</button>)}</div></div></div></div>
              ))}
              {visibleEvents.length === 0 && <p className="text-slate-500">No upcoming events.</p>}
          </div>
      </div>
  );

  const renderHashtags = () => (
      <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Followed Hashtags</h2>
          <div className="flex flex-wrap gap-2">{MOCK_FOLLOWED_TAGS.map(tag => (<div key={tag.tag} className="bg-white border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-2"><span className="font-bold text-slate-700">{tag.tag}</span><span className="text-xs text-slate-400">{tag.posts} posts</span><button className="text-slate-400 hover:text-red-500"><X size={14} /></button></div>))}</div>
      </div>
  );

  const renderFindPeople = () => (
      <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Find People</h2>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><input type="text" placeholder="Search by name, role, or interest..." className="w-full p-3 border border-slate-200 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-primary-500 bg-white" value={findPeopleSearchTerm} onChange={e => setFindPeopleSearchTerm(e.target.value)} /><div className="space-y-2">{allUsers.filter(u => u.id !== currentUser.id && (u.name.toLowerCase().includes(findPeopleSearchTerm.toLowerCase()) || u.bio.toLowerCase().includes(findPeopleSearchTerm.toLowerCase()))).map(user => (<div key={user.id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-lg"><div className="flex items-center gap-3"><img src={user.avatar} className="w-10 h-10 rounded-full object-cover" alt={user.name} /><div><h4 className="font-bold text-slate-900 text-sm">{user.name}</h4><p className="text-xs text-slate-500 line-clamp-1">{user.bio}</p></div></div><button onClick={() => onToggleFollow(user.id)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${followingIds.includes(user.id) ? 'bg-white border-slate-300 text-slate-600' : 'bg-primary-600 text-white border-primary-600'}`}>{followingIds.includes(user.id) ? 'Following' : 'Follow'}</button></div>))}</div></div>
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto no-scrollbar"><div className="flex gap-2 min-w-max pb-1"><MobileNavItem id="discover" icon={UserPlus} label="Discover" /><MobileNavItem id="connections" icon={Users} label="Connections" /><MobileNavItem id="following" icon={UserIcon} label="Following" /><MobileNavItem id="institutes" icon={Building2} label="Institutes" /><MobileNavItem id="events" icon={Calendar} label="Events" /><MobileNavItem id="groups" icon={Users} label="Groups" /><MobileNavItem id="hashtags" icon={Hash} label="Tags" /><MobileNavItem id="find_people" icon={Search} label="Search" /></div></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="hidden md:block md:col-span-1"><div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-24"><h3 className="p-4 font-semibold text-slate-900 border-b border-slate-100">Manage my network</h3><div className="flex flex-col"><SidebarItem id="connections" icon={Users} label="Connections" count={connections.length} /><SidebarItem id="following" icon={UserIcon} label="Following & Followers" count={peopleFollowing.length + peopleFollowers.length} /><SidebarItem id="groups" icon={Users} label="Groups" count={myGroups.length} /><SidebarItem id="institutes" icon={Building2} label="Institutes" count={institutesFollowing.length} /><SidebarItem id="events" icon={Calendar} label="Events" count={visibleEvents.length} /><SidebarItem id="hashtags" icon={Hash} label="Hashtags" count={MOCK_FOLLOWED_TAGS.length} /><SidebarItem id="find_people" icon={Search} label="Find People" />{activeSection !== 'discover' && (<div className="border-t border-slate-100 mt-2 pt-2"><SidebarItem id="discover" icon={UserPlus} label="Discover" /></div>)}</div><div className="mt-auto border-t border-slate-100 p-4 text-center"><p className="text-xs text-slate-500 mb-2">Grow your skills with Premium</p><button className="text-sm font-bold text-indigo-600 hover:underline">Try Premium for Free</button></div></div></div>
        <div className="md:col-span-3">{activeSection === 'discover' && renderDiscover()}{activeSection === 'connections' && renderConnections()}{activeSection === 'following' && renderFollowing()}{activeSection === 'institutes' && renderInstitutes()}{activeSection === 'events' && renderEvents()}{activeSection === 'hashtags' && renderHashtags()}{activeSection === 'find_people' && renderFindPeople()}{activeSection === 'groups' && renderGroups()}</div>
      </div>
      <CreateEventModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} onCreate={handleCreateEvent} />
      <CohortModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} currentUser={currentUser} allUsers={allUsers} onSave={handleSaveGroup} existingGroup={editingGroup} />
      {viewingGroup && (<CohortDetailModal isOpen={!!viewingGroup} onClose={() => setViewingGroupId(null)} cohort={viewingGroup} currentUser={currentUser} allUsers={allUsers} sharedBoxes={boxes.filter(b => b.sharedWithGroupIds?.includes(viewingGroup.id))} sharedEvents={events.filter(e => e.sharedWithGroupIds?.includes(viewingGroup.id))} conversation={conversations.find(c => c.groupId === viewingGroup.id)} onSendMessage={handleGroupMessageSend} onViewBox={(id) => { setViewingGroupId(null); if (onGroupViewBox) onGroupViewBox(id); }} onViewEvent={(id) => { setViewingGroupId(null); setViewEventId(id); }} />)}
      {selectedEventForInvite && (<InviteUsersModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} event={selectedEventForInvite} users={allUsers} onInvite={handleInviteUsers} groups={myGroups} />)}
      {sharingEvent && (<ShareModal isOpen={true} onClose={() => setSharingEventId(null)} item={{ id: sharingEvent.id, title: sharingEvent.title, type: 'Event' }} allUsers={allUsers} currentUser={currentUser} onShare={handleShareEvent} groups={myGroups} />)}
      {viewEvent && (<EventDetailModal isOpen={!!viewEvent} onClose={() => setViewEventId(null)} event={viewEvent} onToggleJoin={handleJoinEvent} />)}
    </div>
  );
};

export default Network;
