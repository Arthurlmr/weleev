import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { LogOut, User, Bell, Globe, Shield, Heart, Search } from 'lucide-react';
import './AccountPage.css';

export function AccountPage() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="account-page">
      <header className="account-header">
        <h1>Mon Compte</h1>
      </header>

      <div className="account-content">
        <div className="profile-card">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">
              {(profile?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </div>
          )}
          <h2>{profile?.full_name || 'Utilisateur'}</h2>
          <p className="profile-email">{user?.email}</p>
          <button className="btn btn-secondary btn-small">
            Modifier le profil
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Heart size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">12</div>
              <div className="stat-label">Favoris</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Search size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">45</div>
              <div className="stat-label">Recherches</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <User size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">3</div>
              <div className="stat-label">Visites</div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Paramètres</h3>

          <div className="settings-list">
            <button className="setting-item">
              <div className="setting-info">
                <Bell size={20} />
                <span>Notifications</span>
              </div>
              <span className="setting-arrow">›</span>
            </button>

            <button className="setting-item">
              <div className="setting-info">
                <Globe size={20} />
                <span>Langue et région</span>
              </div>
              <span className="setting-arrow">›</span>
            </button>

            <button className="setting-item">
              <div className="setting-info">
                <Shield size={20} />
                <span>Confidentialité</span>
              </div>
              <span className="setting-arrow">›</span>
            </button>

            <button className="setting-item">
              <div className="setting-info">
                <Search size={20} />
                <span>Préférences de recherche</span>
              </div>
              <span className="setting-arrow">›</span>
            </button>
          </div>
        </div>

        <button className="btn btn-ghost btn-large btn-signout" onClick={handleSignOut}>
          <LogOut size={20} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
