
import { GoogleGenAI, Modality } from "@google/genai";
import { Lesson, QuizContent, QuizType, Box, AssessmentContent, AssessmentQuestion, CrosswordWord } from "../types";

export interface GeneratedLessonData {
  title: string;
  content: string;
  type: 'text' | 'quiz' | 'image' | 'video' | 'audio' | 'html5' | 'scorm' | 'interactive_video' | 'pdf' | 'ppt' | 'assessment';
  quizType?: QuizType;
  quizData?: QuizContent;
  assessmentData?: AssessmentContent;
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
  // Use byteLength/2 because Int16 is 2 bytes per sample
  // Ensure we use the underlying buffer correctly with offsets
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

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(buffer.length * numOfChan * 2);      // chunk length

  // write interleaved data
  for (let offset = 0; offset < buffer.length; offset++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = buffer.getChannelData(channel)[offset];
      sample = Math.max(-1, Math.min(1, sample)); // clamp
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, intSample, true);
      pos += 2;
    }
  }

  return new Blob([buffer_arr], { type: "audio/wav" });
}

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
    
    if (!base64Audio) {
      console.error("Gemini TTS Error: Response did not contain inline audio data.", response);
      throw new Error("No audio data returned from Gemini");
    }

    // Convert raw PCM to usable Blob URL
    // Sample rate for Gemini TTS is typically 24000Hz
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
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b; background: white;">
            <h1 style="color: #0a66c2;">Interactive Study Guide</h1>
            <p>This is a simulated interactive version of your PDF.</p>
            <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Key Concepts</h3>
              <ul>
                <li>Foundational Theory</li>
                <li>Practical Application</li>
                <li>Advanced Techniques</li>
              </ul>
            </div>
            <button style="background: #0a66c2; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              Explore Content
            </button>
          </div>
        `);
      }, 2000);
    });
  }

  try {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: pdfBase64,
                mimeType: 'application/pdf',
              },
            },
            {
              text: `
                Convert the provided PDF into a beautiful, high-fidelity interactive HTML5 document for a micro-learning platform. 
                
                Requirements:
                1. Single-file output containing HTML, CSS, and minimal JS.
                2. Use a clean, modern aesthetic (like Tailwind or modern professional UI).
                3. Include a "Key Takeaways" sidebar or section.
                4. Make it responsive and mobile-friendly.
                5. Use a white background with dark text for accessibility.
                6. Extract all important diagrams or text structures into clean HTML tables/lists.
                7. Add a small interactive button or accordion to reveal "Deep Dive" details.
                
                Return ONLY the HTML/CSS/JS code, starting with <!DOCTYPE html>.
              `,
            },
          ],
        },
      ],
    });

    return response.text || "Failed to convert document.";
  } catch (error) {
    console.error("PDF Conversion failed", error);
    return "<div style='padding: 20px; color: red;'>Error: Document conversion failed. Please try again.</div>";
  }
};

export const convertPptToHtml = async (pptBase64: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`
          <!DOCTYPE html>
          <html>
          <head>
          <style>
            body { font-family: sans-serif; background: #1e293b; color: white; margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
            .player { width: 90%; max-width: 800px; aspect-ratio: 16/9; background: white; color: #333; border-radius: 12px; position: relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; }
            .slide { flex: 1; padding: 40px; display: flex; flex-direction: column; justify-content: center; text-align: center; }
            .controls { padding: 20px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
            button { background: #0a66c2; color: white; border: none; padding: 10px 25px; border-radius: 6px; cursor: pointer; font-weight: bold; }
            button:disabled { opacity: 0.3; }
            .progress { position: absolute; bottom: 0; left: 0; height: 4px; background: #0a66c2; transition: width 0.3s; }
          </style>
          </head>
          <body>
            <div class="player">
                <div class="slide">
                    <h1>Welcome to the Presentation</h1>
                    <p>This is an AI-reimagined slide player.</p>
                </div>
                <div class="controls">
                    <button disabled>Prev</button>
                    <span>Slide 1 of 1</span>
                    <button disabled>Next</button>
                </div>
                <div class="progress" style="width: 100%"></div>
            </div>
          </body>
          </html>
        `);
      }, 2000);
    });
  }

  try {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
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
                Convert the provided PowerPoint presentation into a functional, high-fidelity interactive HTML5 slide deck player.
                
                Requirements:
                1. Single-file HTML/CSS/JS output.
                2. Implement a "Slide Player" logic:
                   - An array of slide content (HTML strings) in JS.
                   - Functions to Navigate (Next/Prev).
                   - Keyboard support (Left/Right arrow keys).
                   - A progress bar indicator.
                3. UI Design:
                   - Stage: A dark cinematic container.
                   - Slide Area: A 16:9 white aspect-ratio card with rounded corners and soft shadows.
                   - Floating Controls: Minimalist 'Previous', 'Next', and 'Slide Number' counter.
                4. Content Extraction:
                   - Faithfully extract all titles, headers, bullet points, and data from the actual PPTX file.
                   - Convert charts or tables into clean HTML <table> elements.
                5. Polish:
                   - Use a clean sans-serif font (Inter or system-default).
                   - Add simple fade transitions between slides.
                
                Return ONLY the raw code starting with <!DOCTYPE html>.
              `,
            },
          ],
        },
      ],
    });

    return response.text || "Failed to convert presentation.";
  } catch (error) {
    console.error("PPT Conversion failed", error);
    return "<div style='padding: 20px; color: red;'>Error: Presentation conversion failed. Please try again.</div>";
  }
};

