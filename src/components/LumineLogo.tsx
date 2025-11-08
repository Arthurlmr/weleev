import { BRAND_NAME, BRAND_LOGO_CONDENSED } from '@/lib/theme-lumine';

interface LumineLogoProps {
  /**
   * Variante du logo
   * - full: LUMINᵉ complet (défaut)
   * - condensed: L ou LU (espaces restreints)
   * - exponent: ᵉ seul (bold move)
   */
  variant?: 'full' | 'condensed-single' | 'condensed-double' | 'exponent';

  /**
   * Taille du logo
   * - sm: 18px
   * - md: 24px (défaut)
   * - lg: 32px
   * - xl: 48px
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Couleur du logo
   * - primary: Noir chaud #2B2621 (défaut)
   * - accent: Or rose #D4A574
   * - white: Blanc (pour fonds sombres)
   */
  color?: 'primary' | 'accent' | 'white';

  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',     // 18px
  md: 'text-2xl',    // 24px
  lg: 'text-[32px]', // 32px
  xl: 'text-5xl',    // 48px
};

const colorClasses = {
  primary: 'text-lumine-primary',
  accent: 'text-lumine-accent',
  white: 'text-white',
};

export function LumineLogo({
  variant = 'full',
  size = 'md',
  color = 'primary',
  className = '',
}: LumineLogoProps) {
  const sizeClass = sizeClasses[size];
  const colorClass = colorClasses[color];

  const getLogoText = () => {
    switch (variant) {
      case 'full':
        return BRAND_NAME;
      case 'condensed-single':
        return BRAND_LOGO_CONDENSED.single;
      case 'condensed-double':
        return BRAND_LOGO_CONDENSED.double;
      case 'exponent':
        return BRAND_LOGO_CONDENSED.exponent;
      default:
        return BRAND_NAME;
    }
  };

  return (
    <span
      className={`
        font-display font-medium tracking-wide
        ${sizeClass}
        ${colorClass}
        ${className}
      `}
      style={{
        letterSpacing: variant === 'full' ? '0.05em' : '0.02em',
      }}
    >
      {getLogoText()}
    </span>
  );
}

/**
 * Composant Logo avec icône (pour header)
 */
interface LumineLogoWithIconProps extends Omit<LumineLogoProps, 'variant'> {
  /**
   * Afficher l'icône circulaire à gauche
   */
  showIcon?: boolean;

  /**
   * Callback au clic
   */
  onClick?: () => void;
}

export function LumineLogoWithIcon({
  showIcon = true,
  size = 'md',
  color = 'primary',
  className = '',
  onClick,
}: LumineLogoWithIconProps) {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const iconSize = iconSizes[size];

  return (
    <div
      className={`flex items-center gap-2 md:gap-3 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {showIcon && (
        <div className={`${iconSize} rounded-full bg-lumine-primary flex items-center justify-center flex-shrink-0`}>
          <span className="text-lumine-neutral-100 font-display text-sm font-bold">
            {BRAND_LOGO_CONDENSED.single}
          </span>
        </div>
      )}
      <LumineLogo variant="full" size={size} color={color} />
    </div>
  );
}

/**
 * Composant Logo + Tagline (pour landing page)
 */
interface LumineLogoWithTaglineProps extends LumineLogoProps {
  /**
   * Afficher le tagline "L'immobilier en pleine lumière"
   */
  showTagline?: boolean;

  /**
   * Taille du tagline relatif au logo
   */
  taglineSize?: 'sm' | 'md' | 'lg';
}

export function LumineLogoWithTagline({
  variant = 'full',
  size = 'xl',
  color = 'primary',
  showTagline = true,
  taglineSize = 'md',
  className = '',
}: LumineLogoWithTaglineProps) {
  const taglineSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg md:text-xl',
    lg: 'text-xl md:text-2xl lg:text-3xl',
  };

  return (
    <div className={`flex flex-col gap-2 md:gap-4 ${className}`}>
      <LumineLogo variant={variant} size={size} color={color} />
      {showTagline && (
        <p className={`text-lumine-accent font-display font-light tracking-wide ${taglineSizeClasses[taglineSize]}`}>
          L'immobilier en pleine lumière
        </p>
      )}
    </div>
  );
}
