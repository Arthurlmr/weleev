import { Listing } from '@/types';

export const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Appartement moderne avec vue sur la Seine',
    price: 450000,
    surface: 65,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    city: 'Paris',
    address: '15 Quai de la Seine, 75019',
    description: 'Magnifique appartement rénové avec vue imprenable sur la Seine. Cuisine équipée, parquet, double vitrage. Proche métro Jaurès.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    propertyType: 'apartment',
    hasParking: false,
    rating: 4.5,
    energyClass: 'C',
    yearBuilt: 2018,
    floor: 5,
    totalFloors: 7
  },
  {
    id: '2',
    title: 'Maison familiale avec jardin',
    price: 580000,
    surface: 120,
    rooms: 5,
    bedrooms: 4,
    bathrooms: 2,
    city: 'Lyon',
    address: '23 Avenue Victor Hugo, 69003',
    description: 'Belle maison familiale dans quartier calme. Grand jardin arboré, garage double, cuisine aménagée. Proche écoles et commerces.',
    images: [
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
    ],
    propertyType: 'house',
    hasParking: true,
    rating: 4.8,
    energyClass: 'B',
    yearBuilt: 2015
  },
  {
    id: '3',
    title: 'Studio lumineux centre-ville',
    price: 185000,
    surface: 28,
    rooms: 1,
    bedrooms: 1,
    bathrooms: 1,
    city: 'Bordeaux',
    address: '8 Rue Sainte-Catherine, 33000',
    description: 'Studio parfaitement agencé en plein centre. Idéal premier achat ou investissement locatif. Charges faibles.',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
    ],
    propertyType: 'apartment',
    hasParking: false,
    rating: 4.2,
    energyClass: 'D',
    yearBuilt: 1990,
    floor: 3,
    totalFloors: 5
  },
  {
    id: '4',
    title: 'Loft industriel rénové',
    price: 520000,
    surface: 95,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    city: 'Paris',
    address: '42 Rue Oberkampf, 75011',
    description: 'Superbe loft dans ancien atelier. Hauteur sous plafond 4m, poutres apparentes, verrière. Caractère unique.',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
    ],
    propertyType: 'apartment',
    hasParking: false,
    rating: 4.9,
    energyClass: 'C',
    yearBuilt: 2020,
    floor: 2,
    totalFloors: 4
  },
  {
    id: '5',
    title: 'Appartement terrasse panoramique',
    price: 680000,
    surface: 85,
    rooms: 4,
    bedrooms: 3,
    bathrooms: 2,
    city: 'Nice',
    address: '12 Promenade des Anglais, 06000',
    description: 'Rare ! Appartement dernier étage avec terrasse de 40m². Vue mer exceptionnelle. Standing élevé.',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    propertyType: 'apartment',
    hasParking: true,
    rating: 5.0,
    energyClass: 'A',
    yearBuilt: 2021,
    floor: 8,
    totalFloors: 8
  },
  {
    id: '6',
    title: 'Maison de ville rénovée',
    price: 425000,
    surface: 110,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    city: 'Toulouse',
    address: '18 Rue des Arts, 31000',
    description: 'Charmante maison de ville entièrement rénovée. Petite cour intérieure, cave voutée. Quartier historique.',
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800'
    ],
    propertyType: 'house',
    hasParking: false,
    rating: 4.6,
    energyClass: 'C',
    yearBuilt: 2019
  },
  {
    id: '7',
    title: 'Duplex avec balcon',
    price: 395000,
    surface: 75,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    city: 'Lille',
    address: '5 Boulevard de la Liberté, 59000',
    description: 'Beau duplex lumineux avec balcon. Cuisine ouverte, dressing, cave. Proche Vieux-Lille.',
    images: [
      'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800'
    ],
    propertyType: 'apartment',
    hasParking: false,
    rating: 4.4,
    energyClass: 'C',
    yearBuilt: 2017,
    floor: 6,
    totalFloors: 7
  },
  {
    id: '8',
    title: 'Villa contemporaine piscine',
    price: 850000,
    surface: 180,
    rooms: 6,
    bedrooms: 4,
    bathrooms: 3,
    city: 'Aix-en-Provence',
    address: 'Chemin des Vignes, 13100',
    description: 'Villa d\'architecte sur 1200m² de terrain. Piscine chauffée, pool house, vue dégagée. Prestations haut de gamme.',
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
    ],
    propertyType: 'house',
    hasParking: true,
    rating: 5.0,
    energyClass: 'A',
    yearBuilt: 2022
  }
];
