
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Lesson, QuizContent, QuizType, Box, AssessmentContent, AssessmentQuestion, CrosswordWord } from "../types";

export interface GeneratedLessonData {
  title: string;
  content: string;
  type: 'text' | 'quiz' | 'image' | 'video' | 'audio' | 'html5' | 'scorm' | 'interactive_video' | 'pdf' | 'ppt' | 'assessment';
  quizType?: QuizType;
  quizData?: QuizContent;
}

// Audio Decoding Helpers
function decodeBase64ToUint8(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeRawPcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const buffer_arr = new ArrayBuffer(length);
  const view = new DataView(buffer_arr);
  let pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(pos, data, true);
    pos += 2;
  };

  const setUint32 = (data: number) => {
    view.setUint32(pos, data, true);
    pos += 4;
  };

  setUint32(0x46464952);
  setUint32(length - 8);
  setUint32(0x45564157);
  setUint32(0x20746d66);
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164);
  setUint32(buffer.length * numOfChan * 2);

  for (let offset = 0; offset < buffer.length; offset++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = buffer.getChannelData(channel)[offset];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, intSample, true);
      pos += 2;
    }
  }

  return new Blob([buffer_arr], { type: "audio/wav" });
}

export const generateVerbatimSpeech = async (text: string, voiceName: string = 'Zephyr'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read the following text exactly as written, clearly and at a natural pace: "${text}"` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const base64Audio = audioPart?.inlineData?.data;
    
    if (!base64Audio) throw new Error("No audio data returned from Gemini");

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const uint8Data = decodeBase64ToUint8(base64Audio);
    const audioBuffer = await decodeRawPcmToAudioBuffer(uint8Data, audioCtx, 24000, 1);
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    
    return URL.createObjectURL(wavBlob);
  } catch (error) {
    console.error("Verbatim speech failed", error);
    throw error;
  }
};

export const generateLessonAudio = async (prompt: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Act as an expert educator. Record a short, engaging 30-second educational podcast segment about: ${prompt}. Speak clearly and enthusiastically. Structure it with an intro, key point, and summary.` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    const base64Audio = audioPart?.inlineData?.data;
    
    if (!base64Audio) throw new Error("No audio data returned from Gemini");

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const uint8Data = decodeBase64ToUint8(base64Audio);
    const audioBuffer = await decodeRawPcmToAudioBuffer(uint8Data, audioCtx, 24000, 1);
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    return URL.createObjectURL(wavBlob);
  } catch (error) {
    console.error("Audio Generation failed", error);
    throw error;
  }
};

