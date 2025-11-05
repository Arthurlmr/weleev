import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { searchLocation, createSearch, getProperties, mapPropertyTypeToMelo } from '@/lib/melo';
import { generateAiQuestions } from '@/lib/gemini';
import { Send, Loader2, Check } from 'lucide-react';
import './OnboardingPage.css';

type OnboardingStep = 'location' | 'transaction' | 'propertyType' | 'budget' | 'rooms' | 'refine' | 'ai-questions' | 'loading';

interface FixedPreferences {
  location: string;
  locationId: string;
  locationName: string;
  transactionType: 0 | 1;
  propertyType: 'apartment' | 'house' | 'any';
  budgetMax: number;
  roomMin: number;
}

interface AiQuestion {
  id: string;
  question: string;
  type: 'toggle' | 'slider' | 'chips' | 'text';
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: string[];
  meloMapping: {
    field: string;
    value: any;
  };
}

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if already onboarded
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

        if (data && (data as { onboarded: boolean }).onboarded) {
          navigate('/feed', { replace: true });
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const [step, setStep] = useState<OnboardingStep>('location');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fixed preferences
  const [fixedPrefs, setFixedPrefs] = useState<Partial<FixedPreferences>>({});

  // AI questions
  const [aiQuestions, setAiQuestions] = useState<AiQuestion[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Record<string, any>>({});
  const [currentAiQuestionIndex, setCurrentAiQuestionIndex] = useState(0);

  // Location autocomplete
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Budget slider values based on transaction type
  const budgetRanges = {
    sale: { min: 50000, max: 5000000, step: 10000, default: 300000 },
    rental: { min: 300, max: 5000, step: 50, default: 1000 },
  };

  // Search location with debounce
  useEffect(() => {
    if (locationQuery.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const results = await searchLocation(locationQuery, 'city');
        setLocationSuggestions(results.slice(0, 5));
      } catch (err) {
        console.error('Error searching location:', err);
      } finally {
        setSearchingLocation(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleLocationSelect = (location: any) => {
    setFixedPrefs(prev => ({
      ...prev,
      location: location['@id'],
      locationId: location['@id'],
      locationName: location.name,
    }));
    setLocationQuery(location.name);
    setLocationSuggestions([]);
    setStep('transaction');
  };

  const handleTransactionSelect = (type: 0 | 1) => {
    setFixedPrefs(prev => ({ ...prev, transactionType: type }));
    setStep('propertyType');
  };

  const handlePropertyTypeSelect = (type: 'apartment' | 'house' | 'any') => {
    setFixedPrefs(prev => ({ ...prev, propertyType: type }));
    setStep('budget');
  };

  const handleBudgetSelect = (budget: number) => {
    setFixedPrefs(prev => ({ ...prev, budgetMax: budget }));
    setStep('rooms');
  };

  const handleRoomsSelect = (rooms: number) => {
    setFixedPrefs(prev => ({ ...prev, roomMin: rooms }));
    setStep('refine');
  };

  const handleSkipRefinement = async () => {
    await completeOnboarding({});
  };

  const handleStartRefinement = async () => {
    setLoading(true);
    setStep('ai-questions');

    try {
      const context = {
        location: fixedPrefs.locationName,
        transactionType: fixedPrefs.transactionType === 0 ? 'Achat' : 'Location',
        propertyType: fixedPrefs.propertyType,
        budgetMax: fixedPrefs.budgetMax,
        roomMin: fixedPrefs.roomMin,
      };

      const questions = await generateAiQuestions(context);
      setAiQuestions(questions);
      setCurrentAiQuestionIndex(0);
    } catch (err) {
      console.error('Error generating AI questions:', err);
      setError('Erreur lors de la génération des questions. Continuons sans affinement.');
      setTimeout(() => completeOnboarding({}), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleAiQuestionAnswer = (answer: any) => {
    const currentQuestion = aiQuestions[currentAiQuestionIndex];
    setAiAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

    if (currentAiQuestionIndex < aiQuestions.length - 1) {
      setCurrentAiQuestionIndex(prev => prev + 1);
    } else {
      completeOnboarding(aiAnswers);
    }
  };

  const handleSkipAiQuestion = () => {
    if (currentAiQuestionIndex < aiQuestions.length - 1) {
      setCurrentAiQuestionIndex(prev => prev + 1);
    } else {
      completeOnboarding(aiAnswers);
    }
  };

  const completeOnboarding = async (aiRefinements: Record<string, any>) => {
    if (!user || !fixedPrefs.locationId || !fixedPrefs.transactionType === undefined) {
      setError('Informations manquantes');
      return;
    }

    setStep('loading');
    setLoading(true);

    try {
      // 1. Save to Supabase searches table
      const { data: searchData, error: searchError } = await (supabase
        .from('searches') as any)
        .insert({
          user_id: user.id,
          location: fixedPrefs.locationName!,
          property_type: fixedPrefs.propertyType || 'any',
          max_budget: fixedPrefs.budgetMax!,
          min_rooms: fixedPrefs.roomMin || 1,
          wants_parking: false,
          refinements: aiRefinements,
        })
        .select()
        .single();

      if (searchError || !searchData) throw searchError || new Error('Failed to create search');

      // 2. Build Melo search criteria
      const meloSearchData: any = {
        title: `Recherche ${fixedPrefs.locationName}`,
        transactionType: fixedPrefs.transactionType!,
        propertyTypes: mapPropertyTypeToMelo(fixedPrefs.propertyType!),
        budgetMax: fixedPrefs.budgetMax!,
        roomMin: fixedPrefs.roomMin || 1,
        includedCities: [fixedPrefs.locationId!],
      };

      // Add AI refinements to Melo criteria
      aiQuestions.forEach(q => {
        const answer = aiRefinements[q.id];
        if (answer !== undefined && answer !== null) {
          const mapping = q.meloMapping;
          if (mapping.field === 'expressions') {
            if (!meloSearchData.expressions) meloSearchData.expressions = [];
            meloSearchData.expressions.push(mapping.value);
          } else {
            meloSearchData[mapping.field] = typeof mapping.value === 'string' && mapping.value.includes('{{value}}')
              ? answer
              : mapping.value;
          }
        }
      });

      // 3. Create Melo search
      const meloSearch = await createSearch(meloSearchData);

      // 4. Save Melo search reference
      await (supabase.from('melo_searches') as any).insert({
        user_id: user.id,
        search_id: searchData.id,
        melo_uuid: meloSearch.uuid,
        melo_token: meloSearch.token,
        location_id: fixedPrefs.locationId!,
        location_name: fixedPrefs.locationName!,
        transaction_type: fixedPrefs.transactionType!,
        property_types: mapPropertyTypeToMelo(fixedPrefs.propertyType!),
        budget_max: fixedPrefs.budgetMax!,
        room_min: fixedPrefs.roomMin || 1,
        melo_search_data: meloSearchData,
      });

      // 5. Fetch initial 10 properties
      const propertiesResponse = await getProperties({
        ...meloSearchData,
        itemsPerPage: 10,
        page: 1,
      });

      // 6. Save properties to Supabase
      if (propertiesResponse['hydra:member'].length > 0) {
        const propertiesToInsert = propertiesResponse['hydra:member'].map(prop => ({
          melo_uuid: prop.uuid,
          user_id: user.id,
          melo_search_id: searchData.id,
          property_data: prop,
          title: prop.title,
          price: prop.price,
          surface: prop.surface || null,
          rooms: prop.room || null,
          bedrooms: prop.bedroom || null,
          city: prop.city?.name || '',
          zipcode: prop.city?.zipcode || null,
          property_type: mapPropertyTypeToMelo(fixedPrefs.propertyType!).includes(1) ? 'house' : 'apartment',
          transaction_type: fixedPrefs.transactionType!,
          main_image: prop.pictures?.[0] || prop.picturesRemote?.[0] || null,
          images: prop.pictures || prop.picturesRemote || [],
          virtual_tour: prop.virtualTour || null,
          melo_created_at: prop.createdAt,
          melo_updated_at: prop.updatedAt || null,
        }));

        await (supabase.from('melo_properties') as any).insert(propertiesToInsert);
      }

      // 7. Mark user as onboarded
      await (supabase
        .from('profiles') as any)
        .update({ onboarded: true })
        .eq('id', user.id);

      // 8. Navigate to feed
      navigate('/feed');
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  };

  // Render functions for each step
  const renderLocationStep = () => (
    <div className="onboarding-step">
      <h2>Où cherchez-vous ?</h2>
      <p className="step-subtitle">Entrez le nom d'une ville</p>

      <div className="input-group">
        <input
          type="text"
          className="input"
          placeholder="Paris, Lyon, Marseille..."
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          autoFocus
        />
        {searchingLocation && <Loader2 className="spinner-inline" size={20} />}
      </div>

      {locationSuggestions.length > 0 && (
        <div className="suggestions">
          {locationSuggestions.map((loc, idx) => (
            <button
              key={idx}
              className="suggestion-item"
              onClick={() => handleLocationSelect(loc)}
            >
              <div>
                <strong>{loc.name}</strong>
                {loc.zipcode && <span className="text-muted"> • {loc.zipcode}</span>}
              </div>
              {loc.department && <div className="text-small">{loc.department.name}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderTransactionStep = () => (
    <div className="onboarding-step">
      <h2>Que souhaitez-vous faire ?</h2>
      <div className="button-grid">
        <button
          className="choice-button"
          onClick={() => handleTransactionSelect(0)}
        >
          <div className="choice-icon">🏠</div>
          <div className="choice-label">Acheter</div>
        </button>
        <button
          className="choice-button"
          onClick={() => handleTransactionSelect(1)}
        >
          <div className="choice-icon">🔑</div>
          <div className="choice-label">Louer</div>
        </button>
      </div>
    </div>
  );

  const renderPropertyTypeStep = () => (
    <div className="onboarding-step">
      <h2>Quel type de bien ?</h2>
      <div className="button-grid">
        <button
          className="choice-button"
          onClick={() => handlePropertyTypeSelect('apartment')}
        >
          <div className="choice-icon">🏢</div>
          <div className="choice-label">Appartement</div>
        </button>
        <button
          className="choice-button"
          onClick={() => handlePropertyTypeSelect('house')}
        >
          <div className="choice-icon">🏡</div>
          <div className="choice-label">Maison</div>
        </button>
        <button
          className="choice-button"
          onClick={() => handlePropertyTypeSelect('any')}
        >
          <div className="choice-icon">✨</div>
          <div className="choice-label">Les deux</div>
        </button>
      </div>
    </div>
  );

  const renderBudgetStep = () => {
    const range = fixedPrefs.transactionType === 0 ? budgetRanges.sale : budgetRanges.rental;
    const [budget, setBudget] = useState(range.default);

    return (
      <div className="onboarding-step">
        <h2>Budget maximum ?</h2>
        <p className="step-subtitle">
          {fixedPrefs.transactionType === 0 ? 'Prix d\'achat' : 'Loyer mensuel'}
        </p>

        <div className="budget-display">
          {budget.toLocaleString('fr-FR')} €
        </div>

        <input
          type="range"
          className="slider"
          min={range.min}
          max={range.max}
          step={range.step}
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
        />

        <div className="slider-labels">
          <span>{range.min.toLocaleString('fr-FR')} €</span>
          <span>{range.max.toLocaleString('fr-FR')} €</span>
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={() => handleBudgetSelect(budget)}
        >
          Continuer
        </button>
      </div>
    );
  };

  const renderRoomsStep = () => (
    <div className="onboarding-step">
      <h2>Nombre de pièces minimum ?</h2>
      <div className="chips-grid">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            className="chip"
            onClick={() => handleRoomsSelect(num)}
          >
            {num} {num === 1 ? 'pièce' : 'pièces'}
          </button>
        ))}
      </div>
    </div>
  );

  const renderRefineStep = () => (
    <div className="onboarding-step">
      <div className="completion-icon">
        <Check size={48} />
      </div>
      <h2>Parfait !</h2>
      <p className="step-subtitle">
        Voulez-vous affiner votre recherche avec quelques questions supplémentaires ?
      </p>

      <button
        className="btn btn-primary btn-large"
        onClick={handleStartRefinement}
        disabled={loading}
      >
        {loading ? <Loader2 className="spinner" size={20} /> : 'Oui, affiner'}
      </button>

      <button
        className="btn btn-ghost"
        onClick={handleSkipRefinement}
        disabled={loading}
      >
        Non, c'est bon
      </button>
    </div>
  );

  const renderAiQuestion = () => {
    if (aiQuestions.length === 0) return null;

    const currentQuestion = aiQuestions[currentAiQuestionIndex];

    return (
      <div className="onboarding-step">
        <div className="progress-indicator">
          Question {currentAiQuestionIndex + 1} sur {aiQuestions.length}
        </div>

        <h2>{currentQuestion.question}</h2>

        {currentQuestion.type === 'toggle' && (
          <div className="button-grid">
            <button
              className="choice-button"
              onClick={() => handleAiQuestionAnswer(true)}
            >
              Oui
            </button>
            <button
              className="choice-button"
              onClick={() => handleAiQuestionAnswer(false)}
            >
              Non
            </button>
          </div>
        )}

        {currentQuestion.type === 'slider' && (
          <div className="slider-question">
            <input
              type="range"
              className="slider"
              min={currentQuestion.min}
              max={currentQuestion.max}
              step={currentQuestion.step}
              onChange={(e) => {
                const value = Number(e.target.value);
                handleAiQuestionAnswer(value);
              }}
            />
            <span className="slider-unit">{currentQuestion.unit}</span>
          </div>
        )}

        {currentQuestion.type === 'chips' && (
          <div className="chips-grid">
            {currentQuestion.options?.map((option, idx) => (
              <button
                key={idx}
                className="chip"
                onClick={() => handleAiQuestionAnswer(option)}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'text' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.currentTarget.querySelector('input');
              if (input) {
                handleAiQuestionAnswer(input.value);
              }
            }}
          >
            <input
              type="text"
              className="input"
              placeholder="Votre réponse..."
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              <Send size={20} />
            </button>
          </form>
        )}

        <button className="btn btn-ghost btn-small" onClick={handleSkipAiQuestion}>
          Passer
        </button>
      </div>
    );
  };

  const renderLoadingStep = () => (
    <div className="onboarding-step">
      <Loader2 className="spinner-large" size={48} />
      <h2>Recherche en cours...</h2>
      <p className="step-subtitle">
        Nous recherchons les meilleurs biens pour vous
      </p>
    </div>
  );

  return (
    <div className="onboarding-page">
      <div className="onboarding-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="onboarding-container">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {step === 'location' && renderLocationStep()}
        {step === 'transaction' && renderTransactionStep()}
        {step === 'propertyType' && renderPropertyTypeStep()}
        {step === 'budget' && renderBudgetStep()}
        {step === 'rooms' && renderRoomsStep()}
        {step === 'refine' && renderRefineStep()}
        {step === 'ai-questions' && renderAiQuestion()}
        {step === 'loading' && renderLoadingStep()}
      </div>
    </div>
  );
}
