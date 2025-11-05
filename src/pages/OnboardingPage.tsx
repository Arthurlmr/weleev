import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getRefinementQuestions } from '@/lib/gemini';
import { useAuth } from '@/hooks/useAuth';
import { SearchPreferences, OnboardingMessage, RefinementQuestion } from '@/types';
import { Send } from 'lucide-react';
import './OnboardingPage.css';

type OnboardingStep =
  | 'location'
  | 'propertyType'
  | 'budget'
  | 'rooms'
  | 'parking'
  | 'refinement'
  | 'complete';

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('location');
  const [messages, setMessages] = useState<OnboardingMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Bonjour ! Je vais vous aider à trouver votre bien idéal. Dans quelle ville cherchez-vous ?',
      timestamp: new Date()
    }
  ]);
  const [preferences, setPreferences] = useState<Partial<SearchPreferences>>({});
  const [inputValue, setInputValue] = useState('');
  const [refinementQuestions, setRefinementQuestions] = useState<RefinementQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if user is already onboarded and redirect to feed
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarded')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // If user is already onboarded, redirect to feed
        if (data && (data as { onboarded: boolean }).onboarded) {
          navigate('/feed', { replace: true });
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const addMessage = (content: string, type: 'bot' | 'user') => {
    const newMessage: OnboardingMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleLocationSubmit = async (location: string) => {
    addMessage(location, 'user');
    setPreferences(prev => ({ ...prev, location }));

    setTimeout(() => {
      addMessage('Parfait ! Quel type de bien recherchez-vous ?', 'bot');
      setStep('propertyType');
    }, 500);
  };

  const handlePropertyType = (type: 'apartment' | 'house' | 'any') => {
    const labels = {
      apartment: 'Un appartement',
      house: 'Une maison',
      any: 'Appartement ou maison'
    };
    addMessage(labels[type], 'user');
    setPreferences(prev => ({ ...prev, propertyType: type }));

    setTimeout(() => {
      addMessage('Quel est votre budget maximum ?', 'bot');
      setStep('budget');
    }, 500);
  };

  const handleBudget = (budget: number) => {
    addMessage(`${budget.toLocaleString('fr-FR')}€`, 'user');
    setPreferences(prev => ({ ...prev, maxBudget: budget }));

    setTimeout(() => {
      addMessage('Combien de pièces minimum souhaitez-vous ?', 'bot');
      setStep('rooms');
    }, 500);
  };

  const handleRooms = (rooms: number) => {
    addMessage(`${rooms} pièce${rooms > 1 ? 's' : ''}`, 'user');
    setPreferences(prev => ({ ...prev, minRooms: rooms }));

    setTimeout(() => {
      addMessage('Avez-vous besoin d\'un parking ?', 'bot');
      setStep('parking');
    }, 500);
  };

  const handleParking = async (wantsParking: boolean) => {
    addMessage(wantsParking ? 'Oui' : 'Non', 'user');
    const updatedPreferences = { ...preferences, wantsParking };
    setPreferences(updatedPreferences);

    // Get AI refinement questions
    setLoading(true);
    setTimeout(async () => {
      addMessage('Parfait ! Quelques questions supplémentaires pour affiner votre recherche...', 'bot');

      try {
        const questions = await getRefinementQuestions(updatedPreferences as SearchPreferences);
        setRefinementQuestions(questions);

        if (questions.length > 0) {
          setTimeout(() => {
            addMessage(questions[0].question, 'bot');
            setStep('refinement');
          }, 800);
        }
      } catch (error) {
        console.error('Error getting refinement questions:', error);
        await completeOnboarding(updatedPreferences);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleRefinementAnswer = async (answer: string) => {
    addMessage(answer, 'user');

    const currentQuestion = refinementQuestions[currentQuestionIndex];
    const refinements = {
      ...preferences.refinements,
      [currentQuestion.id]: answer
    };
    setPreferences(prev => ({ ...prev, refinements }));

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < refinementQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      setTimeout(() => {
        addMessage(refinementQuestions[nextIndex].question, 'bot');
      }, 500);
    } else {
      await completeOnboarding({ ...preferences, refinements });
    }
  };

  const completeOnboarding = async (finalPreferences: Partial<SearchPreferences>) => {
    if (!user) return;

    try {
      // Save search preferences
      await supabase.from('searches').insert({
        user_id: user.id,
        location: finalPreferences.location || '',
        property_type: finalPreferences.propertyType || 'any',
        max_budget: finalPreferences.maxBudget || 0,
        min_rooms: finalPreferences.minRooms || 1,
        wants_parking: finalPreferences.wantsParking || false,
        refinements: finalPreferences.refinements || null
      } as any);

      // Update profile
      await (supabase
        .from('profiles') as any)
        .update({ onboarded: true })
        .eq('id', user.id);

      setTimeout(() => {
        addMessage('Merci ! Je cherche maintenant les meilleurs biens pour vous...', 'bot');
        setTimeout(() => {
          setStep('complete');
          navigate('/feed');
        }, 1500);
      }, 500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (step === 'location') {
      handleLocationSubmit(inputValue);
    } else if (step === 'budget') {
      const budget = parseInt(inputValue.replace(/\s/g, ''));
      if (!isNaN(budget)) {
        handleBudget(budget);
      }
    } else if (step === 'refinement') {
      handleRefinementAnswer(inputValue);
    }

    setInputValue('');
  };

  const renderOptions = () => {
    if (step === 'propertyType') {
      return (
        <div className="options-container">
          <button className="chip" onClick={() => handlePropertyType('apartment')}>
            Appartement
          </button>
          <button className="chip" onClick={() => handlePropertyType('house')}>
            Maison
          </button>
          <button className="chip" onClick={() => handlePropertyType('any')}>
            Indifférent
          </button>
        </div>
      );
    }

    if (step === 'rooms') {
      return (
        <div className="options-container">
          {[1, 2, 3, 4, 5].map(num => (
            <button key={num} className="chip" onClick={() => handleRooms(num)}>
              {num} {num === 1 ? 'pièce' : 'pièces'}
            </button>
          ))}
        </div>
      );
    }

    if (step === 'parking') {
      return (
        <div className="options-container">
          <button className="chip" onClick={() => handleParking(true)}>
            Oui
          </button>
          <button className="chip" onClick={() => handleParking(false)}>
            Non
          </button>
        </div>
      );
    }

    if (step === 'refinement' && refinementQuestions.length > 0) {
      const currentQuestion = refinementQuestions[currentQuestionIndex];
      if (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'chips') {
        return (
          <div className="options-container">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                className="chip"
                onClick={() => handleRefinementAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
        );
      }
    }

    return null;
  };

  const needsTextInput =
    step === 'location' ||
    step === 'budget' ||
    (step === 'refinement' &&
      refinementQuestions[currentQuestionIndex]?.type === 'text');

  return (
    <div className="onboarding-page">
      <div className="onboarding-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="onboarding-container">
        <div className="messages-container">
          {messages.map(message => (
            <div
              key={message.id}
              className={`message ${message.type === 'bot' ? 'message-bot' : 'message-user'}`}
            >
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message message-bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {renderOptions()}

        {needsTextInput && (
          <form onSubmit={handleSubmit} className="input-form">
            <input
              type="text"
              className="input"
              placeholder={
                step === 'location'
                  ? 'Paris, Lyon, Bordeaux...'
                  : step === 'budget'
                  ? '300000'
                  : 'Votre réponse...'
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!inputValue.trim()}>
              <Send size={20} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
