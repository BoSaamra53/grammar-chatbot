require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { splitTextIntoChunks, findRelevantChunks } = require('./chunks');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

let loadedChunks = [];

// Load na7w.txt and split into chunks on server start
const na7wPath = path.join(__dirname, 'na7w.txt');
fs.readFile(na7wPath, 'utf-8', (err, data) => {
  if (err) {
    console.error('❌ فشل في تحميل ملف na7w.txt:', err);
    return;
  }
  loadedChunks = splitTextIntoChunks(data);
  console.log('✅ تم تحميل وتقطيع الملف، عدد المقاطع:', loadedChunks.length);
});

app.post('/chat', async (req, res) => {
  const { question } = req.body;
  console.log('السؤال:', question);

  if (!question) {
    return res.status(400).json({ error: 'لم يتم إرسال سؤال.' });
  }

  const relevantChunks = findRelevantChunks(question, loadedChunks, 5);
  console.log('عدد المقاطع المسترجعة:', relevantChunks.length);

  // ✨ برومبت أكثر مرونة
  const finalPrompt = `أنت مساعد ذكي متخصص في النحو العربي. إليك بعض المعلومات المرجعية من دليل النحو، ولكن يمكنك أيضًا استخدام معرفتك العامة إن لم تكن المعلومة موجودة بشكل مباشر.\n\nمعلومات مرجعية:\n${relevantChunks.join('\n\n')}\n\nسؤال المستخدم: ${question}\n\nإذا كنت تعرف الإجابة حتى لو لم تكن مذكورة مباشرة، فلا تتردد في تقديمها.`;

  console.log('البرومبت النهائي المرسل إلى Gemini:', finalPrompt);

  try {
    const geminiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: finalPrompt }],
          },
        ],
      }
    );

    const aiResponse = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '❌ لم أتمكن من توليد إجابة.';
    console.log('الرد الكامل:', aiResponse);
    res.json({ response: aiResponse });
  } catch (error) {
    console.error('خطأ في استدعاء Gemini:', error.message);
    res.status(500).json({ error: '❌ حدث خطأ أثناء الاتصال بـ Gemini.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${port}`);
});
