// City coordinates database for France (top cities)
// Used as fallback when property coordinates are missing

export const FRENCH_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Major cities
  'paris': { lat: 48.8566, lng: 2.3522 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'lyon': { lat: 45.7640, lng: 4.8357 },
  'toulouse': { lat: 43.6047, lng: 1.4442 },
  'nice': { lat: 43.7102, lng: 7.2620 },
  'nantes': { lat: 47.2184, lng: -1.5536 },
  'montpellier': { lat: 43.6108, lng: 3.8767 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 },
  'bordeaux': { lat: 44.8378, lng: -0.5792 },
  'lille': { lat: 50.6292, lng: 3.0573 },
  'rennes': { lat: 48.1173, lng: -1.6778 },
  'reims': { lat: 49.2583, lng: 4.0317 },
  'le havre': { lat: 49.4944, lng: 0.1079 },
  'saint-étienne': { lat: 45.4397, lng: 4.3872 },
  'toulon': { lat: 43.1242, lng: 5.9280 },
  'grenoble': { lat: 45.1885, lng: 5.7245 },
  'dijon': { lat: 47.3220, lng: 5.0415 },
  'angers': { lat: 47.4784, lng: -0.5632 },
  'nîmes': { lat: 43.8367, lng: 4.3601 },
  'villeurbanne': { lat: 45.7663, lng: 4.8794 },
  'le mans': { lat: 48.0061, lng: 0.1996 },
  'aix-en-provence': { lat: 43.5297, lng: 5.4474 },
  'clermont-ferrand': { lat: 45.7772, lng: 3.0870 },
  'brest': { lat: 48.3905, lng: -4.4860 },
  'tours': { lat: 47.3941, lng: 0.6848 },
  'amiens': { lat: 49.8941, lng: 2.2958 },
  'limoges': { lat: 45.8336, lng: 1.2611 },
  'annecy': { lat: 45.8992, lng: 6.1294 },
  'perpignan': { lat: 42.6886, lng: 2.8948 },
  'boulogne-billancourt': { lat: 48.8356, lng: 2.2397 },
  'metz': { lat: 49.1193, lng: 6.1757 },
  'besançon': { lat: 47.2380, lng: 6.0243 },
  'orléans': { lat: 47.9029, lng: 1.9093 },
  'mulhouse': { lat: 47.7508, lng: 7.3359 },
  'rouen': { lat: 49.4431, lng: 1.0993 },
  'caen': { lat: 49.1829, lng: -0.3707 },
  'nancy': { lat: 48.6921, lng: 6.1844 },
  'argenteuil': { lat: 48.9474, lng: 2.2469 },
  'montreuil': { lat: 48.8630, lng: 2.4432 },
  'saint-denis': { lat: 48.9362, lng: 2.3574 },

  // Deux-Sèvres
  'niort': { lat: 46.3236, lng: -0.4650 },
  'bressuire': { lat: 46.8406, lng: -0.4914 },
  'thouars': { lat: 46.9761, lng: -0.2153 },
  'parthenay': { lat: 46.6497, lng: -0.2478 },

  // Additional major cities
  'la rochelle': { lat: 46.1603, lng: -1.1511 },
  'poitiers': { lat: 46.5802, lng: 0.3404 },
  'avignon': { lat: 43.9493, lng: 4.8055 },
  'saint-maur-des-fossés': { lat: 48.8006, lng: 2.4969 },
  'aulnay-sous-bois': { lat: 48.9336, lng: 2.4965 },
  'vitry-sur-seine': { lat: 48.7873, lng: 2.3933 },
  'champigny-sur-marne': { lat: 48.8173, lng: 2.4995 },
  'pau': { lat: 43.2951, lng: -0.3708 },
  'bayonne': { lat: 43.4832, lng: -1.4748 },
  'cannes': { lat: 43.5528, lng: 7.0174 },
  'antibes': { lat: 43.5808, lng: 7.1251 },
};

/**
 * Get coordinates for a city (case-insensitive, handles accents)
 */
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  if (!cityName) return null;

  // Normalize city name (lowercase, remove accents)
  const normalized = cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Try exact match first
  if (FRENCH_CITY_COORDINATES[normalized]) {
    return FRENCH_CITY_COORDINATES[normalized];
  }

  // Try partial match
  const match = Object.keys(FRENCH_CITY_COORDINATES).find(key =>
    normalized.includes(key) || key.includes(normalized)
  );

  if (match) {
    return FRENCH_CITY_COORDINATES[match];
  }

  return null;
}

/**
 * Geocode a city using OpenStreetMap Nominatim API
 * Free, no API key required
 */
export async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Try local database first
    const localCoords = getCityCoordinates(cityName);
    if (localCoords) {
      return localCoords;
    }

    // Fallback to Nominatim API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(cityName)},France` +
      `&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Weleev/1.0 (https://weleev.com)',
        },
      }
    );

    if (!response.ok) {
      console.warn('Nominatim geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding city:', error);
    return null;
  }
}

/**
 * Get default map center based on search location or fallback to Paris
 */
export function getDefaultMapCenter(cityName?: string): { lat: number; lng: number } {
  if (cityName) {
    const coords = getCityCoordinates(cityName);
    if (coords) return coords;
  }

  // Fallback to Paris
  return { lat: 48.8566, lng: 2.3522 };
}