export const generateBoxSummary = async (box: Box): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`This is an AI-generated summary for "${box.title}". \n\nIn this box, you will explore ${box.category} through ${box.lessons.length} micro-lessons. Key topics include foundational principles and practical applications of ${box.tags.join(', ')}. Perfect for ${box.difficulty} learners looking to master these skills efficiently.`);
      }, 1500);
    });
  }

  try {
    const model = 'gemini-3-flash-preview';
    
    // Prepare a detailed content map for the AI to synthesize
    const lessonContext = box.lessons.map((l, index) => {
      const typeLabel = l.type.toUpperCase();
      return `${index + 1}. [${typeLabel}] ${l.title}: ${l.content.substring(0, 200)}${l.content.length > 200 ? '...' : ''}`;
    }).join('\n');
    
    const prompt = `
      You are an expert educational synthesizer. Create a cohesive "Box Executive Summary" for a learning collection titled "${box.title}".
      
      Box Overview: ${box.description}
      Category: ${box.category}
      Tags: ${box.tags.join(', ')}
      Target Audience: ${box.ageGroup} (${box.difficulty} level)

      Here are the individual posts/lessons added to this box:
      ${lessonContext || 'No lessons added yet.'}

      Instructions:
      1. Synthesis: Don't just list the lessons. Combine the topics into a meaningful narrative of what the user will learn.
      2. Core Value: Identify the "Single Most Important Takeaway" from this collection.
      3. Learning Roadmap: Briefly explain the progression from the first post to the last.
      4. Outcome: What specific skill will the learner walk away with?
      
      Format: Professional, academic but accessible. Use bold text for headers. Do not use Markdown '#' headers. Keep it under 250 words.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("Summary generation failed", error);
    return "The AI was unable to synthesize the box content at this time. Please ensure your posts have descriptive content and try again.";
  }
};

export const generateAssessment = async (topic: string, context: string, questionCount: number = 5): Promise<AssessmentContent> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    if (!process.env.API_KEY) {
        const mockQuestions = [];
        for (let i = 1; i <= questionCount; i++) {
          mockQuestions.push({ 
            id: String(i), 
            type: i % 2 === 0 ? 'true_false' : 'mcq_single', 
            question: `Simulated Question ${i} about ${topic}?`, 
            options: i % 2 === 0 ? undefined : ['Option A', 'Option B', 'Option C', 'Option D'], 
            correctAnswer: i % 2 === 0 ? true : 0,
            feedback: `Explanation for simulated question ${i}. This covers the core logic of ${topic}.`
          });
        }
        return {
            questions: mockQuestions as AssessmentQuestion[],
            passingScore: 70
        };
    }

    try {
        const model = 'gemini-3-flash-preview';
        const prompt = `
            Create a comprehensive assessment (exam) about "${topic}".
            Context of the box: "${context}".
            
            Requirements:
            - Exactly ${questionCount} questions.
            - Mix of types: 'mcq_single', 'mcq_multi', 'true_false', 'short_answer', 'fill_blanks', 'sorting', 'matching', 'coloring', 'crossword'.
            - For 'crossword', include "crosswordWords" which is an array of {answer, clue, x, y, direction}.
            - For EACH question, provide a "feedback" field which is a detailed explanation of why the correct answer is correct.
            - Return JSON format:
            {
              "questions": [
                { 
                   "id": "1", 
                   "type": "mcq_single", 
                   "question": "...", 
                   "options": ["...", "..."], 
                   "correctAnswer": 0,
                   "feedback": "Detailed explanation here..."
                },
                { 
                   "id": "2", 
                   "type": "crossword", 
                   "question": "Solve this crossword about the topic", 
                   "crosswordWords": [
                      { "answer": "REACT", "clue": "Popular JS UI library", "x": 0, "y": 0, "direction": "across" },
                      { "answer": "ROUTER", "clue": "Library for navigation in React", "x": 0, "y": 0, "direction": "down" }
                   ],
                   "feedback": "Crosswords help reinforce keyword associations."
                }
              ],
              "passingScore": 80
            }
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text || '{}';
        return JSON.parse(text) as AssessmentContent;
    } catch (error) {
        console.error("Assessment generation failed", error);
        throw error;
    }
};

