import React, { useState } from 'react';
import { User, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface Action {
  label: string;
  value: string;
  primary?: boolean;
}

export interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date | string;
  options?: string[];
  type?: 'text' | 'input' | 'select' | 'typing' | 'action';
  inputType?: string;
  actions?: Action[];
}

interface ChatBubbleProps {
  message: Message;
  onOptionClick?: (option: string) => void;
  onInputSubmit?: (value: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onOptionClick, onInputSubmit }) => {
  const [inputValue, setInputValue] = useState('');

  const time = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onInputSubmit?.(inputValue.trim());
      setInputValue('');
    }
  };

  // compute suggestions for country autocomplete
  const suggestions = (message.type === 'input' && message.inputType === 'country' && message.options && inputValue)
    ? message.options
      .filter(o => o.toLowerCase().startsWith(inputValue.toLowerCase()))
      .slice(0, 8)
    : [];

  return (
    <div className={`d-flex ${message.isBot ? 'justify-content-start' : 'justify-content-end'} mb-3`}>
      <div style={{ maxWidth: '85%', minWidth: '200px' }} className="d-flex flex-column">

        {/* Header (Avatar + Name) */}
        <div className={`d-flex align-items-center gap-2 mb-1 ${!message.isBot ? 'flex-row-reverse' : ''}`}>
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: '32px',
              height: '32px',
              background: message.isBot ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
              color: 'white'
            }}
          >
            {message.isBot ? <Sparkles size={16} /> : <User size={16} />}
          </div>
          <span className="subtitle" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {message.isBot ? 'Assistant' : 'You'}
          </span>
        </div>

        {/* Bubble Content */}
        <div className={`message-bubble ${message.isBot ? 'message-bot' : 'message-user'}`}>
          {message.type === 'typing' ? (
            <div className="d-flex gap-1 align-items-center" style={{ height: '24px' }}>
              <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true" style={{ width: '0.5rem', height: '0.5rem' }}></span>
              <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true" style={{ width: '0.5rem', height: '0.5rem', animationDelay: '0.2s' }}></span>
              <span className="spinner-grow spinner-grow-sm" role="status" aria-hidden="true" style={{ width: '0.5rem', height: '0.5rem', animationDelay: '0.4s' }}></span>
            </div>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
          )}
        </div>

        {/* Options */}
        {message.options && message.options.length > 0 && message.type !== 'input' && (
          <div className="row g-2 mt-2" style={{ marginLeft: message.isBot ? '0' : 'auto', width: '100%' }}>
            {message.options.map((option, index) => (
              <motion.div
                key={index}
                className="col-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.button
                  onClick={() => onOptionClick?.(option)}
                  className="btn-secondary w-100 h-100 d-flex align-items-center justify-content-center text-center position-relative overflow-hidden"
                  style={{
                    fontSize: '14px',
                    padding: '0.6rem 0.5rem',
                    minHeight: '42px',
                    lineHeight: '1.2',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.03)'
                  }}
                  whileHover={{
                    scale: 1.02,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(var(--primary-rgb), 0.5)',
                    boxShadow: '0 0 15px rgba(var(--primary-rgb), 0.2)'
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {option}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Input Field (for when bot asks for input) */}
        {message.type === 'input' && (
          <form onSubmit={handleSubmit} className="mt-2 w-100">
            <div className="position-relative">
              <input
                type={message.inputType || 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="modern-input"
                placeholder={message.inputType === 'country' ? 'Start typing country...' : 'Type your answer...'}
                autoFocus
              />
              <button
                type="submit"
                className="position-absolute end-0 top-50 translate-middle-y btn-ghost"
                style={{ color: inputValue ? 'var(--primary)' : 'var(--text-secondary)' }}
                disabled={!inputValue.trim()}
              >
                <Send size={18} />
              </button>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="glass-card p-2 mt-1 position-absolute" style={{ zIndex: 100, width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="p-2 rounded hover-bg-white-10 cursor-pointer"
                    onClick={() => { onInputSubmit?.(s); setInputValue(''); }}
                    style={{ cursor: 'pointer' }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </form>
        )}

        {/* Timestamp */}
        {message.type !== 'typing' && (
          <span className={`subtitle mt-1 ${message.isBot ? 'text-start' : 'text-end'}`} style={{ fontSize: '0.7rem', opacity: 0.7 }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;
