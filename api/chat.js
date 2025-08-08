import axios from 'axios';

export default async function handler(req, res) {
  // 1. يتأكد إن نوع الطلب POST فقط. لو غير كده يرجّع status 405.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. يستقبل الـ prompt من req.body.prompt. لو مش موجود، يرجع 400.
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 3. يستخدم مكتبة axios لإرسال POST request لـ Gemini API.
  // 4. يقرأ مفتاح API من process.env.GEMINI_API_KEY.
  const GEMINI_API_KEY = 'AIzaSyCuSo7Ehty5yv8Y8g1Q3CuWqJDi9XIzX0o';
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await axios.post(API_URL, {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    });

    // 5. يرجّع استجابة بصيغة JSON فيها الـ reply.
    const reply = response.data.candidates[0].content.parts[0].text;
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Error communicating with Gemini API:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Failed to get response from AI' });
  }
}