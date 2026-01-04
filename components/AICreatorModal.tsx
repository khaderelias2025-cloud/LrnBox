
import React, { useState, useRef } from 'react';
import { Box } from '../types';
import { GoogleGenAI } from "@google/genai";
import { X, Wand2, Loader2, Save, Lock, Globe, DollarSign, Image as ImageIcon, Link as LinkIcon, Upload, EyeOff, User, Award } from 'lucide-react';
import { CATEGORIES, AGE_GROUPS, DIFFICULTIES, REGIONS, LANGUAGES, GENDERS } from '../constants';

interface AICreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (box: Box) => void;
  currentUser: any;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        
        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL(file.type, 0.7));
      };
    };
    reader.onerror = error => reject(error);
  });
};

const AICreatorModal: React.FC<AICreatorModalProps> = ({ isOpen, onClose, onSave, currentUser }) => {
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [ageGroup, setAgeGroup] = useState(AGE_GROUPS[2]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0]);
  const [region, setRegion] = useState('Global');
  const [language, setLanguage] = useState('English');
  const [genderAudience, setGenderAudience] = useState('All');
  const [hasCertificate, setHasCertificate] = useState(false);
  
  const [accessLevel, setAccessLevel] = useState<'public' | 'premium' | 'invite_only' | 'private'>('public');
  const [price, setPrice] = useState<number>(0);
  const [coverImage, setCoverImage] = useState('');
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!process.env.API_KEY || !topic) {
        if (!topic) alert("Please enter a topic first.");
        return;
    }
    
    setLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Generate a catchy title and a short, engaging description (max 2 sentences) for a micro-learning course about "${topic}". 
        Return JSON format: { "title": "...", "description": "..." }`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const text = response.text || '{}';
        const data = JSON.parse(text);
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        
    } catch (error) {
        console.error("AI Generation failed", error);
        alert("AI generation failed. Please check your connection or try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setCoverImage(base64);
        setImageMode('file');
      } catch (err) {
        console.error(err);
        alert("Error processing image");
      }
    }
  };

  const handleSubmit = () => {
    if (!title || !description) {
        alert("Please fill in title and description.");
        return;
    }

    const newBox: Box = {
        id: `b-${Date.now()}`,
        title,
        description,
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorAvatar: currentUser.avatar,
        category,
        tags: [`#${category.toLowerCase()}`, `#${difficulty.toLowerCase()}`],
        subscribers: 0,
        lessons: [],
        isPrivate: accessLevel !== 'public',
        accessLevel,
        price: accessLevel === 'premium' ? price : 0,
        coverImage: coverImage || `https://picsum.photos/seed/${title.replace(/\s/g,'')}/800/400`,
        ageGroup,
        difficulty,
        region,
        language,
        genderAudience,
        sharedWithUserIds: [],
        hasCertificate: hasCertificate
    };

    onSave(newBox);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
             <h2 className="font-bold text-xl text-slate-900">Create New Box</h2>
             <p className="text-sm text-slate-500">Share your knowledge with the world</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {/* AI Assistant Section */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Wand2 size={14} /> AI Assistant
                </label>
                <div className="flex gap-2">
                    <input 
                        className="flex-1 border border-indigo-200 rounded-lg p-2 text-sm outline-none bg-white text-slate-900 focus:ring-2 focus:ring-indigo-200"
                        placeholder="e.g., Introduction to Pottery..."
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !topic}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                        Auto-Fill
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input 
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                        placeholder="Course Title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                        className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                        placeholder="What will students learn?"
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
            </div>

            {/* Cover Image */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cover Image</label>
                <div className="flex gap-3 mb-3">
                    <button 
                        onClick={() => setImageMode('url')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${imageMode === 'url' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                        Image URL
                    </button>
                    <button 
                        onClick={() => setImageMode('file')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${imageMode === 'file' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                    >
                        Upload File
                    </button>
                </div>
                
                {imageMode === 'url' ? (
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            placeholder="https://example.com/image.jpg"
                            value={coverImage.startsWith('data:') ? '' : coverImage}
                            onChange={e => setCoverImage(e.target.value)}
                        />
                    </div>
                ) : (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        <ImageIcon className="text-slate-300 mb-2" size={24} />
                        <p className="text-sm font-medium text-slate-600">Click to upload cover image</p>
                        {coverImage && coverImage.startsWith('data:') && <p className="text-xs text-green-600 mt-2 font-bold">Image loaded successfully</p>}
                    </div>
                )}
            </div>

            {/* Categorization Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" value={category} onChange={e => setCategory(e.target.value)}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age Group</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                        {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Difficulty</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Certificate Toggle */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 text-yellow-700 rounded-lg">
                            <Award size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-slate-900">Issue Certificates</h3>
                            <p className="text-xs text-slate-500">Students receive a professional certificate upon completion.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={hasCertificate} onChange={e => setHasCertificate(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                </div>
            </div>

            {/* Access Level & Pricing */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">Access Level</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button 
                        onClick={() => setAccessLevel('public')}
                        className={`p-3 rounded-lg border text-left transition-all ${accessLevel === 'public' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                        <div className="flex items-center gap-2 mb-1 text-green-700">
                            <Globe size={18} /> <span className="font-bold text-sm">Public</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Free to join. Visible to everyone.</p>
                    </button>

                    <button 
                        onClick={() => setAccessLevel('premium')}
                        className={`p-3 rounded-lg border text-left transition-all ${accessLevel === 'premium' ? 'border-yellow-500 bg-yellow-50 ring-1 ring-yellow-500' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                        <div className="flex items-center gap-2 mb-1 text-yellow-700">
                            <DollarSign size={18} /> <span className="font-bold text-sm">Premium</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Paid access. Public metadata.</p>
                    </button>
                </div>
                
                {accessLevel === 'premium' && (
                    <div className="animate-in fade-in slide-in-from-top-2 pt-2 border-t border-slate-200">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Access Price (Points)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="number"
                                min="1"
                                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-500 bg-white"
                                placeholder="e.g. 500"
                                value={price}
                                onChange={e => setPrice(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
           <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
           <button 
             onClick={handleSubmit}
             className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg shadow-slate-900/20 transition-all active:scale-95"
           >
             <Save size={18} /> Create Box
           </button>
        </div>
      </div>
    </div>
  );
};

export default AICreatorModal;
