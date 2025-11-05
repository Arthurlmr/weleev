import { Heart } from 'lucide-react';
import './FavoritesPage.css';

export function FavoritesPage() {
  return (
    <div className="favorites-page">
      <header className="favorites-header">
        <h1>Mes Favoris</h1>
        <p>Retrouvez tous vos biens préférés</p>
      </header>

      <div className="favorites-empty">
        <div className="empty-icon">
          <Heart size={64} />
        </div>
        <h2>Aucun favori pour le moment</h2>
        <p>Commencez à explorer les annonces et ajoutez vos biens préférés à cette liste.</p>
        <a href="/feed" className="btn btn-primary">
          Explorer les annonces
        </a>
      </div>
    </div>
  );
}
