import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { getPropertyEnrichment } from '../lib/gemini-client';
import {
  ArrowLeft, MapPin, Home, Phone, Zap, BadgeCheck,
  Share2, Heart, ChevronLeft, ChevronRight,
  Sparkles, Shield, Wrench, CheckCircle,
  X, MessageCircle, TrendingUp, TrendingDown, Navigation
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ChatModal } from '../components/ChatModal';

// Calculate monthly payment
function calculateMonthlyPayment(
  price: number,
  downPaymentPercent: number,
  years: number,
  annualRate: number
): number {
  const downPayment = price * (downPaymentPercent / 100);
  const loanAmount = price - downPayment;
  const monthlyRate = annualRate / 12 / 100;
  const months = years * 12;

  if (monthlyRate === 0) return loanAmount / months;

  const monthlyPayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(monthlyPayment);
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enrichmentData, setEnrichmentData] = useState<any>(null);
  const [loadingEnrichment, setLoadingEnrichment] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  // Financial simulator state
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanYears, setLoanYears] = useState(20);
  const [annualRate] = useState(3.85);

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('melo_properties')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProperty(data);

        // Load existing AI analysis from DB (NO automatic analysis)
        await loadExistingAnalysis(Number(id));
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  // Load existing analysis from database (cached)
  const loadExistingAnalysis = async (propertyId: number) => {
    if (!user) return;

    try {
      // Check if analysis exists
      const { data: existingAnalysis } = await supabase
        .from('ai_property_analysis')
        .select('*')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .single();

      if (existingAnalysis) {
        // Check if score exists
        const { data: scoreData } = await supabase
          .from('user_property_scores')
          .select('*')
          .eq('property_id', propertyId)
          .eq('user_id', user.id)
          .single();

        const analysisData = existingAnalysis as any;
        const scoreRecord = scoreData as any;

        setEnrichmentData({
          vision: {
            generalCondition: {
              status: analysisData.general_condition,
              details: analysisData.general_condition_details,
            },
            remarkedFeatures: analysisData.remarked_features || [],
            recommendedWorks: analysisData.recommended_works || [],
            confidence: analysisData.vision_confidence_score || 0,
          },
          extraction: {
            structuredData: analysisData.structured_data || {},
            tags: analysisData.tags || [],
            missingInfo: analysisData.missing_info || [],
          },
          score: scoreRecord ? {
            score: scoreRecord.personalized_score,
            breakdown: scoreRecord.score_breakdown,
            recommendation: scoreRecord.recommendation_badge,
            reason: scoreRecord.recommendation_reason,
          } : null,
        });
      }
    } catch (error) {
      console.error('Error loading existing analysis:', error);
    }
  };

  // Manual AI analysis (triggered by user button click)
  const triggerAIAnalysis = async () => {
    if (!property || !user) return;

    setLoadingEnrichment(true);
    try {
      const allImages = [
        ...(property.pictures_remote || []),
        ...(property.images || []),
      ].filter(Boolean);

      const imageUrls = allImages.slice(0, 5);
      const description = property.description || property.title || '';

      const data = await getPropertyEnrichment(property.id, imageUrls, description);
      setEnrichmentData(data);
    } catch (error) {
      console.error('Error triggering AI analysis:', error);
      alert('Erreur lors de l\'analyse IA. Veuillez réessayer.');
    } finally {
      setLoadingEnrichment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lumine-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-lumine-accent border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-lumine-neutral-700">Chargement de l'annonce...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-lumine-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lumine-neutral-700">Annonce non trouvée</p>
          <Button onClick={() => navigate('/app/feed')} className="mt-4">
            Retour au feed
          </Button>
        </div>
      </div>
    );
  }

  // Get all available images
  const allImages = [
    ...(property.pictures_remote || []),
    ...(property.images || []),
  ].filter(Boolean);

  const currentImage = allImages[currentImageIndex] || property.main_image || '';

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // Financial calculations
  const agencyFees = Math.round(property.price * 0.03);
  const notaryFees = Math.round(property.price * 0.075);
  const annualPropertyTax = property.property_tax_annual || 2100;

  const monthlyPayment = calculateMonthlyPayment(
    property.price,
    downPaymentPercent,
    loanYears,
    annualRate
  );

  const insuranceMonthly = Math.round(monthlyPayment * 0.067);
  const propertyTaxMonthly = Math.round(annualPropertyTax / 12);
  const energyMonthly = property.dpe_category === 'A' || property.dpe_category === 'B' ? 90 : 150;

  const totalMonthly =
    monthlyPayment + insuranceMonthly + propertyTaxMonthly + energyMonthly;

  return (
    <div className="min-h-screen bg-lumine-neutral-100">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-lumine-primary text-lumine-neutral-100 shadow-md"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="text-lumine-accent" size={28} />
              <span className="text-2xl font-bold tracking-tight">
                LUMIN<span className="text-xs align-super">ᵉ</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-lumine-primary-dark rounded transition-all">
                <Heart className="text-lumine-accent" size={20} />
              </button>
              <button className="p-2 hover:bg-lumine-primary-dark rounded transition-all">
                <Share2 size={20} />
              </button>
              <button
                onClick={() => navigate('/app/feed')}
                className="p-2 hover:bg-lumine-primary-dark rounded transition-all"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="w-full max-w-none">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          {/* Hero Section: Image + AVIS LUMINᵉ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Image Gallery - 2/3 width */}
            <div className="lg:col-span-2">
              {/* Main Image */}
              <div
                className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-lumine-neutral-200 to-lumine-neutral-300 cursor-pointer group"
                onClick={() => setShowImageModal(true)}
              >
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="text-lumine-neutral-500" size={64} />
                  </div>
                )}

                {/* Navigation arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPrevious();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-lumine-primary/70 text-lumine-neutral-100 rounded-full flex items-center justify-center hover:bg-lumine-accent hover:text-lumine-primary transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNext();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-lumine-primary/70 text-lumine-neutral-100 rounded-full flex items-center justify-center hover:bg-lumine-accent hover:text-lumine-primary transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Image counter */}
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {allImages.length || 1}
                </div>
              </div>

              {/* Thumbnails - 8 max */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-8 gap-2 mt-3">
                  {allImages.slice(0, 8).map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                        index === currentImageIndex
                          ? 'ring-2 ring-lumine-accent scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AVIS LUMINᵉ - 1/3 width sticky */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="border-2 border-lumine-accent shadow-lg bg-gradient-to-br from-lumine-neutral-100 to-lumine-neutral-200 rounded-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="text-lumine-accent" size={24} />
                      <h3 className="font-bold text-lumine-primary text-lg">
                        AVIS LUMIN<span className="text-xs align-super">ᵉ</span>
                      </h3>
                    </div>

                    {!enrichmentData ? (
                      <div className="space-y-4">
                        <p className="text-sm text-lumine-neutral-700">
                          Découvrez l'analyse IA complète de cette propriété adaptée à votre profil.
                        </p>
                        <Button
                          onClick={triggerAIAnalysis}
                          disabled={loadingEnrichment}
                          className="w-full bg-lumine-accent hover:bg-lumine-accent-dark text-lumine-primary"
                        >
                          {loadingEnrichment ? (
                            <>
                              <div className="w-4 h-4 border-2 border-lumine-primary/30 border-t-lumine-primary rounded-full animate-spin mr-2" />
                              Analyse en cours...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2" size={16} />
                              Analyser avec IA
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Score */}
                        {enrichmentData.score && (
                          <div className="text-center p-4 bg-white rounded-lg">
                            <div className="text-4xl font-bold text-lumine-accent mb-1">
                              {enrichmentData.score.score}/10
                            </div>
                            <div className="text-xs text-lumine-neutral-700">Score personnalisé</div>
                            {enrichmentData.score.recommendation && (
                              <Badge className="mt-2 bg-amber-100 text-amber-700">
                                {enrichmentData.score.recommendation === 'favorite' ? '⭐ Coup de cœur' :
                                 enrichmentData.score.recommendation === 'recommended' ? '✓ Recommandé' :
                                 '⚡ Tendance'}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Location enrichie */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-lumine-primary">
                            <Navigation size={14} className="text-lumine-accent" />
                            Localisation
                          </div>
                          <p className="text-sm text-lumine-neutral-700">
                            {property.city} {property.zipcode && `- ${property.zipcode}`}
                          </p>
                        </div>

                        {/* Points forts */}
                        {enrichmentData.vision?.remarkedFeatures && enrichmentData.vision.remarkedFeatures.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-lumine-primary">
                              <TrendingUp size={14} className="text-green-600" />
                              Points forts
                            </div>
                            <ul className="space-y-1">
                              {enrichmentData.vision.remarkedFeatures.slice(0, 3).map((feature: string, i: number) => (
                                <li key={i} className="text-sm text-lumine-neutral-700 flex items-start gap-2">
                                  <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Points à améliorer */}
                        {enrichmentData.vision?.recommendedWorks && enrichmentData.vision.recommendedWorks.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-lumine-primary">
                              <TrendingDown size={14} className="text-orange-600" />
                              À prévoir
                            </div>
                            <ul className="space-y-1">
                              {enrichmentData.vision.recommendedWorks.slice(0, 2).map((work: any, i: number) => (
                                <li key={i} className="text-sm text-lumine-neutral-700 flex items-start gap-2">
                                  <Wrench size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
                                  <span>{work.description}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Caractéristiques clés */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-lumine-neutral-400/20">
                          <div className="text-center">
                            <div className="text-xl font-bold text-lumine-primary">{property.surface || '-'}</div>
                            <div className="text-xs text-lumine-neutral-700">m²</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-lumine-primary">{property.rooms || '-'}</div>
                            <div className="text-xs text-lumine-neutral-700">pièces</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-lumine-primary">{property.dpe_category || '-'}</div>
                            <div className="text-xs text-lumine-neutral-700">DPE</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-bold text-lumine-primary">{property.construction_year || '-'}</div>
                            <div className="text-xs text-lumine-neutral-700">Année</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Grid Layout: Main Content + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Quick Price & Specs */}
              <Card className="border border-lumine-neutral-400/20 shadow-sm bg-white rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h1 className="text-4xl font-bold text-lumine-primary mb-2">
                        {property.title}
                      </h1>
                      <p className="text-lg text-lumine-neutral-700 flex items-center gap-2">
                        <MapPin className="text-lumine-accent" size={18} />
                        {property.city} {property.zipcode && `- ${property.zipcode}`}
                      </p>
                    </div>
                    {property.price_per_meter && (
                      <div className="text-right">
                        <div className="text-sm text-lumine-neutral-700">Prix au m²</div>
                        <div className="text-3xl font-bold text-lumine-accent">
                          {property.price_per_meter.toLocaleString('fr-FR')}€
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick stats grid */}
                  <div className="grid grid-cols-4 gap-0 border-t border-b border-lumine-neutral-400/20 py-4">
                    <div className="text-center border-r border-lumine-neutral-400/20">
                      <div className="text-3xl font-bold text-lumine-accent">
                        {property.surface || '-'}
                      </div>
                      <div className="text-sm text-lumine-neutral-700">m² Surface</div>
                    </div>
                    <div className="text-center border-r border-lumine-neutral-400/20">
                      <div className="text-3xl font-bold text-lumine-accent">
                        {property.bedrooms || property.rooms || '-'}
                      </div>
                      <div className="text-sm text-lumine-neutral-700">Chambres</div>
                    </div>
                    <div className="text-center border-r border-lumine-neutral-400/20">
                      <div className="text-3xl font-bold text-lumine-accent">
                        {property.bathrooms || '-'}
                      </div>
                      <div className="text-sm text-lumine-neutral-700">Salles de Bain</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-lumine-accent">
                        {property.dpe_category || '-'}
                      </div>
                      <div className="text-sm text-lumine-neutral-700">Classe Énergie</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Information */}
              <section className="bg-white border-l-4 border-lumine-accent p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-lumine-primary mb-4 flex items-center gap-2">
                  <Home className="text-lumine-accent" />
                  La Propriété
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lumine-primary mb-1">
                      Caractéristiques Principales
                    </h3>
                    <p className="text-lumine-neutral-700">
                      {property.description || 'Aucune description disponible'}
                    </p>
                  </div>
                  {property.construction_year && (
                    <div>
                      <h3 className="font-semibold text-lumine-primary mb-1">
                        Construction & Rénovation
                      </h3>
                      <p className="text-lumine-neutral-700">
                        Construit en {property.construction_year}
                        {property.renovation_status === 'renovated' && ' · Rénové récemment'}
                        {property.renovation_status === 'new' && ' · Construction neuve'}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* AI Analysis Section */}
              {enrichmentData && (
                <section className="bg-white border-l-4 border-lumine-accent p-6 rounded-lg shadow-sm">
                  <h2 className="text-2xl font-bold text-lumine-primary mb-4 flex items-center gap-2">
                    <Sparkles className="text-lumine-accent" />
                    Analyse LUMIN<span className="text-xs align-super">ᵉ</span>
                  </h2>
                  <p className="text-sm text-lumine-neutral-700 mb-6">
                    Ce que LUMIN<span className="text-xs align-super">ᵉ</span> a détecté
                  </p>

                  <div className="space-y-3">
                    {/* General condition */}
                    {enrichmentData.vision?.generalCondition && (
                      <div className="bg-lumine-neutral-100 p-4 rounded-lg border-l-4 border-lumine-primary">
                        <h4 className="font-semibold text-lumine-primary mb-2 flex items-center gap-2">
                          <CheckCircle size={18} />
                          État Général{' '}
                          {enrichmentData.vision.generalCondition.status === 'excellent'
                            ? 'Excellent'
                            : enrichmentData.vision.generalCondition.status === 'good'
                            ? 'Bon'
                            : enrichmentData.vision.generalCondition.status === 'fair'
                            ? 'Correct'
                            : 'À surveiller'}
                        </h4>
                        <p className="text-sm text-lumine-neutral-700">
                          {enrichmentData.vision.generalCondition.details}
                        </p>
                      </div>
                    )}

                    {/* Remarked features */}
                    {enrichmentData.vision?.remarkedFeatures &&
                      enrichmentData.vision.remarkedFeatures.length > 0 && (
                        <div className="bg-lumine-neutral-100 p-4 rounded-lg border-l-4 border-lumine-primary">
                          <h4 className="font-semibold text-lumine-primary mb-2 flex items-center gap-2">
                            <BadgeCheck size={18} />
                            Détails Remarqués
                          </h4>
                          <p className="text-sm text-lumine-neutral-700">
                            {enrichmentData.vision.remarkedFeatures.join(', ')}
                          </p>
                        </div>
                      )}

                    {/* Recommended works */}
                    {enrichmentData.vision?.recommendedWorks &&
                      enrichmentData.vision.recommendedWorks.length > 0 && (
                        <div className="bg-lumine-neutral-100 p-4 rounded-lg border-l-4 border-lumine-primary">
                          <h4 className="font-semibold text-lumine-primary mb-2 flex items-center gap-2">
                            <Wrench size={18} />
                            Travaux Recommandés
                          </h4>
                          <div className="space-y-2">
                            {enrichmentData.vision.recommendedWorks.map(
                              (work: any, index: number) => (
                                <p key={index} className="text-sm text-lumine-neutral-700">
                                  • {work.description} (~{work.estimatedCost.toLocaleString('fr-FR')}€)
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Structured data */}
                    {enrichmentData.extraction?.structuredData && (
                      <div className="bg-lumine-neutral-100 p-4 rounded-lg border-l-4 border-lumine-primary">
                        <h4 className="font-semibold text-lumine-primary mb-2 flex items-center gap-2">
                          <Sparkles size={18} />
                          Données Structurées Détectées
                        </h4>
                        <ul className="text-sm space-y-1 text-lumine-neutral-700">
                          {Object.entries(enrichmentData.extraction.structuredData).map(
                            ([key, value]) =>
                              value && (
                                <li key={key}>
                                  • {key}: {String(value)}
                                </li>
                              )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Legal & Risk Data */}
              <section className="bg-white border-l-4 border-lumine-accent p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-lumine-primary mb-4 flex items-center gap-2">
                  <Shield className="text-lumine-accent" />
                  Données Légales & Risques
                </h2>

                <div className="space-y-3">
                  {/* DPE */}
                  {property.dpe_category && (
                    <div className="p-3 bg-green-50 rounded border-l-4 border-lumine-accent">
                      <h4 className="font-semibold text-lumine-primary text-sm mb-1">
                        Diagnostic Énergétique (DPE)
                      </h4>
                      <p className="text-sm text-lumine-neutral-700">
                        Classe {property.dpe_category}
                        {property.dpe_value && ` · Consommation: ${property.dpe_value} kWh/m²/an`}
                      </p>
                    </div>
                  )}

                  {/* Risks */}
                  <div className="p-3 bg-green-50 rounded border-l-4 border-lumine-accent">
                    <h4 className="font-semibold text-lumine-primary text-sm mb-1">
                      Risques Naturels
                    </h4>
                    <p className="text-sm text-lumine-neutral-700 flex items-center gap-2">
                      <CheckCircle size={14} className="text-lumine-primary" />
                      {property.flood_risk || 'Faible'} · Géologique:{' '}
                      {property.geological_risk || 'Nul'} · Pollution:{' '}
                      {property.pollution_risk || 'Faible'}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar: Financial & Action */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-8">
                {/* Price Card */}
                <Card className="border border-lumine-neutral-400/20 shadow-sm bg-white rounded-xl">
                  <CardContent className="p-6">
                    <div className="mb-6">
                      <p className="text-xs uppercase tracking-wider text-lumine-accent font-semibold">
                        Prix Total
                      </p>
                      <h3 className="text-5xl font-bold text-lumine-primary mt-2 mb-1">
                        <span className="border-b-4 border-lumine-accent pb-1 inline-block">
                          {property.price.toLocaleString('fr-FR')}€
                        </span>
                      </h3>
                      {property.price_per_meter && (
                        <p className="text-sm text-lumine-neutral-700">
                          {property.price_per_meter.toLocaleString('fr-FR')}€ par m²
                        </p>
                      )}
                    </div>

                    {/* Fees */}
                    <div className="space-y-2 mb-6 pb-6 border-b border-lumine-neutral-400/20">
                      <div className="flex justify-between text-sm">
                        <span className="text-lumine-neutral-700">Frais d'agence</span>
                        <span className="font-semibold text-lumine-primary">
                          ~{agencyFees.toLocaleString('fr-FR')}€
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-lumine-neutral-700">Frais de notaire</span>
                        <span className="font-semibold text-lumine-primary">
                          ~{notaryFees.toLocaleString('fr-FR')}€
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-lumine-neutral-700">
                          Taxe foncière (annuelle)
                        </span>
                        <span className="font-semibold text-lumine-primary">
                          ~{annualPropertyTax.toLocaleString('fr-FR')}€
                        </span>
                      </div>
                    </div>

                    {/* Financial Simulator */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-lumine-primary mb-3 text-sm">
                        Simulateur Financier
                      </h4>

                      <div className="bg-lumine-neutral-100 p-4 rounded-lg border border-lumine-neutral-400/20">
                        {/* Down payment slider */}
                        <div className="mb-4">
                          <label className="text-xs uppercase tracking-wider text-lumine-accent font-semibold block mb-2">
                            Apport Initial
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={downPaymentPercent}
                            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                            className="w-full accent-lumine-accent"
                          />
                          <div className="flex justify-between mt-2 text-sm">
                            <span className="text-lumine-neutral-700">
                              {downPaymentPercent}%
                            </span>
                            <span className="font-semibold text-lumine-primary">
                              {Math.round((property.price * downPaymentPercent) / 100).toLocaleString('fr-FR')}€
                            </span>
                          </div>
                        </div>

                        {/* Loan duration */}
                        <div className="mb-4">
                          <label className="text-xs uppercase tracking-wider text-lumine-accent font-semibold block mb-2">
                            Durée du Prêt
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[15, 20, 25].map((years) => (
                              <button
                                key={years}
                                onClick={() => setLoanYears(years)}
                                className={`py-2 px-2 text-xs font-semibold rounded transition ${
                                  loanYears === years
                                    ? 'bg-lumine-accent text-lumine-primary'
                                    : 'bg-lumine-neutral-200 hover:bg-lumine-neutral-300'
                                }`}
                              >
                                {years} ans
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interest rate */}
                        <div>
                          <label className="text-xs uppercase tracking-wider text-lumine-accent font-semibold block mb-2">
                            Taux d'Intérêt
                          </label>
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm font-semibold text-lumine-primary">
                              {annualRate}% TMA
                            </p>
                            <p className="text-xs text-lumine-neutral-700 mt-1">
                              Marché actuel
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Costs */}
                    <div className="mb-6 p-4 rounded bg-lumine-neutral-100 border border-lumine-neutral-400/20">
                      <p className="text-xs uppercase tracking-wider text-lumine-accent font-semibold mb-3">
                        Coût Mensuel Estimé
                      </p>
                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-lumine-neutral-700">Remboursement prêt</span>
                          <span className="font-semibold text-lumine-primary">
                            {monthlyPayment.toLocaleString('fr-FR')}€
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-lumine-neutral-700">Assurance prêt</span>
                          <span className="font-semibold text-lumine-primary">
                            {insuranceMonthly.toLocaleString('fr-FR')}€
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-lumine-neutral-700">Taxe foncière</span>
                          <span className="font-semibold text-lumine-primary">
                            {propertyTaxMonthly.toLocaleString('fr-FR')}€
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-lumine-neutral-700">Énergie estimée</span>
                          <span className="font-semibold text-lumine-primary">
                            {energyMonthly.toLocaleString('fr-FR')}€
                          </span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-lumine-accent">
                        <div className="flex justify-between">
                          <span className="font-semibold text-lumine-primary">
                            Total Mensuel
                          </span>
                          <span className="text-2xl font-bold text-lumine-accent border-b-4 border-lumine-accent pb-1">
                            {totalMonthly.toLocaleString('fr-FR')}€
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button className="w-full bg-lumine-primary hover:bg-lumine-primary-dark text-white">
                        <Phone className="mr-2" size={16} />
                        Contacter l'Agence
                      </Button>
                      <Button className="w-full bg-lumine-accent hover:bg-lumine-accent-dark text-lumine-primary">
                        <Heart className="mr-2" size={16} />
                        Ajouter aux Favoris
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-2 border-lumine-accent text-lumine-accent hover:bg-lumine-neutral-100"
                      >
                        <Zap className="mr-2" size={16} />
                        Me Notifier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Button */}
      <button
        onClick={() => setShowChatModal(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-lumine-accent hover:bg-lumine-accent-dark text-lumine-primary rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-40"
      >
        <MessageCircle size={24} />
      </button>

      {/* Image Modal (Fullscreen) */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setShowImageModal(false)}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
            >
              <X size={24} />
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={currentImage}
                alt={property.title}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Navigation */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevious();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
      />
    </div>
  );
}
