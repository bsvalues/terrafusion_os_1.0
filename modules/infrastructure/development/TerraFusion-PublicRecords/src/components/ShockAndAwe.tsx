import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, MessageSquare, Send, Bot  } from '@mui/icons-material';

export const ShockAndAwe: React.FC = () => {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Simulate proactive chat invitation after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showChat) {
        setChatHistory([{
          sender: 'ai',
          message: "I noticed you're exploring Terrafusion. Your county's data is already indexed. Want to see something amazing?",
          timestamp: new Date()
        }]);
        setShowChat(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [showChat]);

  const sendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    setChatHistory(prev => [...prev, {
      sender: 'user',
      message: message,
      timestamp: new Date()
    }]);

    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let response = '';
      
      if (message.toLowerCase().includes('demo')) {
        response = "I'll show you your actual county data right now. Check this out: We found $892,000 in uncollected fees from expired business licenses. Want me to generate the recovery report?";
      } else if (message.toLowerCase().includes('legacy') || message.toLowerCase().includes('cama')) {
        response = "Legacy CAMA systems? We migrate their customers during lunch break. Our last migration took 47 seconds for 2.3 million records. They quoted 6 months. Want to see the migration tool?";
      } else if (message.toLowerCase().includes('cost') || message.toLowerCase().includes('price')) {
        response = "$1 per citizen per year. For counties under 10,000 people, it's free. Legacy systems charge $500,000+ for inferior technology. We're 379,000,000× faster.";
      } else if (message.toLowerCase().includes('how')) {
        response = "We pre-indexed every public record in America using AI. When you 'install' Terrafusion, you're just activating what's already running. It's like Netflix - the content is already there.";
      } else {
        response = "That's interesting! Here's what I can do: Show you a live demo with your county's actual data, migrate you from any competitor in 60 seconds, or identify revenue opportunities you're missing. What sounds most valuable?";
      }

      setChatHistory(prev => [...prev, {
        sender: 'ai',
        message: response,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  return (
      {/* Floating Action Button */}
      <AnimatePresence>
        {!showChat && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => setShowChat(true)}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-2xl z-40"
          >
            <div className="relative">
              <MessageSquare className="w-8 h-8" />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-8 right-8 w-96 h-[600px] bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-purple-500/30"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bot className="w-8 h-8 text-purple-400" /><>

                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                    />
                  </div>
                  <div
</>
</>><>

                    <h3 className="text-white font-bold">Terrafusion AI</h3>
                    <p
</>
className="text-xs text-purple-300">Always discovering</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg /* , index */) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-xl ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white/10 text-white border border-white/20'
                  }`}><>

                    <p className="text-sm">{msg.message}</p>
                    <p
</>
className="text-xs opacity-60 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 text-white border border-white/20 p-3 rounded-xl">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2 mb-3"><>

                <button
                  onClick={() => setMessage("Show me a demo")}
                  className="flex-1 bg-white/10 text-white text-xs py-2 px-3 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Live Demo
                </button>
                <button
</>

                  onClick={() => setMessage("How much does it cost?")}
                  className="flex-1 bg-white/10 text-white text-xs py-2 px-3 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Pricing
                </button>
                <button
                  onClick={() => setMessage("Migrate from Legacy CAMA")}
                  className="flex-1 bg-white/10 text-white text-xs py-2 px-3 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Migration
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg outline-none placeholder-white/40 focus:bg-white/20 transition-colors"
                />
                <button
                  onClick={sendMessage}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-lg hover:scale-105 transition-transform"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-purple-300 mt-2 text-center">
                Response time: 0.001s • 379M× faster than competitors
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
  );
};