
import { GoogleGenAI, Type } from "@google/genai";
import { PersonaType, PersonaIntensity } from "../components/PersonaSelector";

export interface PromptData {
  regular: string;
  json: any;
  isUniversal?: boolean;
  isCharacterBuilder?: boolean;
  negative?: string;
  confidence?: number;
  grade?: {
      score: number;
      feedback: string[];
      suggestions: string[];
  };
}

export interface Template {
    id: string;
    name: string;
    description: string;
    options: Partial<PromptOptions>;
}

export interface ImagePart {
    inlineData: {
      data: string;
      mimeType: string;
    };
}

export const base64ToImagePart = (base64Data: string, mimeType: string = 'image/png'): ImagePart => {
    let finalMimeType = mimeType;
    let data = base64Data;
    
    const match = base64Data.match(/^data:(image\/[^;]+);base64,/);
    if (match) {
        finalMimeType = match[1];
        data = base64Data.replace(/^data:image\/[^;]+;base64,/, "");
    } else {
        data = base64Data.replace(/^data:image\/\w+;base64,/, "");
    }

    return {
        inlineData: { data, mimeType: finalMimeType }
    };
};

export const resizeBase64 = (base64Str: string, maxWidth = 1280): Promise<string> => {
    return new Promise((resolve) => {
        if (!base64Str.startsWith('data:')) {
             base64Str = `data:image/png;base64,${base64Str}`;
        }

        const img = new Image();
        img.src = base64Str;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxWidth) {
                const ratio = Math.min(maxWidth / width, maxWidth / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            } else {
                if (base64Str.length < 3 * 1024 * 1024) { // < 3MB
                    resolve(base64Str);
                    return;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64Str);
                return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => {
            resolve(base64Str);
        };
    });
};

export type ModelPreset = 
  | 'standard' 
  | 'midjourney' 
  | 'dall-e-3' 
  | 'firefly' 
  | 'stable-diffusion'
  | 'sdxl'
  | 'flux'
  | 'playground-v3'
  | 'ideogram'
  | 'story-script'
  | '3d-asset'
  | 'lora-caption';

export interface CameraSettings {
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: string | null;
  filmType: string | null;
}

export interface PromptOptions {
  aspectRatio: string | null;
  isUniversal: boolean;
  isCharacterBuilder?: boolean;
  userDescription: string;
  backgroundReference?: ImagePart | null;
  contextReference?: ImagePart | null;
  preset: ModelPreset;
  cameraAngle: string | null;
  lighting: string | null;
  visualStyle: string | null;
  colorPalette: string | null;
  colorTemperature: number; 
  texture: string | null;
  animationStyle: string | null;
  persona: PersonaType[];
  personaIntensity: PersonaIntensity;
  detailWeight: number; 
  realismBalance: number;
  cameraSettings: CameraSettings;
  sourceType: string | null;
  themeMode: 'light' | 'dark' | null;
  subjectGender: 'male' | 'female' | 'non-binary' | null;
}

const getAiClient = () => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

const formatGeminiError = (error: unknown): string => {
    if (error instanceof Error) {
        let msg = error.message;
        try {
            const jsonMatch = msg.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.error) {
                    if (parsed.error.message) msg = parsed.error.message;
                    if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
                        return "Quota Exceeded: API request limit reached. Please check your billing or try again later.";
                    }
                }
            }
        } catch (e) { /* ignore */ }
        
        if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
            return "Quota Exceeded: API request limit reached. Please check your billing or try again later.";
        }
        if (msg.includes("SAFETY")) {
            return "Safety Violation: The model blocked the request due to safety settings.";
        }
        
        return msg;
    }
    return "An unknown error occurred.";
};

const promptSchema = {
  type: Type.OBJECT,
  properties: {
    regular: { type: Type.STRING },
    negative: { type: Type.STRING },
    confidence: { type: Type.INTEGER },
    json: {
      type: Type.OBJECT,
      properties: {
        subject: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            pose: { type: Type.STRING },
            attire: { type: Type.STRING }
          },
          required: ["description"]
        },
        environment: {
          type: Type.OBJECT,
          properties: {
            setting: { type: Type.STRING },
            elements: { type: Type.ARRAY, items: { type: Type.STRING } },
            mood: { type: Type.STRING }
          },
           required: ["setting", "mood"]
        },
        lighting: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            color: { type: Type.STRING }
          },
           required: ["type"]
        },
        style: {
          type: Type.OBJECT,
          properties: {
            visual_style: { type: Type.STRING },
            medium: { type: Type.STRING },
            camera: { type: Type.STRING }
          },
           required: ["visual_style", "medium"]
        }
      },
      required: ["subject", "environment", "lighting", "style"]
    }
  },
  required: ["regular", "json", "confidence"],
};

