import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { getPropertyEnrichment } from '../lib/gemini-client';
import {
  ArrowLeft, MapPin, Home, Phone, Zap, BadgeCheck,
  Share2, Heart, ChevronLeft, ChevronRight,
  Sparkles, Shield, Wrench, CheckCircle, AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

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
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [enrichmentData, setEnrichmentData] = useState<any>(null);
  const [loadingEnrichment, setLoadingEnrichment] = useState(false);

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

        // Load AI enrichment data
        loadEnrichment(data);
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

  const loadEnrichment = async (prop: any) => {
    if (!prop) return;

    setLoadingEnrichment(true);
    try {
      const allImages = [
        ...(prop.pictures_remote || []),
        ...(prop.images || []),
      ].filter(Boolean);

      const imageUrls = allImages.slice(0, 5); // Analyze first 5 images
      const description = prop.description || prop.title || '';

      const data = await getPropertyEnrichment(prop.id, imageUrls, description);
      setEnrichmentData(data);
    } catch (error) {
      console.error('Error loading enrichment:', error);
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
          {/* Hero Gallery */}
          <section className="mb-8">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-lumine-neutral-200 to-lumine-neutral-300">
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

              {/* Navigation buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute top-4 right-16 bg-lumine-primary/70 text-lumine-neutral-100 px-3 py-2 rounded hover:bg-lumine-accent hover:text-lumine-primary transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute top-4 right-4 bg-lumine-primary/70 text-lumine-neutral-100 px-3 py-2 rounded hover:bg-lumine-accent hover:text-lumine-primary transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Thumbnails */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="grid grid-cols-6 gap-2">
                  {allImages.slice(0, 5).map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`bg-lumine-neutral-300 rounded aspect-square cursor-pointer hover:opacity-70 transition overflow-hidden ${
                        index === currentImageIndex ? 'ring-2 ring-lumine-accent' : ''
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {allImages.length > 5 && (
                    <div className="bg-lumine-neutral-700 text-white rounded aspect-square flex items-center justify-center cursor-pointer text-sm font-bold">
                      +{allImages.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

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

                  {enrichmentData?.score?.recommendation && (
                    <div className="mt-6 flex items-center gap-3">
                      <CheckCircle className="text-lumine-accent" />
                      <span className="text-sm text-lumine-accent font-medium">
                        {enrichmentData.score.recommendation === 'favorite'
                          ? 'Coup de cœur pour vous'
                          : enrichmentData.score.recommendation === 'recommended'
                          ? 'Recommandé pour vous'
                          : 'À considérer'}
                      </span>
                    </div>
                  )}
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
              <section className="bg-white border-l-4 border-lumine-accent p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-lumine-primary mb-4 flex items-center gap-2">
                  <Sparkles className="text-lumine-accent" />
                  Analyse LUMIN<span className="text-xs align-super">ᵉ</span>
                </h2>
                <p className="text-sm text-lumine-neutral-700 mb-6">
                  Ce que LUMIN<span className="text-xs align-super">ᵉ</span> a détecté
                </p>

                {loadingEnrichment ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-lumine-accent/30 border-t-lumine-accent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-lumine-neutral-700">
                      Analyse IA en cours...
                    </p>
                  </div>
                ) : enrichmentData ? (
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
                ) : (
                  <div className="text-center py-8 bg-lumine-neutral-100 rounded-lg">
                    <AlertTriangle className="text-lumine-neutral-500 mx-auto mb-3" size={32} />
                    <p className="text-sm text-lumine-neutral-700">
                      Analyse IA non disponible pour cette propriété
                    </p>
                  </div>
                )}
              </section>

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

                {/* AI Recommendation */}
                {enrichmentData?.score && (
                  <Card className="border-2 border-lumine-accent shadow-sm bg-gradient-to-br from-lumine-neutral-100 to-lumine-neutral-200 rounded-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="text-lumine-accent" size={24} />
                        <h3 className="font-bold text-lumine-primary">
                          Verdict LUMIN<span className="text-xs align-super">ᵉ</span>
                        </h3>
                      </div>

                      <p className="text-sm text-lumine-neutral-700 mb-4">
                        Basé sur votre profil & critères
                      </p>

                      <div className="flex gap-2 mb-4">
                        <Badge className="bg-lumine-accent text-lumine-primary">
                          Score: {enrichmentData.score.score}/10
                        </Badge>
                        {enrichmentData.score.recommendation === 'favorite' && (
                          <Badge className="bg-blue-100 text-blue-700">Coup de cœur</Badge>
                        )}
                      </div>

                      <p className="text-sm text-lumine-primary leading-relaxed">
                        {enrichmentData.score.reason}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