export const generateMicroLesson = async (topic: string, context: string, targetType?: 'text' | 'quiz' | 'assessment'): Promise<GeneratedLessonData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  if (!process.env.API_KEY) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (targetType === 'quiz') {
          resolve({
            title: `Quiz: ${topic}`,
            content: `Identify the characteristics of ${topic}`,
            type: 'quiz',
            quizType: 'mcq_single',
            quizData: {
              question: `What is the key characteristic of ${topic}?`,
              options: ['Fast', 'Slow', 'Red', 'Blue'],
              correctAnswer: 0
            }
          });
        } else {
          resolve({
            title: `Intro to ${topic}`,
            content: `This is a simulated AI response about ${topic}.`,
            type: 'text'
          });
        }
      }, 1000);
    });
  }

  try {
    const model = 'gemini-3-flash-preview';
    const typeInstruction = targetType 
      ? `The type MUST be "${targetType}".` 
      : `The type can be "text" or "quiz".`;

    const prompt = `
      Create a "micro-learning" lesson about "${topic}". 
      Context of the box: "${context}".
      ${typeInstruction}
      
      If type is 'quiz', choose one of these sub-types randomly or based on what fits best:
      ['mcq_single', 'mcq_multi', 'true_false', 'short_answer', 'fill_blanks', 'sorting', 'matching', 'coloring', 'crossword'].
      
      If 'crossword', return crosswordWords as array of {answer, clue, x, y, direction}.
      
      Return ONLY a valid JSON object with this structure:
      {
        "title": "Title (max 50 chars)",
        "content": "Short explanation or question (max 300 chars).",
        "type": "text" OR "quiz",
        "quizType": "mcq_single", (or others listed above)
        "quizData": {
            "question": "The specific question text",
            "options": ["Opt1", "Opt2"], (Required for mcq/sorting/matching/coloring)
            "correctAnswer": 0 (for mcq_single) OR [0, 2] (mcq_multi/coloring) OR true (true_false) OR "Answer string" (short_answer) OR ["Ans1", "Ans2"] (fill_blanks/matching) OR [1, 0, 2] (sorting),
            "crosswordWords": [...] (if crossword)
        }
      }
      
      For 'fill_blanks', include {{blank}} in the content or question text.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text) as GeneratedLessonData;

  } catch (error) {
    console.error("Gemini generation failed", error);
    throw new Error("Failed to generate content");
  }
};

export const generateLessonVideo = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Educational micro-learning content: ${prompt}. Cinematic quality, professional lighting, clear subjects.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed - no URI");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video Generation failed", error);
    throw error;
  }
};

export const generateLessonImage = async (prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `High-quality educational illustration: ${prompt}. Professional, clean, and clear for micro-learning.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Image Generation failed", error);
    throw error;
  }
};
