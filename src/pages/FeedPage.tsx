import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { Listing } from '@/types';
import { Search, SlidersHorizontal, MapPin, Bed, Ruler, Heart, Euro } from 'lucide-react';

export function FeedPage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'apartment' | 'house'>('all');

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
      listing.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' || listing.propertyType === filter;
    return matchesSearch && matchesFilter;
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
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <div className="bg-gradient-to-b from-cream-50 to-cream-100 border-b border-warm-taupe/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-serif font-light text-elegant-charcoal mb-2">
              Bonjour {profile?.full_name || 'Utilisateur'}
            </h1>
            <p className="text-lg text-elegant-stone">
              Découvrez votre prochain cocon
            </p>
          </motion.div>

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
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-elegant-stone"
              />
              <input
                type="text"
                placeholder="Rechercher une ville, un quartier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-14 py-4 bg-cream-50 border border-warm-taupe/20 rounded-2xl text-elegant-charcoal placeholder:text-elegant-stone/50 focus:outline-none focus:ring-2 focus:ring-warm-terracotta/50 focus:border-transparent transition-all"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-warm-beige rounded-xl transition-colors">
                <SlidersHorizontal size={20} className="text-elegant-stone" />
              </button>
            </div>
          </motion.div>

          {/* Filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-cream-100 border-b border-warm-taupe/10 backdrop-blur-sm"
          >
            <div className="flex gap-3 overflow-x-auto pb-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-warm-terracotta text-cream-50 shadow-md'
                    : 'bg-cream-50 text-elegant-stone hover:bg-warm-beige'
                }`}
              >
                Tous
              </button>
              {hasApartments && (
                <button
                  onClick={() => setFilter('apartment')}
                  className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filter === 'apartment'
                      ? 'bg-warm-terracotta text-cream-50 shadow-md'
                      : 'bg-cream-50 text-elegant-stone hover:bg-warm-beige'
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
                      ? 'bg-warm-terracotta text-cream-50 shadow-md'
                      : 'bg-cream-50 text-elegant-stone hover:bg-warm-beige'
                  }`}
                >
                  Maisons
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Properties grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-warm-terracotta/30 border-t-warm-terracotta rounded-full animate-spin mx-auto mb-4" />
              <p className="text-elegant-stone">Chargement de vos annonces...</p>
            </div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-elegant-stone">Aucune annonce trouvée</p>
            <p className="text-elegant-stone/70 mt-2">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing, index) => {
              const prop = properties.find(p => p.id.toString() === listing.id);
              const mainImage = prop?.main_image || prop?.images?.[0] || prop?.pictures_remote?.[0] || '';

              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/property/${listing.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="bg-cream-50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-warm-taupe/10">
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-warm-beige">
                      <img
                        src={mainImage}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Favorite button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="absolute top-4 right-4 w-10 h-10 bg-cream-50/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-cream-50 transition-colors"
                      >
                        <Heart size={18} className="text-elegant-stone" />
                      </button>

                      {/* DPE badge */}
                      {listing.energyClass && (
                        <div className="absolute top-4 left-4">
                          <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            listing.energyClass === 'A' ? 'bg-green-500 text-white' :
                            listing.energyClass === 'B' ? 'bg-lime-500 text-white' :
                            listing.energyClass === 'C' ? 'bg-yellow-500 text-white' :
                            listing.energyClass === 'D' ? 'bg-orange-400 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            DPE {listing.energyClass}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-serif font-semibold text-elegant-charcoal">
                          {listing.price.toLocaleString('fr-FR')} €
                        </span>
                        {prop?.price_per_meter && (
                          <span className="text-sm text-elegant-stone">
                            ({parseFloat(prop.price_per_meter).toLocaleString('fr-FR')} €/m²)
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-medium text-elegant-charcoal mb-2 line-clamp-2 group-hover:text-warm-terracotta transition-colors">
                        {listing.title}
                      </h3>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-elegant-stone mb-4">
                        <MapPin size={16} />
                        <span className="text-sm">{listing.city}</span>
                      </div>

                      {/* Features */}
                      <div className="flex items-center gap-4 text-sm text-elegant-stone">
                        {listing.surface > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Ruler size={16} />
                            <span>{listing.surface} m²</span>
                          </div>
                        )}
                        {listing.rooms > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Euro size={16} />
                            <span>{listing.rooms} pièces</span>
                          </div>
                        )}
                        {listing.bedrooms > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Bed size={16} />
                            <span>{listing.bedrooms} ch.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredListings.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-elegant-stone"
          >
            {filteredListings.length} bien{filteredListings.length > 1 ? 's' : ''} trouvé{filteredListings.length > 1 ? 's' : ''}
          </motion.div>
        )}
      </div>
    </div>
  );
}