export const generatePromptFromImage = async (
  imagePart: ImagePart, 
  options: PromptOptions
): Promise<PromptData> => {
  const { 
    aspectRatio, isUniversal, isCharacterBuilder, userDescription, backgroundReference, contextReference, preset, 
    cameraAngle, lighting, visualStyle, colorPalette, colorTemperature,
    texture, animationStyle,
    persona, personaIntensity,
    detailWeight, realismBalance,
    cameraSettings,
    sourceType,
    themeMode,
    subjectGender
  } = options;

  let systemInstruction = `You are an expert AI Analyst and Prompt Engineer.
  Your task is to analyze the input image and generate a structured response based on the selected Mode (${preset}).
  
  **PRIORITY INSTRUCTIONS:**
  - **USER TEXT CONTEXT**: If the user provides text context, you MUST treat it as a command. If they say "Change hair to red", ignore the hair color in the image and describe red hair.
  - **CONTEXT REFERENCE IMAGE**: If a reference image is provided in the Additional Context, use it to inform the final output.
  - **THEME & GENDER**: Explicit theme and gender choices MUST override the visual data in the source image.
  
  **OUTPUT FORMAT:**
  1. **Regular**: The main output text.
  2. **Negative**: Analyze the image for flaws.
  3. **Confidence**: An integer (0-100).
  4. **JSON**: A structured breakdown.
  
  **MODE GUIDELINES (${preset}):**
  `;

  switch (preset) {
    case 'midjourney': systemInstruction += `- **GOAL**: Image Generation Prompt (v6/v7). Style: Artistic, evocative.`; break;
    case 'dall-e-3': systemInstruction += `- **GOAL**: Image Generation Prompt (DALL-E 3). Style: Detailed, narrative.`; break;
    case 'stable-diffusion':
    case 'sdxl': systemInstruction += `- **GOAL**: Image Generation Prompt (SDXL). Style: Tag-heavy.`; break;
    case 'flux': systemInstruction += `- **GOAL**: Image Generation Prompt (Flux.1). Style: Natural language, structured.`; break;
    case 'firefly': systemInstruction += `- **GOAL**: Commercial Photography Prompt. Style: Photorealistic.`; break;
    case 'playground-v3': systemInstruction += `- **GOAL**: Playground v3 Prompt. Style: Artistic, vibrant.`; break;
    case 'ideogram': systemInstruction += `- **GOAL**: Ideogram Prompt. Style: Typography focused.`; break;
    case 'story-script': systemInstruction += `- **GOAL**: Story/Script Generation. Format: Screenplay.`; break;
    case '3d-asset': systemInstruction += `- **GOAL**: 3D Engine Prompt. Format: Technical spec.`; break;
    case 'lora-caption': systemInstruction += `- **GOAL**: LoRA/Fine-Tuning Caption. Format: Strict tags.`; break;
    default: systemInstruction += `- **GOAL**: Standard Description.`; break;
  }

  systemInstruction += `\n\n**OPTIMIZATION PARAMETERS:**`;
  
  if (detailWeight < 30) systemInstruction += `\n- **DETAIL LEVEL (Low)**: Concise, minimal.`;
  else if (detailWeight > 70) systemInstruction += `\n- **DETAIL LEVEL (High)**: Exhaustive detail.`;
  else systemInstruction += `\n- **DETAIL LEVEL (Balanced)**: Standard detail.`;

  if (realismBalance < 30) systemInstruction += `\n- **REALISM vs CREATIVITY (Strict Realism)**: Grounded, objective.`;
  else if (realismBalance > 70) systemInstruction += `\n- **REALISM vs CREATIVITY (High Creativity)**: Evocative, poetic.`;

  if (Array.isArray(persona) && persona.length > 0) {
    const intensityMap = { low: "Subtly influence with:", medium: "Adopt the persona of:", high: "Strictly adhere to:" };
    systemInstruction += `\n\n**PERSONA LAYER (${personaIntensity.toUpperCase()}):**\n- ${intensityMap[personaIntensity]} ${persona.join(' + ')}.`;
  }

  if (isUniversal) {
    systemInstruction += `\n\n**MASTER PROMPT ENABLED:** OMIT age, identity, hair/eye color. Use gender only. Create a template description.`;
  }

  if (isCharacterBuilder) {
    systemInstruction += `\n\n**CHARACTER BUILDER MODE ENABLED:**\n- **OBJECTIVE**: Create a description to build a consistent character from scratch.\n- **PRESERVE**: Exact Hair style/color, ear shape, body type, height, age, gender, clothing style, accessories, and distinctive features.\n- **ANONYMIZE**: Do NOT use the specific facial identity of the subject. Describe the *type* of face (e.g., 'oval face', 'high cheekbones') but allow the AI model to generate a unique face.`;
  }
  
  if (sourceType) {
      systemInstruction += `\n\n**INPUT CLASSIFICATION**: The user explicitly defines the input image as "${sourceType}". Ensure the analysis respects this medium.`;
  }

  if (themeMode === 'light') {
      systemInstruction += `\n\n**AESTHETIC THEME: LIGHT/HIGH-KEY**. Describe the result as bright, luminous, airy, and high-key.`;
  } else if (themeMode === 'dark') {
      systemInstruction += `\n\n**AESTHETIC THEME: DARK/LOW-KEY**. Describe the result as moody, dark, low-key, with deep shadows and dramatic lighting.`;
  }

  if (subjectGender) {
      systemInstruction += `\n\n**SUBJECT GENDER OVERRIDE**: Explicitly describe the primary subject as ${subjectGender.toUpperCase()}.`;
  }

  if (cameraAngle) systemInstruction += `\n- **PERSPECTIVE**: "${cameraAngle}".`;
  if (lighting) systemInstruction += `\n- **LIGHTING**: "${lighting}".`;
  if (visualStyle) systemInstruction += `\n- **STYLE**: "${visualStyle}".`;
  if (animationStyle) systemInstruction += `\n- **ANIMATION**: "${animationStyle}".`;
  if (texture) systemInstruction += `\n- **TEXTURES**: "${texture}".`;
  if (colorPalette) systemInstruction += `\n- **COLORS**: "${colorPalette}".`;
  if (colorTemperature < 40) systemInstruction += `\n- **TEMP**: Cool/Blue.`;
  else if (colorTemperature > 60) systemInstruction += `\n- **TEMP**: Warm/Gold.`;

  if (cameraSettings) {
      if (cameraSettings.focalLength) systemInstruction += `\n- **LENS/FOCAL LENGTH**: "${cameraSettings.focalLength}".`;
      if (cameraSettings.aperture) systemInstruction += `\n- **APERTURE/DEPTH**: "${cameraSettings.aperture}".`;
      if (cameraSettings.shutterSpeed) systemInstruction += `\n- **SHUTTER SPEED**: "${cameraSettings.shutterSpeed}".`;
      if (cameraSettings.iso) systemInstruction += `\n- **ISO/SENSITIVITY**: "${cameraSettings.iso}".`;
      if (cameraSettings.filmType) systemInstruction += `\n- **FILM STOCK/SENSOR**: "${cameraSettings.filmType}".`;
  }

  let promptText = `MAIN INSTRUCTION: Analyze the first image based on the selected MODE (${preset}).`;
  if (aspectRatio) promptText += ` Target Aspect Ratio: ${aspectRatio}.`;
  
  const requestParts: any[] = [{ text: promptText }, imagePart];

  if (userDescription?.trim()) {
      systemInstruction += `\n\n**CRITICAL MANDATE - USER CONTEXT**: The user has provided the following specific instruction which MUST be integrated even if it conflicts with the image: "${userDescription}".`;
      requestParts.push({ text: `\n\nUSER TEXT INSTRUCTION (Mandatory): "${userDescription}"` });
  }

  if (contextReference) {
      systemInstruction += `\n\n**CONTEXT REFERENCE IMAGE**: A second image has been provided for contextual guidance. Use its details (style, color, subject features as requested) to influence the prompt for the main image.`;
      requestParts.push({ text: "\n\n**CONTEXT REFERENCE IMAGE (Guidance):**" });
      requestParts.push(contextReference);
  }

  if (backgroundReference) {
      systemInstruction += `\n\n**BACKGROUND COMPOSITING:** A Background Reference image has been provided. Place the SUBJECT from the main image into the ENVIRONMENT/BACKGROUND of the background reference image.`;
      requestParts.push({ text: "\n\n**ENVIRONMENT REFERENCE IMAGE (Background):**" });
      requestParts.push(backgroundReference);
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: promptSchema as any,
      },
      contents: { parts: requestParts },
    });
    
    if (response.text) {
        const data = JSON.parse(response.text) as PromptData;
        data.isUniversal = isUniversal;
        data.isCharacterBuilder = isCharacterBuilder;
        return data;
    } else {
        throw new Error('No text was generated by the model.');
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(formatGeminiError(error));
  }
};

