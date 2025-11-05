# Charte graphique Weleev - "Cocon Immobilier"

## Philosophie

La charte graphique Weleev s'inspire de l'univers du **cocon immobilier** : un design qui évoque la chaleur, le confort, la paix et l'élégance d'un chez-soi. L'objectif est de faire ressentir instantanément à l'utilisateur cette sensation de bien-être et de sécurité qu'on ressent lorsqu'on trouve son lieu de vie idéal.

### Valeurs visuelles
- **Chaleureux** : Des tons crème, beige et terracotta qui évoquent la chaleur d'un intérieur cosy
- **Raffiné** : Une élégance sobre, sans tomber dans le luxe ostentatoire
- **Apaisant** : Des couleurs douces et des espaces aérés qui invitent à la sérénité
- **Naturel** : Des touches de vert sage qui rappellent la nature et la vie
- **Authentique** : Une typographie serif élégante qui apporte du caractère

---

## Palette de couleurs

### Couleurs primaires (Cream)

```css
cream-50: #FFFCF7   /* Blanc cassé - highlights, cards */
cream-100: #FAF8F3  /* Crème principal - fond de page */
cream-200: #F5F1E8  /* Beige clair - sections */
cream-300: #EFE9DC  /* Beige moyen */
cream-400: #E8DFC9  /* Beige foncé */
```

**Usage:**
- `cream-50`: Arrière-plans de cards, overlays, highlights
- `cream-100`: Fond principal de l'application
- `cream-200`: Sections, zones délimitées
- `cream-300-400`: Bordures subtiles, séparateurs

---

### Couleurs d'accent chaudes (Warm)

```css
warm-beige: #F5F1E8      /* Beige chaud - cards, inputs */
warm-taupe: #9C8B7A      /* Taupe - accents secondaires */
warm-terracotta: #D4A59A /* Terracotta - CTA principal */
warm-sand: #C9B8A6       /* Sable - hover states */
```

**Usage:**
- `warm-beige`: Fond de cards, inputs, zones interactives au repos
- `warm-taupe`: Bordures, séparateurs, texte secondaire light
- `warm-terracotta`: Boutons principaux, éléments actifs, filtres sélectionnés
- `warm-sand`: États hover, transitions douces

---

### Couleurs nature (Nature)

```css
nature-sage: #A8B69C   /* Vert sage - accents positifs */
nature-olive: #8A9580  /* Olive - états hover */
nature-moss: #6B7562   /* Mousse - texte sur fond sage */
```

**Usage:**
- `nature-sage`: Badges positifs, éléments de validation, touches nature
- `nature-olive`: États hover sur éléments verts
- `nature-moss`: Texte sur fond sage (contraste)

---

### Couleurs élégantes (Elegant)

```css
elegant-charcoal: #3A3A3A /* Charcoal - texte principal */
elegant-stone: #6B6458    /* Pierre - texte secondaire */
elegant-pearl: #FFFCF7    /* Perle - identique à cream-50 */
```

**Usage:**
- `elegant-charcoal`: Texte principal, titres importants
- `elegant-stone`: Texte secondaire, labels, placeholders
- `elegant-pearl`: Texte sur fonds sombres

---

## Typographies

### Font principale : **Cormorant Garamond** (Serif)

**Usage:** Titres, prix, éléments d'emphase

```css
font-family: 'Cormorant Garamond', serif;
```

**Poids disponibles:**
- 300 (Light) - Titres longs, sous-titres
- 400 (Regular) - Titres standards
- 500 (Medium) - Titres moyens
- 600 (SemiBold) - Titres importants
- 700 (Bold) - Très grands titres, prix

**Caractéristiques:**
- Serif élégante et raffinée
- Excellent pour les grands titres
- Évoque le luxe accessible et le raffinement

**Exemples d'usage:**
```html
<h1 className="text-4xl font-serif font-light">Bonjour utilisateur</h1>
<span className="text-2xl font-serif font-semibold">347 800 €</span>
```

---

### Font secondaire : **Inter** (Sans-serif)

**Usage:** Texte courant, labels, descriptions

```css
font-family: 'Inter', sans-serif;
```

**Poids disponibles:**
- 300 (Light) - Textes longs, descriptions
- 400 (Regular) - Texte standard
- 500 (Medium) - Labels, boutons
- 600 (SemiBold) - Boutons importants
- 700 (Bold) - Badges, tags

**Caractéristiques:**
- Sans-serif moderne et très lisible
- Excellent pour le texte courant
- Complète parfaitement Cormorant Garamond

