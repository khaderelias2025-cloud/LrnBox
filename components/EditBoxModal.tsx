
import React, { useState, useRef, useEffect } from 'react';
import { Box } from '../types';
import { X, Save, Image as ImageIcon, Link as LinkIcon, Upload, Globe, DollarSign, EyeOff, Tag, ListFilter } from 'lucide-react';
import { CATEGORIES, AGE_GROUPS, DIFFICULTIES, REGIONS, LANGUAGES, GENDERS } from '../constants';

interface EditBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBox: Box) => void;
  box: Box;
}

const EditBoxModal: React.FC<EditBoxModalProps> = ({ isOpen, onClose, onSave, box }) => {
  const [title, setTitle] = useState(box.title);
  const [description, setDescription] = useState(box.description);
  const [coverImage, setCoverImage] = useState(box.coverImage);
  const [tags, setTags] = useState(box.tags ? box.tags.join(', ') : '');
  
  // Access Settings
  const [accessLevel, setAccessLevel] = useState<'public' | 'premium' | 'invite_only' | 'private'>('public');
  const [price, setPrice] = useState(box.price || 0);

  // Filters State
  const [category, setCategory] = useState(box.category);
  const [isCustomCategory, setIsCustomCategory] = useState(!CATEGORIES.includes(box.category));

  const [ageGroup, setAgeGroup] = useState(box.ageGroup || AGE_GROUPS[0]);
  const [isCustomAgeGroup, setIsCustomAgeGroup] = useState(!AGE_GROUPS.includes(box.ageGroup || ''));

  const [difficulty, setDifficulty] = useState(box.difficulty || DIFFICULTIES[0]);
  const [isCustomDifficulty, setIsCustomDifficulty] = useState(!DIFFICULTIES.includes(box.difficulty || ''));

  const [region, setRegion] = useState(box.region || REGIONS[0]);
  const [isCustomRegion, setIsCustomRegion] = useState(!REGIONS.includes(box.region || ''));

  const [language, setLanguage] = useState(box.language || LANGUAGES[0]);
  const [isCustomLanguage, setIsCustomLanguage] = useState(!LANGUAGES.includes(box.language || ''));

  const [audience, setAudience] = useState(box.genderAudience || GENDERS[0]);
  const [isCustomAudience, setIsCustomAudience] = useState(!GENDERS.includes(box.genderAudience || ''));

  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when box changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(box.title);
      setDescription(box.description);
      setCoverImage(box.coverImage);
      setTags(box.tags ? box.tags.join(', ') : '');
      
      const currentLevel = box.accessLevel || (box.isPrivate ? (box.price && box.price > 0 ? 'premium' : 'invite_only') : 'public');
      setAccessLevel(currentLevel);
      setPrice(box.price || 0);
      setImageMode('url');

      setCategory(box.category);
      setIsCustomCategory(!CATEGORIES.includes(box.category));

      setAgeGroup(box.ageGroup || AGE_GROUPS[0]);
      setIsCustomAgeGroup(box.ageGroup ? !AGE_GROUPS.includes(box.ageGroup) : false);

      setDifficulty(box.difficulty || DIFFICULTIES[0]);
      setIsCustomDifficulty(box.difficulty ? !DIFFICULTIES.includes(box.difficulty) : false);

      setRegion(box.region || REGIONS[0]);
      setIsCustomRegion(box.region ? !REGIONS.includes(box.region) : false);

      setLanguage(box.language || LANGUAGES[0]);
      setIsCustomLanguage(box.language ? !LANGUAGES.includes(box.language) : false);

      setAudience(box.genderAudience || GENDERS[0]);
      setIsCustomAudience(box.genderAudience ? !GENDERS.includes(box.genderAudience) : false);
    }
  }, [isOpen, box]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setCoverImage(objectUrl);
      setImageMode('file');
    }
  };

  const handleSave = () => {
    const updatedTags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    onSave({
      ...box,
      title,
      description,
      coverImage,
      tags: updatedTags,
      accessLevel,
      isPrivate: accessLevel !== 'public',
      price: accessLevel === 'premium' ? price : 0,
      category,
      ageGroup,
      difficulty,
      region,
      language,
      genderAudience: audience
    });
    onClose();
  };

  // Helper for filter fields with "Other" option
  const FilterField = ({ 
      label, 
      value, 
      setValue, 
      options, 
      isCustom, 
      setIsCustom 
  }: { 
      label: string, 
      value: string, 
      setValue: (v: string) => void, 
      options: string[], 
      isCustom: boolean, 
      setIsCustom: (v: boolean) => void 
  }) => (
      <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>
          <select 
              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 mb-2"
              value={isCustom ? 'custom_option_value' : value}
              onChange={(e) => {
                  if (e.target.value === 'custom_option_value') {
                      setIsCustom(true);
                      setValue(''); // Clear for typing
                  } else {
                      setIsCustom(false);
                      setValue(e.target.value);
                  }
              }}
          >
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              <option value="custom_option_value">Other... (Add Custom)</option>
          </select>
          {isCustom && (
              <input 
                  type="text" 
                  className="w-full p-2 border border-primary-200 rounded-lg text-sm bg-white text-slate-900 focus:bg-white transition-colors"
                  placeholder={`Type custom ${label.toLowerCase()}...`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  autoFocus
              />
          )}
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="font-bold text-lg text-slate-800">Edit Box Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Box Title</label>
                    <input 
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                    className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            placeholder="e.g. math, science, fun"
                            value={tags}
                            onChange={e => setTags(e.target.value)}
                        />
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cover Image</label>
                <div className="mb-4 relative h-40 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group">
                    <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex bg-slate-100 p-1 rounded-lg self-start w-full">
                        <button 
                            onClick={() => setImageMode('url')}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${imageMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            <LinkIcon size={12} /> URL
                        </button>
                        <button 
                            onClick={() => setImageMode('file')}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${imageMode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                        >
                            <Upload size={12} /> Upload
                        </button>
                    </div>

                    {imageMode === 'url' ? (
                        <input 
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 outline-none bg-white"
                            placeholder="https://example.com/image.jpg"
                            value={coverImage.startsWith('blob:') ? '' : coverImage}
                            onChange={e => setCoverImage(e.target.value)}
                        />
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border border-dashed border-slate-300 rounded-lg p-3 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-center"
                        >
                            <input 
                            type="file" 
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                            />
                            <p className="text-xs text-slate-600 font-medium">Click to upload new thumbnail</p>
                        </div>
                    )}
                </div>
              </div>
          </div>

          {/* Filters Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                  <ListFilter size={16} /> Filters & Categorization
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <FilterField label="Category" value={category} setValue={setCategory} options={CATEGORIES} isCustom={isCustomCategory} setIsCustom={setIsCustomCategory} />
                  <FilterField label="Age Group" value={ageGroup} setValue={setAgeGroup} options={AGE_GROUPS} isCustom={isCustomAgeGroup} setIsCustom={setIsCustomAgeGroup} />
                  <FilterField label="Difficulty" value={difficulty} setValue={setDifficulty} options={DIFFICULTIES} isCustom={isCustomDifficulty} setIsCustom={setIsCustomDifficulty} />
                  <FilterField label="Region" value={region} setValue={setRegion} options={REGIONS} isCustom={isCustomRegion} setIsCustom={setIsCustomRegion} />
                  <FilterField label="Language" value={language} setValue={setLanguage} options={LANGUAGES} isCustom={isCustomLanguage} setIsCustom={setIsCustomLanguage} />
                  <FilterField label="Audience" value={audience} setValue={setAudience} options={GENDERS} isCustom={isCustomAudience} setIsCustom={setIsCustomAudience} />
              </div>
          </div>

          {/* Privacy & Access Settings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
             <label className="block text-sm font-medium text-slate-700 mb-3">Access Settings</label>
             <div className="space-y-3">
                 <div className="flex gap-2 overflow-x-auto pb-1">
                    <button 
                        onClick={() => setAccessLevel('public')}
                        className={`flex-1 min-w-[80px] p-2 rounded-lg border text-center transition-all ${accessLevel === 'public' ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                        <Globe size={16} className="mx-auto mb-1" />
                        <span className="text-xs">Public</span>
                    </button>
                    <button 
                        onClick={() => setAccessLevel('premium')}
                        className={`flex-1 min-w-[80px] p-2 rounded-lg border text-center transition-all ${accessLevel === 'premium' ? 'border-yellow-500 bg-yellow-50 text-yellow-700 font-bold' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                        <DollarSign size={16} className="mx-auto mb-1" />
                        <span className="text-xs">Premium</span>
                    </button>
                    <button 
                        onClick={() => setAccessLevel('invite_only')}
                        className={`flex-1 min-w-[80px] p-2 rounded-lg border text-center transition-all ${accessLevel === 'invite_only' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                        <LinkIcon size={16} className="mx-auto mb-1" />
                        <span className="text-xs">Invite Only</span>
                    </button>
                    <button 
                        onClick={() => setAccessLevel('private')}
                        className={`flex-1 min-w-[80px] p-2 rounded-lg border text-center transition-all ${accessLevel === 'private' ? 'border-slate-500 bg-slate-200 text-slate-800 font-bold' : 'border-slate-200 bg-white text-slate-600'}`}
                    >
                        <EyeOff size={16} className="mx-auto mb-1" />
                        <span className="text-xs">Just Me</span>
                    </button>
                 </div>

                 {accessLevel === 'premium' && (
                    <div className="animate-in fade-in pt-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price (Points)</label>
                        <input 
                            type="number"
                            min="1"
                            className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 bg-white"
                            value={price}
                            onChange={e => setPrice(parseInt(e.target.value) || 0)}
                        />
                    </div>
                 )}
                 <p className="text-xs text-slate-500 mt-1 italic">
                    {accessLevel === 'public' && "Visible to everyone on Explore."}
                    {accessLevel === 'premium' && "Visible metadata, content requires payment."}
                    {accessLevel === 'invite_only' && "Hidden from Explore. Accessible via link."}
                    {accessLevel === 'private' && "Only visible to you."}
                 </p>
             </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="text-slate-600 px-4 py-2 font-medium hover:text-slate-900">Cancel</button>
          <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
             <Save size={18} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditBoxModal;
