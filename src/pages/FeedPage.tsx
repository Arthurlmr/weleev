import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ListingCard } from '@/components/ListingCard';
import { ListingDetailModal } from '@/components/ListingDetailModal';
import { mockListings } from '@/lib/mockData';
import { Listing } from '@/types';
import { Search, SlidersHorizontal } from 'lucide-react';
import './FeedPage.css';

export function FeedPage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredListings = mockListings.filter(listing =>
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
        {filteredListings.map(listing => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClick={() => setSelectedListing(listing)}
          />
        ))}
      </div>

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </div>
  );
}
