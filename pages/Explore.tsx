
import React, { useState, useEffect, useMemo } from 'react';
import { Box, User, Group, TutorSession } from '../types';
import BoxCard from '../components/BoxCard';
import ShareModal from '../components/ShareBoxModal';
import TutorBookingModal from '../components/TutorBookingModal';
import { Search, Filter, X, ChevronDown, ChevronUp, ArrowUpDown, Tag, Building2, LayoutGrid, Check, Plus, GraduationCap, Star, Globe, Languages } from 'lucide-react';
import { REGIONS, LANGUAGES } from '../constants';

interface ExploreProps {
  allBoxes: Box[];
  subscribedIds: string[];
  onSubscribe: (boxId: string) => void;
  onUnsubscribe?: (boxId: string) => void;
  onViewBox: (boxId: string) => void;
  initialSearchTerm?: string;
  allUsers: User[];
  currentUser: User;
  onShare: (boxId: string, userIds: string[], cohortIds: string[]) => void;
  favoriteBoxIds?: string[];
  onToggleFavorite?: (boxId: string) => void;
  onToggleFollow: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  onBookTutor?: (session: TutorSession) => void;
  groups?: Group[];
  tutorSessions?: TutorSession[];
}

type SortOption = 'popular' | 'alpha' | 'price_asc' | 'price_desc';

