
import React, { useState, useRef } from 'react';
import { Lesson, QuizType, AssessmentQuestion, AssessmentContent } from '../types';
import { generateMicroLesson, convertPdfToHtml, convertPptToHtml, generateAssessment } from '../services/geminiService';
import { X, Wand2, Loader2, Save, Type, Video, HelpCircle, Image as ImageIcon, Music, FileCode, Package, MousePointerClick, Upload, Link as LinkIcon, FileText, Sparkles, Presentation, Trophy, Plus, Trash2, ChevronRight, ChevronDown, ListOrdered, Palette, Grid, Info } from 'lucide-react';

interface LessonCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
  boxTitle: string;
}

const LessonCreatorModal: React.FC<LessonCreatorModalProps> = ({ isOpen, onClose, onSave, boxTitle }) => {
  const [loading, setLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [activeType, setActiveType] = useState<'text' | 'video' | 'quiz' | 'image' | 'audio' | 'html5' | 'scorm' | 'interactive_video' | 'pdf' | 'ppt' | 'assessment'>('text');
  const [quizSubType, setQuizSubType] = useState<QuizType>('mcq_single');
  
  // Form State
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState(''); 
  const [html5Content, setHtml5Content] = useState('');
  
  // Full Assessment State
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [passingScore, setPassingScore] = useState(80);
  const [expandedQIdx, setExpandedQIdx] = useState<number | null>(0);
  const [assessmentQuestionCount, setAssessmentQuestionCount] = useState(5);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          if (activeType === 'quiz' && data.quizData) {
            setQuizSubType(data.quizType || 'mcq_single');
          }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate content.');
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

  const updateAssessmentQuestion = (idx: number, updates: Partial<AssessmentQuestion>) => {
    const next = [...assessmentQuestions];
    next[idx] = { ...next[idx], ...updates };
    setAssessmentQuestions(next);
  };

  const handleSave = () => {
    if (!title) {
      alert("Please fill in the title.");
      return;
    }

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
      audioUrl: activeType === 'audio' ? mediaUrl : undefined,
      html5Url: activeType === 'html5' ? mediaUrl : undefined,
      html5Content: activeType === 'html5' ? html5Content : undefined,
    };

    if (activeType === 'assessment') {
        newLesson.assessmentData = { questions: assessmentQuestions, passingScore };
    }

    onSave(newLesson);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle(''); setContent(''); setMediaUrl(''); setHtml5Content('');
    setAssessmentQuestions([]); setPassingScore(80);
    setActiveType('text'); setTopic(''); setAssessmentQuestionCount(5);
  };

  const renderQuestionEditor = (q: AssessmentQuestion, idx: number) => {
      return (
        <div className="space-y-4">
            {/* Logic for specific types */}
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
                    default:
                        return null;
                }
            })()}

            {/* Explanation Field for all types */}
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
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="font-bold text-lg text-slate-800">Add New Post</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <div className="p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <div className="flex gap-1 min-w-max">
            {[
              { id: 'text', label: 'Text', icon: Type },
              { id: 'video', label: 'Video', icon: Video },
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

        <div className="p-6 overflow-y-auto">
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
                       <button onClick={handleAddQuestion} className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:underline"><Plus size={14} /> Add Manual Question</button>
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                {['video', 'image', 'audio', 'html5', 'pdf', 'ppt'].includes(activeType) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">URL Link</label>
                    <input className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 bg-white" placeholder="https://..." value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content / Description</label>
                  <textarea className="w-full border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white" rows={3} value={content} onChange={e => setContent(e.target.value)} />
                </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="text-slate-600 px-4 py-2 font-medium hover:text-slate-900">Cancel</button>
          <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-md active:scale-95"><Save size={18} /> Add to Box</button>
        </div>
      </div>
    </div>
  );
};

export default LessonCreatorModal;
