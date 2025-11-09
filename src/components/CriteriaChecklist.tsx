import { CheckCircle, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Criterion {
  id: number;
  label: string;
  key: string;
  filled: boolean;
  value?: any;
  displayValue?: string;
}

interface CriteriaChecklistProps {
  profile: any;
}

const CRITERION_LABELS = {
  search_type: 'Type de recherche',
  property_type_filter: 'Type de bien',
  city_filter: 'Ville',
  neighborhoods_filter: 'Quartiers/Zones',
  budget_max: 'Budget maximum',
  surface_min: 'Surface minimale',
  bedrooms_min: 'Nombre de chambres',
  floor_preference: 'Étage',
  outdoor_preference: 'Extérieur',
  parking_preference: 'Parking',
  state_filter: 'État du bien',
  detached_house_only: 'Maison non mitoyenne',
  vis_a_vis_importance: 'Vis-à-vis',
  orientation_importance: 'Orientation',
  proximity_priorities: 'Proximités',
  renovation_acceptance: 'Travaux acceptés',
  max_charges: 'Charges maximum',
  is_current_owner: 'Propriétaire actuel',
  property_usage: 'Usage du bien',
};

// Format display value for each criterion
function formatDisplayValue(key: string, value: any): string {
  if (value === null || value === undefined) return '';

  switch (key) {
    case 'search_type':
      return value === 'purchase' ? 'Achat' : 'Location';

    case 'property_type_filter':
      if (Array.isArray(value)) {
        if (value.includes('both')) return 'Les deux';
        const types = value.map((v: string) => v === 'apartment' ? 'Appartement' : 'Maison');
        return types.join(', ');
      }
      return '';

    case 'city_filter':
      return value;

    case 'neighborhoods_filter':
      if (Array.isArray(value) && value.length > 0) {
        return value.join(', ');
      }
      return '';

    case 'budget_max':
      return `${(value / 1000).toFixed(0)}k€`;

    case 'surface_min':
      return `${value}m²`;

    case 'bedrooms_min':
      return `${value}`;

    case 'floor_preference':
      if (value === 'not_ground') return 'Pas RDC';
      if (value === 'top_floor') return 'Dernier étage';
      if (value === 'no_preference') return 'Peu importe';
      return '';

    case 'outdoor_preference':
      if (value === 'garden_required') return 'Jardin obligatoire';
      if (value === 'balcony_ok') return 'Balcon suffit';
      if (value === 'not_needed') return 'Pas nécessaire';
      return '';

    case 'parking_preference':
      if (value === 'garage_required') return 'Garage obligatoire';
      if (value === 'spot_ok') return 'Place suffit';
      if (value === 'not_important') return 'Pas important';
      return '';

    case 'state_filter':
      if (Array.isArray(value) && value.length > 0) {
        const states = value.map((v: string) => {
          if (v === 'new') return 'Neuf';
          if (v === 'recent') return 'Récent';
          if (v === 'old') return 'Ancien';
          if (v === 'construction') return 'À construire';
          if (v === 'no_new') return 'Pas de neuf';
          return v;
        });
        return states.join(', ');
      }
      return '';

    case 'detached_house_only':
      return value ? 'Oui' : 'Non';

    case 'vis_a_vis_importance':
      if (value === 'clear_required') return 'Dégagé obligatoire';
      if (value === 'important') return 'Important';
      if (value === 'not_important') return 'Peu importe';
      return '';

    case 'orientation_importance':
      if (value === 'required') return 'Obligatoire';
      if (value === 'important') return 'Important';
      if (value === 'not_important') return 'Peu importe';
      return '';

    case 'proximity_priorities':
      if (Array.isArray(value) && value.length > 0) {
        const proximities = value.map((v: string) => {
          if (v === 'schools') return 'Écoles';
          if (v === 'transport') return 'Transports';
          if (v === 'shops') return 'Commerces';
          return v;
        });
        return proximities.join(', ');
      }
      return '';

    case 'renovation_acceptance':
      if (value === 'none') return 'Non';
      if (value === 'minor') return 'Petits travaux';
      if (value === 'major') return 'Gros travaux';
      return '';

    case 'max_charges':
      return `< ${value}€/mois`;

    case 'is_current_owner':
      if (value === true) return 'Oui';
      if (value === false) return 'Non';
      if (value === null) return 'Préfère ne pas dire';
      return '';

    case 'property_usage':
      if (value === 'main_residence') return 'Résidence principale';
      if (value === 'investment') return 'Investissement';
      if (value === 'secondary') return 'Résidence secondaire';
      return '';

    default:
      return String(value);
  }
}

// Check if criterion is filled
function isCriterionFilled(key: string, value: any): boolean {
  if (value === null || value === undefined) return false;

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  if (typeof value === 'number') {
    return true;
  }

  if (typeof value === 'boolean') {
    return true;
  }

  return false;
}

export function CriteriaChecklist({ profile }: CriteriaChecklistProps) {
  if (!profile) {
    return null;
  }

  const criteria: Criterion[] = Object.keys(CRITERION_LABELS).map((key, index) => {
    const value = profile[key];
    const filled = isCriterionFilled(key, value);
    const displayValue = filled ? formatDisplayValue(key, value) : undefined;

    return {
      id: index + 1,
      label: CRITERION_LABELS[key as keyof typeof CRITERION_LABELS],
      key,
      filled,
      value,
      displayValue,
    };
  });

  const filledCount = criteria.filter(c => c.filled).length;
  const totalCount = criteria.length;
  const completionPercentage = Math.round((filledCount / totalCount) * 100);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-lumine-neutral-400/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lumine-primary">
          Profil de recherche
        </h3>
        <div className="text-sm text-lumine-neutral-700">
          {filledCount}/{totalCount} critères
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-lumine-neutral-200 rounded-full mb-4">
        <div
          className="h-full bg-lumine-accent rounded-full transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="text-xs text-center mb-4 text-lumine-neutral-700">
        {completionPercentage}% complété
      </div>

      {/* Criteria List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {criteria.map((criterion) => (
          <div
            key={criterion.id}
            className="flex items-center justify-between p-2 hover:bg-lumine-neutral-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {criterion.filled ? (
                <CheckCircle className="text-green-600 flex-shrink-0" size={16} />
              ) : (
                <Circle className="text-lumine-neutral-400 flex-shrink-0" size={16} />
              )}
              <span
                className={`text-sm truncate ${
                  criterion.filled ? 'text-lumine-primary font-medium' : 'text-lumine-neutral-500'
                }`}
              >
                {criterion.label}
              </span>
            </div>
            {criterion.filled && criterion.displayValue && (
              <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                {criterion.displayValue}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
