import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Listing } from '@/types';
import { Search, SlidersHorizontal, MapPin, Bed, Ruler, Heart, Map, List, Menu, X, Home, User, ChevronLeft, ChevronRight, Home as HomeIcon } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'apartment' | 'house'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [menuOpen, setMenuOpen] = useState(false);
  const [surfaceMin, setSurfaceMin] = useState<number>(0);
  const [priceMin, setPriceMin] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(0);
  const [quartier, setQuartier] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});

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

  // Convert Supabase properties to Listing format
  const listings: Listing[] = properties.map(prop => ({
    id: prop.id.toString(),
    title: prop.title,
    price: prop.price,
    surface: prop.surface || 0,
    rooms: prop.rooms || 0,
    bedrooms: prop.bedrooms || 0,
    bathrooms: 1,
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

    return matchesSearch && matchesFilter && matchesSurface && matchesPrice && matchesQuartier;
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

  return (
    <div className="min-h-screen bg-lumine-neutral-100">
      {/* Hamburger Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-lumine-neutral-100 shadow-2xl z-50 p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display text-lumine-primary">Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 hover:bg-lumine-neutral-200 rounded-xl transition-colors"
                >
                  <X size={24} className="text-lumine-neutral-700" />
                </button>
              </div>
              <nav className="space-y-4">
                <button
                  onClick={() => {
                    navigate('/feed');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-lumine-neutral-200 rounded-xl transition-colors text-left"
                >
                  <Home size={20} className="text-lumine-neutral-700" />
                  <span className="text-lumine-primary">Explorer</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/favorites');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-lumine-neutral-200 rounded-xl transition-colors text-left"
                >
                  <Heart size={20} className="text-lumine-neutral-700" />
                  <span className="text-lumine-primary">Favoris</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/account');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-lumine-neutral-200 rounded-xl transition-colors text-left"
                >
                  <User size={20} className="text-lumine-neutral-700" />
                  <span className="text-lumine-primary">Compte</span>
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-b from-cream-50 to-cream-100 border-b border-lumine-neutral-400/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Top bar with view toggle and menu */}
          <div className="flex justify-between items-center mb-6">
            {/* View toggle */}
            <div className="flex gap-2 bg-lumine-neutral-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-lumine-accent text-lumine-neutral-100 shadow-md'
                    : 'text-lumine-neutral-700 hover:bg-lumine-neutral-200'
                }`}
              >
                <List size={18} />
                <span className="text-sm font-medium">Liste</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'map'
                    ? 'bg-lumine-accent text-lumine-neutral-100 shadow-md'
                    : 'text-lumine-neutral-700 hover:bg-lumine-neutral-200'
                }`}
              >
                <Map size={18} />
                <span className="text-sm font-medium">Carte</span>
              </button>
            </div>

            {/* Hamburger menu button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 hover:bg-lumine-neutral-200 rounded-xl transition-colors"
            >
              <Menu size={24} className="text-lumine-neutral-700" />
            </button>
          </div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lumine-neutral-700"
              />
              <input
                type="text"
                placeholder="Rechercher une ville, un quartier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-14 py-4 bg-lumine-neutral-100 border border-lumine-neutral-400/20 rounded-2xl text-lumine-primary placeholder:text-lumine-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-lumine-accent/50 focus:border-transparent transition-all"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-lumine-neutral-200 rounded-xl transition-colors"
              >
                <SlidersHorizontal size={20} className="text-lumine-neutral-700" />
              </button>
            </div>
          </motion.div>

          {/* Filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="bg-lumine-neutral-100 rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-lumine-primary mb-2">
                        Surface min (m²)
                      </label>
                      <input
                        type="number"
                        value={surfaceMin || ''}
                        onChange={(e) => setSurfaceMin(Number(e.target.value))}
                        placeholder="0"
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
                        placeholder="Ex: Centre-ville"
                        className="w-full px-4 py-2 bg-lumine-neutral-100 border border-lumine-neutral-400/20 rounded-xl text-lumine-primary focus:outline-none focus:ring-2 focus:ring-lumine-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lumine-primary mb-2">
                        Prix min (€)
                      </label>
                      <input
                        type="number"
                        value={priceMin || ''}
                        onChange={(e) => setPriceMin(Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-4 py-2 bg-lumine-neutral-100 border border-lumine-neutral-400/20 rounded-xl text-lumine-primary focus:outline-none focus:ring-2 focus:ring-lumine-accent/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-lumine-primary mb-2">
                        Prix max (€)
                      </label>
                      <input
                        type="number"
                        value={priceMax || ''}
                        onChange={(e) => setPriceMax(Number(e.target.value))}
                        placeholder="Illimité"
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
                    }}
                    className="text-sm text-lumine-accent hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-lumine-neutral-100 border-b border-lumine-neutral-400/10 backdrop-blur-sm"
          >
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-lumine-accent text-lumine-neutral-100 shadow-md'
                    : 'bg-lumine-neutral-100 text-lumine-neutral-700 hover:bg-lumine-neutral-200'
                }`}
              >
                Tous
              </button>
              {hasApartments && (
                <button
                  onClick={() => setFilter('apartment')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filter === 'apartment'
                      ? 'bg-lumine-accent text-lumine-neutral-100 shadow-md'
                      : 'bg-lumine-neutral-100 text-lumine-neutral-700 hover:bg-lumine-neutral-200'
                  }`}
                >
                  Appartements
                </button>
              )}
              {hasHouses && (
                <button
                  onClick={() => setFilter('house')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filter === 'house'
                      ? 'bg-lumine-accent text-lumine-neutral-100 shadow-md'
                      : 'bg-lumine-neutral-100 text-lumine-neutral-700 hover:bg-lumine-neutral-200'
                  }`}
                >
                  Maisons
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Properties content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-lumine-accent/30 border-t-lumine-accent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lumine-neutral-700">Chargement de vos annonces...</p>
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-lumine-neutral-700">Aucune annonce trouvée</p>
            <p className="text-lumine-neutral-700/70 mt-2">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* List view */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing, index) => {
                const prop = properties.find(p => p.id.toString() === listing.id);

                // Properly combine all available images
                const allImages = [
                  ...(Array.isArray(prop?.pictures_remote) && prop.pictures_remote.length > 0 ? prop.pictures_remote : []),
                  ...(Array.isArray(prop?.images) && prop.images.length > 0 ? prop.images : []),
                ].filter(img => img && typeof img === 'string' && img.trim() !== '');

                // Add main_image as fallback if no images in arrays
                if (allImages.length === 0 && prop?.main_image) {
                  allImages.push(prop.main_image);
                }

                const imgIndex = currentImageIndex[listing.id] || 0;
                const currentImg = allImages[imgIndex] || allImages[0] || '';

                return (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/property/${listing.id}`)}
                    className="group cursor-pointer"
                  >
                    <div className="bg-lumine-neutral-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-lumine-neutral-400/10">
                      {/* Image with navigation */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-lumine-neutral-200">
                        <img
                          src={currentImg}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Image navigation */}
                        {allImages.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex({
                                  ...currentImageIndex,
                                  [listing.id]: imgIndex > 0 ? imgIndex - 1 : allImages.length - 1
                                });
                              }}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-lumine-neutral-100/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-lumine-neutral-100 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <ChevronLeft size={16} className="text-lumine-neutral-700" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentImageIndex({
                                  ...currentImageIndex,
                                  [listing.id]: imgIndex < allImages.length - 1 ? imgIndex + 1 : 0
                                });
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-lumine-neutral-100/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-lumine-neutral-100 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <ChevronRight size={16} className="text-lumine-neutral-700" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                              {allImages.slice(0, 5).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    i === imgIndex ? 'bg-lumine-neutral-100' : 'bg-lumine-neutral-100/40'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="absolute top-4 right-4 w-10 h-10 bg-lumine-neutral-100/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-lumine-neutral-100 transition-colors"
                        >
                          <Heart size={18} className="text-lumine-neutral-700" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-lumine-primary mb-2 line-clamp-2 group-hover:text-lumine-accent transition-colors">
                          {listing.title}
                        </h3>

                        {/* Price */}
                        <div className="mb-4">
                          <span className="text-2xl font-display font-semibold text-lumine-primary">
                            {listing.price.toLocaleString('fr-FR')} €
                          </span>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-lumine-neutral-700">
                          {listing.surface > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Ruler size={16} />
                              <span>{listing.surface} m²</span>
                            </div>
                          )}
                          {listing.rooms > 0 && (
                            <div className="flex items-center gap-1.5">
                              <HomeIcon size={16} />
                              <span>{listing.rooms} pièces</span>
                            </div>
                          )}
                          {listing.bedrooms > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Bed size={16} />
                              <span>{listing.bedrooms} ch.</span>
                            </div>
                          )}
                          {prop?.land_surface && prop.land_surface > 0 && (
                            <div className="flex items-center gap-1.5">
                              <MapPin size={16} />
                              <span>{prop.land_surface} m² terrain</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-center text-lumine-neutral-700"
            >
              {filteredListings.length} bien{filteredListings.length > 1 ? 's' : ''} trouvé{filteredListings.length > 1 ? 's' : ''}
            </motion.div>
          </>
        ) : (
          /* Map view */
          <div className="relative h-[calc(100vh-300px)] rounded-3xl overflow-hidden">
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

                // Properly combine all available images (same logic as list view)
                const allImages = [
                  ...(Array.isArray(prop?.pictures_remote) && prop.pictures_remote.length > 0 ? prop.pictures_remote : []),
                  ...(Array.isArray(prop?.images) && prop.images.length > 0 ? prop.images : []),
                ].filter(img => img && typeof img === 'string' && img.trim() !== '');

                // Add main_image as fallback if no images in arrays
                if (allImages.length === 0 && prop?.main_image) {
                  allImages.push(prop.main_image);
                }

                const imgIndex = currentImageIndex[listing.id] || 0;
                const currentImg = allImages[imgIndex] || allImages[0] || '';

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
                        {/* Image carousel */}
                        <div className="relative aspect-[4/3] mb-3 rounded-lg overflow-hidden">
                          <img
                            src={currentImg}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                          {allImages.length > 1 && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex({
                                    ...currentImageIndex,
                                    [listing.id]: imgIndex > 0 ? imgIndex - 1 : allImages.length - 1
                                  });
                                }}
                                className="absolute left-1 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                              >
                                <ChevronLeft size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentImageIndex({
                                    ...currentImageIndex,
                                    [listing.id]: imgIndex < allImages.length - 1 ? imgIndex + 1 : 0
                                  });
                                }}
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                              >
                                <ChevronRight size={14} />
                              </button>
                              {/* Image indicators */}
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                                {allImages.slice(0, 5).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      i === imgIndex ? 'bg-white' : 'bg-white/40'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{listing.title}</h3>

                        {/* Price */}
                        <p className="text-lg font-display font-semibold mb-3">
                          {listing.price.toLocaleString('fr-FR')} €
                        </p>

                        {/* KPIs */}
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          {listing.surface > 0 && <span>{listing.surface} m²</span>}
                          {listing.rooms > 0 && <span>{listing.rooms} pièces</span>}
                          {listing.bedrooms > 0 && <span>{listing.bedrooms} ch.</span>}
                          {prop?.land_surface && prop.land_surface > 0 && <span>{prop.land_surface} m² terrain</span>}
                        </div>

                        <button
                          onClick={() => navigate(`/property/${listing.id}`)}
                          className="mt-3 w-full py-2 bg-lumine-accent text-white rounded-lg text-sm hover:bg-lumine-accent/90 transition-colors"
                        >
                          Voir les détails
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
