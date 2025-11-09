import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import {
  ArrowLeft, User, Mail, Lock, Bell, Heart, Search, MessageCircle,
  Sparkles, Shield, LogOut, Trash2, Save, X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatModal } from '@/components/ChatModal';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // User profile data
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newListingsAlerts, setNewListingsAlerts] = useState(true);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      try {
        // Load profile completeness
        const { data: profile } = await supabase
          .from('conversational_profiles')
          .select('profile_completeness_score')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setProfileCompleteness((profile as any).profile_completeness_score || 0);
        }

        // Load favorites count
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        setFavoritesCount(favorites?.length || 0);

        // Set email from auth
        setEmail(user.email || '');
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Save user preferences here
      // This would typically update a user_preferences table
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated save

      alert('Paramètres sauvegardés !');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const confirm = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
    if (confirm) {
      await signOut();
      navigate('/');
    }
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      'ATTENTION : Cette action est irréversible. Êtes-vous sûr de vouloir supprimer votre compte ?'
    );
    if (confirm) {
      const doubleConfirm = window.confirm(
        'Dernière confirmation : Toutes vos données seront définitivement supprimées. Continuer ?'
      );
      if (doubleConfirm) {
        try {
          // Delete user data
          // This would typically be handled by a Cloud Function
          await supabase.auth.admin.deleteUser(user!.id);
          navigate('/');
        } catch (error) {
          console.error('Error deleting account:', error);
          alert('Erreur lors de la suppression du compte');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-lumine-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-lumine-accent/30 border-t-lumine-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lumine-neutral-700">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lumine-neutral-100">
      {/* Header */}
      <header className="w-full bg-white border-b border-lumine-neutral-400/20 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app')}
                className="p-2 hover:bg-lumine-neutral-200 rounded-lg transition-all duration-200"
              >
                <ArrowLeft size={20} className="text-lumine-neutral-700" />
              </button>
              <h1 className="text-2xl font-display text-lumine-primary">
                Paramètres
              </h1>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-lumine-accent hover:bg-lumine-accent-dark text-white"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-3 border-2 border-lumine-accent/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-lumine-accent to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-white" size={32} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-display text-lumine-primary mb-2">
                    {displayName || email}
                  </h2>
                  <p className="text-lumine-neutral-700 mb-4">{email}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="text-red-500" />
                      <span className="text-lumine-neutral-700">
                        <strong className="text-lumine-primary">{favoritesCount}</strong> favoris
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-lumine-accent" />
                      <span className="text-lumine-neutral-700">
                        Profil <strong className="text-lumine-primary">{profileCompleteness}%</strong> complété
                      </span>
                    </div>
                  </div>

                  {profileCompleteness < 100 && (
                    <button
                      onClick={() => setShowChatModal(true)}
                      className="mt-4 px-4 py-2 bg-lumine-accent hover:bg-lumine-accent-dark text-white rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-2"
                    >
                      <MessageCircle size={16} />
                      Compléter mon profil avec l'IA
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Completeness Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-lumine-primary">Complétude du profil</span>
                  <span className="text-sm text-lumine-neutral-700">{profileCompleteness}%</span>
                </div>
                <div className="w-full h-3 bg-lumine-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-lumine-accent to-amber-500 transition-all duration-500"
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="text-lumine-accent" size={24} />
                <h3 className="text-xl font-display text-lumine-primary">Compte</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-lumine-primary mb-2">
                    Nom d'affichage
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-3 bg-lumine-neutral-100 border border-lumine-neutral-400/20 rounded-xl text-lumine-primary focus:outline-none focus:ring-2 focus:ring-lumine-accent/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-lumine-primary mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-3 bg-lumine-neutral-200 border border-lumine-neutral-400/20 rounded-xl text-lumine-neutral-600 cursor-not-allowed"
                    />
                    <Mail className="absolute right-3 top-3.5 text-lumine-neutral-500" size={20} />
                  </div>
                  <p className="text-xs text-lumine-neutral-600 mt-1">
                    L'email ne peut pas être modifié pour des raisons de sécurité
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    className="w-full px-4 py-3 bg-lumine-neutral-200 hover:bg-lumine-neutral-300 text-lumine-primary rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                  >
                    <Lock size={20} />
                    Changer le mot de passe
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Bell className="text-lumine-accent" size={24} />
                <h3 className="text-xl font-display text-lumine-primary">Notifications</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-lumine-primary">Emails</p>
                    <p className="text-xs text-lumine-neutral-600">Recevoir les notifications par email</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                      emailNotifications ? 'bg-lumine-accent' : 'bg-lumine-neutral-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                        emailNotifications ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-lumine-primary">Alertes prix</p>
                    <p className="text-xs text-lumine-neutral-600">Baisse de prix sur vos favoris</p>
                  </div>
                  <button
                    onClick={() => setPriceAlerts(!priceAlerts)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                      priceAlerts ? 'bg-lumine-accent' : 'bg-lumine-neutral-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                        priceAlerts ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-lumine-primary">Nouvelles annonces</p>
                    <p className="text-xs text-lumine-neutral-600">Correspondant à vos critères</p>
                  </div>
                  <button
                    onClick={() => setNewListingsAlerts(!newListingsAlerts)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                      newListingsAlerts ? 'bg-lumine-accent' : 'bg-lumine-neutral-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                        newListingsAlerts ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-3">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="text-lumine-accent" size={24} />
                <h3 className="text-xl font-display text-lumine-primary">Actions</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/app')}
                  className="p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <Search size={20} />
                  Mes recherches
                </button>

                <button
                  onClick={() => navigate('/app')}
                  className="p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <Heart size={20} />
                  Mes favoris ({favoritesCount})
                </button>

                <button
                  onClick={() => setShowChatModal(true)}
                  className="p-4 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} />
                  Assistant IA
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="lg:col-span-3 border-2 border-red-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-display text-red-600 mb-4">Zone de danger</h3>

              <div className="space-y-3">
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <LogOut size={20} />
                  Se déconnecter
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 size={20} />
                  Supprimer mon compte
                </button>
              </div>

              <p className="text-xs text-lumine-neutral-600 mt-4 text-center">
                La suppression du compte est irréversible et entraîne la perte de toutes vos données.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal isOpen={showChatModal} onClose={() => setShowChatModal(false)} />
    </div>
  );
}
