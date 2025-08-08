import { useState, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contextText, setContextText] = useState('');
  const [chunks, setChunks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // ✅ تجزئة النص إلى مقاطع
  const splitTextIntoChunks = (text) => {
    const minChunkSize = 300;
    const maxChunkSize = 500;
    const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
    const newChunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length >= minChunkSize) {
        newChunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) {
      newChunks.push(currentChunk.trim());
    }
    return newChunks;
  };

  // ✅ تحميل ملف النحو
  useEffect(() => {
    const fetchNa7wText = async () => {
      try {
        const response = await fetch('/na7w.txt');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        setContextText(text);
        console.log('✅ تم تحميل na7w.txt:\n"' + text.substring(0, 300) + '"');
      } catch (error) {
        console.error('❌ خطأ في تحميل na7w.txt:', error);
      }
    };
    fetchNa7wText();
  }, []);

  // ✅ تقسيم النص إلى مقاطع بعد التحميل
  useEffect(() => {
    if (contextText) {
      const newChunks = splitTextIntoChunks(contextText);
      setChunks(newChunks);
      console.log("✅ عدد المقاطع:", newChunks.length);
    }
  }, [contextText]);

  // ✅ إرسال الرسالة
  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = { text: input, isUser: true };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const query = input.toLowerCase();
        const relevantChunks = [];
        const maxChunks = 5;

        // ✅ تحسين البحث: بدلاً من `includes` فقط، نستخدم دوال أقوى
        for (const chunk of chunks) {
          const normalizedChunk = chunk.toLowerCase();
          if (
            normalizedChunk.includes(query) ||
            query.split(' ').some(word => normalizedChunk.includes(word))
          ) {
            relevantChunks.push(chunk);
            if (relevantChunks.length >= maxChunks) break;
          }
        }

        let finalPrompt = '';
        let aiResponse = '';

        if (relevantChunks.length > 0) {
          finalPrompt = `أنت مساعد ذكاء اصطناعي متخصص في النحو العربي. استخدم المعلومات التالية للإجابة عن سؤال المستخدم.\n\nالمعلومات:\n${relevantChunks.join('\n\n')}\n\nسؤال المستخدم: ${input}`;
        } else {
          aiResponse = "❌ لم أجد معلومات حول سؤالك في دليل النحو.";
        }

        if (finalPrompt) {
          const response = await fetch('http://localhost:3001/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: input }),
          });

          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          aiResponse = data.response || "❌ حدث خطأ أثناء توليد الرد.";
        }

        // ✅ تقسيم الرد إلى أسطر منفصلة لكل فقاعة
        const aiLines = aiResponse.split('\n').filter(line => line.trim() !== '');
        aiLines.forEach((line) => {
          setMessages((prevMessages) => [...prevMessages, { text: line, isUser: false }]);
        });

      } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        setMessages((prev) => [...prev, { text: "❌ عذرًا، حدث خطأ أثناء معالجة طلبك.", isUser: false }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="chat-widget-wrapper">
      {!isOpen && (
        <button className="chat-toggle-button" onClick={() => setIsOpen(true)}>💬</button>
      )}

      {isOpen && (
        <div className="chat-widget">
          <div className="chat-header">
            <span>اسأل النحو 🤖</span>
            <button onClick={() => setIsOpen(false)}>✖️</button>
          </div>

          <div className="messages">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg.text} isUser={msg.isUser} />
            ))}
            {isLoading && <ChatMessage message="جاري البحث عن الإجابة..." isUser={false} />}
          </div>

          <div className="input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="اكتب سؤالك هنا..."
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>إرسال</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
