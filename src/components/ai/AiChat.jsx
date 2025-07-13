import React, { useState, useRef, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../services/supabaseClient';

const AiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `👋 Hi! I'm your QSuite AI assistant. I can help you with:

🔹 **QSuite Features** - Learn about test management capabilities
🔹 **Best Practices** - Get testing methodology advice  
🔹 **Navigation Help** - Find your way around the platform
🔹 **Tips & Tricks** - Optimize your testing workflow

Ask me questions like:
• "How do I organize test cases in QSuite?"
• "What's the best way to track test results?"
• "How can I collaborate with my team on testing?"
• "Tell me about QSuite's reporting features"

What would you like to know about QSuite?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: userMessage.content,
          context: {
            type: 'general_chat',
            product: 'QSuite'
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('AI Chat response data:', data);

      if (data?.content || data?.message) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: data.content || data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data?.error || 'Failed to get AI response');
      }
    } catch (error) {
      console.error('Error calling AI chat:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.

In the meantime, here are some quick QSuite tips:
• Use the **Test Cases** tab to create and manage your tests
• **Queue** tab helps you organize test execution
• **Files** tab for managing test artifacts
• Try the **AI Test Generator** for automated test creation`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-circle btn-primary btn-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-base-100 rounded-lg shadow-2xl border border-base-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-primary text-primary-content rounded-t-lg">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-5 h-5" />
          <h3 className="font-semibold">QSuite AI Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="btn btn-ghost btn-sm btn-circle text-primary-content hover:bg-primary-focus"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-primary text-primary-content ml-4'
                  : message.isError
                  ? 'bg-error text-error-content mr-4'
                  : 'bg-base-200 text-base-content mr-4'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
              
              <div className="text-xs opacity-70 mt-2">
                {formatTimestamp(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-base-200 rounded-lg p-3 mr-4">
              <div className="flex items-center space-x-2">
                <span className="loading loading-dots loading-sm"></span>
                <span className="text-sm text-base-content/70">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t border-base-300 bg-base-50">
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setInputValue('How do I organize test cases?')}
            className="btn btn-xs btn-ghost text-xs"
            disabled={isLoading}
          >
            <LightBulbIcon className="w-3 h-3" />
            Organization
          </button>
          <button
            onClick={() => setInputValue('QSuite best practices')}
            className="btn btn-xs btn-ghost text-xs"
            disabled={isLoading}
          >
            <ClipboardDocumentIcon className="w-3 h-3" />
            Best Practices
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-base-300">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about QSuite..."
            className="textarea textarea-bordered textarea-sm flex-1 resize-none"
            rows="2"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="btn btn-primary btn-sm"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;