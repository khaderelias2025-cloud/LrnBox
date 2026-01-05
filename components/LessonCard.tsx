
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Box, QuizType, User, AssessmentQuestion, QuizContent, CrosswordWord } from '../types';
import { Heart, MessageCircle, Share2, CheckCircle, PlayCircle, ExternalLink, Move, Palette, RefreshCcw, ImageIcon, Headphones, FileCode, Package, MousePointerClick, Send, XCircle, Check, X, Bookmark, Trash2, FileText, Sparkles, Presentation, Loader2, Trophy, ArrowRight, ArrowLeft, HelpCircle, Eye, Award, GripVertical, Plus, ChevronDown, Info, Grid, Volume2, Download, AlertTriangle, Flag, EyeOff, LayoutGrid, RotateCcw, Languages, Globe, ChevronRight, VolumeX } from 'lucide-react';
import RichText from './RichText';
import { convertPptToHtml, generateVerbatimSpeech } from '../services/geminiService';

interface LessonCardProps {
  lesson: Lesson;
  box?: Box;
  onLike: (id: string) => void;
  onComplete: (id: string) => void;
  onAddComment: (lessonId: string, text: string) => void;
  onHashtagClick?: (tag: string) => void;
  friendsWhoCompleted?: User[];
  onShowCompleters?: (users: User[]) => void;
  onShare?: (lessonId: string) => void;
  isSaved?: boolean;
  onSave?: (lessonId: string) => void;
  onDelete?: (id: string) => void;
  onUpdateLesson?: (boxId: string, lessonId: string, updates: Partial<Lesson>) => void;
}

interface AssessmentResultDetail {
    qId: string;
    question_en: string;
    question_ar: string;
    type: QuizType;
    userAns: any;
    correctAns: any;
    isCorrect: boolean;
    feedback_en?: string;
    feedback_ar?: string;
    options_en?: string[];
    options_ar?: string[];
}

interface AssessmentResult {
    score: number;
    passed: boolean;
    details: AssessmentResultDetail[];
}

