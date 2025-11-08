import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft, MapPin, Ruler, Bed, Home, Euro, Calendar,
  Building2, Phone, ExternalLink, Leaf, Zap, BadgeCheck,
  Map as MapIcon, Share2, Heart, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperty();
  }, [id]);

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
          <Button onClick={() => navigate('/feed')} className="mt-4">
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
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  // DPE color mapping
  const dpeColors: Record<string, string> = {
    A: 'bg-green-500',
    B: 'bg-lime-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-400',
    E: 'bg-orange-500',
    F: 'bg-red-500',
    G: 'bg-red-700',
  };

  return (
    <div className="min-h-screen bg-lumine-neutral-100">
      {/* Header with back button */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-lumine-neutral-100/90 backdrop-blur-lg border-b border-lumine-neutral-400/20"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/feed')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Retour
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Share2 size={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart size={20} />
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Images and main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image carousel */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl group"
            >
              <img
                src={currentImage}
                alt={property.title}
                className="w-full h-[500px] object-cover"
              />

              {/* Previous/Next buttons */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Dot navigation */}
              {allImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/50 rounded-full px-4 py-2">
                  {allImages.slice(0, 10).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                    />
                  ))}
                  {allImages.length > 10 && (
                    <span className="text-white text-xs ml-2">
                      +{allImages.length - 10}
                    </span>
                  )}
                </div>
              )}

              {/* Image counter */}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </motion.div>

            {/* Title and location */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                <CardContent className="p-6">
                  <h1 className="text-3xl font-display font-bold text-lumine-primary mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 text-lumine-neutral-700">
                    <MapPin size={20} className="text-lumine-accent" />
                    <span className="text-lg">
                      {property.city} ({property.zipcode})
                    </span>
                  </div>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold text-lumine-accent">
                      {property.price.toLocaleString('fr-FR')} €
                    </span>
                    {property.price_per_meter && (
                      <span className="text-lumine-neutral-700">
                        ({parseFloat(property.price_per_meter).toLocaleString('fr-FR')} €/m²)
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Key metrics */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {property.surface && (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-lumine-accent/10 rounded-full flex items-center justify-center mb-2">
                          <Ruler className="text-lumine-accent600" size={24} />
                        </div>
                        <span className="text-2xl font-bold text-lumine-primary">
                          {property.surface} m²
                        </span>
                        <span className="text-sm text-lumine-neutral-700">Surface</span>
                      </div>
                    )}

                    {property.rooms && (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-2">
                          <Home className="text-success" size={24} />
                        </div>
                        <span className="text-2xl font-bold text-lumine-primary">
                          {property.rooms}
                        </span>
                        <span className="text-sm text-lumine-neutral-700">Pièces</span>
                      </div>
                    )}

                    {property.bedrooms && (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-lumine-neutral-200 rounded-full flex items-center justify-center mb-2">
                          <Bed className="text-lumine-accent" size={24} />
                        </div>
                        <span className="text-2xl font-bold text-lumine-primary">
                          {property.bedrooms}
                        </span>
                        <span className="text-sm text-lumine-neutral-700">Chambres</span>
                      </div>
                    )}

                    {property.construction_year && (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-lumine-neutral-200 rounded-full flex items-center justify-center mb-2">
                          <Calendar className="text-lumine-neutral-400" size={24} />
                        </div>
                        <span className="text-2xl font-bold text-lumine-primary">
                          {property.construction_year}
                        </span>
                        <span className="text-sm text-lumine-neutral-700">Construction</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Description */}
            {property.description && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold text-lumine-primary mb-4">
                      Description
                    </h2>
                    <p className="text-lumine-primary whitespace-pre-line leading-relaxed">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold text-lumine-primary mb-4 flex items-center gap-2">
                      <BadgeCheck className="text-lumine-accent600" />
                      Caractéristiques
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-sm px-3 py-1"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Additional details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-lumine-primary mb-4">
                    Informations complémentaires
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.floor !== null && (
                      <div className="flex items-center gap-3">
                        <Building2 className="text-lumine-neutral-700/70" size={20} />
                        <span className="text-lumine-neutral-700/70700">
                          Étage: {property.floor}
                        </span>
                      </div>
                    )}

                    {property.land_surface && (
                      <div className="flex items-center gap-3">
                        <Ruler className="text-lumine-neutral-700/70" size={20} />
                        <span className="text-lumine-neutral-700/70700">
                          Terrain: {property.land_surface} m²
                        </span>
                      </div>
                    )}

                    {property.property_type && (
                      <div className="flex items-center gap-3">
                        <Home className="text-lumine-neutral-700/70" size={20} />
                        <span className="text-lumine-neutral-700/70700">
                          Type: {property.property_type === 'house' ? 'Maison' : 'Appartement'}
                        </span>
                      </div>
                    )}

                    {property.transaction_type !== null && (
                      <div className="flex items-center gap-3">
                        <Euro className="text-lumine-neutral-700/70" size={20} />
                        <span className="text-lumine-neutral-700/70700">
                          {property.transaction_type === 0 ? 'Vente' : 'Location'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* DPE / GES */}
            {(property.dpe_category || property.ges_category) && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-lumine-primary mb-4">
                      Performance énergétique
                    </h3>

                    {property.dpe_category && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="text-lumine-accent" size={20} />
                            <span className="font-semibold">DPE</span>
                          </div>
                          <Badge
                            className={`${
                              dpeColors[property.dpe_category] || 'bg-lumine-neutral-700'
                            } text-white text-lg px-4 py-1`}
                          >
                            {property.dpe_category}
                          </Badge>
                        </div>
                        {property.dpe_value && (
                          <p className="text-sm text-lumine-neutral-700">
                            {property.dpe_value} kWh/m²/an
                          </p>
                        )}
                      </div>
                    )}

                    {property.ges_category && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Leaf className="text-success" size={20} />
                            <span className="font-semibold">GES</span>
                          </div>
                          <Badge
                            className={`${
                              dpeColors[property.ges_category] || 'bg-lumine-neutral-700'
                            } text-white text-lg px-4 py-1`}
                          >
                            {property.ges_category}
                          </Badge>
                        </div>
                        {property.ges_value && (
                          <p className="text-sm text-lumine-neutral-700">
                            {property.ges_value} kg CO₂/m²/an
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Agency contact */}
            {(property.agency_name || property.agency_phone) && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-lumine-primary mb-4">
                      Contact
                    </h3>

                    {property.agency_name && (
                      <div className="mb-3">
                        <p className="text-sm text-lumine-neutral-700 mb-1">Agence</p>
                        <p className="font-semibold text-lumine-primary">
                          {property.agency_name}
                        </p>
                      </div>
                    )}

                    {property.agency_phone && (
                      <div className="mb-4">
                        <p className="text-sm text-lumine-neutral-700 mb-1">Téléphone</p>
                        <a
                          href={`tel:${property.agency_phone}`}
                          className="flex items-center gap-2 text-lumine-accent600 font-semibold hover:underline"
                        >
                          <Phone size={16} />
                          {property.agency_phone}
                        </a>
                      </div>
                    )}

                    <Button className="w-full" size="lg">
                      Contacter l'agence
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Map */}
            {property.latitude && property.longitude && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-lumine-primary mb-4 flex items-center gap-2">
                      <MapIcon className="text-lumine-accent" />
                      Localisation
                    </h3>
                    <div className="aspect-video bg-cream-200 rounded-lg overflow-hidden">
                      <iframe
                        title="Property location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                          parseFloat(property.longitude) - 0.01
                        }%2C${parseFloat(property.latitude) - 0.01}%2C${
                          parseFloat(property.longitude) + 0.01
                        }%2C${
                          parseFloat(property.latitude) + 0.01
                        }&layer=mapnik&marker=${property.latitude}%2C${
                          property.longitude
                        }`}
                      />
                    </div>
                    <p className="text-sm text-lumine-neutral-700 mt-2">
                      Coordonnées: {parseFloat(property.latitude).toFixed(6)},{' '}
                      {parseFloat(property.longitude).toFixed(6)}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Original listing link */}
            {property.advert_url && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                  <CardContent className="p-6">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(property.advert_url, '_blank')}
                    >
                      <ExternalLink size={16} className="mr-2" />
                      Voir l'annonce originale
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Metadata */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border border-lumine-neutral-400/10 shadow-xl bg-lumine-neutral-100 rounded-3xl">
                <CardContent className="p-6">
                  <h3 className="text-sm font-semibold text-lumine-neutral-700 mb-3">
                    Informations
                  </h3>
                  <div className="space-y-2 text-sm text-lumine-neutral-700">
                    <p>
                      Créée le:{' '}
                      {new Date(property.melo_created_at).toLocaleDateString('fr-FR')}
                    </p>
                    {property.melo_updated_at && (
                      <p>
                        Mise à jour:{' '}
                        {new Date(property.melo_updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                    <p className="text-xs text-lumine-neutral-700/70 mt-4">
                      ID: {property.melo_uuid}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
