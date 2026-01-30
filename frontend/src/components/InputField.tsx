import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface InputFieldProps {
  onSend: (message: string) => void;
  placeholder?: string;
  initialValue?: string;
}

const InputField: React.FC<InputFieldProps> = ({ onSend, placeholder, initialValue = '' }) => {
  const [message, setMessage] = useState(initialValue);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessage('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-card p-3">
      <div className="d-flex gap-2 align-items-center">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || 'Type your message...'}
          className="modern-input"
          style={{
            height: '48px',
            fontSize: '1rem'
          }}
          aria-label="Type your message"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="btn-primary d-flex align-items-center justify-content-center"
          style={{
            minWidth: '100px',
            height: '48px',
            opacity: message.trim() ? 1 : 0.6,
            cursor: message.trim() ? 'pointer' : 'not-allowed'
          }}
          aria-label="Send message"
        >
          <Send className="me-2" size={18} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};

export default InputField;