**Exemples d'usage:**
```html
<p className="text-base font-sans text-elegant-stone">Description du bien...</p>
<button className="font-sans font-medium">Contacter</button>
```

---

## Hiérarchie typographique

### Page Feed

```css
/* Titre principal */
h1: text-4xl md:text-5xl font-serif font-light text-elegant-charcoal

/* Sous-titre */
p: text-lg text-elegant-stone

/* Prix */
span: text-2xl font-serif font-semibold text-elegant-charcoal

/* Titre de card */
h3: text-lg font-medium text-elegant-charcoal

/* Texte secondaire */
span: text-sm text-elegant-stone
```

### Page Détail

```css
/* Titre propriété */
h1: text-3xl font-bold text-slate-900

/* Prix */
span: text-4xl font-bold text-blue-600

/* Sections */
h2: text-2xl font-bold text-slate-900

/* Description */
p: text-slate-700 leading-relaxed
```

---

## Composants UI

### Boutons

#### Bouton principal (CTA)
```html
<button className="bg-warm-terracotta text-cream-50 px-6 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all">
  Contacter l'agence
</button>
```

**Caractéristiques:**
- Fond terracotta (#D4A59A)
- Texte crème (#FFFCF7)
- Bord arrondi complet (`rounded-full`)
- Ombre portée au hover
- Transition fluide

#### Bouton secondaire
```html
<button className="bg-cream-50 text-elegant-stone px-6 py-2.5 rounded-full font-medium hover:bg-warm-beige transition-all">
  Filtrer
</button>
```

#### Bouton fantôme
```html
<button className="text-elegant-stone hover:bg-warm-beige p-2 rounded-xl transition-colors">
  <Icon />
</button>
```

---

### Cards

#### Card principale
```html
<div className="bg-cream-50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-warm-taupe/10">
  <!-- Content -->
</div>
```

**Caractéristiques:**
- Fond crème (#FFFCF7)
- Bord très arrondi (`rounded-3xl` = 24px)
- Ombre douce qui s'accentue au hover
- Bordure subtile taupe avec opacité 10%
- Transition de 300ms

---

### Inputs

#### Champ de recherche
```html
<input
  type="text"
  className="w-full pl-12 pr-14 py-4 bg-cream-50 border border-warm-taupe/20 rounded-2xl text-elegant-charcoal placeholder:text-elegant-stone/50 focus:outline-none focus:ring-2 focus:ring-warm-terracotta/50 focus:border-transparent transition-all"
  placeholder="Rechercher..."
/>
```

**Caractéristiques:**
- Fond crème très clair
- Bordure taupe subtile (20% opacité)
- Bord arrondi généreux (`rounded-2xl` = 16px)
- Focus ring terracotta avec 50% opacité
- Placeholder avec opacité 50%

---

### Badges

#### Badge DPE
```html
<div className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500 text-white">
  DPE C
</div>
```

**Couleurs selon catégorie:**
- A: `bg-green-500`
- B: `bg-lime-500`
- C: `bg-yellow-500`
- D: `bg-orange-400`
- E-G: `bg-red-500`

#### Badge feature
```html
<span className="px-3 py-1 bg-warm-beige text-elegant-charcoal rounded-full text-sm">
  Jardin
</span>
```

---

## Espacements et grid

### Espacements principaux
```css
padding-page: px-4 sm:px-6 lg:px-8
padding-section: py-8
padding-card: p-5 ou p-6

gap-grid: gap-6
gap-inline: gap-3 ou gap-4
```

### Grid layouts
```css
/* Feed grid */
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6

/* Détail layout */
grid grid-cols-1 lg:grid-cols-3 gap-8
```

### Container
```css
max-width: max-w-7xl
centering: mx-auto
```

---

## Animations

### Transitions standards
```css
transition-all duration-300  /* Hover cards */
transition-colors            /* Boutons, links */
transition-transform duration-500 /* Images zoom */
```

### Framer Motion - Fade in
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: index * 0.05 }}
```

### Framer Motion - Scale
```typescript
initial={{ scale: 0.95, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
```

---

## Principes de design

### 1. Espacement généreux
- Utiliser des marges et paddings confortables
- Laisser respirer les éléments
- Éviter la surcharge visuelle

### 2. Arrondis doux
- Préférer `rounded-2xl` (16px) et `rounded-3xl` (24px)
- `rounded-full` pour boutons et badges
- Éviter les angles droits sauf exception

### 3. Ombres subtiles
- `shadow-sm` par défaut
- `shadow-xl` au hover
- Éviter les ombres trop marquées

### 4. Couleurs en couches
- Utiliser l'opacité pour créer de la profondeur
- `bg-warm-taupe/10` pour bordures
- `bg-cream-50/90` pour overlays

### 5. Hiérarchie visuelle
- Taille de typo progressive (text-sm → text-lg → text-2xl → text-4xl)
- Poids de police pour l'emphase (light → regular → semibold → bold)
- Couleurs : charcoal (important) → stone (secondaire) → taupe (tertiaire)

---

## Responsive design

### Breakpoints Tailwind
```css
sm: 640px   /* Tablets */
md: 768px   /* Landscape tablets */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Very large screens */
```

### Patterns mobiles
```css
/* Text responsive */
text-4xl md:text-5xl

/* Grid responsive */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3

/* Padding responsive */
px-4 sm:px-6 lg:px-8
```

---

## États interactifs

### Hover
```css
hover:shadow-xl           /* Cards */
hover:bg-warm-beige      /* Buttons secondaires */
hover:scale-105          /* Images */
hover:text-warm-terracotta /* Links */
```

### Active/Selected
```css
bg-warm-terracotta text-cream-50 shadow-md
```

### Disabled
```css
opacity-50 cursor-not-allowed
```

### Focus
```css
focus:outline-none focus:ring-2 focus:ring-warm-terracotta/50
```

---

## Iconographie

### Bibliothèque : Lucide React

**Style:** Stroke icons, minimalistes et élégantes

**Tailles standards:**
- `size={16}` - Icônes inline, petits badges
- `size={18}` - Icônes dans boutons
- `size={20}` - Icônes standard
- `size={24}` - Icônes importantes, navigation

**Couleurs:**
- `text-elegant-stone` - Icônes secondaires
- `text-elegant-charcoal` - Icônes principales
- `text-warm-terracotta` - Icônes d'action

**Exemples:**
```tsx
<MapPin size={20} className="text-warm-terracotta" />
<Heart size={18} className="text-elegant-stone" />
<Search size={20} className="text-elegant-stone" />
```

---

## Exemples de composition

### Card annonce (Feed)
```tsx
<div className="bg-cream-50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-warm-taupe/10">
  {/* Image */}
  <div className="relative aspect-[4/3] overflow-hidden bg-warm-beige">
    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
  </div>

  {/* Content */}
  <div className="p-5">
    {/* Prix */}
    <span className="text-2xl font-serif font-semibold text-elegant-charcoal">
      347 800 €
    </span>

    {/* Titre */}
    <h3 className="text-lg font-medium text-elegant-charcoal group-hover:text-warm-terracotta">
      Maison 7 pièces
    </h3>

    {/* Features */}
    <div className="flex gap-4 text-sm text-elegant-stone">
      <span>188 m²</span>
      <span>7 pièces</span>
    </div>
  </div>
</div>
```

---

## Guidelines d'usage

### ✅ À faire
- Utiliser `font-serif` pour les prix et grands titres
- Privilégier les arrondis généreux (`rounded-2xl`, `rounded-3xl`)
- Laisser respirer les éléments avec des espacements confortables
- Utiliser les opacités pour créer des variations subtiles
- Animer les transitions pour fluidité

### ❌ À éviter
- Mélanger trop de couleurs d'accent
- Utiliser des ombres trop prononcées
- Angles droits sauf nécessité
- Surcharger visuellement les cards
- Texte trop petit (minimum `text-sm`)

---

## Accessibilité

### Contrastes minimums (WCAG AA)
- Texte normal : ratio 4.5:1
- Texte large : ratio 3:1

**Paires validées:**
- `elegant-charcoal` sur `cream-100` ✅
- `elegant-stone` sur `cream-50` ✅
- `cream-50` sur `warm-terracotta` ✅

### Focus visible
Toujours inclure un état focus visible :
```css
focus:outline-none focus:ring-2 focus:ring-warm-terracotta/50
```

### Tailles cliquables
Minimum 44x44px pour touch targets :
```css
w-10 h-10  /* 40px minimum */
p-3        /* Padding additionnel si besoin */
```

---

## Maintenance

### Ajout de nouvelles couleurs
1. Ajouter dans `tailwind.config.js`
2. Documenter l'usage dans ce fichier
3. Tester le contraste avec WebAIM

### Nouvelles typos
1. Importer dans `index.html`
2. Ajouter dans `tailwind.config.js` → `fontFamily`
3. Documenter les usages

### Nouveaux composants
1. Suivre la convention de nommage existante
2. Utiliser la palette définie
3. Documenter dans ce fichier avec exemples

---

**Dernière mise à jour:** 5 novembre 2025
