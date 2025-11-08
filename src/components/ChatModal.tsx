import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2 } from 'lucide-react';
import { getChatbotResponse } from '@/lib/gemini-client';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  options?: string[];
  type?: 'text' | 'choice' | 'range';
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing conversation on mount
  useEffect(() => {
    if (isOpen && user) {
      loadConversationHistory();
    }
  }, [isOpen, user]);

  const loadConversationHistory = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('conversational_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile && (profile as any).conversation_history && (profile as any).conversation_history.length > 0) {
        // Convert history to messages
        const historyMessages: Message[] = [];
        (profile as any).conversation_history.forEach((item: any) => {
          historyMessages.push({
            role: 'assistant',
            content: item.question,
            options: item.options,
            type: item.type || 'text',
          });
          historyMessages.push({
            role: 'user',
            content: item.answer,
          });
        });
        setMessages(historyMessages);
        setProfileCompleteness((profile as any).profile_completeness || 0);
      } else {
        // Start with welcome message
        setMessages([
          {
            role: 'assistant',
            content:
              "Bonjour ! Je suis l'assistant LUMIN<span class='text-xs align-super'>ᵉ</span>. Je vais vous poser quelques questions pour mieux comprendre vos besoins et vous proposer les biens immobiliers les plus adaptés. Commençons : quel type de bien recherchez-vous ?",
            type: 'text',
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // Start fresh on error
      setMessages([
        {
          role: 'assistant',
          content:
            "Bonjour ! Je suis l'assistant LUMIN<span class='text-xs align-super'>ᵉ</span>. Je vais vous poser quelques questions pour mieux comprendre vos besoins et vous proposer les biens immobiliers les plus adaptés. Commençons : quel type de bien recherchez-vous ?",
          type: 'text',
        },
      ]);
    }
  };

  const handleSendMessage = async (message?: string) => {
    const textToSend = message || inputValue.trim();
    if (!textToSend || isLoading || !user) return;

    // Add user message to chat
    const userMessage: Message = {
      role: 'user',
      content: textToSend,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Build conversation history for API
      const conversationHistory = messages
        .filter((msg) => msg.role === 'user')
        .map((msg, index) => ({
          question: messages[index * 2]?.content || '',
          answer: msg.content,
        }));

      // Call Gemini chatbot
      const response = await getChatbotResponse(textToSend, conversationHistory);

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.question,
        options: response.options,
        type: response.type,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setProfileCompleteness(response.profileCompleteness);

      // Update conversation in database
      await supabase.from('conversational_profiles').upsert({
        user_id: user.id,
        conversation_history: [
          ...conversationHistory,
          {
            question: response.question,
            answer: textToSend,
            type: response.type,
          },
        ],
        extracted_preferences: response.extractedPreferences,
        profile_completeness: response.profileCompleteness,
        updated_at: new Date().toISOString(),
      } as any);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Désolé, une erreur s'est produite. Pouvez-vous reformuler votre réponse ?",
          type: 'text',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-lumine-neutral-100 rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-lumine-primary to-lumine-neutral-800 text-lumine-neutral-100 p-6 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lumine-accent flex items-center justify-center">
                <Sparkles className="text-lumine-primary" size={20} />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl">
                  Assistant LUMIN<span className="text-xs align-super">ᵉ</span>
                </h2>
                <p className="text-sm text-lumine-neutral-300">
                  Profil complété à {profileCompleteness}%
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-lumine-neutral-100/10 hover:bg-lumine-neutral-100/20 flex items-center justify-center transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="bg-lumine-neutral-200 h-2">
            <div
              className="bg-lumine-accent h-full transition-all duration-500"
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-lumine-accent text-lumine-primary'
                      : 'bg-white text-lumine-neutral-900 shadow-sm'
                  }`}
                >
                  <div
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />

                  {/* Options (for choice questions) */}
                  {msg.options && msg.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.options.map((option, optIndex) => (
                        <button
                          key={optIndex}
                          onClick={() => handleOptionClick(option)}
                          disabled={isLoading}
                          className="w-full text-left px-4 py-2 rounded-lg bg-lumine-neutral-100 hover:bg-lumine-accent hover:text-lumine-primary transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <Loader2 className="text-lumine-accent animate-spin" size={20} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-lumine-neutral-300">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre réponse..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-lumine-neutral-300 focus:outline-none focus:ring-2 focus:ring-lumine-accent text-lumine-neutral-900 placeholder-lumine-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-3 rounded-xl bg-lumine-accent hover:bg-lumine-accent-dark text-lumine-primary font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
