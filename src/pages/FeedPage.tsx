import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { ListingCard } from '@/components/ListingCard';
import { Listing } from '@/types';
import { Search, SlidersHorizontal } from 'lucide-react';
import './FeedPage.css';

export function FeedPage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="feed-page">
      <header className="feed-header">
        <div className="header-top">
          <div className="welcome-section">
            <h1>Bonjour {profile?.full_name || 'Utilisateur'} 👋</h1>
            <p>Découvrez les biens qui correspondent à vos critères</p>
          </div>

          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="user-avatar" />
          ) : (
            <div className="user-avatar-placeholder">
              {(profile?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
          )}
        </div>

        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher une ville, un quartier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-ghost">
            <SlidersHorizontal size={20} />
          </button>
        </div>

        <div className="category-filters">
          <button className="chip active">Tous</button>
          <button className="chip">Appartements</button>
          <button className="chip">Maisons</button>
          <button className="chip">Nouveautés</button>
        </div>
      </header>

      <div className="listings-grid">
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
            Chargement de vos annonces...
          </div>
        ) : filteredListings.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
            Aucune annonce trouvée
          </div>
        ) : (
          filteredListings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => navigate(`/property/${listing.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
