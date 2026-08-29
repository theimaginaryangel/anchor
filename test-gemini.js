require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI, Type } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-3.7-flash' });
  
  const routingSchema = {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING },
      reasoning: { type: Type.STRING },
      response_text: { type: Type.STRING }
    },
    required: ["action", "reasoning", "response_text"]
  };
  
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: "hi" }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: routingSchema,
      }
    });
    console.log(result.response.text());
  } catch (e) {
    console.error(e);
  }
}
test();
