
import React, { useState, useEffect, useRef } from 'react';
import { Lesson, Box, QuizType, User, AssessmentQuestion, QuizContent, CrosswordWord } from '../types';
/* Added Volume2 to the imports from lucide-react */
import { Heart, MessageCircle, Share2, CheckCircle, PlayCircle, ExternalLink, Move, Palette, RefreshCcw, ImageIcon, Headphones, FileCode, Package, MousePointerClick, Send, XCircle, Check, X, Bookmark, Trash2, FileText, Sparkles, Presentation, Loader2, Trophy, ArrowRight, ArrowLeft, HelpCircle, Eye, Award, GripVertical, Plus, ChevronDown, Info, Grid, Volume2 } from 'lucide-react';
import RichText from './RichText';
import { convertPptToHtml } from '../services/geminiService';

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
  const [isConverting, setIsConverting] = useState(false);
  
  // Track completion locally for immediate UI feedback
  const [isCompleted, setIsCompleted] = useState(lesson.isCompleted || false);

  // Comment State
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // Generic state for different quiz types
  const [userAnswer, setUserAnswer] = useState<any>(null);

  // Assessment Player State
  const [assessmentStep, setAssessmentStep] = useState<'intro' | 'question' | 'result'>('intro');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, any>>({});
  const [assessmentResult, setAssessmentResult] = useState<{ score: number, passed: boolean } | null>(null);
  const [showQuizAnswer, setShowQuizAnswer] = useState(false);

  useEffect(() => {
    // Reset state when lesson changes
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
    
    // Initialize default states for specific types
    if (lesson.type === 'quiz' && lesson.quizData) {
      if (lesson.isCompleted) {
         setQuizFeedback('correct');
      }
    }
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

  const checkAnswer = () => {
    if (!lesson.quizData) return;
    let isCorrect = false;
    const correct = lesson.quizData.correctAnswer;

    switch (lesson.quizType) {
      case 'mcq_single':
      case 'true_false':
        isCorrect = userAnswer === correct;
        break;
      case 'short_answer':
        isCorrect = userAnswer?.toLowerCase().trim() === correct?.toLowerCase().trim();
        break;
      case 'mcq_multi':
        isCorrect = Array.isArray(userAnswer) && Array.isArray(correct) && 
                    userAnswer.length === correct.length && 
                    userAnswer.every(val => correct.includes(val));
        break;
      case 'crossword':
        const words = lesson.quizData.crosswordWords || [];
        isCorrect = words.every(w => {
            const userWord = words.map((_, i) => {
                const char = (userAnswer as Record<string, string>)?.[`${w.x},${w.y},${w.direction},${i}`];
                return char || '';
            }).join('');
            // Crossword checking is slightly different; checking per character in the grid is better
            return true; // Simplified for now, the UI handles visual feedback
        });
        // Actually, let's just use the grid comparison
        break;
      default:
        isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correct);
        break;
    }

    // Special handling for crossword in checkAnswer
    if (lesson.quizType === 'crossword') {
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
    }

    if (isCorrect) {
      setQuizFeedback('correct');
      setIsCompleted(true);
      onComplete(lesson.id);
    } else {
      setQuizFeedback('incorrect');
    }
  };

  const renderMCQSingle = (data: QuizContent | AssessmentQuestion, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => {
    const correctIdx = data.correctAnswer;
    return (
      <div className="space-y-2">
        {data.options?.map((option, idx) => {
          const isSelected = currentAns === idx;
          const isCorrect = idx === correctIdx;
          let containerClass = isSelected ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900" : "bg-white border-slate-200 hover:bg-slate-50";
          if (highlightCorrect && isCorrect) containerClass = "bg-green-50 border-green-500 ring-2 ring-green-500 text-green-900";
          return (
            <button
              key={idx}
              disabled={locked}
              onClick={() => setAns(idx)}
              className={`w-full text-left p-3.5 rounded-lg text-sm border transition-all flex items-center gap-3 ${containerClass}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 transition-all ${isSelected ? 'border-indigo-600 bg-indigo-600' : highlightCorrect && isCorrect ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                {(isSelected || (highlightCorrect && isCorrect)) && <div className="w-full h-full flex items-center justify-center text-white"><Check size={12} strokeWidth={4} /></div>}
              </div>
              <span className="font-medium">{option}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMCQMulti = (data: QuizContent | AssessmentQuestion, currentAns: any[], setAns: (val: any[]) => void, locked = false, highlightCorrect = false) => {
    const current = Array.isArray(currentAns) ? currentAns : [];
    const correctArr = Array.isArray(data.correctAnswer) ? data.correctAnswer : [];
    return (
      <div className="space-y-2">
        {data.options?.map((option, idx) => {
          const isSelected = current.includes(idx);
          const isCorrect = correctArr.includes(idx);
          let containerClass = isSelected ? "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-900" : "bg-white border-slate-200 hover:bg-slate-50";
          if (highlightCorrect && isCorrect) containerClass = "bg-green-50 border-green-500 ring-2 ring-green-500 text-green-900";
          return (
            <button
              key={idx}
              disabled={locked}
              onClick={() => {
                  const next = isSelected ? current.filter(i => i !== idx) : [...current, idx];
                  setAns(next);
              }}
              className={`w-full text-left p-3.5 rounded-lg text-sm border transition-all flex items-center gap-3 ${containerClass}`}
            >
              <div className={`w-5 h-5 rounded border-2 transition-all ${isSelected ? 'border-indigo-600 bg-indigo-600' : highlightCorrect && isCorrect ? 'border-green-600 bg-green-600' : 'border-slate-300'}`}>
                {(isSelected || (highlightCorrect && isCorrect)) && <div className="w-full h-full flex items-center justify-center text-white"><Check size={12} strokeWidth={4} /></div>}
              </div>
              <span className="font-medium">{option}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTrueFalse = (data: QuizContent | AssessmentQuestion, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => (
    <div className="flex gap-4">
      {[true, false].map((val) => {
        const isSelected = currentAns === val;
        const isCorrect = val === data.correctAnswer;
        let buttonClass = isSelected ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500" : "bg-white border-slate-200 text-slate-700";
        if (highlightCorrect && isCorrect) buttonClass = "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500";
        return (
            <button
              key={val ? 'T' : 'F'}
              disabled={locked}
              onClick={() => setAns(val)}
              className={`flex-1 p-4 rounded-xl border-2 text-center font-bold transition-all ${buttonClass}`}
            >
              {val ? 'True' : 'False'}
            </button>
        );
      })}
    </div>
  );

  const renderShortAnswer = (data: QuizContent | AssessmentQuestion, currentAns: any, setAns: (val: any) => void, locked = false, highlightCorrect = false) => (
    <div className="space-y-3">
        <input
            type="text"
            disabled={locked}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-colors"
            placeholder="Type your answer here..."
            value={currentAns || ''}
            onChange={(e) => setAns(e.target.value)}
        />
        {highlightCorrect && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-xs font-bold text-green-800 uppercase mb-1">Correct Answer:</p>
                <p className="text-sm font-medium text-green-900">{data.correctAnswer}</p>
            </div>
        )}
    </div>
  );

  const renderFillBlanks = (data: QuizContent | AssessmentQuestion, currentAns: string[], setAns: (val: string[]) => void, locked = false, highlightCorrect = false) => {
      const parts = data.question.split('{{blank}}');
      const answers = Array.isArray(currentAns) ? currentAns : new Array(parts.length - 1).fill('');
      const correctAnswers = Array.isArray(data.correctAnswer) ? data.correctAnswer : [];
      
      return (
          <div className="text-slate-800 leading-loose">
              {parts.map((part, i) => (
                  <React.Fragment key={i}>
                      {part}
                      {i < parts.length - 1 && (
                          <span className="inline-block mx-1">
                              <input 
                                disabled={locked}
                                className={`min-w-[80px] border-b-2 px-1 focus:border-indigo-600 outline-none transition-colors text-center font-bold bg-white ${highlightCorrect ? (answers[i]?.toLowerCase() === correctAnswers[i]?.toLowerCase() ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300') : 'text-indigo-600 border-slate-300'}`}
                                value={answers[i]}
                                onChange={(e) => {
                                    const next = [...answers];
                                    next[i] = e.target.value;
                                    setAns(next);
                                }}
                              />
                              {highlightCorrect && answers[i]?.toLowerCase() !== correctAnswers[i]?.toLowerCase() && (
                                  <span className="block text-[10px] text-green-600 font-bold">({correctAnswers[i]})</span>
                              )}
                          </span>
                      )}
                  </React.Fragment>
              ))}
          </div>
      );
  };

  const renderSorting = (data: QuizContent | AssessmentQuestion, currentAns: number[], setAns: (val: number[]) => void, locked = false, highlightCorrect = false) => {
      const options = data.options || [];
      const order = Array.isArray(currentAns) ? currentAns : options.map((_, i) => i);
      const correctOrder = Array.isArray(data.correctAnswer) ? data.correctAnswer : [];

      const move = (from: number, to: number) => {
          const next = [...order];
          const [removed] = next.splice(from, 1);
          next.splice(to, 0, removed);
          setAns(next);
      };

      return (
          <div className="space-y-2">
              {order.map((optIdx, i) => {
                  const isCorrectPos = highlightCorrect && correctOrder[i] === optIdx;
                  return (
                      <div key={optIdx} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isCorrectPos ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                          <div className="text-xs font-bold text-slate-400 w-4">{i + 1}</div>
                          <div className="flex-1 text-sm font-medium text-slate-800">{options[optIdx]}</div>
                          {!locked && (
                              <div className="flex flex-col gap-1">
                                  <button disabled={i === 0} onClick={() => move(i, i - 1)} className="p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-20"><ChevronDown className="rotate-180" size={14} /></button>
                                  <button disabled={i === options.length - 1} onClick={() => move(i, i + 1)} className="p-1 hover:bg-slate-100 rounded transition-colors disabled:opacity-20"><ChevronDown size={14} /></button>
                              </div>
                          )}
                          {highlightCorrect && !isCorrectPos && (
                              <div className="text-[10px] font-bold text-red-500 uppercase">Wrong Pos</div>
                          )}
                      </div>
                  );
              })}
              {highlightCorrect && (
                  <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <p className="text-[10px] text-indigo-700 font-bold uppercase mb-1">Correct Order:</p>
                      <p className="text-xs font-medium text-indigo-900">{correctOrder.map(idx => options[idx]).join(' → ')}</p>
                  </div>
              )}
          </div>
      );
  };

  const renderMatching = (data: QuizContent | AssessmentQuestion, currentAns: string[], setAns: (val: string[]) => void, locked = false, highlightCorrect = false) => {
      const leftItems = data.options || [];
      const answers = Array.isArray(currentAns) ? currentAns : new Array(leftItems.length).fill('');
      const correctAnswers = Array.isArray(data.correctAnswer) ? data.correctAnswer : [];

      return (
          <div className="space-y-4">
              {leftItems.map((left, i) => (
                  <div key={i} className="flex items-center gap-4">
                      <div className="flex-1 p-3 bg-slate-100 rounded-lg text-sm font-bold text-slate-700 text-center">{left}</div>
                      <ArrowRight size={20} className="text-slate-300" />
                      <div className="flex-1">
                          <input 
                              disabled={locked}
                              className={`w-full p-3 border-2 rounded-lg text-sm transition-all text-center font-bold bg-white ${highlightCorrect ? (answers[i]?.toLowerCase() === correctAnswers[i]?.toLowerCase() ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700') : 'border-slate-200 focus:border-indigo-500 outline-none'}`}
                              placeholder="Match..."
                              value={answers[i]}
                              onChange={(e) => {
                                  const next = [...answers];
                                  next[i] = e.target.value;
                                  setAns(next);
                              }}
                          />
                          {highlightCorrect && answers[i]?.toLowerCase() !== correctAnswers[i]?.toLowerCase() && (
                              <div className="text-[10px] font-bold text-green-600 mt-1">Correct: {correctAnswers[i]}</div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  const renderColoring = (data: QuizContent | AssessmentQuestion, currentAns: number[], setAns: (val: number[]) => void, locked = false, highlightCorrect = false) => {
      const options = data.options || [];
      const selected = Array.isArray(currentAns) ? currentAns : [];
      const correct = Array.isArray(data.correctAnswer) ? data.correctAnswer : [];

      return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {options.map((opt, i) => {
                  const isSelected = selected.includes(i);
                  const isCorrect = correct.includes(i);
                  
                  let bgColor = isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700';
                  if (highlightCorrect) {
                      if (isSelected && isCorrect) bgColor = 'bg-green-600 text-white ring-2 ring-green-200';
                      else if (isSelected && !isCorrect) bgColor = 'bg-red-500 text-white';
                      else if (!isSelected && isCorrect) bgColor = 'bg-green-100 text-green-700 border-dashed border-green-500';
                  }

                  return (
                      <button 
                        key={i}
                        disabled={locked}
                        onClick={() => {
                            const next = isSelected ? selected.filter(idx => idx !== i) : [...selected, i];
                            setAns(next);
                        }}
                        className={`p-6 rounded-2xl border-2 transition-all font-bold text-lg shadow-sm flex items-center justify-center ${bgColor}`}
                      >
                          {opt}
                      </button>
                  );
              })}
          </div>
      );
  };

  const renderCrossword = (data: QuizContent | AssessmentQuestion, currentAns: Record<string, string>, setAns: (val: Record<string, string>) => void, locked = false, highlightCorrect = false) => {
      const words = data.crosswordWords || [];
      if (words.length === 0) return <p className="text-slate-400 italic">No crossword data.</p>;

      // Determine Grid Size
      let maxX = 0, maxY = 0;
      words.forEach(w => {
          const endX = w.direction === 'across' ? w.x + w.answer.length : w.x + 1;
          const endY = w.direction === 'down' ? w.y + w.answer.length : w.y + 1;
          if (endX > maxX) maxX = endX;
          if (endY > maxY) maxY = endY;
      });

      const gridWidth = Math.max(8, maxX + 1);
      const gridHeight = Math.max(8, maxY + 1);

      // Map coordinates to words for numbering
      const coordToWordInfo: Record<string, { num: number, type: 'across' | 'down' | 'both' }> = {};
      words.forEach((w, i) => {
          const key = `${w.x},${w.y}`;
          if (!coordToWordInfo[key]) coordToWordInfo[key] = { num: i + 1, type: w.direction };
          else coordToWordInfo[key].type = 'both';
      });

      const isCellActive = (x: number, y: number) => {
          return words.some(w => {
              if (w.direction === 'across') return y === w.y && x >= w.x && x < w.x + w.answer.length;
              return x === w.x && y >= w.y && y < w.y + w.answer.length;
          });
      };

      const getCorrectChar = (x: number, y: number) => {
          for (const w of words) {
              if (w.direction === 'across' && y === w.y && x >= w.x && x < w.x + w.answer.length) return w.answer[x - w.x];
              if (w.direction === 'down' && x === w.x && y >= w.y && y < w.y + w.answer.length) return w.answer[y - w.y];
          }
          return '';
      };

      return (
          <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                  {/* Grid Renderer */}
                  <div className="bg-slate-200 p-2 rounded-xl shadow-inner inline-block mx-auto md:mx-0">
                      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`, width: 'fit-content' }}>
                          {Array.from({ length: gridHeight }).map((_, y) => (
                              Array.from({ length: gridWidth }).map((_, x) => {
                                  const active = isCellActive(x, y);
                                  const wordInfo = coordToWordInfo[`${x},${y}`];
                                  const curVal = currentAns?.[`${x},${y}`] || '';
                                  const correctChar = getCorrectChar(x, y);
                                  
                                  let bgClass = active ? "bg-white" : "bg-slate-300";
                                  if (highlightCorrect && active) {
                                      bgClass = curVal.toUpperCase() === correctChar.toUpperCase() ? "bg-green-100" : "bg-red-50";
                                  }

                                  return (
                                      <div key={`${x},${y}`} className={`w-8 h-8 sm:w-10 sm:h-10 relative rounded-sm ${bgClass} transition-colors border border-slate-200 shadow-sm`}>
                                          {active && (
                                              <input 
                                                maxLength={1}
                                                disabled={locked}
                                                className="w-full h-full bg-transparent text-center font-bold text-lg uppercase outline-none focus:ring-2 focus:ring-indigo-400 z-10 relative"
                                                value={curVal}
                                                onChange={e => {
                                                    const next = { ...currentAns, [`${x},${y}`]: e.target.value.substring(0, 1) };
                                                    setAns(next);
                                                    // Auto focus logic could go here
                                                }}
                                              />
                                          )}
                                          {wordInfo && (
                                              <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-slate-400 z-0">{wordInfo.num}</span>
                                          )}
                                      </div>
                                  );
                              })
                          ))}
                      </div>
                  </div>

                  {/* Clues */}
                  <div className="flex-1 space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      <div>
                          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Across</h5>
                          <div className="space-y-2">
                              {words.filter(w => w.direction === 'across').map((w, i) => (
                                  <div key={i} className="flex gap-2 items-start group">
                                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">{coordToWordInfo[`${w.x},${w.y}`]?.num}</span>
                                      <p className="text-sm text-slate-600 leading-tight group-hover:text-slate-900">{w.clue}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div>
                          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-widest mb-2 border-b border-slate-100 pb-1 pt-2">Down</h5>
                          <div className="space-y-2">
                              {words.filter(w => w.direction === 'down').map((w, i) => (
                                  <div key={i} className="flex gap-2 items-start group">
                                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">{coordToWordInfo[`${w.x},${w.y}`]?.num}</span>
                                      <p className="text-sm text-slate-600 leading-tight group-hover:text-slate-900">{w.clue}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderAssessmentContent = () => {
    if (!lesson.assessmentData) return null;
    const { questions, passingScore } = lesson.assessmentData;

    if (assessmentStep === 'intro') {
      return (
        <div className="text-center py-8 px-4 bg-indigo-50 rounded-2xl border border-indigo-100">
           <Trophy size={48} className="mx-auto mb-4 text-indigo-600" />
           <h3 className="text-xl font-bold text-indigo-900 mb-2">Final Assessment</h3>
           <p className="text-indigo-700 text-sm mb-6">Test your mastery. You need {passingScore}% to pass.</p>
           <div className="flex items-center justify-center gap-6 text-xs font-bold text-indigo-500 uppercase tracking-widest mb-8">
              <span className="flex items-center gap-1.5"><HelpCircle size={14} /> {questions.length} Questions</span>
              <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Auto-Graded</span>
           </div>
           <button onClick={() => setAssessmentStep('question')} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 mx-auto">Start Exam <ArrowRight size={18} /></button>
        </div>
      );
    }

    if (assessmentStep === 'question') {
      const q = questions[currentQuestionIdx];
      const isLast = currentQuestionIdx === questions.length - 1;
      const setAns = (val: any) => setAssessmentAnswers({...assessmentAnswers, [q.id]: val});
      const ans = assessmentAnswers[q.id];

      return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex justify-between items-center mb-6">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentQuestionIdx + 1} of {questions.length}</span>
             <div className="flex gap-1 h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all" style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }} />
             </div>
          </div>
          <h4 className="text-lg font-bold text-slate-800 leading-tight mb-6">{q.question}</h4>
          
          {q.type === 'mcq_single' && renderMCQSingle(q, ans, setAns)}
          {q.type === 'mcq_multi' && renderMCQMulti(q, ans, setAns)}
          {q.type === 'true_false' && renderTrueFalse(q, ans, setAns)}
          {q.type === 'short_answer' && renderShortAnswer(q, ans, setAns)}
          {q.type === 'fill_blanks' && renderFillBlanks(q, ans, setAns)}
          {q.type === 'sorting' && renderSorting(q, ans, setAns)}
          {q.type === 'matching' && renderMatching(q, ans, setAns)}
          {q.type === 'coloring' && renderColoring(q, ans, setAns)}
          {q.type === 'crossword' && renderCrossword(q, ans, setAns)}

          <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
             <button disabled={currentQuestionIdx === 0} onClick={() => setCurrentQuestionIdx(v => v - 1)} className="text-slate-400 font-bold text-sm flex items-center gap-1 hover:text-slate-600 disabled:opacity-30"><ArrowLeft size={16} /> Back</button>
             {isLast ? (
               <button onClick={() => {
                   let correctCount = 0;
                   questions.forEach(q => {
                      const userAns = assessmentAnswers[q.id];
                      const correct = q.correctAnswer;
                      let isQCorrect = false;
                      if (q.type === 'short_answer') isQCorrect = userAns?.toLowerCase().trim() === correct.toLowerCase().trim();
                      else if (q.type === 'mcq_multi' || q.type === 'coloring' || q.type === 'sorting') {
                          isQCorrect = JSON.stringify([...(userAns || [])].sort()) === JSON.stringify([...(correct || [])].sort());
                      } else if (q.type === 'fill_blanks' || q.type === 'matching') {
                          isQCorrect = JSON.stringify(userAns) === JSON.stringify(correct);
                      } else if (q.type === 'crossword') {
                          const words = q.crosswordWords || [];
                          let crosswordOk = true;
                          words.forEach(w => {
                              for (let i = 0; i < w.answer.length; i++) {
                                  const curX = w.direction === 'across' ? w.x + i : w.x;
                                  const curY = w.direction === 'across' ? w.y : w.y + i;
                                  const cellVal = (userAns as Record<string, string>)?.[`${curX},${curY}`] || '';
                                  if (cellVal.toUpperCase() !== w.answer[i].toUpperCase()) crosswordOk = false;
                              }
                          });
                          isQCorrect = crosswordOk;
                      } else {
                          isQCorrect = userAns === correct;
                      }
                      if (isQCorrect) correctCount++;
                   });
                   const score = Math.round((correctCount / questions.length) * 100);
                   setAssessmentResult({ score, passed: score >= passingScore });
                   setAssessmentStep('result');
                   if (score >= passingScore) { setIsCompleted(true); onComplete(lesson.id); }
               }} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700">Submit Exam</button>
             ) : (
               <button onClick={() => setCurrentQuestionIdx(v => v + 1)} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800">Next <ArrowRight size={16} /></button>
             )}
          </div>
        </div>
      );
    }

    if (assessmentStep === 'result' && assessmentResult) {
       return (
         <div className="animate-in zoom-in duration-300">
            <div className="text-center py-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${assessmentResult.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{assessmentResult.passed ? <Check size={40} strokeWidth={3} /> : <X size={40} strokeWidth={3} />}</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{assessmentResult.passed ? 'Assessment Passed!' : 'Assessment Failed'}</h3>
                <p className="text-slate-500 mb-6">You scored <span className="font-bold text-slate-900">{assessmentResult.score}%</span> on the final exam.</p>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 inline-block min-w-[200px]">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Correct Answers:</span>
                        <span className="font-bold text-slate-800">{Math.round((assessmentResult.score / 100) * questions.length)} / {questions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Passing Requirement:</span>
                        <span className="font-bold text-slate-800">{passingScore}%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6 mt-8">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Results Breakdown</h4>
                {questions.map((q, idx) => {
                    const userAns = assessmentAnswers[q.id];
                    const correct = q.correctAnswer;
                    let isQCorrect = false;
                    if (q.type === 'short_answer') isQCorrect = userAns?.toLowerCase().trim() === correct.toLowerCase().trim();
                    else if (q.type === 'mcq_multi' || q.type === 'coloring' || q.type === 'sorting') {
                        isQCorrect = JSON.stringify([...(userAns || [])].sort()) === JSON.stringify([...(correct || [])].sort());
                    } else if (q.type === 'fill_blanks' || q.type === 'matching') {
                        isQCorrect = JSON.stringify(userAns) === JSON.stringify(correct);
                    } else if (q.type === 'crossword') {
                        const words = q.crosswordWords || [];
                        let crossOk = true;
                        words.forEach(w => {
                            for (let i = 0; i < w.answer.length; i++) {
                                const curX = w.direction === 'across' ? w.x + i : w.x;
                                const curY = w.direction === 'across' ? w.y : w.y + i;
                                const val = (userAns as Record<string, string>)?.[`${curX},${curY}`] || '';
                                if (val.toUpperCase() !== w.answer[i].toUpperCase()) crossOk = false;
                            }
                        });
                        isQCorrect = crossOk;
                    } else {
                        isQCorrect = userAns === correct;
                    }

                    return (
                        <div key={q.id} className={`p-4 rounded-xl border-2 transition-all ${isQCorrect ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'}`}>
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="flex gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isQCorrect ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                                        {idx + 1}
                                    </span>
                                    <h5 className="font-bold text-slate-800 text-sm">{q.question.replace('{{blank}}', '___')}</h5>
                                </div>
                                {isQCorrect ? <CheckCircle size={18} className="text-green-600 shrink-0" /> : <XCircle size={18} className="text-red-600 shrink-0" />}
                            </div>

                            {q.type === 'crossword' ? (
                                <div className="mt-2">
                                    {renderCrossword(q, userAns, () => {}, true, true)}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    <div className="p-2.5 rounded-lg bg-white border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Your Answer</p>
                                        <div className={`text-sm font-medium ${isQCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                            {q.type === 'mcq_single' ? (q.options ? q.options[userAns] : 'No selection') : 
                                            q.type === 'true_false' ? (userAns === true ? 'True' : userAns === false ? 'False' : 'No selection') :
                                            q.type === 'mcq_multi' ? (Array.isArray(userAns) ? userAns.map(i => q.options?.[i]).join(', ') : 'No selection') :
                                            q.type === 'sorting' ? (Array.isArray(userAns) ? userAns.map(i => q.options?.[i]).join(' → ') : 'No movement') :
                                            q.type === 'fill_blanks' ? (Array.isArray(userAns) ? userAns.join(', ') : 'Empty') :
                                            q.type === 'matching' ? (Array.isArray(userAns) ? userAns.join(', ') : 'No match') :
                                            JSON.stringify(userAns) || 'No Answer'}
                                        </div>
                                    </div>
                                    {!isQCorrect && (
                                        <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 shadow-sm">
                                            <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Correct Answer</p>
                                            <div className="text-sm font-bold text-green-800">
                                                {q.type === 'mcq_single' ? (q.options ? q.options[q.correctAnswer] : 'Error') : 
                                                q.type === 'true_false' ? (q.correctAnswer === true ? 'True' : 'False') :
                                                q.type === 'mcq_multi' ? (Array.isArray(correct) ? correct.map(i => q.options?.[i]).join(', ') : 'Error') :
                                                q.type === 'sorting' ? (Array.isArray(correct) ? correct.map(i => q.options?.[i]).join(' → ') : 'Error') :
                                                q.type === 'fill_blanks' ? (Array.isArray(correct) ? correct.join(', ') : 'Error') :
                                                q.type === 'matching' ? (Array.isArray(correct) ? correct.join(', ') : 'Error') :
                                                JSON.stringify(correct)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {q.feedback && (
                                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-2">
                                    <Info size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-0.5">Explanation</p>
                                        <p className="text-xs text-indigo-800 leading-relaxed italic">{q.feedback}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-3 justify-center mt-10 pt-6 border-t border-slate-100">
                <button onClick={() => { setAssessmentStep('intro'); setCurrentQuestionIdx(0); setAssessmentAnswers({}); }} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2 transition-all shadow-lg active:scale-95"><RefreshCcw size={18} /> Retake Exam</button>
                {assessmentResult.passed && box?.hasCertificate && (
                    <button onClick={() => {}} className="bg-yellow-400 text-yellow-900 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-yellow-300 transition-all flex items-center gap-2"><Award size={20} /> View Certificate</button>
                )}
            </div>
         </div>
       );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 hover:border-slate-300 transition-colors relative group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {box && <img src={box.coverImage} alt={box.title} className="w-10 h-10 rounded-lg object-cover" />}
          <div>
            <h4 className="font-bold text-slate-900">{lesson.title}</h4>
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
        {lesson.type === 'image' && lesson.imageUrl && <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 bg-slate-50"><img src={lesson.imageUrl} alt={lesson.title} className="w-full h-auto object-cover max-h-96" /></div>}
        {lesson.type === 'audio' && lesson.audioUrl && (
          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-sm">
             <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                <Volume2 size={40} />
             </div>
             <div className="flex-1 text-center md:text-left">
                <h5 className="font-bold text-emerald-900 text-lg mb-1">AI Podcast Segment</h5>
                <p className="text-emerald-700 text-xs font-medium mb-4 uppercase tracking-widest">Listen to the micro-learning segment</p>
                <audio src={lesson.audioUrl} controls className="w-full h-10 rounded-full" />
             </div>
          </div>
        )}
        {lesson.type === 'html5' && (lesson.html5Url || lesson.html5Content) && <div className="mt-3 aspect-[4/3] w-full bg-white rounded-lg overflow-hidden border border-slate-200 relative group"><iframe src={lesson.html5Url} srcDoc={lesson.html5Content} title={lesson.title} className="w-full h-full" sandbox="allow-scripts allow-same-origin allow-forms" /></div>}
        {lesson.type === 'assessment' && renderAssessmentContent()}
        {lesson.type === 'quiz' && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
             <div className="flex justify-between items-start gap-4 mb-4">
                {lesson.quizData?.question && <p className="font-medium text-slate-800">{lesson.quizData.question}</p>}
                <button onClick={() => setShowQuizAnswer(!showQuizAnswer)} className={`flex-shrink-0 px-2 py-1 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold ${showQuizAnswer ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}><Eye size={12} />{showQuizAnswer ? 'Hide' : 'Show Correct'}</button>
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
             {quizFeedback && (
               <div className={`mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${quizFeedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                 {quizFeedback === 'correct' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                 {quizFeedback === 'correct' ? 'Correct! Great job.' : 'Not quite right. Try again!'}
               </div>
             )}
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
    </div>
  );
};

export default LessonCard;
