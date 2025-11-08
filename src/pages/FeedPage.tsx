import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { calculatePropertyScore } from '@/lib/gemini-client';
import { Listing } from '@/types';
import { Search, SlidersHorizontal, MapPin, Heart, Map, List, X, Home, User, Grid3x3, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Calculate monthly payment estimate
function calculateMonthlyPayment(price: number): number {
  const downPayment = price * 0.2; // 20% apport
  const loanAmount = price - downPayment;
  const annualRate = 0.035; // 3.5% taux annuel
  const monthlyRate = annualRate / 12;
  const months = 20 * 12; // 20 ans

  if (monthlyRate === 0) return loanAmount / months;

  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(monthlyPayment);
}

export function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'apartment' | 'house'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'hybrid'>('hybrid');
  const [surfaceMin, setSurfaceMin] = useState<number>(0);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(0);
  const [quartier, setQuartier] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [propertyScores, setPropertyScores] = useState<Record<number, any>>({});
  const [loadingScores, setLoadingScores] = useState<Record<number, boolean>>({});

  // Active filter chips
  const [activeFilters, setActiveFilters] = useState<{
    price?: number;
    surface?: number;
    rooms?: number;
  }>({});

  // Load user's properties from Supabase
  useEffect(() => {
    const loadProperties = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('melo_properties')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProperties(data || []);
      } catch (error) {
        console.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [user]);

  // Load scores for properties
  useEffect(() => {
    const loadScores = async () => {
      if (!user || properties.length === 0) return;

      // Load scores for first 10 properties
      const propertiesToScore = properties.slice(0, 10);

      for (const property of propertiesToScore) {
        if (propertyScores[property.id] || loadingScores[property.id]) continue;

        setLoadingScores(prev => ({ ...prev, [property.id]: true }));

        try {
          const scoreResult = await calculatePropertyScore(property.id);
          setPropertyScores(prev => ({ ...prev, [property.id]: scoreResult }));
        } catch (error) {
          console.error(`Error loading score for property ${property.id}:`, error);
        } finally {
          setLoadingScores(prev => ({ ...prev, [property.id]: false }));
        }
      }
    };

    loadScores();
  }, [user, properties]);

  // Convert Supabase properties to Listing format
  const listings: Listing[] = properties.map(prop => ({
    id: prop.id.toString(),
    title: prop.title,
    price: prop.price,
    surface: prop.surface || 0,
    rooms: prop.rooms || 0,
    bedrooms: prop.bedrooms || 0,
    bathrooms: prop.bathrooms || 1,
    city: prop.city,
    address: prop.zipcode ? `${prop.city} ${prop.zipcode}` : prop.city,
    description: prop.description || '',
    images: prop.images || [],
    propertyType: prop.property_type === 'house' ? 'house' : 'apartment',
    hasParking: false,
    energyClass: prop.dpe_category,
    yearBuilt: prop.construction_year,
    floor: prop.floor,
  }));

  const filteredListings = listings.filter(listing => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quartier && listing.description.toLowerCase().includes(quartier.toLowerCase()));

    const matchesFilter =
      filter === 'all' || listing.propertyType === filter;

    const matchesSurface = surfaceMin === 0 || listing.surface >= surfaceMin;

    const matchesPrice =
      (priceMin === 0 || listing.price >= priceMin) &&
      (priceMax === 0 || listing.price <= priceMax);

    const matchesQuartier = !quartier ||
      listing.description.toLowerCase().includes(quartier.toLowerCase()) ||
      listing.city.toLowerCase().includes(quartier.toLowerCase());

    const matchesActiveFilters =
      (!activeFilters.price || listing.price <= activeFilters.price) &&
      (!activeFilters.surface || listing.surface >= activeFilters.surface) &&
      (!activeFilters.rooms || listing.rooms >= activeFilters.rooms);

    return matchesSearch && matchesFilter && matchesSurface && matchesPrice && matchesQuartier && matchesActiveFilters;
  });

  // Check if there are properties of each type
  const hasApartments = listings.some(listing => listing.propertyType === 'apartment');
  const hasHouses = listings.some(listing => listing.propertyType === 'house');

  // Reset filter to 'all' if the selected type doesn't exist
  useEffect(() => {
    if (filter === 'apartment' && !hasApartments) {
      setFilter('all');
    }
    if (filter === 'house' && !hasHouses) {
      setFilter('all');
    }
  }, [filter, hasApartments, hasHouses]);

  // Get recommendation badge component
  const RecommendationBadge = ({ badge }: { badge: string | null }) => {
    if (!badge) return null;

    const badges = {
      trending: { label: 'Tendance', color: 'bg-red-500', icon: '⚡' },
      favorite: { label: 'Coup de cœur', color: 'bg-amber-500', icon: '⭐' },
      recommended: { label: 'Recommandé', color: 'bg-blue-600', icon: '✓' },
    };

    const config = badges[badge as keyof typeof badges];
    if (!config) return null;

    return (
      <div className={`${config.color} text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
        <span>{config.icon}</span> {config.label}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-lumine-neutral-100">
      {/* Header */}
      <header className="w-full bg-white border-b border-lumine-neutral-400/20 shadow-sm sticky top-0 z-50">
        <div className="w-full px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 bg-lumine-accent rounded-lg flex items-center justify-center">
                <Home className="text-white" size={20} />
              </div>
              <h1 className="text-2xl font-display text-lumine-primary hidden sm:block">
                LUMIN<span className="text-sm align-super">ᵉ</span>
              </h1>
            </div>

            {/* Search Context - Center */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="text-sm text-lumine-neutral-700">
                <span className="font-semibold text-lumine-primary">{filteredListings.length} annonces</span>
                {priceMin > 0 && priceMax > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <span>{(priceMin / 1000).toFixed(0)}k€ - {(priceMax / 1000).toFixed(0)}k€</span>
                  </>
                )}
              </div>
            </div>

            {/* View Toggle & Controls - Right */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* View Toggle Buttons */}
              <div className="hidden sm:flex items-center bg-lumine-neutral-200 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm rounded transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-lumine-accent text-white shadow-md'
                      : 'text-lumine-neutral-700 hover:bg-white'
                  }`}
                  title="Liste"
                >
                  <List size={16} className="inline" />
                  <span className="hidden md:inline ml-1">Liste</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 text-sm rounded transition-all duration-200 ${
                    viewMode === 'map'
                      ? 'bg-lumine-accent text-white shadow-md'
                      : 'text-lumine-neutral-700 hover:bg-white'
                  }`}
                  title="Carte"
                >
                  <MapPin size={16} className="inline" />
                  <span className="hidden md:inline ml-1">Carte</span>
                </button>
                <button
                  onClick={() => setViewMode('hybrid')}
                  className={`px-3 py-1.5 text-sm rounded transition-all duration-200 ${
                    viewMode === 'hybrid'
                      ? 'bg-lumine-accent text-white shadow-md'
                      : 'text-lumine-neutral-700 hover:bg-white'
                  }`}
                  title="Hybride"
                >
                  <Grid3x3 size={16} className="inline" />
                  <span className="hidden md:inline ml-1">Hybride</span>
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative p-2 hover:bg-lumine-neutral-200 rounded-lg transition-all duration-200"
              >
                <SlidersHorizontal size={20} className="text-lumine-neutral-700" />
                {Object.keys(activeFilters).length > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {Object.keys(activeFilters).length}
                  </span>
                )}
              </button>

              {/* Profile */}
              <div
                onClick={() => navigate('/app/account')}
                className="w-10 h-10 bg-lumine-accent rounded-full flex items-center justify-center cursor-pointer hover:bg-lumine-accent-dark transition-all duration-200"
              >
                <User className="text-white" size={18} />
              </div>
            </div>
          </div>

          {/* Mobile Search Context */}
          <div className="md:hidden mt-3 text-xs text-lumine-neutral-700 text-center">
            <span className="font-semibold text-lumine-primary">{filteredListings.length} annonces</span>
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div className="w-full px-4 md:px-6 lg:px-8 py-3 border-t border-lumine-neutral-400/10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {activeFilters.price && (
              <button
                onClick={() => setActiveFilters({ ...activeFilters, price: undefined })}
                className="px-3 py-1.5 text-sm bg-white border border-lumine-neutral-400 rounded-full text-lumine-neutral-700 hover:border-lumine-accent hover:text-lumine-accent transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                <X className="inline" size={12} /> Prix: {(activeFilters.price / 1000).toFixed(0)}k€
              </button>
            )}
            {activeFilters.surface && (
              <button
                onClick={() => setActiveFilters({ ...activeFilters, surface: undefined })}
                className="px-3 py-1.5 text-sm bg-white border border-lumine-neutral-400 rounded-full text-lumine-neutral-700 hover:border-lumine-accent hover:text-lumine-accent transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                <X className="inline" size={12} /> Surface: {activeFilters.surface}m²+
              </button>
            )}
            {activeFilters.rooms && (
              <button
                onClick={() => setActiveFilters({ ...activeFilters, rooms: undefined })}
                className="px-3 py-1.5 text-sm bg-white border border-lumine-neutral-400 rounded-full text-lumine-neutral-700 hover:border-lumine-accent hover:text-lumine-accent transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                <X className="inline" size={12} /> {activeFilters.rooms}+ Pièces
              </button>
            )}
            <button
              onClick={() => setShowFilters(true)}
              className="px-3 py-1.5 text-sm text-lumine-accent border border-lumine-accent rounded-full hover:bg-lumine-accent/10 transition-all duration-200 whitespace-nowrap flex-shrink-0"
            >
              + Affiner
            </button>
          </div>
        </div>
      </header>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-lumine-neutral-400/20 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lumine-primary mb-2">
                    Prix max (€)
                  </label>
                  <input
                    type="number"
                    value={priceMax || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setPriceMax(value);
                      if (value > 0) {
                        setActiveFilters({ ...activeFilters, price: value });
                      }
                    }}
                    placeholder="500000"
                    className="w-full px-4 py-2 bg-lumine-neutral-100 border border-lumine-neutral-400/20 rounded-xl text-lumine-primary focus:outline-none focus:ring-2 focus:ring-lumine-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lumine-primary mb-2">
                    Surface min (m²)
                  </label>
                  <input
                    type="number"
                    value={surfaceMin || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setSurfaceMin(value);
                      if (value > 0) {
                        setActiveFilters({ ...activeFilters, surface: value });
                      }
                    }}
                    placeholder="75"
                    className="w-full px-4 py-2 bg-lumine-neutral-100 border border-lumine-neutral-400/20 rounded-xl text-lumine-primary focus:outline-none focus:ring-2 focus:ring-lumine-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lumine-primary mb-2">
                    Quartier
                  </label>
                  <input
                    type="text"
                    value={quartier}
                    onChange={(e) => setQuartier(e.target.value)}
                    placeholder="Ex: Marais"
                    className="w-full px-4 py-2 bg-lumine-neutral-100 border border-lumine-neutral-400/20 rounded-xl text-lumine-primary focus:outline-none focus:ring-2 focus:ring-lumine-accent/50"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setSurfaceMin(0);
                  setPriceMin(0);
                  setPriceMax(0);
                  setQuartier('');
                  setActiveFilters({});
                }}
                className="mt-4 text-sm text-lumine-accent hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`w-full max-w-none ${viewMode === 'hybrid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-0' : ''}`}>
        {/* Property List */}
        {(viewMode === 'list' || viewMode === 'hybrid') && (
          <div className={`${viewMode === 'hybrid' ? 'lg:col-span-1 overflow-y-auto lg:border-r lg:border-lumine-neutral-400/20' : ''}`}>
            <div className="w-full px-4 md:px-6 lg:px-6 py-4 md:py-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-lumine-accent/30 border-t-lumine-accent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lumine-neutral-700">Chargement...</p>
                  </div>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-xl text-lumine-neutral-700">Aucune annonce trouvée</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredListings.map((listing, index) => {
                    const prop = properties.find(p => p.id.toString() === listing.id);
                    const score = propertyScores[prop?.id];
                    const monthlyPayment = calculateMonthlyPayment(listing.price);

                    // Get images
                    const allImages = [
                      ...(Array.isArray(prop?.pictures_remote) && prop.pictures_remote.length > 0 ? prop.pictures_remote : []),
                      ...(Array.isArray(prop?.images) && prop.images.length > 0 ? prop.images : []),
                    ].filter(img => img && typeof img === 'string' && img.trim() !== '');

                    if (allImages.length === 0 && prop?.main_image) {
                      allImages.push(prop.main_image);
                    }

                    const currentImg = allImages[0] || '';

                    return (
                      <motion.div
                        key={listing.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-lumine-neutral-400/20 cursor-pointer group"
                        onClick={() => navigate(`/property/${listing.id}`)}
                      >
                        <div className="flex flex-col sm:flex-row gap-0">
                          {/* Image */}
                          <div className="sm:w-32 md:w-40 flex-shrink-0 relative h-40 sm:h-auto bg-gradient-to-br from-lumine-neutral-200 to-lumine-neutral-300 overflow-hidden">
                            {currentImg ? (
                              <img
                                src={currentImg}
                                alt={listing.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-all duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="text-lumine-neutral-500" size={32} />
                              </div>
                            )}

                            {/* Recommendation Badge */}
                            {score?.recommendation && (
                              <div className="absolute top-2 left-2">
                                <RecommendationBadge badge={score.recommendation} />
                              </div>
                            )}

                            {/* Favorite button */}
                            <div
                              className="absolute top-2 right-2 bg-white bg-opacity-90 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-opacity-100 transition-all duration-200 z-10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Heart size={14} className="text-lumine-neutral-700 hover:text-red-500" />
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              {/* Price & Score Badge */}
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="text-2xl font-bold text-lumine-primary">
                                    {listing.price.toLocaleString('fr-FR')} €
                                  </div>
                                  <div className="text-xs text-lumine-neutral-700 mt-1">
                                    soit {monthlyPayment.toLocaleString('fr-FR')}€/mois
                                  </div>
                                </div>
                                {score && (
                                  <div className="inline-block bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-semibold">
                                    {score.score}/10
                                  </div>
                                )}
                              </div>

                              {/* Location & Details */}
                              <div className="mb-3">
                                <div className="text-sm text-lumine-primary font-medium flex items-center gap-1 mb-1">
                                  <MapPin size={14} className="text-lumine-accent" />
                                  {listing.address}
                                </div>
                                <div className="text-sm text-lumine-neutral-700 line-clamp-1">
                                  {listing.description || listing.title}
                                </div>
                              </div>

                              {/* Quick Stats - Grid 4 columns */}
                              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                <div>
                                  <div className="font-semibold text-lumine-primary">
                                    {listing.bedrooms || listing.rooms || '-'}
                                  </div>
                                  <div className="text-lumine-neutral-700">Chambres</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-lumine-primary">
                                    {listing.bathrooms || '-'}
                                  </div>
                                  <div className="text-lumine-neutral-700">SdB</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-lumine-primary">
                                    {listing.surface || '-'}
                                  </div>
                                  <div className="text-lumine-neutral-700">m²</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-lumine-primary">
                                    {listing.yearBuilt || '-'}
                                  </div>
                                  <div className="text-lumine-neutral-700">Construit</div>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-3 pt-3 border-t border-lumine-neutral-400/20">
                              <button className="w-full py-2 bg-lumine-accent text-white rounded-lg hover:bg-lumine-accent-dark transition-all duration-200 font-medium text-sm">
                                Voir plus <ArrowRight size={14} className="inline ml-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Map View */}
        {(viewMode === 'map' || viewMode === 'hybrid') && (
          <div className={`${viewMode === 'hybrid' ? 'lg:col-span-1 hidden lg:flex flex-col bg-lumine-neutral-200 relative' : 'w-full'}`}>
            <div className={`${viewMode === 'hybrid' ? 'flex-1' : 'h-[calc(100vh-200px)]'} relative overflow-hidden`}>
              <MapContainer
                center={[48.8566, 2.3522]}
                zoom={12}
                className="h-full w-full"
                style={{ zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  maxZoom={20}
                />
                {filteredListings.map((listing) => {
                  const prop = properties.find(p => p.id.toString() === listing.id);
                  const lat = prop?.latitude || 48.8566 + (Math.random() - 0.5) * 0.1;
                  const lng = prop?.longitude || 2.3522 + (Math.random() - 0.5) * 0.1;
                  const score = propertyScores[prop?.id];

                  return (
                    <CircleMarker
                      key={listing.id}
                      center={[lat, lng]}
                      radius={10}
                      pathOptions={{
                        fillColor: '#D4A574',
                        color: '#FFFFFF',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8,
                      }}
                      eventHandlers={{
                        mouseover: (e) => {
                          e.target.setStyle({ fillOpacity: 1, radius: 12 });
                        },
                        mouseout: (e) => {
                          e.target.setStyle({ fillOpacity: 0.8, radius: 10 });
                        },
                      }}
                    >
                      <Popup>
                        <div className="w-64">
                          <h3 className="font-semibold text-sm mb-2 line-clamp-2">{listing.title}</h3>
                          <p className="text-lg font-display font-semibold mb-1">
                            {listing.price.toLocaleString('fr-FR')} €
                          </p>
                          {score && (
                            <p className="text-xs text-lumine-accent mb-2">Score: {score.score}/10</p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-lumine-neutral-700 mb-3">
                            {listing.bedrooms > 0 && <span>{listing.bedrooms} chambres</span>}
                            {listing.surface > 0 && <span>{listing.surface} m²</span>}
                          </div>
                          <button
                            onClick={() => navigate(`/property/${listing.id}`)}
                            className="w-full py-2 bg-lumine-accent text-white rounded-lg text-sm hover:bg-lumine-accent-dark transition-colors"
                          >
                            Voir détails
                          </button>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
