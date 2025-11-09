import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { CriteriaChecklist } from './CriteriaChecklist';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  quickReplies?: string[];
  evasiveReplies?: string[];
}

interface ChatStructuredResponse {
  nextQuestion: {
    id: number;
    text: string;
    quickReplies: string[];
    evasiveReplies: string[];
  } | null;
  extractedCriteria: Record<string, any>;
  allCriteriaFilled: boolean;
  profileCompleteness: number;
  criteriaFilled: number;
  assistantMessage: string;
}

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [criteriaFilled, setCriteriaFilled] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [allCriteriaFilled, setAllCriteriaFilled] = useState(false);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<string[]>([]);
  const [currentEvasiveReplies, setCurrentEvasiveReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load profile and start conversation
  useEffect(() => {
    if (isOpen && user) {
      loadProfileAndStartConversation();
    }
  }, [isOpen, user]);

  const loadProfileAndStartConversation = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('conversational_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        setProfileCompleteness((profile as any).profile_completeness_score || 0);
        setCriteriaFilled((profile as any).criteria_filled || 0);

        // Check if profile is complete
        if ((profile as any).criteria_filled >= 19) {
          setAllCriteriaFilled(true);
          setMessages([
            {
              role: 'assistant',
              content:
                "Parfait ! Votre profil de recherche est complet. Je peux maintenant vous proposer des biens parfaitement adaptés à vos critères. N'hésitez pas à modifier vos préférences si vos besoins évoluent.",
            },
          ]);
        } else {
          // Start conversation
          setMessages([
            {
              role: 'assistant',
              content:
                "Bonjour ! Je suis l'assistant LUMIN<span class='text-xs align-super'>ᵉ</span>. Je vais vous poser quelques questions pour mieux comprendre vos besoins et vous proposer les biens immobiliers les plus adaptés. Vous pouvez répondre librement ou utiliser les boutons de réponse rapide. Commençons !",
            },
          ]);

          // Send empty message to get first question
          await handleSendMessage('Bonjour', true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessages([
        {
          role: 'assistant',
          content:
            "Bonjour ! Je suis l'assistant LUMIN<span class='text-xs align-super'>ᵉ</span>. Je vais vous poser quelques questions pour mieux comprendre vos besoins. Commençons !",
        },
      ]);
    }
  };

  const handleSendMessage = async (message?: string, skipUserMessage = false) => {
    const textToSend = message || inputValue.trim();
    if (!textToSend || isLoading || !user) return;

    // Add user message to chat (if not skipped)
    if (!skipUserMessage) {
      const userMessage: Message = {
        role: 'user',
        content: textToSend,
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    setInputValue('');
    setIsLoading(true);

    try {
      // Call new gemini-chat-structured Edge Function
      const { data, error } = await supabase.functions.invoke('gemini-chat-structured', {
        body: {
          userId: user.id,
          message: textToSend,
        },
      });

      if (error) throw error;

      const response: ChatStructuredResponse = data;

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.assistantMessage,
        quickReplies: response.nextQuestion?.quickReplies || [],
        evasiveReplies: response.nextQuestion?.evasiveReplies || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setProfileCompleteness(response.profileCompleteness);
      setCriteriaFilled(response.criteriaFilled);
      setAllCriteriaFilled(response.allCriteriaFilled);
      setCurrentQuickReplies(response.nextQuestion?.quickReplies || []);
      setCurrentEvasiveReplies(response.nextQuestion?.evasiveReplies || []);

      // Reload profile to update checklist
      const { data: updatedProfile } = await supabase
        .from('conversational_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (updatedProfile) {
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Désolé, une erreur s'est produite. Pouvez-vous reformuler votre réponse ?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReplyClick = (reply: string) => {
    handleSendMessage(reply);
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
          className="bg-lumine-neutral-100 rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col lg:flex-row overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Sidebar - Criteria Checklist (Desktop) */}
          <div className="hidden lg:block w-80 bg-white border-r border-lumine-neutral-400/20 p-4 overflow-y-auto">
            <CriteriaChecklist profile={userProfile} />
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-lumine-primary to-lumine-neutral-800 text-lumine-neutral-100 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-lumine-accent flex items-center justify-center">
                  {allCriteriaFilled ? (
                    <CheckCircle2 className="text-lumine-primary" size={20} />
                  ) : (
                    <Sparkles className="text-lumine-primary" size={20} />
                  )}
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl">
                    Assistant LUMIN<span className="text-xs align-super">ᵉ</span>
                  </h2>
                  <p className="text-sm text-lumine-neutral-300">
                    {allCriteriaFilled
                      ? 'Profil complété !'
                      : `${criteriaFilled}/19 critères remplis`}
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-lumine-neutral-100">
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

            {/* Quick Replies (if available) */}
            {currentQuickReplies.length > 0 && !isLoading && !allCriteriaFilled && (
              <div className="px-6 py-3 bg-white border-t border-lumine-neutral-300">
                <p className="text-xs text-lumine-neutral-700 mb-2">Réponses rapides :</p>
                <div className="flex flex-wrap gap-2">
                  {currentQuickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReplyClick(reply)}
                      className="px-4 py-2 rounded-lg bg-lumine-accent/10 hover:bg-lumine-accent hover:text-white transition-colors text-sm font-medium border border-lumine-accent text-lumine-primary"
                    >
                      {reply}
                    </button>
                  ))}
                  {currentEvasiveReplies.length > 0 && (
                    <>
                      {currentEvasiveReplies.map((reply, index) => (
                        <button
                          key={`evasive-${index}`}
                          onClick={() => handleQuickReplyClick(reply)}
                          className="px-4 py-2 rounded-lg bg-lumine-neutral-200 hover:bg-lumine-neutral-300 transition-colors text-sm text-lumine-neutral-700"
                        >
                          {reply}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 bg-white border-t border-lumine-neutral-300">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    allCriteriaFilled
                      ? 'Votre profil est complet !'
                      : 'Tapez votre réponse ou utilisez les boutons...'
                  }
                  disabled={isLoading || allCriteriaFilled}
                  className="flex-1 px-4 py-3 rounded-xl border border-lumine-neutral-300 focus:outline-none focus:ring-2 focus:ring-lumine-accent text-lumine-neutral-900 placeholder-lumine-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading || allCriteriaFilled}
                  className="px-6 py-3 rounded-xl bg-lumine-accent hover:bg-lumine-accent-dark text-lumine-primary font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