const Explore: React.FC<ExploreProps> = ({ 
    allBoxes, 
    subscribedIds, 
    onSubscribe, 
    onUnsubscribe,
    onViewBox, 
    initialSearchTerm = '',
    allUsers,
    currentUser,
    onShare,
    favoriteBoxIds = [],
    onToggleFavorite,
    onToggleFollow,
    onViewProfile,
    onBookTutor,
    groups,
    tutorSessions = []
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'institutes' | 'tutors'>('content');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [sharingBox, setSharingBox] = useState<Box | null>(null);
  const [bookingTutorId, setBookingTutorId] = useState<string | null>(null);
  
  // --- Content Filter States ---
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>([]);
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // --- Institute Filter States ---
  const [selectedInstTypes, setSelectedInstTypes] = useState<string[]>([]);
  const [selectedInstAgeGroups, setSelectedInstAgeGroups] = useState<string[]>([]); 
  const [selectedInstCategories, setSelectedInstCategories] = useState<string[]>([]); 
  const [selectedInstRegion, setSelectedInstRegion] = useState<string>('All');

  // --- Tutor Filter States ---
  const [selectedTutorSubjects, setSelectedTutorSubjects] = useState<string[]>([]);
  const [selectedTutorRegions, setSelectedTutorRegions] = useState<string[]>([]);
  const [selectedTutorLanguages, setSelectedTutorLanguages] = useState<string[]>([]);

  // Accordion States for Sidebar
  const [accordions, setAccordions] = useState({
    topic: true,
    tags: true,
    age: true,
    price: true,
    difficulty: true,
    more: false,
    instType: true,
    instAge: true,
    instCat: true,
    instRegion: true,
    tutorSubject: true,
    tutorRegion: true,
    tutorLang: true
  });

  const institutes = useMemo(() => {
      return allUsers.filter(u => u.role === 'institute');
  }, [allUsers]);

  const filteredInstitutes = useMemo(() => {
      if (activeTab !== 'institutes') return [];
      
      return institutes.filter(inst => {
          const term = searchTerm.toLowerCase();
          const matchesSearch = 
              inst.name.toLowerCase().includes(term) ||
              inst.instituteType?.toLowerCase().includes(term) ||
              inst.bio.toLowerCase().includes(term);

          if (!matchesSearch) return false;
          if (selectedInstTypes.length > 0 && (!inst.instituteType || !selectedInstTypes.includes(inst.instituteType))) return false;

          const instBoxes = allBoxes.filter(b => b.creatorId === inst.id);
          if (selectedInstRegion !== 'All' && !instBoxes.some(b => b.region === selectedInstRegion || b.region === 'Global')) return false;
          if (selectedInstAgeGroups.length > 0 && !instBoxes.some(b => b.ageGroup && selectedInstAgeGroups.includes(b.ageGroup))) return false;
          if (selectedInstCategories.length > 0 && !instBoxes.some(b => selectedInstCategories.includes(b.category))) return false;

          return true;
      });
  }, [activeTab, institutes, searchTerm, selectedInstTypes, selectedInstRegion, selectedInstAgeGroups, selectedInstCategories, allBoxes]);

  // Tutor Discovery Logic
  const availableTutors = useMemo(() => {
    if (activeTab !== 'tutors') return [];
    return allUsers.filter(u => {
      if (u.id === currentUser.id || !u.isTutor) return false;
      
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
          u.name.toLowerCase().includes(term) || 
          u.tutorSubjects?.some(s => s.toLowerCase().includes(term));

      if (!matchesSearch) return false;
      
      // Filters
      if (selectedTutorSubjects.length > 0 && !u.tutorSubjects?.some(s => selectedTutorSubjects.includes(s))) return false;
      if (selectedTutorRegions.length > 0 && (!u.tutorRegion || !selectedTutorRegions.includes(u.tutorRegion))) return false;
      if (selectedTutorLanguages.length > 0 && !u.tutorLanguages?.some(l => selectedTutorLanguages.includes(l))) return false;

      return true;
    });
  }, [allUsers, searchTerm, currentUser.id, activeTab, selectedTutorSubjects, selectedTutorRegions, selectedTutorLanguages]);

  // Derived Tutor Subject List for Filters
  const tutorAvailableSubjects = useMemo(() => {
    const subs = new Set<string>();
    allUsers.forEach(u => u.isTutor && u.tutorSubjects?.forEach(s => subs.add(s)));
    return Array.from(subs).sort();
  }, [allUsers]);

  const categories = useMemo(() => {
    const defaults = ['Technology', 'History', 'Arts', 'Language', 'Business', 'Science'];
    const fromBoxes = allBoxes.map(b => b.category).filter(Boolean);
    return Array.from(new Set([...defaults, ...fromBoxes])).sort();
  }, [allBoxes]);

  const ageGroups = useMemo(() => {
    const defaults = ['Kids (5-12)', 'Teens (13-18)', 'Adults', 'All Ages'];
    const fromBoxes = allBoxes.map(b => b.ageGroup).filter(Boolean) as string[];
    return Array.from(new Set([...defaults, ...fromBoxes])).sort();
  }, [allBoxes]);

  const instituteTypes = ['University', 'School', 'Training Center', 'Ministry', 'Kindergarten', 'Company'];

  const difficulties = useMemo(() => {
    const defaults = ['Beginner', 'Intermediate', 'Advanced'];
    const fromBoxes = allBoxes.map(b => b.difficulty).filter(Boolean) as string[];
    return Array.from(new Set([...defaults, ...fromBoxes])).sort();
  }, [allBoxes]);

  const regions = useMemo(() => {
    const unique = new Set([...REGIONS]);
    allBoxes.forEach(b => b.region && unique.add(b.region));
    return Array.from(unique).sort();
  }, [allBoxes]);

  const languages = useMemo(() => {
    const unique = new Set([...LANGUAGES]);
    allBoxes.forEach(b => b.language && unique.add(b.language));
    return Array.from(unique).sort();
  }, [allBoxes]);

  const genders = useMemo(() => {
    const defaults = ['All', 'Female', 'Male'];
    const fromBoxes = allBoxes.map(b => b.genderAudience).filter(Boolean) as string[];
    return Array.from(new Set([...defaults, ...fromBoxes])).sort();
  }, [allBoxes]);

  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    allBoxes.forEach(box => {
      box.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([tag]) => tag);
  }, [allBoxes]);

  const toggleAccordion = (key: keyof typeof accordions) => {
    setAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const filteredBoxes = useMemo(() => {
    if (activeTab !== 'content') return [];

    let result = allBoxes.filter(box => {
        const level = box.accessLevel || (box.isPrivate ? 'premium' : 'public');
        if (level === 'invite_only' || level === 'private') return false;

        const term = searchTerm.toLowerCase();
        const matchesSearch = 
        box.title.toLowerCase().includes(term) || 
        box.category.toLowerCase().includes(term) ||
        (box.tags && box.tags.some(tag => tag.toLowerCase().includes(term)));

        if (!matchesSearch) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(box.category)) return false;
        if (selectedAgeGroups.length > 0 && box.ageGroup && !selectedAgeGroups.includes(box.ageGroup)) return false;
        if (priceType === 'free' && box.isPrivate && (box.price || 0) > 0) return false;
        if (priceType === 'paid' && (!box.isPrivate || (box.price || 0) === 0)) return false;
        if (selectedDifficulties.length > 0 && box.difficulty && !selectedDifficulties.includes(box.difficulty)) return false;
        if (selectedRegion !== 'All' && box.region && box.region !== 'Global' && box.region !== selectedRegion) return false;
        if (selectedLanguage !== 'All' && box.language && box.language !== selectedLanguage) return false;
        if (selectedGender !== 'All' && box.genderAudience && box.genderAudience !== 'All' && box.genderAudience !== selectedGender) return false;
        if (selectedTags.length > 0 && (!box.tags || !box.tags.some(t => selectedTags.includes(t)))) return false;

        return true;
    });

    result = result.sort((a, b) => {
        switch (sortBy) {
            case 'popular': return b.subscribers - a.subscribers;
            case 'alpha': return a.title.localeCompare(b.title);
            case 'price_asc': return (a.price || 0) - (b.price || 0);
            case 'price_desc': return (b.price || 0) - (a.price || 0);
            default: return 0;
        }
    });

    return result;
  }, [allBoxes, activeTab, searchTerm, selectedCategories, selectedAgeGroups, priceType, selectedDifficulties, selectedRegion, selectedLanguage, selectedGender, selectedTags, sortBy]);

  const handleCategoryChange = (cat: string) => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  const handleAgeChange = (age: string) => setSelectedAgeGroups(prev => prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]);
  const handleDifficultyChange = (diff: string) => setSelectedDifficulties(prev => prev.includes(diff) ? prev.filter(d => d !== diff) : [...prev, diff]);
  const handleTagChange = (tag: string) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const handleInstTypeChange = (type: string) => setSelectedInstTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const handleInstAgeChange = (age: string) => setSelectedInstAgeGroups(prev => prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]);
  const handleInstCategoryChange = (cat: string) => setSelectedInstCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const handleTutorSubjectChange = (sub: string) => setSelectedTutorSubjects(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  const handleTutorRegionChange = (reg: string) => setSelectedTutorRegions(prev => prev.includes(reg) ? prev.filter(r => r !== reg) : [...prev, reg]);
  const handleTutorLangChange = (lang: string) => setSelectedTutorLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);

  const clearFilters = () => {
    setSelectedCategories([]); setSelectedAgeGroups([]); setPriceType('all'); setSelectedDifficulties([]);
    setSelectedRegion('All'); setSelectedLanguage('All'); setSelectedGender('All'); setSelectedTags([]);
    setSelectedInstTypes([]); setSelectedInstAgeGroups([]); setSelectedInstCategories([]); setSelectedInstRegion('All');
    setSelectedTutorSubjects([]); setSelectedTutorRegions([]); setSelectedTutorLanguages([]);
    setSearchTerm(''); setSortBy('popular');
  };

  const activeFiltersCount = (activeTab === 'content' 
    ? selectedCategories.length + selectedAgeGroups.length + selectedDifficulties.length + (priceType !== 'all' ? 1 : 0) + (selectedRegion !== 'All' ? 1 : 0) + (selectedLanguage !== 'All' ? 1 : 0) + (selectedGender !== 'All' ? 1 : 0) + selectedTags.length 
    : activeTab === 'institutes' 
        ? selectedInstTypes.length + selectedInstAgeGroups.length + selectedInstCategories.length + (selectedInstRegion !== 'All' ? 1 : 0)
        : selectedTutorSubjects.length + selectedTutorRegions.length + selectedTutorLanguages.length);

  const FilterSidebar = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-6 h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar">
       <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Filters</h3>
          {activeFiltersCount > 0 && (
             <button onClick={clearFilters} className="text-xs text-primary-600 font-medium hover:underline">Clear all</button>
          )}
       </div>
       
       {activeTab === 'content' ? (
           <>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('topic')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Topic / Category {accordions.topic ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.topic && <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">{categories.map(cat => <label key={cat} className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={selectedCategories.includes(cat)} onChange={() => handleCategoryChange(cat)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" /><span className="text-sm text-slate-600 group-hover:text-slate-900">{cat}</span></label>)}</div>}
                </div>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('tags')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Popular Tags {accordions.tags ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.tags && <div className="flex flex-wrap gap-2">{popularTags.map(tag => <button key={tag} onClick={() => handleTagChange(tag)} className={`text-xs px-2 py-1 rounded-full border transition-colors ${selectedTags.includes(tag) ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>{tag}</button>)}</div>}
                </div>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('age')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Age Group {accordions.age ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.age && <div className="space-y-2">{ageGroups.map(age => <label key={age} className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={selectedAgeGroups.includes(age)} onChange={() => handleAgeChange(age)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" /><span className="text-sm text-slate-600 group-hover:text-slate-900">{age}</span></label>)}</div>}
                </div>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('price')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Price {accordions.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.price && <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="price" checked={priceType === 'all'} onChange={() => setPriceType('all')} className="text-primary-600 focus:ring-primary-500" /><span className="text-sm text-slate-600">Any</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="price" checked={priceType === 'free'} onChange={() => setPriceType('free')} className="text-primary-600 focus:ring-primary-500" /><span className="text-sm text-slate-600">Free</span></label>
                        <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="price" checked={priceType === 'paid'} onChange={() => setPriceType('paid')} className="text-primary-600 focus:ring-primary-500" /><span className="text-sm text-slate-600">Paid</span></label>
                    </div>}
                </div>
                <div>
                    <button onClick={() => toggleAccordion('more')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">More Filters {accordions.more ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.more && <div className="space-y-4">
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Region</label><select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:border-primary-500 outline-none"><option value="All">All Regions</option>{regions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                        <div><label className="block text-xs font-medium text-slate-500 mb-1">Language</label><select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg p-2 bg-white text-slate-900 focus:border-primary-500 outline-none"><option value="All">All Languages</option>{languages.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                    </div>}
                </div>
           </>
       ) : activeTab === 'institutes' ? (
           <>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('instType')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Institute Type {accordions.instType ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.instType && <div className="space-y-2">{instituteTypes.map(type => <label key={type} className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={selectedInstTypes.includes(type)} onChange={() => handleInstTypeChange(type)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" /><span className="text-sm text-slate-600 group-hover:text-slate-900">{type}</span></label>)}</div>}
                </div>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('instAge')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Targeted Age Group {accordions.instAge ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.instAge && <div className="space-y-2">{ageGroups.map(age => <label key={age} className="flex items-center gap-2 cursor-pointer group"><input type="checkbox" checked={selectedInstAgeGroups.includes(age)} onChange={() => handleInstAgeChange(age)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" /><span className="text-sm text-slate-600 group-hover:text-slate-900">{age}</span></label>)}</div>}
                </div>
           </>
       ) : (
           <>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('tutorSubject')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Topics / Subjects {accordions.tutorSubject ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.tutorSubject && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {tutorAvailableSubjects.length > 0 ? tutorAvailableSubjects.map(sub => (
                                <label key={sub} className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={selectedTutorSubjects.includes(sub)} onChange={() => handleTutorSubjectChange(sub)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{sub}</span>
                                </label>
                            )) : <p className="text-xs text-slate-400 italic">No topics available</p>}
                        </div>
                    )}
                </div>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('tutorRegion')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Geolocation {accordions.tutorRegion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.tutorRegion && (
                        <div className="space-y-2">
                            {REGIONS.map(reg => (
                                <label key={reg} className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={selectedTutorRegions.includes(reg)} onChange={() => handleTutorRegionChange(reg)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{reg}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div className="border-b border-slate-100 pb-4">
                    <button onClick={() => toggleAccordion('tutorLang')} className="flex items-center justify-between w-full text-sm font-semibold text-slate-800 mb-3">Language {accordions.tutorLang ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                    {accordions.tutorLang && (
                        <div className="space-y-2">
                            {LANGUAGES.map(lang => (
                                <label key={lang} className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" checked={selectedTutorLanguages.includes(lang)} onChange={() => handleTutorLangChange(lang)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{lang}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
           </>
       )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex justify-center mb-8">
          <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner overflow-x-auto no-scrollbar max-w-full">
              <button 
                onClick={() => setActiveTab('content')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <LayoutGrid size={18} /> Explore Content
              </button>
              <button 
                onClick={() => setActiveTab('tutors')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'tutors' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <GraduationCap size={18} /> Find Tutors
              </button>
              <button 
                onClick={() => setActiveTab('institutes')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'institutes' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Building2 size={18} /> Find Institutes
              </button>
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <aside className="hidden md:block w-64 flex-shrink-0 sticky top-24 self-start">
            <FilterSidebar />
        </aside>
        
        {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 bg-white p-4 overflow-y-auto md:hidden">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">Filters</h2><button onClick={() => setIsMobileFiltersOpen(false)}><X size={24} /></button></div>
                <FilterSidebar />
                <button onClick={() => setIsMobileFiltersOpen(false)} className="w-full bg-primary-600 text-white py-3 rounded-lg font-bold mt-6 sticky bottom-0">Show Results</button>
            </div>
        )}

        <div className={`flex-1 ${activeTab === 'institutes' ? 'max-w-5xl mx-auto w-full' : ''}`}>
          <div className="mb-6 space-y-4">
             <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileFiltersOpen(true)} className="md:hidden p-2 bg-white border border-slate-200 rounded-lg text-slate-600"><Filter size={20} /></button>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder={activeTab === 'content' ? "Search boxes by title, tag..." : activeTab === 'tutors' ? "Search by subject or expertise..." : "Search universities, schools, ministries..."}
                      className="pl-10 pr-4 py-3 border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-slate-900 shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {activeTab === 'content' && (
                    <div className="relative group">
                        <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors shadow-sm min-w-[160px]">
                            <ArrowUpDown size={16} className="text-slate-500" />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 w-full cursor-pointer appearance-none">
                                <option value="popular">Most Popular</option>
                                <option value="alpha">A-Z</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                            <ChevronDown size={14} className="text-slate-400 absolute right-3 pointer-events-none" />
                        </div>
                    </div>
                )}
             </div>
          </div>
          
          {activeTab === 'content' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredBoxes.map(box => (
                    <BoxCard 
                        key={box.id} box={box} subscribed={subscribedIds.includes(box.id)}
                        onClick={onViewBox} onSubscribe={onSubscribe} onUnsubscribe={onUnsubscribe}
                        onShare={() => setSharingBox(box)} isFavorite={favoriteBoxIds.includes(box.id)}
                        onToggleFavorite={onToggleFavorite}
                    />
                    ))}
                </div>
                {filteredBoxes.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                        <Search size={32} className="text-slate-300 mx-auto mb-2" />
                        <h3 className="text-lg font-bold text-slate-700">No content found</h3>
                        <p className="text-slate-500">Try adjusting your filters or search terms.</p>
                    </div>
                )}
              </>
          )}

          {activeTab === 'tutors' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTutors.length > 0 ? (
                    availableTutors.map(tutor => (
                        <div key={tutor.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative">
                                    <img src={tutor.avatar} alt={tutor.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-50" />
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 onClick={() => onViewProfile(tutor.id)} className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate cursor-pointer">{tutor.name}</h3>
                                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                                        <Star size={12} fill="currentColor" /> {tutor.tutorRating || '4.8'} 
                                        <span className="text-slate-400 font-medium">({tutor.tutorReviewCount || 12})</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 flex-1">
                                <div className="flex flex-wrap gap-1.5">
                                    {tutor.tutorSubjects?.map(subject => (
                                        <span key={subject} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{subject}</span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Globe size={12} /> {tutor.tutorRegion || 'Global'}</span>
                                    <span className="flex items-center gap-1"><Languages size={12} /> {tutor.tutorLanguages?.slice(0, 1).join('')}{tutor.tutorLanguages && tutor.tutorLanguages.length > 1 && `+${tutor.tutorLanguages.length - 1}`}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                                <div><p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Rate</p><p className="text-sm font-bold text-slate-900">{tutor.tutorRate} pts / hr</p></div>
                                <button onClick={() => setBookingTutorId(tutor.id)} className="bg-primary-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-primary-700 transition-all shadow-md active:scale-95">Book Session</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                        <GraduationCap size={48} className="mx-auto mb-3 text-slate-200" />
                        <h3 className="text-lg font-bold text-slate-700">No tutors found</h3>
                        <p className="text-slate-500 text-sm">Try searching for subjects like "React" or adjusting filters.</p>
                    </div>
                )}
              </div>
          )}

          {activeTab === 'institutes' && (
              <div className="space-y-4">
                  {filteredInstitutes.length > 0 ? (
                      filteredInstitutes.map(inst => {
                          const isFollowing = currentUser.following.includes(inst.id);
                          return (
                              <div key={inst.id} onClick={() => onViewProfile(inst.id)} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center sm:items-start gap-5 hover:shadow-md transition-shadow cursor-pointer">
                                  {inst.avatar ? <img src={inst.avatar} alt={inst.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-sm" /> : <div className="w-20 h-20 rounded-full border-4 border-slate-50 shadow-sm bg-slate-100 flex items-center justify-center"><Building2 size={32} className="text-slate-400" /></div>}
                                  <div className="flex-1 text-center sm:text-left"><div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1"><h3 className="text-xl font-bold text-slate-900">{inst.name}</h3><span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded border border-indigo-100 w-fit mx-auto sm:mx-0">{inst.instituteType || 'Organization'}</span></div><p className="text-slate-500 text-sm mb-3 max-w-xl">{inst.bio}</p><div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 font-medium"><span>{inst.followers.length.toLocaleString()} Followers</span><span>•</span><span>{allBoxes.filter(b => b.creatorId === inst.id).length} Boxes</span></div></div>
                                  <button onClick={(e) => { e.stopPropagation(); onToggleFollow(inst.id); }} className={`px-6 py-2 rounded-full font-bold text-sm transition-colors flex items-center gap-2 ${isFollowing ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>{isFollowing ? <>Following</> : <><Plus size={16} /> Follow</>}</button>
                              </div>
                          );
                      })
                  ) : (
                      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                          <Building2 size={32} className="text-slate-300 mx-auto mb-2" />
                          <h3 className="text-lg font-bold text-slate-700">No institutes found</h3>
                          <p className="text-slate-500 text-sm">Try searching for "University" or adjusting filters.</p>
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>

      {sharingBox && <ShareModal isOpen={true} onClose={() => setSharingBox(null)} item={{ id: sharingBox.id, title: sharingBox.title, type: 'Box', sharedWithUserIds: sharingBox.sharedWithUserIds }} allUsers={allUsers} currentUser={currentUser} onShare={onShare} groups={groups} />}
      
      {bookingTutorId && allUsers.find(u => u.id === bookingTutorId) && (
          <TutorBookingModal 
              isOpen={!!bookingTutorId} onClose={() => setBookingTutorId(null)} 
              tutor={allUsers.find(u => u.id === bookingTutorId)!} currentUser={currentUser} 
              onBook={(session) => { if (onBookTutor) onBookTutor(session); setBookingTutorId(null); }} 
              existingSessions={tutorSessions}
          />
      )}
    </div>
  );
};

export default Explore;