export const generatePromptVariations = async (
  imagePart: ImagePart, 
  options: PromptOptions,
  strategy: 'style' | 'lighting' | 'emotion',
  count: number
): Promise<PromptData[]> => {
  const ai = getAiClient();
  const variationsSchema = {
    type: Type.OBJECT,
    properties: {
      variations: {
        type: Type.ARRAY,
        items: promptSchema as any
      }
    },
    required: ["variations"]
  };

  const systemInstruction = `Generate ${count} variations of an image generation prompt for the attached image.
  Focus the variations on the strategy: ${strategy}.
  Maintain the preset: ${options.preset}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        temperature: 0.9,
        responseMimeType: "application/json",
        responseSchema: variationsSchema as any,
      },
      contents: { parts: [{ text: "Analyze and provide variations." }, imagePart] },
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return result.variations;
    }
    throw new Error("No response generated.");
  } catch (error) {
    throw new Error(formatGeminiError(error));
  }
};

export const refinePromptWithGemini = async (currentData: PromptData, instruction: string, referenceImage?: ImagePart): Promise<PromptData> => {
  const ai = getAiClient();
  let systemInstruction = `You are an AI assistant helping a user refine image generation prompts. Apply the instruction to the text and JSON. Return same JSON structure.`;
  if (currentData.isUniversal) systemInstruction += `\nMAINTAIN MASTER PROMPT (Generic identity).`;
  if (currentData.isCharacterBuilder) systemInstruction += `\nMAINTAIN CHARACTER BUILDER MODE (Consistent body/style, generic face).`;

  const userContent: any[] = [{ text: `CURRENT PROMPT:\n${JSON.stringify(currentData)}\n\nINSTRUCTION:\n${instruction}` }];
  if (referenceImage) {
    userContent.push(referenceImage);
    userContent.push({ text: "\n(Use attached image as visual reference.)" });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: { 
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: promptSchema as any,
      },
      contents: { parts: userContent },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as PromptData;
      data.isUniversal = currentData.isUniversal;
      data.isCharacterBuilder = currentData.isCharacterBuilder;
      return data;
    } else {
      throw new Error('No text was generated.');
    }
  } catch (error) {
    console.error("Error refining prompt:", error);
    throw new Error(formatGeminiError(error));
  }
};

export const compressPrompt = async (text: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: "Compress prompt to dense keywords." },
            contents: { parts: [{ text: text }] }
        });
        return response.text || text;
    } catch (e) {
        return text;
    }
};

export const gradePrompt = async (text: string): Promise<{ score: number, feedback: string[], suggestions: string[] }> => {
    const ai = getAiClient();
    const schema = {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "feedback", "suggestions"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: { 
                systemInstruction: "Grade this prompt (1-10) and suggest improvements.",
                responseMimeType: "application/json",
                responseSchema: schema as any
            },
            contents: { parts: [{ text: text }] }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { score: 0, feedback: ["Error grading prompt."], suggestions: [] };
    }
};

export const generateStyleTransferPrompt = async (
    subjectImage: ImagePart, 
    styleImage: ImagePart, 
    options: { 
        aspectRatio?: string | null, 
        userDescription?: string, 
        backgroundReference?: ImagePart | null,
        preset?: ModelPreset,
        styleStrength?: number,
        isUniversal?: boolean,
        sourceType?: string | null
    } = {}
): Promise<PromptData> => {
    const ai = getAiClient();
    let systemInstruction = `You are a Style Transfer Specialist. Describe the SUBJECT from Image 1, applying the VISUAL STYLE of Image 2. Output JSON.
    
    **OUTPUT GOAL**: Generate a prompt optimized for: ${options.preset || 'standard'}.`;
    
    if (options.aspectRatio) systemInstruction += `\nTarget Aspect Ratio: ${options.aspectRatio}.`;
    if (options.userDescription) systemInstruction += `\nUser Context: "${options.userDescription}".`;
    if (options.backgroundReference) systemInstruction += `\n**BACKGROUND COMPOSITING**: Use the environment/background from the Background Reference Image (Image 3).`;

    if (options.isUniversal) {
        systemInstruction += `\n**MASTER PROMPT ENABLED**: OMIT age, specific facial identity, hair color, and eye color. Use gender only.`;
    }

    if (options.sourceType) {
        systemInstruction += `\n**SUBJECT INPUT CLASSIFICATION**: The user explicitly defines the SUBJECT image as "${options.sourceType}".`;
    }

    const strength = options.styleStrength || 50;
    if (strength < 30) {
        systemInstruction += `\n**STYLE INTENSITY (Low):** Prioritize structural integrity.`;
    } else if (strength > 70) {
        systemInstruction += `\n**STYLE INTENSITY (High):** Prioritize style medium and abstraction.`;
    }

    const contents: any[] = [{ text: "SUBJECT SOURCE (Image 1):" }, subjectImage, { text: "STYLE SOURCE (Image 2):" }, styleImage];
    
    if (options.backgroundReference) {
        contents.push({ text: "BACKGROUND REFERENCE (Image 3):" });
        contents.push(options.backgroundReference);
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: { 
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: promptSchema as any
            },
            contents: { parts: contents }
        });
        
        if (response.text) {
             const data = JSON.parse(response.text) as PromptData;
             data.isUniversal = options.isUniversal;
             return data;
        }
        throw new Error("No response");
    } catch (e) {
        throw new Error(formatGeminiError(e));
    }
};

export const predictModelOutcome = async (prompt: string, model: ModelPreset): Promise<string> => {
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: `Predict how ${model} will interpret this prompt.` },
            contents: { parts: [{ text: prompt }] }
        });
        return response.text || "Analysis unavailable.";
    } catch (e) {
        return "Failed to generate prediction.";
    }
};

export const generateImage = async (
    prompt: string, 
    options: { 
        aspectRatio?: string, 
        seed?: number,
        subjectReference?: ImagePart | null,
        styleReference?: ImagePart | null
    } = {}
): Promise<string> => {
  const ai = getAiClient();
  const { aspectRatio = "1:1", seed, subjectReference, styleReference } = options;
  
  let systemInstruction = "You are a creative image generation model.";
  const parts: any[] = [];

  if (subjectReference) {
      systemInstruction += "\n**FACE/SUBJECT REFERENCE ENABLED**: You MUST generate a new image where the main subject has the EXACT facial identity and body features of the attached 'Subject Reference'. Maintain this character consistency.";
      parts.push({ text: "SUBJECT REFERENCE (Identity Context):" });
      parts.push(subjectReference);
  }

  if (styleReference) {
      systemInstruction += "\n**STYLE REFERENCE ENABLED**: You MUST generate a new image that adopts the color palette, lighting mood, and artistic style (e.g., painting style, film stock) of the attached 'Style Reference'.";
      parts.push({ text: "STYLE REFERENCE (Aesthetic Context):" });
      parts.push(styleReference);
  }

  parts.push({ text: `PROMPT: ${prompt}` });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        systemInstruction,
        imageConfig: { aspectRatio: aspectRatio as any },
        seed: seed || undefined
      }
    });

    let base64Image = "";
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                base64Image = part.inlineData.data;
                break;
            }
        }
    }
    if (!base64Image) throw new Error("No image generated.");
    return `data:image/png;base64,${base64Image}`;
  } catch (error) {
    console.error("Image generation error", error);
    throw new Error(formatGeminiError(error));
  }
}

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
    const ai = getAiClient();
    try {
        const resizedBase64 = await resizeBase64(base64Image, 1280);
        const imagePart = base64ToImagePart(resizedBase64);
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, { text: prompt }] }
        });

        let newImage = "";
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    newImage = part.inlineData.data;
                    break;
                }
            }
        }
        if (!newImage) throw new Error("No image generated.");
        return `data:image/png;base64,${newImage}`;
    } catch (error) {
        console.error("Image edit error", error);
        throw new Error(formatGeminiError(error));
    }
};

export const exportToJSON = (data: any[]) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `prompts_${new Date().toISOString().slice(0,10)}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const exportToCSV = (data: any[]) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(','))
    ];
    const csvStr = csvRows.join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `prompts_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
