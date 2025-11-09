import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { NeighborhoodsSelector } from '@/components/NeighborhoodsSelector';
import {
  Home, MapPin, DollarSign, Maximize, Bed, Building2, Layers, Sun,
  Eye, Compass, Train, Euro, Wrench, User, Target, ChevronDown,
  ChevronUp, Save, CheckCircle2, ArrowLeft
} from 'lucide-react';

interface UserProfile {
  // Metadata
  search_type: 'purchase' | 'rental' | null;
  property_type_filter: string[] | null;
  city_filter: string | null;

  // Strict filters
  neighborhoods_filter: string[] | null;
  budget_max: number | null;
  surface_min: number | null;
  bedrooms_min: number | null;
  must_have_garden: boolean | null;
  must_have_garage: boolean | null;
  state_filter: string[] | null;
  no_renovation_needed: boolean | null;
  detached_house_only: boolean | null;

  // Preferences
  floor_preference: string | null;
  outdoor_preference: string | null;
  parking_preference: string | null;
  orientation_importance: string | null;
  vis_a_vis_importance: string | null;
  proximity_priorities: string[] | null;
  max_charges: number | null;
  interior_config_prefs: string[] | null;

  // Business criteria
  is_current_owner: boolean | null;
  property_usage: string | null;
  renovation_acceptance: string | null;

  // Computed
  criteria_filled: number;
  profile_completeness_score: number;
}