export const convertPdfToHtml = async (pdfBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    return `
      <div style="font-family: sans-serif; padding: 20px; color: #1e293b; background: white;">
        <h1 style="color: #0a66c2;">Interactive Study Guide</h1>
        <p>This is a simulated interactive version of your PDF.</p>
      </div>
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { inlineData: { data: pdfBase64, mimeType: 'application/pdf' } },
            { text: `Convert the provided PDF into a beautiful, high-fidelity interactive HTML5 document. Return ONLY the HTML/CSS/JS code, starting with <!DOCTYPE html>.` }
          ]
        }
      ]
    });
    return response.text || "Failed to convert document.";
  } catch (error) {
    return "<div style='padding: 20px; color: red;'>Error: Document conversion failed.</div>";
  }
};

export const convertPptToHtml = async (pptBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #202124; color: white; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
        .player { width: 100%; height: 100%; display: flex; flex-direction: column; }
        .slide-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; overflow: hidden; position: relative; }
        .slide { width: 100%; aspect-ratio: 16/9; max-height: 100%; background: white; color: #3c4043; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; box-sizing: border-box; }
        .toolbar { height: 44px; background: #000; display: flex; align-items: center; padding: 0 16px; color: #eee; font-size: 13px; gap: 20px; user-select: none; }
        .btn { cursor: pointer; opacity: 0.7; padding: 8px; transition: opacity 0.2s, background 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn:hover { opacity: 1; background: rgba(255,255,255,0.1); border-radius: 4px; }
        .counter { font-family: Roboto, Arial, sans-serif; min-width: 50px; text-align: center; font-weight: 500; }
        .logo { margin-left: auto; display: flex; align-items: center; gap: 8px; opacity: 0.8; font-weight: bold; font-size: 12px; }
        .logo svg { width: 18px; height: 18px; fill: #f4b400; }
      </style>
      </head>
      <body>
        <div class="player">
            <div class="slide-area">
                <div class="slide">
                    <h1 style="margin: 0 0 20px 0; color: #202124; font-size: 2.5rem;">Presentation Preview</h1>
                    <p style="margin: 0; color: #5f6368; font-size: 1.2rem;">Please provide an API key to enable high-fidelity content extraction.</p>
                </div>
            </div>
            <div class="toolbar">
                <div class="btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                </div>
                <span class="counter">1 / 1</span>
                <div class="btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                </div>
                <div class="logo">
                  <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 14H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2z"/></svg>
                  <span>Google Slides</span>
                </div>
            </div>
        </div>
      </body>
      </html>
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: pptBase64,
                mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              },
            },
            {
              text: `
                Convert the provided PowerPoint presentation into a standalone HTML5 interactive player that looks EXACTLY like a Google Slides web embed.

                UI REQUIREMENTS (MUST MATCH GOOGLE SLIDES):
                - Background: Dark canvas (#202124).
                - Slide View: Centered 16:9 white rectangle. Use standard slide layouts.
                - Bottom Toolbar: Pure black (#000), 44px height.
                - Toolbar Controls: 
                    1. Minimalist "Previous" arrow (left-pointing chevron).
                    2. Slide counter label (e.g., "1 / 12") centered in the controls section.
                    3. Minimalist "Next" arrow (right-pointing chevron).
                    4. A right-aligned "Google Slides" branding lookalike with a yellow icon.
                - Animations: Smooth 0.3s fade-in/out transitions when switching slides.

                CONTENT EXTRACTION REQUIREMENTS:
                - DO NOT summarize. DO NOT rewrite.
                - STRICTLY extract all text content from EVERY slide.
                - Preserve titles, bullet points, headers, and footer text if present.
                - Use semantic HTML (h1 for titles, ul/li for bullets).
                - Use a clean, sans-serif font stack (Roboto, Arial, sans-serif).

                JS REQUIREMENTS:
                - Implement a robust slide management system.
                - Add Event Listeners for toolbar buttons.
                - Add Keyboard Event Listeners for Left/Right arrow keys.
                - Support auto-scaling content if it overflows the slide bounds.

                Return ONLY the raw HTML code starting with <!DOCTYPE html>.
              `,
            },
          ],
        },
      ],
    });

    return response.text || "Failed to convert presentation.";
  } catch (error) {
    console.error("PPT Conversion failed", error);
    return "<div style='padding: 20px; color: red; background: white;'>Error: Could not render presentation. Please check your file.</div>";
  }
};

export const generateBoxSummary = async (box: Box): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    return `This is an AI-generated summary for "${box.title}". \n\nIn this box, you will explore ${box.category} through ${box.lessons.length} micro-lessons.`;
  }

  try {
    const lessonContext = box.lessons.map((l, index) => `${index + 1}. [${l.type.toUpperCase()}] ${l.title}: ${l.content.substring(0, 100)}...`).join('\n');
    const prompt = `Create a cohesive Executive Summary for: "${box.title}".\n\nLessons:\n${lessonContext}\n\nKeep it under 200 words.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "Failed to generate summary.";
  } catch (error) {
    return "AI was unable to synthesize the box content.";
  }
};

export const generateAssessment = async (topic: string, context: string, questionCount: number = 5): Promise<AssessmentContent> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (!process.env.API_KEY) {
        return { questions: [], passingScore: 70 };
    }

    try {
        const prompt = `Create a ${questionCount} question academic assessment about "${topic}". Provide a mix of question types (mcq_single, mcq_multi, true_false, fill_blanks). 
        
        SPECIAL RULE FOR LOCALIZATION: 
        For every question, you MUST provide "question_en" and "question_ar". 
        For every option in MCQs, provide "options_en" and "options_ar" arrays of same length.
        For feedback, provide "feedback_en" and "feedback_ar".
        For fill_blanks, use the placeholder {{blank}} in both versions.

        CONTEXT: ${context}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        passingScore: { type: Type.INTEGER, description: 'Percentage needed to pass (e.g. 80)' },
                        questions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    type: { type: Type.STRING, description: 'One of: mcq_single, mcq_multi, true_false, short_answer, fill_blanks, sorting, matching, coloring' },
                                    question_en: { type: Type.STRING },
                                    question_ar: { type: Type.STRING },
                                    options_en: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    options_ar: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswer: { type: Type.STRING, description: 'Index for mcq_single, array for multi, or string/array for others.' },
                                    feedback_en: { type: Type.STRING },
                                    feedback_ar: { type: Type.STRING }
                                },
                                required: ['id', 'type', 'question_en', 'question_ar', 'correctAnswer', 'feedback_en', 'feedback_ar']
                            }
                        }
                    },
                    required: ['passingScore', 'questions']
                }
            }
        });

        const rawData = JSON.parse(response.text || '{}');
        
        const processedQuestions = rawData.questions.map((q: any) => {
            let processedCorrect = q.correctAnswer;
            
            if (q.type === 'mcq_single' || q.type === 'sorting') {
                processedCorrect = parseInt(q.correctAnswer);
            } else if (q.type === 'mcq_multi' || q.type === 'coloring') {
                try {
                    processedCorrect = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
                    if (!Array.isArray(processedCorrect)) processedCorrect = [parseInt(q.correctAnswer)];
                } catch { processedCorrect = [parseInt(q.correctAnswer)]; }
            } else if (q.type === 'true_false') {
                processedCorrect = q.correctAnswer === true || q.correctAnswer === 'true' || q.correctAnswer === 'True';
            } else if (q.type === 'fill_blanks') {
                try {
                    processedCorrect = typeof q.correctAnswer === 'string' ? JSON.parse(q.correctAnswer) : q.correctAnswer;
                    if (!Array.isArray(processedCorrect)) {
                        processedCorrect = String(q.correctAnswer).split(',').map((s: string) => s.trim());
                    }
                } catch {
                    processedCorrect = String(q.correctAnswer).split(',').map((s: string) => s.trim());
                }
            }

            return { 
              ...q, 
              question: q.question_en, // Fallback for components that expect 'question'
              feedback: `${q.feedback_en} | ${q.feedback_ar}`,
              options: q.options_en,
              correctAnswer: processedCorrect 
            };
        });

        return { 
            questions: processedQuestions, 
            passingScore: parseInt(rawData.passingScore) || 80 
        };
    } catch (error) {
        console.error("Assessment Generation Error:", error);
        throw error;
    }
};

export const generateMicroLesson = async (topic: string, context: string, targetType?: 'text' | 'quiz' | 'assessment'): Promise<GeneratedLessonData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    return { title: topic, content: "Mock AI Content", type: 'text' };
  }

  try {
    const prompt = `Create a micro-learning lesson about "${topic}". If it is a quiz, use question types like mcq_single or fill_blanks. For fill_blanks, use the placeholder {{blank}}.
    Return JSON: { "title": "...", "content": "...", "type": "text", "quizType": "...", "quizData": { "question": "...", "correctAnswer": "..." } }`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}') as GeneratedLessonData;
  } catch (error) {
    throw error;
  }
};

export const generateLessonVideo = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Educational content: ${prompt}`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    throw error;
  }
};

export const generateLessonImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: `Educational illustration: ${prompt}` }] },
      config: { imageConfig: { aspectRatio: "16:9" } },
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data");
  } catch (error) {
    throw error;
  }
};

export const generateImageExplanation = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert educator. Provide a short (2-3 sentences), engaging, and educational explanation for an image described as: "${prompt}". Focus on what a student should learn or notice in this visual.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Image explanation failed", error);
    return "";
  }
};
