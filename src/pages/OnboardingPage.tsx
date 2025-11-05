import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { searchLocation, createSearch, getProperties, mapPropertyTypeToMelo } from '../lib/melo';
import { generateAiQuestions } from '../lib/gemini';
import { Home, Building2, MapPin, Euro, Bed, Sparkles, ArrowRight, Check, Loader2, Search, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Slider } from '../components/ui/slider';

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

const STEPS: OnboardingStep[] = ['location', 'transaction', 'propertyType', 'budget', 'rooms', 'refine'];

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

  // Calculate progress
  const currentStepIndex = STEPS.indexOf(step);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

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
      location: location.id,
      locationId: location.id,
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

  const formatBudget = (value: number) => {
    if (fixedPrefs.transactionType === 0) {
      return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M €` : `${(value / 1000).toFixed(0)}K €`;
    }
    return `${value} €/mois`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Configuration de vos préférences</h2>
              <span className="text-xs text-muted-foreground">Étape {currentStepIndex + 1} sur {STEPS.length}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 py-12">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {step === 'location' && (
                <motion.div key="location" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Où cherchez-vous ?</h3>
                          <p className="text-sm text-muted-foreground">Entrez le nom d'une ville</p>
                        </div>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input placeholder="Paris, Lyon, Marseille..." value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} className="pl-10 h-12 text-base" autoFocus />
                        {searchingLocation && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />}
                      </div>
                      {locationSuggestions.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2">
                          {locationSuggestions.map((location, index) => (
                            <motion.button key={location.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} onClick={() => handleLocationSelect(location)} className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all text-left group">
                              <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <span className="flex-1 font-medium">{location.name}</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}


              {step === 'transaction' && (
                <motion.div key="transaction" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Euro className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Type de transaction</h3>
                          <p className="text-sm text-muted-foreground">Achat ou location ?</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleTransactionSelect(0)} className="group relative p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                              <Home className="w-8 h-8 text-green-600" />
                            </div>
                            <span className="font-semibold text-lg">Acheter</span>
                            <span className="text-sm text-muted-foreground text-center">Trouver votre futur bien</span>
                          </div>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleTransactionSelect(1)} className="group relative p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                              <Building2 className="w-8 h-8 text-blue-600" />
                            </div>
                            <span className="font-semibold text-lg">Louer</span>
                            <span className="text-sm text-muted-foreground text-center">Trouver votre location</span>
                          </div>
                        </motion.button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 'propertyType' && (
                <motion.div key="propertyType" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Home className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Type de bien</h3>
                          <p className="text-sm text-muted-foreground">Que recherchez-vous ?</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handlePropertyTypeSelect('apartment')} className="group p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
                          <div className="flex flex-col items-center gap-2">
                            <Building2 className="w-10 h-10 text-gray-600 group-hover:text-primary transition-colors" />
                            <span className="font-semibold">Appartement</span>
                          </div>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handlePropertyTypeSelect('house')} className="group p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
                          <div className="flex flex-col items-center gap-2">
                            <Home className="w-10 h-10 text-gray-600 group-hover:text-primary transition-colors" />
                            <span className="font-semibold">Maison</span>
                          </div>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handlePropertyTypeSelect('any')} className="group p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all">
                          <div className="flex flex-col items-center gap-2">
                            <Sparkles className="w-10 h-10 text-gray-600 group-hover:text-primary transition-colors" />
                            <span className="font-semibold">Tous</span>
                          </div>
                        </motion.button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 'budget' && (
                <motion.div key="budget" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Euro className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Budget maximum</h3>
                          <p className="text-sm text-muted-foreground">{fixedPrefs.transactionType === 0 ? 'Prix maximum' : 'Loyer maximum'}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-primary mb-2">{formatBudget(fixedPrefs.budgetMax || (fixedPrefs.transactionType === 0 ? budgetRanges.sale.default : budgetRanges.rental.default))}</div>
                        </div>
                        <Slider value={fixedPrefs.budgetMax || (fixedPrefs.transactionType === 0 ? budgetRanges.sale.default : budgetRanges.rental.default)} onValueChange={(value) => setFixedPrefs(prev => ({ ...prev, budgetMax: value }))} min={fixedPrefs.transactionType === 0 ? budgetRanges.sale.min : budgetRanges.rental.min} max={fixedPrefs.transactionType === 0 ? budgetRanges.sale.max : budgetRanges.rental.max} step={fixedPrefs.transactionType === 0 ? budgetRanges.sale.step : budgetRanges.rental.step} />
                        <Button onClick={() => handleBudgetSelect(fixedPrefs.budgetMax || (fixedPrefs.transactionType === 0 ? budgetRanges.sale.default : budgetRanges.rental.default))} className="w-full h-12" size="lg">
                          Continuer<ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 'rooms' && (
                <motion.div key="rooms" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Bed className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Nombre de pièces minimum</h3>
                          <p className="text-sm text-muted-foreground">Chambres minimum souhaitées</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((rooms) => (
                          <motion.button key={rooms} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleRoomsSelect(rooms)} className="p-6 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group">
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-3xl font-bold text-gray-600 group-hover:text-primary transition-colors">{rooms}</span>
                              <span className="text-xs text-muted-foreground">{rooms === 1 ? 'pièce' : 'pièces'}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 'refine' && (
                <motion.div key="refine" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Affiner votre recherche</h3>
                          <p className="text-sm text-muted-foreground">Répondez à quelques questions pour des résultats personnalisés</p>
                        </div>
                      </div>
                      {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{error}</motion.div>
                      )}
                      <div className="space-y-3">
                        <Button onClick={handleStartRefinement} disabled={loading} className="w-full h-14 text-base" size="lg">
                          {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Génération des questions...</> : <><Sparkles className="w-5 h-5 mr-2" />Affiner avec l'IA</>}
                        </Button>
                        <Button onClick={handleSkipRefinement} disabled={loading} variant="outline" className="w-full h-14 text-base" size="lg">
                          Continuer sans affiner<ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-6">L'affinement IA vous posera 3-5 questions contextuelles pour des résultats plus précis</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 'ai-questions' && aiQuestions.length > 0 && (
                <motion.div key={`ai-question-${currentAiQuestionIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-sm font-medium text-muted-foreground">Question {currentAiQuestionIndex + 1} sur {aiQuestions.length}</span>
                        <Button variant="ghost" size="sm" onClick={handleSkipAiQuestion} className="text-muted-foreground">Passer</Button>
                      </div>
                      <h3 className="text-2xl font-bold mb-6">{aiQuestions[currentAiQuestionIndex].question}</h3>

                      {aiQuestions[currentAiQuestionIndex].type === 'toggle' && (
                        <div className="grid grid-cols-2 gap-4">
                          <Button onClick={() => handleAiQuestionAnswer(true)} variant="outline" className="h-16 text-base">Oui</Button>
                          <Button onClick={() => handleAiQuestionAnswer(false)} variant="outline" className="h-16 text-base">Non</Button>
                        </div>
                      )}

                      {aiQuestions[currentAiQuestionIndex].type === 'chips' && (
                        <div className="flex flex-wrap gap-3">
                          {aiQuestions[currentAiQuestionIndex].options?.map((option) => (
                            <Button key={option} onClick={() => handleAiQuestionAnswer(option)} variant="outline" className="h-12">{option}</Button>
                          ))}
                        </div>
                      )}

                      {aiQuestions[currentAiQuestionIndex].type === 'slider' && (
                        <div className="space-y-6">
                          <div className="text-center text-2xl font-bold text-primary">{aiAnswers[aiQuestions[currentAiQuestionIndex].id] || aiQuestions[currentAiQuestionIndex].min || 0} {aiQuestions[currentAiQuestionIndex].unit || ''}</div>
                          <Slider value={aiAnswers[aiQuestions[currentAiQuestionIndex].id] || aiQuestions[currentAiQuestionIndex].min || 0} onValueChange={(value) => setAiAnswers(prev => ({ ...prev, [aiQuestions[currentAiQuestionIndex].id]: value }))} min={aiQuestions[currentAiQuestionIndex].min || 0} max={aiQuestions[currentAiQuestionIndex].max || 100} step={aiQuestions[currentAiQuestionIndex].step || 1} />
                          <Button onClick={() => handleAiQuestionAnswer(aiAnswers[aiQuestions[currentAiQuestionIndex].id] || aiQuestions[currentAiQuestionIndex].min || 0)} className="w-full h-12">
                            Valider<Check className="w-5 h-5 ml-2" />
                          </Button>
                        </div>
                      )}

                      {aiQuestions[currentAiQuestionIndex].type === 'text' && (
                        <div className="space-y-4">
                          <Input placeholder="Votre réponse..." value={aiAnswers[aiQuestions[currentAiQuestionIndex].id] || ''} onChange={(e) => setAiAnswers(prev => ({ ...prev, [aiQuestions[currentAiQuestionIndex].id]: e.target.value }))} className="h-12" />
                          <Button onClick={() => handleAiQuestionAnswer(aiAnswers[aiQuestions[currentAiQuestionIndex].id] || '')} className="w-full h-12">
                            Valider<Check className="w-5 h-5 ml-2" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                  <Card className="border-0 shadow-2xl backdrop-blur-sm bg-white/90">
                    <CardContent className="p-12">
                      <div className="flex flex-col items-center gap-6">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                          <Sparkles className="w-16 h-16 text-primary" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-center">Finalisation de votre profil</h3>
                        <p className="text-muted-foreground text-center">Nous récupérons les meilleures annonces pour vous...</p>
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