export function ProfileFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Section visibility
  const [expandedSections, setExpandedSections] = useState({
    essentials: true,
    characteristics: true,
    preferences: false,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversational_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create new profile
        const { data: newProfile } = await supabase
          .from('conversational_profiles')
          .insert({
            user_id: user.id,
            profile_version: 2,
          })
          .select()
          .single();

        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = async (field: string, value: any) => {
    if (!user || !profile) return;

    const updatedProfile = { ...profile, [field]: value };
    setProfile(updatedProfile);

    // Auto-save
    setSaving(true);
    try {
      const updateData: any = { [field]: value };

      await (supabase as any)
        .from('conversational_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      // Refresh to get updated criteria_filled and profile_completeness_score
      const { data: refreshed } = await supabase
        .from('conversational_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (refreshed) {
        setProfile(refreshed);
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Chargement de votre profil...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Erreur lors du chargement du profil</div>
      </div>
    );
  }

  const completionPercentage = profile.profile_completeness_score || 0;
  const criteriaFilled = profile.criteria_filled || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/feed')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mon profil de recherche</h1>
                <p className="text-sm text-gray-500">
                  Complétez vos critères pour obtenir les meilleures recommandations
                </p>
              </div>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircle2 size={16} className="text-green-500" />
                Sauvegardé à {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progression : {criteriaFilled}/19 critères
              </span>
              <span className="text-sm font-bold text-lumine-accent">
                {Math.round(completionPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-lumine-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Section 1: Critères essentiels */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <button
            onClick={() => toggleSection('essentials')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Target size={20} className="text-lumine-accent" />
              <h2 className="text-lg font-bold text-gray-900">Critères essentiels</h2>
            </div>
            {expandedSections.essentials ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.essentials && (
            <div className="px-6 py-4 space-y-6 border-t">
              {/* Search type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Home size={16} />
                  Type de recherche
                  {profile.search_type && <CheckCircle2 size={16} className="text-green-500" />}
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField('search_type', 'purchase')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      profile.search_type === 'purchase'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Achat
                  </button>
                  <button
                    onClick={() => updateField('search_type', 'rental')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      profile.search_type === 'rental'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Location
                  </button>
                </div>
              </div>

              {/* Property type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 size={16} />
                  Type de bien
                  {profile.property_type_filter && profile.property_type_filter.length > 0 && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField('property_type_filter', ['apartment'])}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      profile.property_type_filter?.[0] === 'apartment'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Appartement
                  </button>
                  <button
                    onClick={() => updateField('property_type_filter', ['house'])}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      profile.property_type_filter?.[0] === 'house'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Maison
                  </button>
                  <button
                    onClick={() => updateField('property_type_filter', ['both'])}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      profile.property_type_filter?.[0] === 'both'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Les deux
                  </button>
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  Ville
                  {profile.city_filter && <CheckCircle2 size={16} className="text-green-500" />}
                </label>
                <input
                  type="text"
                  value={profile.city_filter || ''}
                  onChange={(e) => updateField('city_filter', e.target.value)}
                  placeholder="Ex: Niort, Paris, Lyon..."
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lumine-accent"
                />
              </div>

              {/* Neighborhoods - Only show if city is filled */}
              {profile.city_filter && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin size={16} className="text-lumine-accent" />
                    Quartiers souhaités (ULTRA IMPORTANT pour le filtrage)
                    {profile.neighborhoods_filter && profile.neighborhoods_filter.length > 0 && (
                      <CheckCircle2 size={16} className="text-green-500" />
                    )}
                  </label>
                  <NeighborhoodsSelector
                    city={profile.city_filter}
                    userId={user?.id}
                    selectedNeighborhoods={profile.neighborhoods_filter || []}
                    onChange={(neighborhoods) => updateField('neighborhoods_filter', neighborhoods)}
                  />
                </div>
              )}

              {/* Budget max */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <DollarSign size={16} />
                  Budget maximum
                  {profile.budget_max && <CheckCircle2 size={16} className="text-green-500" />}
                </label>
                <div className="flex gap-3 flex-wrap">
                  {[250000, 300000, 350000, 400000, 450000, 500000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => updateField('budget_max', amount)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        profile.budget_max === amount
                          ? 'bg-lumine-accent text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {(amount / 1000).toLocaleString()}k€
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    value={profile.budget_max || ''}
                    onChange={(e) => updateField('budget_max', parseInt(e.target.value) || null)}
                    placeholder="Montant personnalisé"
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lumine-accent"
                  />
                  <button
                    onClick={() => updateField('budget_max', null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Pas de limite
                  </button>
                </div>
              </div>

              {/* Surface min */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Maximize size={16} />
                  Surface minimale
                  {profile.surface_min && <CheckCircle2 size={16} className="text-green-500" />}
                </label>
                <div className="flex gap-3 flex-wrap">
                  {[60, 80, 100, 120, 150, 200].map((surface) => (
                    <button
                      key={surface}
                      onClick={() => updateField('surface_min', surface)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        profile.surface_min === surface
                          ? 'bg-lumine-accent text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {surface}m²
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    value={profile.surface_min || ''}
                    onChange={(e) => updateField('surface_min', parseInt(e.target.value) || null)}
                    placeholder="Surface personnalisée (m²)"
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-lumine-accent"
                  />
                  <button
                    onClick={() => updateField('surface_min', null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Flexible
                  </button>
                </div>
              </div>

              {/* Bedrooms min */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Bed size={16} />
                  Nombre de chambres minimum
                  {profile.bedrooms_min && <CheckCircle2 size={16} className="text-green-500" />}
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((bedrooms) => (
                    <button
                      key={bedrooms}
                      onClick={() => updateField('bedrooms_min', bedrooms)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        profile.bedrooms_min === bedrooms
                          ? 'bg-lumine-accent text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {bedrooms}
                    </button>
                  ))}
                  <button
                    onClick={() => updateField('bedrooms_min', null)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      profile.bedrooms_min === null
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Peu importe
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Caractéristiques du bien */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <button
            onClick={() => toggleSection('characteristics')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Layers size={20} className="text-lumine-accent" />
              <h2 className="text-lg font-bold text-gray-900">Caractéristiques du bien</h2>
            </div>
            {expandedSections.characteristics ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.characteristics && (
            <div className="px-6 py-4 space-y-6 border-t">
              {/* Outdoor preference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Espace extérieur
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField('outdoor_preference', 'garden_required')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.outdoor_preference === 'garden_required'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Jardin obligatoire
                  </button>
                  <button
                    onClick={() => updateField('outdoor_preference', 'balcony_ok')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.outdoor_preference === 'balcony_ok'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Balcon suffit
                  </button>
                  <button
                    onClick={() => updateField('outdoor_preference', 'not_needed')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.outdoor_preference === 'not_needed'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pas nécessaire
                  </button>
                </div>
              </div>

              {/* Parking */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stationnement
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField('parking_preference', 'garage_required')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.parking_preference === 'garage_required'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Garage obligatoire
                  </button>
                  <button
                    onClick={() => updateField('parking_preference', 'spot_ok')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.parking_preference === 'spot_ok'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Place suffit
                  </button>
                  <button
                    onClick={() => updateField('parking_preference', 'not_important')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.parking_preference === 'not_important'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pas important
                  </button>
                </div>
              </div>

              {/* Renovation acceptance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Wrench size={16} />
                  Acceptez-vous des travaux ?
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField('renovation_acceptance', 'none')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.renovation_acceptance === 'none'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Non
                  </button>
                  <button
                    onClick={() => updateField('renovation_acceptance', 'minor')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.renovation_acceptance === 'minor'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Petits travaux OK
                  </button>
                  <button
                    onClick={() => updateField('renovation_acceptance', 'major')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.renovation_acceptance === 'major'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Gros travaux OK
                  </button>
                </div>
              </div>

              {/* Property usage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User size={16} />
                  Usage prévu du bien
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField('property_usage', 'main_residence')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.property_usage === 'main_residence'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Résidence principale
                  </button>
                  <button
                    onClick={() => updateField('property_usage', 'investment')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.property_usage === 'investment'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Investissement locatif
                  </button>
                  <button
                    onClick={() => updateField('property_usage', 'secondary')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.property_usage === 'secondary'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Résidence secondaire
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Préférences (influencent le score) */}
        <div className="bg-white rounded-xl shadow-sm border">
          <button
            onClick={() => toggleSection('preferences')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Sun size={20} className="text-lumine-accent" />
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-900">Préférences</h2>
                <p className="text-sm text-gray-500">Ces critères influencent le score, mais n'excluent pas d'annonces</p>
              </div>
            </div>
            {expandedSections.preferences ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {expandedSections.preferences && (
            <div className="px-6 py-4 space-y-6 border-t">
              {/* Orientation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Compass size={16} />
                  Importance de l'orientation (Sud/Sud-Ouest)
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField('orientation_importance', 'required')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.orientation_importance === 'required'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Obligatoire
                  </button>
                  <button
                    onClick={() => updateField('orientation_importance', 'important')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.orientation_importance === 'important'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Important
                  </button>
                  <button
                    onClick={() => updateField('orientation_importance', 'not_important')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.orientation_importance === 'not_important'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Peu importe
                  </button>
                </div>
              </div>

              {/* Vis-à-vis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Eye size={16} />
                  Importance de l'absence de vis-à-vis
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => updateField('vis_a_vis_importance', 'clear_required')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.vis_a_vis_importance === 'clear_required'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Dégagé obligatoire
                  </button>
                  <button
                    onClick={() => updateField('vis_a_vis_importance', 'important')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.vis_a_vis_importance === 'important'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Important
                  </button>
                  <button
                    onClick={() => updateField('vis_a_vis_importance', 'not_important')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm ${
                      profile.vis_a_vis_importance === 'not_important'
                        ? 'bg-lumine-accent text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Peu importe
                  </button>
                </div>
              </div>

              {/* Proximities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Train size={16} />
                  Proximités importantes (plusieurs choix possibles)
                </label>
                <div className="flex flex-wrap gap-2">
                  {['schools', 'transport', 'shops', 'parks', 'healthcare'].map((proximity) => {
                    const labels = {
                      schools: 'Écoles',
                      transport: 'Transports',
                      shops: 'Commerces',
                      parks: 'Parcs',
                      healthcare: 'Santé',
                    };
                    const isSelected = profile.proximity_priorities?.includes(proximity);

                    return (
                      <button
                        key={proximity}
                        onClick={() => {
                          const current = profile.proximity_priorities || [];
                          const updated = isSelected
                            ? current.filter((p) => p !== proximity)
                            : [...current, proximity];
                          updateField('proximity_priorities', updated);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          isSelected
                            ? 'bg-lumine-accent text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {labels[proximity as keyof typeof labels]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/feed')}
            className="px-8 py-3 bg-lumine-accent text-white rounded-lg font-medium hover:bg-lumine-accent-dark flex items-center gap-2"
          >
            <CheckCircle2 size={20} />
            Voir les annonces recommandées
          </button>
        </div>
      </div>
    </div>
  );
}
