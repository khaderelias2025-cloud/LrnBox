
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Lesson, QuizType, AssessmentQuestion, AssessmentContent, CrosswordWord } from '../types';
import { generateMicroLesson, convertPdfToHtml, convertPptToHtml, generateAssessment, generateLessonVideo, generateLessonImage, generateLessonAudio, generateImageExplanation } from '../services/geminiService';
import { X, Wand2, Loader2, Save, Type, Video, HelpCircle, Image as ImageIcon, Music, FileCode, Package, MousePointerClick, Upload, Link as LinkIcon, FileText, Sparkles, Presentation, Trophy, Plus, Trash2, ChevronRight, ChevronDown, ListOrdered, Palette, Grid, Info, Database, Search, Film, AlertTriangle, Headphones } from 'lucide-react';

interface LessonCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: Lesson) => void | Promise<void>;
  boxTitle: string;
  questionBank?: AssessmentQuestion[];
}

const VIDEO_LOADING_MESSAGES = [
  "Storyboarding scenes...",
  "Synthesizing high-fidelity frames...",
  "Applying cinematic lighting...",
  "Rendering professional textures...",
  "Finalizing visual composition...",
  "Almost ready for premiere..."
];

const AUDIO_LOADING_MESSAGES = [
  "Scripting educational content...",
  "Selecting synthetic vocal chords...",
  "Applying natural intonation...",
  "Synthesizing high-fidelity audio...",
  "Finalizing podcast segment..."
];

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};