const LessonCard: React.FC<LessonCardProps> = ({ 
    lesson, 
    box, 
    onLike, 
    onComplete, 
    onAddComment, 
    onHashtagClick, 
    friendsWhoCompleted = [], 
    onShowCompleters, 
    onShare, 
    isSaved = false, 
    onSave,
    onDelete,
    onUpdateLesson
}) => {
  const [liked, setLiked] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  const [isCompleted, setIsCompleted] = useState(lesson.isCompleted || false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [userAnswer, setUserAnswer] = useState<any>(null);

  // TTS State
  const [isReading, setIsReading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Assessment Player State
  const [assessmentStep, setAssessmentStep] = useState<'intro' | 'question' | 'result'>('intro');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);
  
  // Lightbox State
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // New: Force language state
  const [forcedLanguage, setForcedLanguage] = useState<'original' | 'en' | 'ar'>('original');

  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    setUserAnswer(null);
    setQuizFeedback(null);
    setShowComments(false);
    setCommentText('');
    setIsCompleted(lesson.isCompleted || false);
    setAssessmentStep('intro');
    setCurrentQuestionIdx(0);
    setAssessmentAnswers({});
    setAssessmentResult(null);
    setShowQuizAnswer(false);
    setMarkedQuestions(new Set());
    setRevealedAnswers(new Set());
    setFullscreenImage(null);
    
    if (lesson.type === 'quiz' && lesson.quizData) {
      if (lesson.isCompleted) {
         setQuizFeedback('correct');
      }
    }

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, [lesson.id, lesson.isCompleted, lesson.type, lesson.quizType, lesson.quizData]);

  const handleLike = () => {
    setLiked(!liked);
    onLike(lesson.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onShare) {
        onShare(lesson.id);
    } else {
        const url = `${window.location.origin}/post/${lesson.id}`;
        navigator.clipboard.writeText(url).then(() => {
            alert("Link copied to clipboard!");
        });
    }
  };

  const handleSave = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onSave) onSave(lesson.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete && window.confirm("Delete this post?")) onDelete(lesson.id);
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    onComplete(lesson.id);
  };

  const handleReadAloud = async () => {
      if (isReading) {
          audioRef.current?.pause();
          setIsReading(false);
          return;
      }

      setAudioLoading(true);
      try {
          const textToRead = `${lesson.title}. ${lesson.content}. ${lesson.imageExplanation || ''}`;
          const audioUrl = await generateVerbatimSpeech(textToRead);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onended = () => setIsReading(false);
          audio.play();
          setIsReading(true);
      } catch (err) {
          console.error("Failed to play speech", err);
          alert("AI speech synthesis failed.");
      } finally {
          setAudioLoading(false);
      }
  };

  const toggleMarkQuestion = (qId: string) => {
    const next = new Set(markedQuestions);
    if (next.has(qId)) next.delete(qId);
    else next.add(qId);
    setMarkedQuestions(next);
  };

  const toggleRevealAnswer = (qId: string) => {
    const next = new Set(revealedAnswers);
    if (next.has(qId)) next.delete(qId);
    else next.add(qId);
    setRevealedAnswers(next);
  };

  const checkAnswer = () => {
    if (!lesson.quizData) return;
    let isCorrect = false;
    const correct = lesson.quizData.correctAnswer;

    switch (lesson.quizType) {
      case 'mcq_single':
      case 'true_false':
        isCorrect = String(userAnswer) === String(correct);
        break;
      case 'short_answer':
        isCorrect = userAnswer?.toLowerCase().trim() === correct?.toLowerCase().trim();
        break;
      case 'mcq_multi':
        const uArr = Array.isArray(userAnswer) ? userAnswer.map(String) : [];
        const cArr = Array.isArray(correct) ? correct.map(String) : [];
        isCorrect = uArr.length === cArr.length && uArr.every(val => cArr.includes(val));
        break;
      case 'fill_blanks':
        const uArrF = Array.isArray(userAnswer) ? userAnswer.map(v => String(v).toLowerCase().trim()) : [String(userAnswer).toLowerCase().trim()];
        const cArrF = Array.isArray(correct) ? correct.map(v => String(v).toLowerCase().trim()) : [String(correct).toLowerCase().trim()];
        isCorrect = JSON.stringify(uArrF) === JSON.stringify(cArrF);
        break;
      case 'crossword':
        const words = lesson.quizData.crosswordWords || [];
        let allOk = true;
        words.forEach(w => {
            for (let i = 0; i < w.answer.length; i++) {
                const curX = w.direction === 'across' ? w.x + i : w.x;
                const curY = w.direction === 'across' ? w.y : w.y + i;
                const cellVal = (userAnswer as Record<string, string>)?.[`${curX},${curY}`] || '';
                if (cellVal.toUpperCase() !== w.answer[i].toUpperCase()) allOk = false;
            }
        });
        isCorrect = allOk;
        break;
      default:
        isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correct);
        break;
    }

    if (isCorrect) {
      setQuizFeedback('correct');
      setIsCompleted(true);
      onComplete(lesson.id);
    } else {
      setQuizFeedback('incorrect');
    }
  };

  // Content Selection Logic based on forcing
  const getLocalizedText = (en?: string, ar?: string, original?: string) => {
    if (forcedLanguage === 'en') return en || original || '';
    if (forcedLanguage === 'ar') return ar || original || '';
    
    // Original mode: show stacked if available
    if (en && ar) return (
      <div className="flex flex-col gap-2">
        <p className="text-slate-900">{en}</p>
        <div className="h-px bg-slate-100" />
        <p className="text-indigo-700 text-right" dir="rtl">{ar}</p>
      </div>
    );
    return original || en || ar || '';
  };

  const getLocalizedOptions = (en?: string[], ar?: string[], original?: string[]) => {
    if (forcedLanguage === 'en') return en || original || [];
    if (forcedLanguage === 'ar') return ar || original || [];
    return en || ar || original || [];
  };

  const LanguageSwitcher = () => (
    <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner mb-4">
        {[
            { id: 'original', label: 'Original', icon: Globe },
            { id: 'en', label: 'English', icon: Languages },
            { id: 'ar', label: 'العربية', icon: Languages }
        ].map(l => (
            <button 
                key={l.id}
                onClick={() => setForcedLanguage(l.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${forcedLanguage === l.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
                <l.icon size={12} />
                {l.label}
            </button>
        ))}
    </div>
  );

  const renderSorting = (data: any, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => {
    const itemsEn = data.options_en || data.options || [];
    const itemsAr = data.options_ar || data.options || [];
    const items = getLocalizedOptions(itemsEn, itemsAr, data.options);
    const order = Array.isArray(currentAns) ? currentAns : items.map((_: any, i: number) => i);
    const correctOrder = Array.isArray(data.correctAnswer) ? data.correctAnswer : [];
    const isAr = forcedLanguage === 'ar';

    const move = (idx: number, dir: number) => {
        if (locked) return;
        const next = [...order];
        const target = idx + dir;
        if (target < 0 || target >= next.length) return;
        [next[idx], next[target]] = [next[target], next[idx]];
        setAns(next);
    };

    return (
        <div className="space-y-2">
            {order.map((itemIdx: number, pos: number) => {
                const isCorrect = highlightCorrect && String(correctOrder[pos]) === String(itemIdx);
                return (
                    <div key={itemIdx} dir={isAr ? 'rtl' : 'ltr'} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${highlightCorrect ? (isCorrect ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900') : 'bg-white border-slate-200 text-slate-900'}`}>
                        <span className="text-xs font-bold text-slate-400 w-4">{pos + 1}</span>
                        <span className={`flex-1 text-sm font-medium ${isAr ? 'font-arabic' : ''}`}>{items[itemIdx]}</span>
                        {!locked && (
                            <div className="flex flex-col gap-1">
                                <button type="button" onClick={() => move(pos, -1)} disabled={pos === 0} className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronDown className="rotate-180" size={14}/></button>
                                <button type="button" onClick={() => move(pos, 1)} disabled={pos === order.length - 1} className="p-0.5 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronDown size={14}/></button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
  };

  const renderMatching = (data: any, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => {
      const optionsEn = data.options_en || data.options || [];
      const optionsAr = data.options_ar || data.options || [];
      const leftItems = getLocalizedOptions(optionsEn, optionsAr, data.options);
      const userMatches = currentAns || {};
      const isAr = forcedLanguage === 'ar';

      return (
          <div className="space-y-4">
              {leftItems.map((left: any, idx: number) => (
                  <div key={idx} dir={isAr ? 'rtl' : 'ltr'} className="flex items-center gap-4">
                      <div className={`flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 ${isAr ? 'font-arabic' : ''}`}>{left}</div>
                      <ChevronRight size={16} className={`text-slate-300 ${isAr ? 'rotate-180' : ''}`} />
                      <div className="flex-1">
                          <input 
                            disabled={locked}
                            placeholder={isAr ? "...أدخل المطابقة" : "Match..."}
                            className={`w-full p-3 border rounded-lg text-sm bg-white outline-none ${isAr ? 'font-arabic text-right' : ''} ${highlightCorrect ? (String(userMatches[idx])?.toLowerCase() === String(Array.isArray(data.correctAnswer) ? data.correctAnswer[idx] : '').toLowerCase() ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900') : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}
                            value={userMatches[idx] || ''}
                            onChange={e => setAns({...userMatches, [idx]: e.target.value})}
                          />
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const renderColoring = (data: any, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => {
    const grid = data.coloringGrid || [5, 5];
    const rows = grid[0];
    const cols = grid[1];
    const colored = Array.isArray(currentAns) ? currentAns : [];
    const correct = Array.isArray(data.correctAnswer) ? data.correctAnswer : [];

    return (
        <div className="flex justify-center p-4">
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: rows * cols }).map((_, i) => {
                    const isSelected = colored.includes(i);
                    const shouldBeSelected = correct.includes(i);
                    let colorClass = isSelected ? 'bg-indigo-600' : 'bg-slate-200';
                    if (highlightCorrect) {
                        if (isSelected && shouldBeSelected) colorClass = 'bg-green-600';
                        else if (isSelected && !shouldBeSelected) colorClass = 'bg-red-600';
                        else if (!isSelected && shouldBeSelected) colorClass = 'bg-green-200';
                    }
                    return (
                        <button 
                            key={i} 
                            type="button"
                            disabled={locked}
                            onClick={() => {
                                const next = isSelected ? colored.filter((idx: number) => idx !== i) : [...colored, i];
                                setAns(next);
                            }}
                            className={`w-8 h-8 rounded-sm transition-colors ${colorClass}`}
                        />
                    );
                })}
            </div>
        </div>
    );
  };

  const renderCrossword = (data: any, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => {
    const words: CrosswordWord[] = data.crosswordWords || [];
    const answers = (currentAns as Record<string, string>) || {};
    const isAr = forcedLanguage === 'ar';

    let maxX = 0, maxY = 0;
    words.forEach(w => {
        const len = w.answer.length;
        maxX = Math.max(maxX, w.direction === 'across' ? w.x + len : w.x + 1);
        maxY = Math.max(maxY, w.direction === 'across' ? w.y + 1 : w.y + len);
    });

    return (
        <div className="space-y-6">
            <div className="overflow-x-auto p-4 bg-white border border-slate-100 rounded-xl shadow-inner flex justify-center">
                <div className="grid gap-px bg-slate-200 border border-slate-200" style={{ gridTemplateColumns: `repeat(${maxX}, 32px)`, gridTemplateRows: `repeat(${maxY}, 32px)` }}>
                    {Array.from({ length: maxX * maxY }).map((_, i) => {
                        const x = i % maxX;
                        const y = Math.floor(i / maxX);
                        
                        let charFound = '';
                        let isCell = false;
                        words.forEach(w => {
                            for (let j = 0; j < w.answer.length; j++) {
                                const curX = w.direction === 'across' ? w.x + j : w.x;
                                const curY = w.direction === 'across' ? w.y : w.y + j;
                                if (curX === x && curY === y) {
                                    isCell = true;
                                    charFound = w.answer[j];
                                }
                            }
                        });

                        if (!isCell) return <div key={i} className="bg-slate-800" />;

                        const wordStart = words.find(w => w.x === x && w.y === y);
                        const wordStartIdx = wordStart ? words.indexOf(wordStart) + 1 : null;
                        
                        const val = answers[`${x},${y}`] || '';
                        
                        let bg = 'bg-white';
                        if (highlightCorrect && val) {
                            bg = val.toUpperCase() === charFound.toUpperCase() ? 'bg-green-50' : 'bg-red-50';
                        } else if (highlightCorrect && !val) {
                            bg = 'bg-white';
                        }

                        return (
                            <div key={i} className={`relative flex items-center justify-center ${bg}`}>
                                {wordStartIdx && <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-slate-400 leading-none">{wordStartIdx}</span>}
                                <input 
                                    disabled={locked}
                                    className="w-full h-full text-center text-sm font-bold uppercase bg-transparent outline-none border-none text-slate-900"
                                    maxLength={1}
                                    value={val}
                                    onChange={e => setAns({ ...answers, [`${x},${y}`]: e.target.value.toUpperCase() })}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs ${isAr ? 'text-right' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
                <div>
                    <h5 className="font-bold text-slate-400 uppercase mb-2">{isAr ? 'أفقي' : 'Across'}</h5>
                    <ul className="space-y-1">
                        {words.filter(w => w.direction === 'across').map(w => (
                            <li key={words.indexOf(w)} className={`text-slate-600 ${isAr ? 'font-arabic' : ''}`}><span className="font-bold text-indigo-600 mr-1">{words.indexOf(w) + 1}.</span> {w.clue}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h5 className="font-bold text-slate-400 uppercase mb-2">{isAr ? 'رأسي' : 'Down'}</h5>
                    <ul className="space-y-1">
                        {words.filter(w => w.direction === 'down').map(w => (
                            <li key={words.indexOf(w)} className={`text-slate-600 ${isAr ? 'font-arabic' : ''}`}><span className="font-bold text-indigo-600 mr-1">{words.indexOf(w) + 1}.</span> {w.clue}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
  };

  const renderMCQSingle = (data: AssessmentQuestion, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => {
    const correctIdx = data.correctAnswer;
    const localizedOptions = getLocalizedOptions(data.options_en, data.options_ar, data.options);
    const isAr = forcedLanguage === 'ar';

    return (
      <div className="space-y-2">
        {localizedOptions.map((option, idx) => {
          const isSelected = String(currentAns) === String(idx);
          const isCorrect = String(idx) === String(correctIdx);
          let containerClass = isSelected ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900" : "bg-white border-slate-200 hover:bg-slate-50";
          if (highlightCorrect && isCorrect) containerClass = "bg-green-50 border-green-500 ring-2 ring-green-500 text-green-900";
          if (highlightCorrect && isSelected && !isCorrect) containerClass = "bg-red-50 border-red-500 ring-2 ring-red-500 text-red-900";
          
          return (
            <button
              key={idx}
              dir={isAr ? 'rtl' : 'ltr'}
              disabled={locked}
              onClick={() => setAns(idx)}
              className={`w-full text-left p-3.5 rounded-lg text-sm border transition-all flex items-center gap-3 ${containerClass}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 transition-all shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : highlightCorrect && isCorrect ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                {(isSelected || (highlightCorrect && isCorrect)) && <div className="w-full h-full flex items-center justify-center text-white"><Check size={12} strokeWidth={4} /></div>}
              </div>
              <span className={`font-medium ${isAr ? 'font-arabic' : ''}`}>{option}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMCQMulti = (data: AssessmentQuestion, currentAns: any[], setAns: (val: any[]) => void, locked = false, highlightCorrect = false) => {
    const current = Array.isArray(currentAns) ? currentAns.map(String) : [];
    const correctArr = Array.isArray(data.correctAnswer) ? data.correctAnswer.map(String) : [];
    const localizedOptions = getLocalizedOptions(data.options_en, data.options_ar, data.options);
    const isAr = forcedLanguage === 'ar';

    return (
      <div className="space-y-2">
        {localizedOptions.map((option, idx) => {
          const sIdx = String(idx);
          const isSelected = current.includes(sIdx);
          const isCorrect = correctArr.includes(sIdx);
          let containerClass = isSelected ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900" : "bg-white border-slate-200 hover:bg-slate-50";
          if (highlightCorrect && isCorrect) containerClass = "bg-green-50 border-green-500 ring-2 ring-green-500 text-green-900";
          if (highlightCorrect && isSelected && !isCorrect) containerClass = "bg-red-50 border-red-500 ring-2 ring-red-500 text-red-900";
          
          return (
            <button
              key={idx}
              dir={isAr ? 'rtl' : 'ltr'}
              disabled={locked}
              onClick={() => {
                  const next = isSelected ? current.filter(i => i !== sIdx) : [...current, sIdx];
                  setAns(next);
              }}
              className={`w-full text-left p-3.5 rounded-lg text-sm border transition-all flex items-center gap-3 ${containerClass}`}
            >
              <div className={`w-5 h-5 rounded border-2 transition-all shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : highlightCorrect && isCorrect ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                {(isSelected || (highlightCorrect && isCorrect)) && <div className="w-full h-full flex items-center justify-center text-white"><Check size={12} strokeWidth={4} /></div>}
              </div>
              <span className={`font-medium ${isAr ? 'font-arabic' : ''}`}>{option}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = (data: AssessmentQuestion, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => {
    const isAr = forcedLanguage === 'ar';
    return (
        <div className="flex gap-4">
        {[true, false].map((val) => {
            const isSelected = currentAns === val;
            const isCorrect = val === data.correctAnswer;
            let buttonClass = isSelected ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500" : "bg-white border-slate-200 text-slate-700";
            if (highlightCorrect && isCorrect) buttonClass = "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500";
            if (highlightCorrect && isSelected && !isCorrect) buttonClass = "border-red-500 bg-red-50 text-red-700 ring-2 border-red-500";
            
            return (
                <button
                key={val ? 'T' : 'F'}
                disabled={locked}
                onClick={() => setAns(val)}
                className={`flex-1 p-4 rounded-xl border-2 text-center font-bold transition-all ${isAr ? 'font-arabic' : ''} ${buttonClass}`}
                >
                {val ? (isAr ? 'صحيح' : 'True') : (isAr ? 'خطأ' : 'False')}
                </button>
            );
        })}
        </div>
    );
  };

  const renderShortAnswer = (data: AssessmentQuestion, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => {
    const isAr = forcedLanguage === 'ar';
    return (
        <div className="space-y-3">
            <input
                type="text"
                dir={isAr ? 'rtl' : 'ltr'}
                disabled={locked}
                className={`w-full p-3 border rounded-lg outline-none transition-colors ${isAr ? 'font-arabic text-right' : ''} ${highlightCorrect ? (String(currentAns)?.toLowerCase().trim() === String(data.correctAnswer)?.toLowerCase().trim() ? 'border-green-500 bg-green-50 text-green-900' : 'border-red-500 bg-red-50 text-red-900') : 'border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white'}`}
                placeholder={isAr ? "أدخل إجابتك هنا..." : "Type your answer here..."}
                value={currentAns || ''}
                onChange={(e) => setAns(e.target.value)}
            />
            {highlightCorrect && String(currentAns)?.toLowerCase().trim() !== String(data.correctAnswer)?.toLowerCase().trim() && (
                <div className={`p-3 bg-green-50 border border-green-100 rounded-lg ${isAr ? 'text-right' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
                    <p className={`text-xs font-bold text-green-800 uppercase mb-1 ${isAr ? 'font-arabic' : ''}`}>{isAr ? "الإجابة الصحيحة:" : "Correct Answer:"}</p>
                    <p className="text-sm font-medium text-green-900">{String(data.correctAnswer)}</p>
                </div>
            )}
        </div>
    );
  };

  const renderFillBlanks = (data: AssessmentQuestion, currentAns: string[], setAns: (val: string[]) => void, locked = false, highlightCorrect = false) => {
      const qText = forcedLanguage === 'ar' ? data.question_ar : forcedLanguage === 'en' ? data.question_en : data.question;
      const parts = (qText || '').split('{{blank}}');
      const blankCount = parts.length - 1;
      const answers = Array.isArray(currentAns) && currentAns.length === blankCount ? currentAns : new Array(blankCount).fill('');
      const correctAnswers = Array.isArray(data.correctAnswer) ? data.correctAnswer : [data.correctAnswer];
      const isAr = forcedLanguage === 'ar';
      
      return (
          <div className={`text-slate-800 leading-loose ${isAr ? 'text-right font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
              {parts.map((part, i) => (
                  <React.Fragment key={i}>
                      {part}
                      {i < blankCount && (
                          <span className="inline-block mx-1">
                              <input 
                                disabled={locked}
                                className={`min-w-[80px] border-b-2 px-1 focus:border-indigo-600 outline-none transition-colors text-center font-bold bg-white ${highlightCorrect ? (String(answers[i])?.toLowerCase() === String(correctAnswers[i])?.toLowerCase() ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300') : 'text-indigo-600 border-slate-300'}`}
                                value={answers[i] || ''}
                                onChange={(e) => {
                                    const next = [...answers];
                                    next[i] = e.target.value;
                                    setAns(next);
                                }}
                              />
                              {highlightCorrect && String(answers[i])?.toLowerCase() !== String(correctAnswers[i])?.toLowerCase() && (
                                  <span className="block text-[10px] text-green-600 font-bold">({String(correctAnswers[i])})</span>
                              )}
                          </span>
                      )}
                  </React.Fragment>
              ))}
          </div>
      );
  };

  const renderAssessmentContent = () => {
    if (!lesson.assessmentData || !lesson.assessmentData.questions?.length) {
        return (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <AlertTriangle className="mx-auto mb-3 text-slate-300" size={32} />
                <p className="text-slate-500 text-sm font-medium">Assessment data is unavailable or empty.</p>
            </div>
        );
    }
    
    const { questions, passingScore } = lesson.assessmentData;

    if (assessmentStep === 'intro') {
      return (
        <div className="animate-in fade-in duration-300">
           <LanguageSwitcher />
           <div className="text-center py-10 px-6 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Trophy size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-indigo-900 mb-2">{lesson.title}</h3>
              <p className="text-indigo-700/70 text-sm mb-8 leading-relaxed max-w-sm mx-auto">
                  Challenge your understanding with {questions.length} comprehensive questions. You need {passingScore}% to pass.
              </p>
              <button onClick={() => setAssessmentStep('question')} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto active:scale-95">
                  Start Exam <ArrowRight size={18} />
              </button>
           </div>
        </div>
      );
    }

    if (assessmentStep === 'question') {
      const q = questions[currentQuestionIdx];
      const isLast = currentQuestionIdx === questions.length - 1;
      const setAns = (val: any) => setAssessmentAnswers({...assessmentAnswers, [q.id]: val});
      const ans = assessmentAnswers[q.id];
      const isMarked = markedQuestions.has(q.id);
      const isRevealed = revealedAnswers.has(q.id);
      
      const localizedQ = getLocalizedText(q.question_en, q.question_ar, q.question);
      const isAr = forcedLanguage === 'ar';

      return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <LanguageSwitcher />
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Question {currentQuestionIdx + 1} / {questions.length}</span>
                 <button 
                    onClick={() => toggleMarkQuestion(q.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg transition-all ${isMarked ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                 >
                    <Flag size={14} fill={isMarked ? 'currentColor' : 'none'} />
                    {isMarked ? 'Marked' : 'Mark for Review'}
                 </button>
             </div>
             <div className="w-full sm:w-1/3 flex items-center gap-3">
                <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }} />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}%</span>
             </div>
          </div>
          
          <div className="bg-white border border-slate-100 p-6 rounded-2xl mb-6 shadow-sm relative">
            <div dir={isAr ? 'rtl' : 'ltr'}>
                <div className={`text-xl font-bold text-slate-900 leading-tight mb-8 pr-12 ${isAr ? 'font-arabic' : ''}`}>
                    {typeof localizedQ === 'string' ? localizedQ.replace('{{blank}}', '___') : localizedQ}
                </div>
            </div>
            
            <div className="absolute top-6 right-6">
                <button 
                    onClick={() => toggleRevealAnswer(q.id)}
                    className={`p-2 rounded-lg transition-all ${isRevealed ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                    title={isRevealed ? "Hide Answer" : "Show Answer"}
                >
                    {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {q.type === 'mcq_single' && renderMCQSingle(q, ans, setAns, false, isRevealed)}
            {q.type === 'mcq_multi' && renderMCQMulti(q, ans, setAns, false, isRevealed)}
            {q.type === 'true_false' && renderTrueFalse(q, ans, setAns, false, isRevealed)}
            {q.type === 'short_answer' && renderShortAnswer(q, ans, setAns, false, isRevealed)}
            {q.type === 'fill_blanks' && renderFillBlanks(q, ans, setAns, false, isRevealed)}
            {q.type === 'sorting' && renderSorting(q, ans, setAns, false, isRevealed)}
            {q.type === 'matching' && renderMatching(q, ans, setAns, false, isRevealed)}
            {q.type === 'coloring' && renderColoring(q, ans, setAns, false, isRevealed)}
            {q.type === 'crossword' && renderCrossword(q, ans, setAns, false, isRevealed)}

            {isRevealed && (
                <div className="mt-8 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl animate-in slide-in-from-top-2 duration-300">
                    <p className={`text-xs font-bold text-indigo-700 uppercase tracking-widest mb-1 flex items-center gap-1.5 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
                        <Info size={14} /> AI Feedback & Explanation
                    </p>
                    <div className={`text-sm text-indigo-900 leading-relaxed font-medium ${isAr ? 'text-right' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
                        {getLocalizedText(q.feedback_en, q.feedback_ar, q.feedback)}
                    </div>
                </div>
            )}
          </div>

          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-2 mb-3">
                 <LayoutGrid size={14} className="text-slate-400" />
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question Map</span>
             </div>
             <div className="flex flex-wrap gap-2">
                 {questions.map((q_item, idx) => {
                     const isCurr = currentQuestionIdx === idx;
                     const qAns = assessmentAnswers[q_item.id];
                     const isAnswered = qAns !== undefined && qAns !== null && (Array.isArray(qAns) ? qAns.length > 0 : true);
                     const flagged = markedQuestions.has(q_item.id);

                     return (
                         <button 
                            key={q_item.id}
                            onClick={() => setCurrentQuestionIdx(idx)}
                            className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all relative
                                ${isCurr ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white shadow-lg' : 
                                  isAnswered ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'}
                            `}
                         >
                            {idx + 1}
                            {flagged && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 border-2 border-slate-50 rounded-full" />
                            )}
                         </button>
                     );
                 })}
             </div>
          </div>

          <div className="flex justify-between mt-6 pt-6 border-t border-slate-100">
             <button 
                disabled={currentQuestionIdx === 0} 
                onClick={() => setCurrentQuestionIdx(v => v - 1)} 
                className="text-slate-500 font-bold text-sm flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-all disabled:opacity-20"
             >
                 <ArrowLeft size={18} /> Previous
             </button>
             {isLast ? (
               <button 
                 onClick={() => {
                   let correctCount = 0;
                   const details: AssessmentResultDetail[] = [];
                   
                   questions.forEach(q => {
                      const userAns = assessmentAnswers[q.id];
                      const correct = q.correctAnswer;
                      let isQCorrect = false;

                      if (q.type === 'short_answer') {
                          isQCorrect = String(userAns)?.toLowerCase().trim() === String(correct).toLowerCase().trim();
                      } else if (q.type === 'mcq_multi' || q.type === 'coloring') {
                          const uArr = Array.isArray(userAns) ? userAns.map(String).sort() : [];
                          const cArr = Array.isArray(correct) ? correct.map(String).sort() : [];
                          isQCorrect = JSON.stringify(uArr) === JSON.stringify(cArr);
                      } else if (q.type === 'fill_blanks') {
                          const uArrF = Array.isArray(userAns) ? userAns.map(v => String(v).toLowerCase().trim()) : [String(userAns).toLowerCase().trim()];
                          const cArrF = Array.isArray(correct) ? correct.map(v => String(v).toLowerCase().trim()) : [String(correct).toLowerCase().trim()];
                          isQCorrect = JSON.stringify(uArrF) === JSON.stringify(cArrF);
                      } else if (q.type === 'true_false') {
                          isQCorrect = userAns === correct;
                      } else if (q.type === 'mcq_single') {
                          isQCorrect = String(userAns) === String(correct);
                      } else if (q.type === 'sorting') {
                           const uArr = Array.isArray(userAns) ? userAns.map(String) : [];
                           const cArr = Array.isArray(correct) ? correct.map(String) : [];
                           isQCorrect = JSON.stringify(uArr) === JSON.stringify(cArr);
                      }
                      
                      if (isQCorrect) correctCount++;
                      details.push({
                          qId: q.id,
                          question_en: q.question_en || q.question || '',
                          question_ar: q.question_ar || q.question || '',
                          type: q.type,
                          userAns,
                          correctAns: correct,
                          isCorrect: isQCorrect,
                          feedback_en: q.feedback_en,
                          feedback_ar: q.feedback_ar,
                          options_en: q.options_en,
                          options_ar: q.options_ar
                      });
                   });
                   
                   const score = Math.round((correctCount / questions.length) * 100);
                   setAssessmentResult({ score, passed: score >= passingScore, details });
                   setAssessmentStep('result');
                   if (score >= passingScore) { setIsCompleted(true); onComplete(lesson.id); }
               }} className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
                   Finish & Submit
               </button>
             ) : (
               <button 
                 onClick={() => setCurrentQuestionIdx(v => v + 1)} 
                 className="bg-slate-900 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
               >
                   Next <ArrowRight size={18} />
               </button>
             )}
          </div>
        </div>
      );
    }

    if (assessmentStep === 'result' && assessmentResult) {
       return (
         <div className="animate-in fade-in duration-500 pb-12">
            <LanguageSwitcher />
            
            {/* Header Dashboard */}
            <div className="text-center py-10 px-6 bg-slate-900 text-white rounded-3xl mb-8 relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                   <Trophy size={120} />
               </div>
               
               <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 shadow-xl ${assessmentResult.passed ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'}`}>
                      <span className="text-3xl font-black">{assessmentResult.score}%</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-1">{assessmentResult.passed ? 'Assessment Passed!' : 'Assessment Failed'}</h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">
                      {assessmentResult.passed 
                        ? 'Excellent work! You have mastered this content.' 
                        : `You needed ${passingScore}% to pass. Don't give up!`}
                  </p>

                  <div className="flex gap-4 mt-8">
                     <button 
                        onClick={() => { setAssessmentStep('intro'); setCurrentQuestionIdx(0); setAssessmentAnswers({}); setMarkedQuestions(new Set()); setRevealedAnswers(new Set()); }}
                        className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-all active:scale-95 shadow-lg"
                     >
                        <RotateCcw size={18} /> Retake Assessment
                     </button>
                     <button 
                        onClick={() => setAssessmentStep('intro')}
                        className="bg-slate-800 text-slate-300 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-700 transition-all active:scale-95"
                     >
                        Return to Start
                     </button>
                  </div>
               </div>
            </div>

            {/* Detailed Question Breakdown */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h4 className="font-bold text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
                        <FileText size={16} className="text-primary-600" /> Detailed Performance Report
                    </h4>
                    <span className="text-xs font-bold text-slate-400">
                        {assessmentResult.details.filter(d => d.isCorrect).length} / {assessmentResult.details.length} Correct
                    </span>
                </div>

                {assessmentResult.details.map((detail, idx) => {
                    const isAr = forcedLanguage === 'ar';
                    const localizedQ = forcedLanguage === 'ar' ? detail.question_ar : forcedLanguage === 'en' ? detail.question_en : (
                      <div className="flex flex-col gap-2">
                        <p>{detail.question_en}</p>
                        <p className="text-indigo-600 text-right font-arabic" dir="rtl">{detail.question_ar}</p>
                      </div>
                    );

                    return (
                        <div key={detail.qId} className={`p-6 rounded-2xl border-l-8 shadow-sm transition-all hover:shadow-md ${detail.isCorrect ? 'border-emerald-500 bg-white' : 'border-rose-500 bg-rose-50/20'}`}>
                            <div className={`flex justify-between items-start gap-4 mb-4 ${isAr ? 'flex-row-reverse' : ''}`}>
                                <div className="flex-1">
                                    <div className={`flex items-center gap-2 mb-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${detail.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {detail.isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question {idx + 1}</span>
                                    </div>
                                    <div dir={isAr ? 'rtl' : 'ltr'}>
                                        <h4 className={`text-lg font-bold text-slate-900 leading-tight ${isAr ? 'text-right font-arabic' : ''}`}>
                                            {typeof localizedQ === 'string' ? localizedQ.replace(/{{blank}}/g, '___') : localizedQ}
                                        </h4>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 mb-4 shadow-inner">
                                {detail.type === 'mcq_single' || detail.type === 'mcq_multi' ? (
                                    <div className="space-y-2">
                                        {getLocalizedOptions(detail.options_en, detail.options_ar).map((opt, oIdx) => {
                                            const isUser = detail.type === 'mcq_single' ? String(detail.userAns) === String(oIdx) : Array.isArray(detail.userAns) && detail.userAns.map(String).includes(String(oIdx));
                                            const isCorrect = detail.type === 'mcq_single' ? String(detail.correctAns) === String(oIdx) : Array.isArray(detail.correctAns) && detail.correctAns.map(String).includes(String(oIdx));
                                            
                                            let badge = null;
                                            if (isUser && isCorrect) badge = <Check size={12} className="text-emerald-600" />;
                                            if (isUser && !isCorrect) badge = <X size={12} className="text-rose-600" />;
                                            if (!isUser && isCorrect) badge = <Check size={12} className="text-emerald-600" />;

                                            return (
                                                <div key={oIdx} dir={isAr ? 'rtl' : 'ltr'} className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm font-medium transition-all ${isUser && isCorrect ? 'bg-emerald-50 border-emerald-200' : isUser && !isCorrect ? 'bg-rose-50 border-rose-200' : isCorrect ? 'border-emerald-200 border-dashed bg-white' : 'border-slate-100 bg-white/40 opacity-60'}`}>
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${isUser && isCorrect ? 'bg-emerald-100' : isUser && !isCorrect ? 'bg-rose-100' : isCorrect ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                                                        {badge}
                                                    </div>
                                                    <span className={`${isUser ? 'font-bold text-slate-900' : 'text-slate-600'} ${isAr ? 'font-arabic' : ''}`}>{opt}</span>
                                                    {isUser && <span className={`${isAr ? 'mr-auto' : 'ml-auto'} text-[8px] font-bold uppercase text-slate-400`}>Your Answer</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : detail.type === 'sorting' ? (
                                    renderSorting(detail, detail.userAns, () => {}, true, true)
                                ) : detail.type === 'matching' ? (
                                    renderMatching(detail, detail.userAns, () => {}, true, true)
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-3 bg-white rounded-lg border border-slate-100 text-center">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Your Entry</p>
                                            <p className={`text-sm font-bold ${detail.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                {Array.isArray(detail.userAns) ? detail.userAns.join(', ') : String(detail.userAns || 'Not Answered')}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Correct Answer</p>
                                            <p className="text-sm font-bold text-emerald-700">
                                                {Array.isArray(detail.correctAns) ? detail.correctAns.join(', ') : String(detail.correctAns)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                                <p className={`text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 ${isAr ? 'flex-row-reverse text-right' : ''}`}>
                                    <Languages size={12} /> Detailed Explanation
                                </p>
                                <div className={`text-sm text-indigo-900 leading-relaxed font-medium italic ${isAr ? 'text-right font-arabic' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
                                    {getLocalizedText(detail.feedback_en, detail.feedback_ar)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
         </div>
       );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 hover:border-slate-300 transition-colors relative group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {box && <img src={box.coverImage} alt={box.title} className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFullscreenImage(box.coverImage)} />}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
                <h4 className="font-bold text-slate-900 truncate">{lesson.title}</h4>
                <button 
                    onClick={handleReadAloud}
                    disabled={audioLoading}
                    className={`shrink-0 p-1 rounded-full transition-all ${isReading ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                    title={isReading ? "Stop reading" : "Read post aloud"}
                >
                    {audioLoading ? <Loader2 size={14} className="animate-spin" /> : isReading ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
            </div>
            {box && <p className="text-xs text-slate-500">in <span className="font-medium text-primary-600">{box.title}</span> • {lesson.timestamp}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
            {lesson.type === 'assessment' && <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><Trophy size={10} /> Assessment</span>}
            {onDelete && <button onClick={handleDelete} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>}
            {isCompleted && <CheckCircle className="text-green-500" size={20} />}
        </div>
      </div>

      <div className="mb-4">
        {lesson.type !== 'assessment' && (
            <div className="text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-line mb-4">
                <RichText content={lesson.content} onHashtagClick={onHashtagClick} />
            </div>
        )}
        {lesson.type === 'video' && (lesson.videoUrl?.includes('youtube') ? <div className="mt-3 aspect-video bg-black rounded-lg overflow-hidden"><iframe src={`https://www.youtube.com/embed/${lesson.videoUrl.split('v=')[1]?.split('&')[0] || lesson.videoUrl.split('/').pop()}`} className="w-full h-full" title="vid" allowFullScreen/></div> : <video src={lesson.videoUrl} controls className="mt-3 w-full rounded-lg bg-black" />)}
        
        {lesson.type === 'image' && lesson.imageUrl && (
            <div className="mt-3 space-y-3">
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in" onClick={() => setFullscreenImage(lesson.imageUrl!)}>
                    <img src={lesson.imageUrl} alt={lesson.title} className="w-full h-auto object-cover max-h-96 hover:scale-[1.02] transition-transform duration-500" />
                </div>
                {lesson.imageExplanation && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-top-1 duration-500">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Info size={14} className="text-indigo-600" />
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Image Insights</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed italic">
                            {lesson.imageExplanation}
                        </p>
                    </div>
                )}
            </div>
        )}

        {lesson.type === 'audio' && lesson.audioUrl && (
          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
             <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"><Volume2 size={40} /></div>
             <div className="flex-1 text-center md:text-left">
                <h5 className="font-bold text-emerald-900 text-lg mb-1">AI Podcast Segment</h5>
                <audio src={lesson.audioUrl} controls className="w-full h-10 rounded-full" />
             </div>
          </div>
        )}
        {lesson.type === 'html5' && (lesson.html5Url || lesson.html5Content) && <div className="mt-3 aspect-[4/3] w-full bg-white rounded-lg overflow-hidden border border-slate-200 relative group"><iframe src={lesson.html5Url} srcDoc={lesson.html5Content} title={lesson.title} className="w-full h-full" sandbox="allow-scripts allow-same-origin allow-forms" /></div>}
        
        {lesson.type === 'ppt' && (
          <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm group-ppt transition-all hover:shadow-lg">
             {lesson.html5Content ? (
                <div className="aspect-video w-full bg-[#202124] relative">
                   <iframe 
                      srcDoc={lesson.html5Content} 
                      title="PPT Viewer" 
                      className="w-full h-full border-none"
                      sandbox="allow-scripts allow-same-origin"
                   />
                </div>
             ) : (
                <>
                  <div className="bg-[#D24726] p-3 flex items-center justify-between text-white">
                      <div className="flex items-center gap-3">
                        <Presentation size={20} />
                        <h5 className="font-bold text-sm truncate max-w-xs">{lesson.title}</h5>
                      </div>
                      {lesson.pptUrl && (
                        <a href={lesson.pptUrl} download={lesson.title} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Download Original">
                          <Download size={16} />
                        </a>
                      )}
                  </div>
                </>
             )}
          </div>
        )}

        {lesson.type === 'assessment' && renderAssessmentContent()}
        {lesson.type === 'quiz' && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
             <div className="flex justify-between items-start gap-4 mb-4">
                {lesson.quizData?.question && <p className="font-medium text-slate-800">{lesson.quizData.question}</p>}
                <button onClick={() => setShowQuizAnswer(!showQuizAnswer)} className={`flex-shrink-0 px-2 py-1 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold ${showQuizAnswer ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}><Eye size={12} />{showQuizAnswer ? 'Hide' : 'Show Correct'}</button>
             </div>
             {lesson.quizType === 'mcq_single' && renderMCQSingle(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             {lesson.quizType === 'mcq_multi' && renderMCQMulti(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             {lesson.quizType === 'true_false' && renderTrueFalse(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             {lesson.quizType === 'short_answer' && renderShortAnswer(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             {lesson.quizType === 'fill_blanks' && renderFillBlanks(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             {lesson.quizType === 'sorting' && renderSorting(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             {lesson.quizType === 'matching' && renderMatching(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             {lesson.quizType === 'coloring' && renderColoring(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             {lesson.quizType === 'crossword' && renderCrossword(lesson.quizData!, userAnswer, setUserAnswer, quizFeedback === 'correct', showQuizAnswer)}
             <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                <button onClick={checkAnswer} disabled={quizFeedback === 'correct'} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">{quizFeedback === 'correct' ? 'Completed' : 'Submit Answer'}</button>
             </div>
          </div>
        )}
        {lesson.type !== 'quiz' && lesson.type !== 'assessment' && (
            <div className="mt-4 flex justify-end">
                <button onClick={handleMarkComplete} disabled={isCompleted} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isCompleted ? 'bg-green-100 text-green-700 cursor-default' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{isCompleted ? <><CheckCircle size={16} /> Completed</> : 'Mark as Complete'}</button>
            </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${liked ? 'text-pink-500' : 'text-slate-500 hover:text-pink-500'}`}><Heart size={18} fill={liked ? "currentColor" : "none"} /><span>{lesson.likes + (liked ? 1 : 0)}</span></button>
          <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${showComments ? 'text-blue-600' : 'text-slate-500 hover:text-blue-500'}`}><MessageCircle size={18} /><span>{lesson.comments.length}</span></button>
          <button onClick={() => friendsWhoCompleted.length > 0 && onShowCompleters?.(friendsWhoCompleted)} className="hover:text-green-600 transition-colors flex items-center gap-1.5 text-sm font-medium text-slate-500"><CheckCircle size={18} /><span>{lesson.completionCount || 0}</span></button>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={handleSave} className={`text-slate-400 hover:text-primary-600 ${isSaved ? 'text-primary-600' : ''}`}><Bookmark size={18} fill={isSaved ? "currentColor" : "none"} /></button>
            <button onClick={handleShare} className="text-slate-400 hover:text-slate-600"><Share2 size={18} /></button>
        </div>
      </div>

      {showComments && (
        <div className="bg-slate-50 border-t border-slate-100 p-4 rounded-b-xl -mx-5 -mb-5 mt-4">
          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
            {lesson.comments.map(comment => (
                <div key={comment.id} className="flex gap-2.5">
                <img src={comment.userAvatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex-1">
                    <div className="flex justify-between items-baseline mb-1"><span className="text-xs font-bold">{comment.userName}</span><span className="text-[10px] text-slate-400">{comment.timestamp}</span></div>
                    <p className="text-sm text-slate-600">{comment.content}</p>
                </div>
                </div>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if(commentText.trim()) { onAddComment(lesson.id, commentText); setCommentText(''); } }} className="relative">
            <input type="text" placeholder="Write a comment..." className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-500 bg-white" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-indigo-600"><Send size={16} /></button>
          </form>
        </div>
      )}

      {/* Image Lightbox */}
      {fullscreenImage && (
          <div 
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setFullscreenImage(null)}
          >
              <button 
                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full"
                onClick={(e) => { e.stopPropagation(); setFullscreenImage(null); }}
              >
                  <X size={32} />
              </button>
              <img 
                src={fullscreenImage} 
                alt="Fullscreen" 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-sm animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              />
          </div>
      )}
    </div>
  );
};

export default LessonCard;
