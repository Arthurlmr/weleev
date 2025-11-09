import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, MapPin, Sparkles } from 'lucide-react';

interface Neighborhood {
  name: string;
  zone: string | null;
  type: string | null;
  is_custom?: boolean;
}

interface NeighborhoodsSelectorProps {
  city: string;
  userId?: string;
  selectedNeighborhoods: string[];
  onChange: (neighborhoods: string[]) => void;
}

export function NeighborhoodsSelector({
  city,
  userId,
  selectedNeighborhoods,
  onChange,
}: NeighborhoodsSelectorProps) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [addingCustom, setAddingCustom] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    loadNeighborhoods();
  }, [city, userId]);

  const loadNeighborhoods = async () => {
    if (!city) return;

    setLoading(true);
    setGeneratingAI(false);

    try {
      // Check if neighborhoods exist for this city
      const { data: existingNeighborhoods, error: fetchError } = await supabase
        .from('city_neighborhoods')
        .select('name, zone, type')
        .eq('city', city);

      if (fetchError) {
        console.error('Error fetching neighborhoods:', fetchError);
        setLoading(false);
        return;
      }

      // If no neighborhoods exist, generate them with AI
      if (!existingNeighborhoods || existingNeighborhoods.length === 0) {
        console.log(`No neighborhoods found for ${city}, generating with AI...`);
        setGeneratingAI(true);
        await generateNeighborhoods();
        return;
      }

      // Load custom neighborhoods if user is logged in
      let customNeighborhoods: Neighborhood[] = [];
      if (userId) {
        const { data: customData } = await supabase
          .from('user_custom_neighborhoods')
          .select('name')
          .eq('city', city)
          .eq('user_id', userId);

        if (customData) {
          customNeighborhoods = customData.map((n) => ({
            name: n.name,
            zone: null,
            type: 'custom',
            is_custom: true,
          }));
        }
      }

      const allNeighborhoods = [
        ...existingNeighborhoods.map((n) => ({ ...n, is_custom: false })),
        ...customNeighborhoods,
      ];

      setNeighborhoods(allNeighborhoods);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
    } finally {
      setLoading(false);
      setGeneratingAI(false);
    }
  };

  const generateNeighborhoods = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-neighborhoods', {
        body: { city },
      });

      if (error) {
        console.error('Error generating neighborhoods:', error);
        alert(`Impossible de générer les quartiers pour ${city}. Veuillez vérifier le nom de la ville.`);
        setLoading(false);
        setGeneratingAI(false);
        return;
      }

      if (data.neighborhoods && data.neighborhoods.length > 0) {
        setNeighborhoods(data.neighborhoods.map((n: Neighborhood) => ({ ...n, is_custom: false })));
        console.log(`Generated ${data.neighborhoods.length} neighborhoods for ${city}`);
      }
    } catch (error) {
      console.error('Error generating neighborhoods:', error);
      alert('Erreur lors de la génération des quartiers');
    } finally {
      setLoading(false);
      setGeneratingAI(false);
    }
  };

  const toggleNeighborhood = (name: string) => {
    if (selectedNeighborhoods.includes(name)) {
      onChange(selectedNeighborhoods.filter((n) => n !== name));
    } else {
      onChange([...selectedNeighborhoods, name]);
    }
  };

  const addCustomNeighborhood = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    // Check if already exists
    if (neighborhoods.some((n) => n.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Ce quartier existe déjà dans la liste');
      return;
    }

    // Add to database if user is logged in
    if (userId) {
      const { error } = await supabase.from('user_custom_neighborhoods').insert({
        user_id: userId,
        city,
        name: trimmed,
      });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error adding custom neighborhood:', error);
        alert('Erreur lors de l\'ajout du quartier personnalisé');
        return;
      }
    }

    // Add to local state
    const newNeighborhood: Neighborhood = {
      name: trimmed,
      zone: null,
      type: 'custom',
      is_custom: true,
    };

    setNeighborhoods([...neighborhoods, newNeighborhood]);
    onChange([...selectedNeighborhoods, trimmed]);
    setCustomInput('');
    setAddingCustom(false);
  };

  const removeCustomNeighborhood = async (name: string) => {
    // Remove from database
    if (userId) {
      await supabase
        .from('user_custom_neighborhoods')
        .delete()
        .eq('user_id', userId)
        .eq('city', city)
        .eq('name', name);
    }

    // Remove from local state
    setNeighborhoods(neighborhoods.filter((n) => n.name !== name));
    onChange(selectedNeighborhoods.filter((n) => n !== name));
  };

  const displayedNeighborhoods = showAll ? neighborhoods : neighborhoods.slice(0, 12);

  if (loading || generatingAI) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        {generatingAI && <Sparkles className="animate-pulse text-lumine-accent" size={20} />}
        <span>{generatingAI ? `Génération IA des quartiers de ${city}...` : 'Chargement...'}</span>
      </div>
    );
  }

  if (neighborhoods.length === 0) {
    return (
      <div className="text-gray-500">
        <p>Aucun quartier trouvé pour {city}.</p>
        <button
          onClick={generateNeighborhoods}
          className="mt-2 text-lumine-accent hover:underline flex items-center gap-1"
        >
          <Sparkles size={16} />
          Générer avec l'IA
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sparkles size={16} className="text-lumine-accent" />
          <span>{neighborhoods.filter((n) => !n.is_custom).length} quartiers suggérés pour {city}</span>
        </div>
        {selectedNeighborhoods.length > 0 && (
          <span className="text-sm font-medium text-lumine-accent">
            {selectedNeighborhoods.length} sélectionné{selectedNeighborhoods.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Neighborhoods grid */}
      <div className="flex flex-wrap gap-2">
        {displayedNeighborhoods.map((neighborhood) => {
          const isSelected = selectedNeighborhoods.includes(neighborhood.name);
          const isCustom = neighborhood.is_custom;

          return (
            <div key={neighborhood.name} className="relative">
              <button
                onClick={() => toggleNeighborhood(neighborhood.name)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  flex items-center gap-1.5
                  ${
                    isSelected
                      ? 'bg-lumine-accent text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                  ${isCustom ? 'pr-8' : ''}
                `}
              >
                <MapPin size={14} />
                {neighborhood.name}
              </button>
              {isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomNeighborhood(neighborhood.name);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full"
                  title="Supprimer ce quartier personnalisé"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more/less */}
      {neighborhoods.length > 12 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-lumine-accent hover:underline"
        >
          {showAll ? 'Afficher moins' : `Afficher tous les quartiers (${neighborhoods.length})`}
        </button>
      )}

      {/* Add custom neighborhood */}
      <div className="pt-2 border-t">
        {!addingCustom ? (
          <button
            onClick={() => setAddingCustom(true)}
            className="text-sm text-lumine-accent hover:underline flex items-center gap-1"
          >
            <Plus size={16} />
            Ajouter un quartier personnalisé
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomNeighborhood();
                if (e.key === 'Escape') {
                  setAddingCustom(false);
                  setCustomInput('');
                }
              }}
              placeholder="Nom du quartier"
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumine-accent"
              autoFocus
            />
            <button
              onClick={addCustomNeighborhood}
              className="px-4 py-2 bg-lumine-accent text-white rounded-lg text-sm hover:bg-lumine-accent-dark"
            >
              Ajouter
            </button>
            <button
              onClick={() => {
                setAddingCustom(false);
                setCustomInput('');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
