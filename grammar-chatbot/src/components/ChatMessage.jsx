import React from 'react';

const ChatMessage = ({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 px-4`}>
      <div
        className={`rounded-xl p-3 max-w-[80%] shadow-lg text-sm sm:text-base leading-relaxed 
        ${isUser ? 'bg-blue-600 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md'}`}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.split('\n').map((line, idx) => (
          <p key={idx} className="mb-1">{line}</p>
        ))}
      </div>
    </div>
  );
};

export default ChatMessage;