const LessonCreatorModal: React.FC<LessonCreatorModalProps> = ({ isOpen, onClose, onSave, boxTitle, questionBank = [] }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [videoLoadingMsgIndex, setVideoLoadingMsgIndex] = useState(0);
  const [audioLoadingMsgIndex, setAudioLoadingMsgIndex] = useState(0);
  const [activeType, setActiveType] = useState<'text' | 'video' | 'quiz' | 'image' | 'audio' | 'html5' | 'scorm' | 'interactive_video' | 'pdf' | 'ppt' | 'assessment'>('text');
  
  // Form State
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState(''); 
  const [imageExplanation, setImageExplanation] = useState('');
  const [html5Content, setHtml5Content] = useState('');
  const [pptUrl, setPptUrl] = useState('');
  
  // Full Assessment State
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [passingScore, setPassingScore] = useState(80);
  const [expandedQIdx, setExpandedQIdx] = useState<number | null>(0);
  const [assessmentQuestionCount, setAssessmentQuestionCount] = useState(5);

  // Question Bank Integration State
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  // AI Generation Specific
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');

  // Crossword Local State (for quick quiz mode)
  const [crosswordWords, setCrosswordWords] = useState<CrosswordWord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (loading && activeType === 'video') {
        interval = setInterval(() => {
            setVideoLoadingMsgIndex(prev => (prev + 1) % VIDEO_LOADING_MESSAGES.length);
        }, 5000);
    } else if (loading && activeType === 'audio') {
        interval = setInterval(() => {
            setAudioLoadingMsgIndex(prev => (prev + 1) % AUDIO_LOADING_MESSAGES.length);
        }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading, activeType]);

  const filteredBank = useMemo(() => {
    return questionBank.filter(q => 
        q.question.toLowerCase().includes(bankSearch.toLowerCase()) ||
        q.type.toLowerCase().includes(bankSearch.toLowerCase())
    );
  }, [questionBank, bankSearch]);

  if (!isOpen) return null;

  const handleAIGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      if (activeType === 'assessment') {
          const data = await generateAssessment(topic, boxTitle, assessmentQuestionCount);
          setAssessmentQuestions(data.questions);
          setPassingScore(data.passingScore);
          setTitle(`${topic} Assessment`);
      } else {
          const targetType = activeType === 'quiz' ? 'quiz' : 'text';
          const data = await generateMicroLesson(topic, boxTitle, targetType);
          setTitle(data.title);
          setContent(data.content);
          if (data.quizType === 'crossword' && data.quizData?.crosswordWords) {
              setCrosswordWords(data.quizData.crosswordWords);
          }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate content.');
    } finally {
      setLoading(false);
    }
  };

  const handlePptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
         const fullDataUrl = reader.result as string;
         setPptUrl(fullDataUrl);
      };
      reader.readAsDataURL(file);

      const base64 = await fileToBase64(file);
      const interactiveHtml = await convertPptToHtml(base64);
      setHtml5Content(interactiveHtml);
      
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
      if (!content) setContent(`Interactive presentation of: ${file.name}`);
    } catch (err) {
      console.error(err);
      alert("Failed to process presentation for viewing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoAIGenerate = async () => {
    if (!aiPrompt) return;

    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
    }

    setLoading(true);
    try {
        const videoUrl = await generateLessonVideo(aiPrompt);
        setMediaUrl(videoUrl);
        if (!title) setTitle(`Video: ${aiPrompt.substring(0, 30)}...`);
    } catch (err: any) {
        console.error(err);
        if (err.message?.includes("Requested entity was not found")) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
        } else {
            alert("Video generation failed. Ensure your selected API key is from a paid GCP project.");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleImageAIGenerate = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    try {
        const imageUrl = await generateLessonImage(aiPrompt);
        setMediaUrl(imageUrl);
        if (!title) setTitle(`Image: ${aiPrompt.substring(0, 30)}...`);
    } catch (err) {
        console.error(err);
        alert("Image generation failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleExplainImage = async () => {
    if (!aiPrompt) return;
    setExplaining(true);
    try {
        const explanation = await generateImageExplanation(aiPrompt);
        setImageExplanation(explanation);
    } catch (err) {
        console.error(err);
    } finally {
        setExplaining(false);
    }
  };

  const handleAudioAIGenerate = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    try {
        const audioUrl = await generateLessonAudio(aiPrompt, selectedVoice);
        setMediaUrl(audioUrl);
        if (!title) setTitle(`Podcast: ${aiPrompt.substring(0, 30)}...`);
        if (!content) setContent(`An AI-synthesized educational segment about ${aiPrompt}.`);
    } catch (err) {
        console.error(err);
        alert("Audio generation failed. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    const newQ: AssessmentQuestion = {
        id: `q-${Date.now()}`,
        type: 'mcq_single',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        feedback: ''
    };
    setAssessmentQuestions([...assessmentQuestions, newQ]);
    setExpandedQIdx(assessmentQuestions.length);
  };

  const handleImportFromBank = (q: AssessmentQuestion) => {
      const newQ = { ...q, id: `q-dup-${Date.now()}` };
      setAssessmentQuestions([...assessmentQuestions, newQ]);
      setShowBankPicker(false);
      setExpandedQIdx(assessmentQuestions.length);
  };

  const updateAssessmentQuestion = (idx: number, updates: Partial<AssessmentQuestion>) => {
    const next = [...assessmentQuestions];
    next[idx] = { ...next[idx], ...updates };
    setAssessmentQuestions(next);
  };

  const handleSave = async () => {
    if (!title) {
      alert("Please fill in the title.");
      return;
    }

    setSaving(true);
    try {
        const newLesson: Lesson = {
          id: `l-user-${Date.now()}`,
          boxId: 'temp',
          title,
          content,
          type: activeType,
          likes: 0,
          completionCount: 0,
          comments: [],
          timestamp: 'Just now',
          videoUrl: activeType === 'video' ? mediaUrl : undefined,
          imageUrl: activeType === 'image' ? mediaUrl : undefined,
          imageExplanation: activeType === 'image' ? imageExplanation : undefined,
          audioUrl: activeType === 'audio' ? mediaUrl : undefined,
          html5Url: activeType === 'html5' ? mediaUrl : undefined,
          html5Content: (activeType === 'html5' || activeType === 'ppt') ? html5Content : undefined,
          pptUrl: activeType === 'ppt' ? pptUrl : undefined,
        };

        if (activeType === 'assessment') {
            newLesson.assessmentData = { questions: assessmentQuestions, passingScore };
        } else if (activeType === 'quiz') {
            newLesson.quizType = crosswordWords.length > 0 ? 'crossword' : 'mcq_single';
            newLesson.quizData = {
                question: "Complete the puzzle",
                crosswordWords: crosswordWords
            };
        }

        await onSave(newLesson);
        resetForm();
        onClose();
    } catch (err) {
        console.error("Save failed", err);
        alert("Failed to save lesson. Please try again.");
    } finally {
        setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setContent(''); setMediaUrl(''); setHtml5Content(''); setPptUrl('');
    setAssessmentQuestions([]); setPassingScore(80);
    setActiveType('text'); setTopic(''); setAssessmentQuestionCount(5);
    setShowBankPicker(false); setAiPrompt(''); setCrosswordWords([]);
    setImageExplanation('');
  };

  const renderCrosswordWordEditor = (word: CrosswordWord, idx: number, updateFn: (idx: number, u: Partial<CrosswordWord>) => void, removeFn: (idx: number) => void) => (
      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Word {idx + 1}</span>
              <button onClick={() => removeFn(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
              <input 
                  placeholder="Answer (One word)"
                  className="p-1.5 text-xs rounded border border-slate-200 bg-white"
                  value={word.answer}
                  onChange={e => updateFn(idx, { answer: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
              />
              <select 
                  className="p-1.5 text-xs rounded border border-slate-200 bg-white"
                  value={word.direction}
                  onChange={e => updateFn(idx, { direction: e.target.value as any })}
              >
                  <option value="across">Across</option>
                  <option value="down">Down</option>
              </select>
          </div>
          <input 
              placeholder="Clue for this word"
              className="w-full p-1.5 text-xs rounded border border-slate-200 bg-white"
              value={word.clue}
              onChange={e => updateFn(idx, { clue: e.target.value })}
          />
          <div className="flex gap-2 items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Start X:</label>
              <input type="number" className="w-12 p-1 text-xs border border-slate-200 rounded bg-white" value={word.x} onChange={e => updateFn(idx, { x: parseInt(e.target.value) || 0 })} />
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Start Y:</label>
              <input type="number" className="w-12 p-1 text-xs border border-slate-200 rounded bg-white" value={word.y} onChange={e => updateFn(idx, { y: parseInt(e.target.value) || 0 })} />
          </div>
      </div>
  );

  const renderQuestionEditor = (q: AssessmentQuestion, idx: number) => {
      return (
        <div className="space-y-4">
            {(() => {
                switch (q.type) {
                    case 'mcq_single':
                    case 'mcq_multi':
                    case 'sorting':
                    case 'coloring':
                        return (
                          <div className="space-y-3 pt-2">
                              <p className="text-xs font-bold text-slate-500 uppercase">Options & Correct Answer</p>
                              {q.options?.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex gap-2 items-center">
                                      {q.type === 'mcq_single' ? (
                                          <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => updateAssessmentQuestion(idx, { correctAnswer: oIdx })} />
                                      ) : q.type === 'mcq_multi' || q.type === 'coloring' ? (
                                          <input type="checkbox" checked={Array.isArray(q.correctAnswer) && q.correctAnswer.includes(oIdx)} onChange={(e) => {
                                              const current = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                                              const next = e.target.checked ? [...current, oIdx] : current.filter(i => i !== oIdx);
                                              updateAssessmentQuestion(idx, { correctAnswer: next });
                                          }} />
                                      ) : (
                                          <span className="text-xs font-bold text-slate-400 w-4">{oIdx + 1}.</span>
                                      )}
                                      <input value={opt} onChange={e => { const opts = [...(q.options || [])]; opts[oIdx] = e.target.value; updateAssessmentQuestion(idx, { options: opts }); }} className="flex-1 p-1.5 border border-slate-200 rounded text-xs bg-white" placeholder={`Option ${oIdx + 1}`} />
                                  </div>
                              ))}
                              {q.type === 'sorting' && (
                                  <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-100">
                                      <p className="text-[10px] text-indigo-700 font-bold uppercase mb-1">Target Order (Indices 0, 1, 2...)</p>
                                      <input 
                                          className="w-full p-1.5 text-xs rounded border border-indigo-200 bg-white" 
                                          placeholder="e.g. 1, 0, 2, 3" 
                                          value={Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : ''} 
                                          onChange={e => {
                                              const val = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                                              updateAssessmentQuestion(idx, { correctAnswer: val });
                                          }}
                                      />
                                  </div>
                              )}
                          </div>
                        );
                    case 'matching':
                        return (
                          <div className="space-y-3 pt-2">
                              <p className="text-xs font-bold text-slate-500 uppercase">Matching Pairs</p>
                              {q.options?.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex gap-2 items-center">
                                      <input value={opt} onChange={e => { const opts = [...(q.options || [])]; opts[oIdx] = e.target.value; updateAssessmentQuestion(idx, { options: opts }); }} className="flex-1 p-1.5 border border-slate-200 rounded text-xs bg-white" placeholder="Left Item" />
                                      <ChevronRight size={14} className="text-slate-400" />
                                      <input 
                                          value={Array.isArray(q.correctAnswer) ? q.correctAnswer[oIdx] : ''} 
                                          onChange={e => {
                                              const next = Array.isArray(q.correctAnswer) ? [...q.correctAnswer] : new Array(q.options?.length).fill('');
                                              next[oIdx] = e.target.value;
                                              updateAssessmentQuestion(idx, { correctAnswer: next });
                                          }} 
                                          className="flex-1 p-1.5 border border-slate-200 rounded text-xs bg-white" 
                                          placeholder="Right Item" 
                                      />
                                  </div>
                              ))}
                          </div>
                        );
                    case 'true_false':
                        return (
                          <div className="flex gap-2 pt-2">
                              <button onClick={() => updateAssessmentQuestion(idx, { correctAnswer: true })} className={`flex-1 py-2 rounded border text-xs font-bold ${q.correctAnswer === true ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200'}`}>True</button>
                              <button onClick={() => updateAssessmentQuestion(idx, { correctAnswer: false })} className={`flex-1 py-2 rounded border text-xs font-bold ${q.correctAnswer === false ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200'}`}>False</button>
                          </div>
                        );
                    case 'short_answer':
                        return (
                          <input placeholder="Correct answer..." value={q.correctAnswer} onChange={e => updateAssessmentQuestion(idx, { correctAnswer: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg text-xs mt-2 bg-white" />
                        );
                    case 'fill_blanks':
                          return (
                              <div className="space-y-3 pt-2">
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">Answers (In order of {'{{blank}}'} placeholders)</p>
                                  <input 
                                      placeholder="France, Paris, Europe" 
                                      className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white" 
                                      value={Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : ''} 
                                      onChange={e => updateAssessmentQuestion(idx, { correctAnswer: e.target.value.split(',').map(s => s.trim()) })}
                                  />
                              </div>
                          );
                    case 'crossword':
                        return (
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-bold text-slate-500 uppercase">Crossword Puzzle</p>
                                    <button 
                                        onClick={() => {
                                            const w = [...(q.crosswordWords || [])];
                                            w.push({ answer: '', clue: '', x: 0, y: 0, direction: 'across' });
                                            updateAssessmentQuestion(idx, { crosswordWords: w });
                                        }} 
                                        className="text-[10px] font-bold text-primary-600 flex items-center gap-1 hover:underline"
                                    >
                                        <Plus size={12} /> Add Word
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {q.crosswordWords?.map((w, wIdx) => (
                                        renderCrosswordWordEditor(
                                            w, 
                                            wIdx, 
                                            (wi, updates) => {
                                                const cw = [...(q.crosswordWords || [])];
                                                cw[wi] = { ...cw[wi], ...updates };
                                                updateAssessmentQuestion(idx, { crosswordWords: cw });
                                            },
                                            (wi) => {
                                                const cw = (q.crosswordWords || []).filter((_, i) => i !== wi);
                                                updateAssessmentQuestion(idx, { crosswordWords: cw });
                                            }
                                        )
                                    ))}
                                </div>
                            </div>
                        );
                    default:
                        return null;
                }
            })()}

            <div className="pt-2">
                <label className="block text-[10px] font-bold text-indigo-600 uppercase mb-1.5 flex items-center gap-1">
                    <Info size={12} /> Feedback / Explanation
                </label>
                <textarea 
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 bg-white min-h-[60px]"
                    placeholder="Provide a detailed explanation of the correct answer..."
                    value={q.feedback || ''}
                    onChange={e => updateAssessmentQuestion(idx, { feedback: e.target.value })}
                />
            </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="font-bold text-lg text-slate-800">Add New Post</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 min-w-max">
            {[
              { id: 'text', label: 'Text', icon: Type },
              { id: 'video', label: 'Video', icon: Video },
              { id: 'audio', label: 'Podcast', icon: Headphones },
              { id: 'image', label: 'Image', icon: ImageIcon },
              { id: 'assessment', label: 'Assessment', icon: Trophy },
              { id: 'quiz', label: 'Quick Quiz', icon: HelpCircle },
              { id: 'pdf', label: 'PDF', icon: FileText },
              { id: 'ppt', label: 'PPT', icon: Presentation },
              { id: 'html5', label: 'HTML5', icon: FileCode },
            ].map(item => (
              <button 
                  key={item.id}
                  onClick={() => setActiveType(item.id as any)}
                  className={`px-3 py-2 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${activeType === item.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <item.icon size={16} />
                  {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto relative">
          {showBankPicker ? (
              <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2"><Database size={20} className="text-indigo-600" /> Question Bank</h3>
                      <button onClick={() => setShowBankPicker(false)} className="text-xs font-bold text-slate-500 hover:text-slate-900 border border-slate-200 px-3 py-1 rounded-lg">Cancel</button>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search box questions..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-primary-100"
                        value={bankSearch}
                        onChange={e => setBankSearch(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                      {filteredBank.length > 0 ? filteredBank.map(q => (
                          <div key={q.id} className="p-3 border border-slate-100 rounded-xl hover:border-primary-200 bg-white flex items-center justify-between group transition-all">
                              <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{q.type.replace('_',' ')}</span>
                                  </div>
                                  <p className="text-sm font-medium text-slate-700 truncate">{q.question}</p>
                              </div>
                              <button onClick={() => handleImportFromBank(q)} className="bg-primary-50 text-primary-600 px-3 py-1 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-all">Add to Exam</button>
                          </div>
                      )) : (
                          <div className="py-12 text-center text-slate-400 italic text-sm">No questions available in bank.</div>
                      )}
                  </div>
              </div>
          ) : (
            <>
                {(activeType === 'text' || activeType === 'assessment' || activeType === 'quiz') && (
                    <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-800 uppercase mb-2">AI Generator</label>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                        <input 
                            className="flex-1 border border-indigo-200 rounded-lg p-2 text-sm text-slate-900 outline-none bg-white focus:ring-2 focus:ring-indigo-100"
                            placeholder={`Enter topic (e.g. Photoshop Basics)...`}
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            disabled={loading}
                        />
                        <button 
                            onClick={handleAIGenerate}
                            disabled={loading || !topic}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shrink-0 transition-all active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                            <span>{activeType === 'assessment' ? 'Generate Full Exam' : 'Generate'}</span>
                        </button>
                        </div>
                        
                        {activeType === 'assessment' && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                            <label className="text-xs font-bold text-indigo-700 uppercase whitespace-nowrap">Number of Questions:</label>
                            <div className="flex items-center gap-3 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 shadow-sm">
                            <input 
                                type="range" min="1" max="15" step="1"
                                value={assessmentQuestionCount} 
                                onChange={(e) => setAssessmentQuestionCount(parseInt(e.target.value))}
                                className="w-32 h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <span className="text-sm font-bold text-indigo-900 min-w-[1.25rem] text-center">{assessmentQuestionCount}</span>
                            </div>
                        </div>
                        )}
                    </div>
                    </div>
                )}

                {(activeType === 'video' || activeType === 'image' || activeType === 'audio') && (
                    <div className={`mb-6 p-6 rounded-2xl border text-white shadow-2xl relative overflow-hidden ${activeType === 'video' ? 'bg-slate-900 border-slate-800' : activeType === 'audio' ? 'bg-emerald-900 border-emerald-800' : 'bg-indigo-900 border-indigo-800'}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                            {activeType === 'video' ? <Film size={80} /> : activeType === 'audio' ? <Headphones size={80} /> : <ImageIcon size={80} />}
                        </div>
                        <div className="relative z-10">
                            <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Sparkles size={14} /> AI {activeType === 'video' ? 'Video' : activeType === 'audio' ? 'Podcast' : 'Image'} Synthesis
                            </label>
                            
                            {loading ? (
                                <div className="py-8 flex flex-col items-center justify-center text-center animate-pulse">
                                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                                    <p className="text-sm font-bold text-slate-300 mb-1">
                                        {activeType === 'video' ? VIDEO_LOADING_MESSAGES[videoLoadingMsgIndex] : activeType === 'audio' ? AUDIO_LOADING_MESSAGES[audioLoadingMsgIndex] : "Generating high-quality illustration..."}
                                    </p>
                                    <p className="text-[10px] text-slate-500 italic px-8">
                                        {activeType === 'video' ? "This process usually takes 1-2 minutes. Please remain on this screen." : activeType === 'audio' ? "Crafting educational speech patterns..." : "Fetching pixels from the latent space..."}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <textarea 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[100px]"
                                        placeholder={activeType === 'video' ? "Describe the educational scene you want to generate..." : activeType === 'audio' ? "Describe the podcast topic you want AI to explain..." : "Describe the educational illustration you want to generate..."}
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                    />
                                    
                                    {activeType === 'audio' && (
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-[10px] font-bold text-emerald-400 uppercase mb-1">Select Voice</label>
                                          <select 
                                            value={selectedVoice} 
                                            onChange={e => setSelectedVoice(e.target.value)}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                          >
                                            <option value="Kore">Kore (Male, Professional)</option>
                                            <option value="Zephyr">Zephyr (Female, Calm)</option>
                                            <option value="Puck">Puck (Cheerful, Energetic)</option>
                                            <option value="Charon">Charon (Deep, Academic)</option>
                                          </select>
                                        </div>
                                      </div>
                                    )}

                                    <button 
                                        onClick={activeType === 'video' ? handleVideoAIGenerate : activeType === 'audio' ? handleAudioAIGenerate : handleImageAIGenerate}
                                        disabled={!aiPrompt}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {activeType === 'video' ? <Film size={18} /> : activeType === 'audio' ? <Headphones size={18} /> : <ImageIcon size={18} />}
                                        Generate {activeType === 'video' ? 'Video with Veo' : activeType === 'audio' ? 'Audio Podcast' : 'Image with Gemini'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeType === 'assessment' ? (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Assessment Title</label>
                            <input 
                                className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                placeholder="e.g. Final Certification Exam"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                                <p className="text-sm font-bold text-slate-900">Passing Requirement</p>
                                <p className="text-xs text-slate-500">Students need this percentage to pass.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="number" value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value))} className="w-16 p-2 border border-slate-200 rounded text-center font-bold bg-white" />
                                <span className="text-sm font-bold">%</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Questions ({assessmentQuestions.length})</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setShowBankPicker(true)} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline bg-indigo-50 px-2 py-1 rounded"><Database size={14} /> Import from Bank</button>
                                <button onClick={handleAddQuestion} className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:underline bg-slate-100 px-2 py-1 rounded"><Plus size={14} /> Manual</button>
                            </div>
                        </div>
                        
                        {assessmentQuestions.map((q, idx) => (
                            <div key={q.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                <button 
                                    onClick={() => setExpandedQIdx(expandedQIdx === idx ? null : idx)}
                                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                        <span className="text-sm font-bold text-slate-800 truncate max-w-md">{q.question || 'Untitled Question'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={(e) => { e.stopPropagation(); setAssessmentQuestions(assessmentQuestions.filter((_, i) => i !== idx)); }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                                        {expandedQIdx === idx ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </div>
                                </button>
                                
                                {expandedQIdx === idx && (
                                    <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                        <select value={q.type} onChange={e => updateAssessmentQuestion(idx, { type: e.target.value as any, options: e.target.value === 'true_false' ? [] : (q.options?.length ? q.options : ['', '', '', '']), correctAnswer: e.target.value === 'mcq_multi' || e.target.value === 'coloring' || e.target.value === 'sorting' || e.target.value === 'fill_blanks' ? [] : '' })} className="w-full p-2 border border-slate-200 rounded-lg text-sm mb-2 bg-white">
                                            <option value="mcq_single">Multiple Choice</option>
                                            <option value="mcq_multi">Multi-Select</option>
                                            <option value="true_false">True / False</option>
                                            <option value="short_answer">Short Answer</option>
                                            <option value="fill_blanks">Fill in the Blanks</option>
                                            <option value="sorting">Ordering/Sorting</option>
                                            <option value="matching">Matching Pairs</option>
                                            <option value="coloring">Grid Coloring</option>
                                            <option value="crossword">Crossword</option>
                                        </select>
                                        <input placeholder={q.type === 'fill_blanks' ? "Type question with {{blank}} placeholders..." : "Question text..."} value={q.question} onChange={e => updateAssessmentQuestion(idx, { question: e.target.value })} className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white" />
                                        
                                        {renderQuestionEditor(q, idx)}
                                    </div>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activeType === 'ppt' && (
                            <div className="mb-6 animate-in fade-in zoom-in duration-300">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Presentation</label>
                                {loading ? (
                                    <div className="border-2 border-dashed border-primary-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-primary-50 text-center">
                                        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                                        <p className="font-bold text-primary-900 mb-1">Analyzing Presentation Content...</p>
                                        <p className="text-xs text-primary-600">Gemini is building a browser-native interactive slide player.</p>
                                    </div>
                                ) : pptUrl ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                                <Presentation size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-green-900">Presentation Ready</p>
                                                <p className="text-xs text-green-600">Interactive live viewer generated.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => { setPptUrl(''); setHtml5Content(''); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                                            className="text-xs font-bold text-red-600 hover:underline"
                                        >
                                            Replace File
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-primary-400 transition-all cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform text-[#D24726]">
                                            <Presentation size={32} />
                                        </div>
                                        <p className="font-bold text-slate-800">Click to upload presentation</p>
                                        <p className="text-xs text-slate-500 mt-1">Supports .ppt and .pptx files</p>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".ppt,.pptx"
                                            onChange={handlePptUpload}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                        <input className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        
                        {activeType === 'image' && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-slate-700">Image Explanation (Optional)</label>
                                    <button 
                                        onClick={handleExplainImage}
                                        disabled={explaining || !aiPrompt}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {explaining ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                        AI Explain
                                    </button>
                                </div>
                                <textarea 
                                    className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-h-[80px] transition-all"
                                    placeholder="Write a caption or educational explanation to appear under the image..."
                                    value={imageExplanation}
                                    onChange={e => setImageExplanation(e.target.value)}
                                />
                            </div>
                        )}

                        {activeType === 'quiz' && (
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Crossword Puzzle Words</label>
                                    <button 
                                        onClick={() => {
                                            const w = [...crosswordWords];
                                            w.push({ answer: '', clue: '', x: 0, y: 0, direction: 'across' });
                                            setCrosswordWords(w);
                                        }} 
                                        className="text-[10px] font-bold text-primary-600 flex items-center gap-1 hover:underline"
                                    >
                                        <Plus size={12} /> Add Manual Word
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {crosswordWords.map((w, wIdx) => (
                                        renderCrosswordWordEditor(
                                            w, 
                                            wIdx, 
                                            (wi, updates) => {
                                                const cw = [...crosswordWords];
                                                cw[wi] = { ...cw[wi], ...updates };
                                                setCrosswordWords(cw);
                                            },
                                            (wi) => setCrosswordWords(crosswordWords.filter((_, i) => i !== wi))
                                        )
                                    ))}
                                </div>
                                {crosswordWords.length === 0 && (
                                    <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                                        <p className="text-xs text-slate-400 italic">No words added yet. Use AI generator or add manually.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {['video', 'image', 'audio', 'html5', 'pdf'].includes(activeType) && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{activeType === 'video' ? 'Video / Media' : activeType === 'audio' ? 'Audio / Podcast' : 'Image / Media'} URL</label>
                            <input className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 bg-white" placeholder="https://..." value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
                        </div>
                        )}
                        {activeType === 'audio' && mediaUrl && (
                          <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <audio src={mediaUrl} controls className="w-full" />
                          </div>
                        )}
                        {(activeType === 'video' || activeType === 'image') && mediaUrl && (
                            <div className="mt-3 aspect-video bg-black rounded-xl overflow-hidden border border-slate-200">
                                {activeType === 'video' ? (
                                    <video src={mediaUrl} controls className="w-full h-full" />
                                ) : (
                                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                                )}
                            </div>
                        )}
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Content / Description</label>
                        <textarea className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white" rows={3} value={content} onChange={e => setContent(e.target.value)} />
                        </div>
                    </div>
                )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="text-slate-600 px-4 py-2 font-medium hover:text-slate-900">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            {saving ? 'Adding...' : 'Add to Box'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonCreatorModal;
