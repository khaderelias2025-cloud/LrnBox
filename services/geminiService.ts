
import { GoogleGenAI } from "@google/genai";
// Added missing AssessmentQuestion import
import { Lesson, QuizContent, QuizType, Box, AssessmentContent, AssessmentQuestion } from "../types";

export interface GeneratedLessonData {
  title: string;
  content: string;
  type: 'text' | 'quiz' | 'image' | 'video' | 'audio' | 'html5' | 'scorm' | 'interactive_video' | 'pdf' | 'ppt' | 'assessment';
  quizType?: QuizType;
  quizData?: QuizContent;
  assessmentData?: AssessmentContent;
}

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
            - Mix of types: 'mcq_single', 'mcq_multi', 'true_false', 'short_answer', 'fill_blanks', 'sorting', 'matching', 'coloring'.
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
                   "type": "true_false", 
                   "question": "...", 
                   "correctAnswer": true,
                   "feedback": "Detailed explanation here..."
                },
                { 
                   "id": "3", 
                   "type": "short_answer", 
                   "question": "...", 
                   "correctAnswer": "exact string",
                   "feedback": "Detailed explanation here..."
                },
                { 
                   "id": "4", 
                   "type": "fill_blanks", 
                   "question": "The capital of {{blank}} is {{blank}}.", 
                   "correctAnswer": ["France", "Paris"],
                   "feedback": "Detailed explanation here..."
                },
                { 
                   "id": "5", 
                   "type": "sorting", 
                   "question": "Order these by size", 
                   "options": ["Earth", "Moon", "Sun"], 
                   "correctAnswer": [1, 0, 2],
                   "feedback": "Detailed explanation here..."
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
      ['mcq_single', 'mcq_multi', 'true_false', 'short_answer', 'fill_blanks', 'sorting', 'matching', 'coloring'].
      
      Return ONLY a valid JSON object with this structure:
      {
        "title": "Title (max 50 chars)",
        "content": "Short explanation or question (max 300 chars).",
        "type": "text" OR "quiz",
        "quizType": "mcq_single", (or others listed above)
        "quizData": {
            "question": "The specific question text",
            "options": ["Opt1", "Opt2"], (Required for mcq/sorting/matching/coloring)
            "correctAnswer": 0 (for mcq_single) OR [0, 2] (mcq_multi/coloring) OR true (true_false) OR "Answer string" (short_answer) OR ["Ans1", "Ans2"] (fill_blanks/matching) OR [1, 0, 2] (sorting)
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
