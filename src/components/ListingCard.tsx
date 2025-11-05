import { Listing } from '@/types';
import { MapPin, BedDouble, Bath, Square, Star } from 'lucide-react';
import './ListingCard.css';

interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
  return (
    <div className="listing-card" onClick={onClick}>
      <div className="listing-image">
        <img src={listing.images[0]} alt={listing.title} />
        {listing.rating && (
          <div className="listing-rating">
            <Star size={14} fill="currentColor" />
            <span>{listing.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className="listing-content">
        <h3 className="listing-title">{listing.title}</h3>

        <div className="listing-location">
          <MapPin size={16} />
          <span>{listing.city}</span>
        </div>

        <div className="listing-price">
          {listing.price.toLocaleString('fr-FR')} €
        </div>

        <div className="listing-features">
          <div className="feature">
            <BedDouble size={16} />
            <span>{listing.bedrooms}</span>
          </div>
          <div className="feature">
            <Bath size={16} />
            <span>{listing.bathrooms}</span>
          </div>
          <div className="feature">
            <Square size={16} />
            <span>{listing.surface}m²</span>
          </div>
        </div>
      </div>
    </div>
  );
}
