import {
  Utensils,
  Car,
  Home,
  Clapperboard,
  Pill,
  Plane,
  BookOpen,
  Dumbbell,
  ShoppingBag,
  Lightbulb,
  Gamepad2,
  Coffee,
  Pizza,
  Music,
  Briefcase,
  Heart,
  Gift,
  Shirt,
  Bus,
  Wifi,
  Phone,
  Baby,
  PawPrint,
  Wrench,
  Landmark,
  GraduationCap,
  Bike,
  Train,
  Fuel,
  Scissors,
  Stethoscope,
  ShoppingCart,
  Tv,
  Leaf,
  Wallet,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: 'Utensils', icon: Utensils, label: 'Food' },
  { name: 'Coffee', icon: Coffee, label: 'Coffee' },
  { name: 'Pizza', icon: Pizza, label: 'Pizza' },
  { name: 'ShoppingCart', icon: ShoppingCart, label: 'Groceries' },
  { name: 'ShoppingBag', icon: ShoppingBag, label: 'Shopping' },
  { name: 'Shirt', icon: Shirt, label: 'Clothing' },
  { name: 'Car', icon: Car, label: 'Car' },
  { name: 'Bus', icon: Bus, label: 'Transit' },
  { name: 'Train', icon: Train, label: 'Train' },
  { name: 'Bike', icon: Bike, label: 'Bike' },
  { name: 'Plane', icon: Plane, label: 'Travel' },
  { name: 'Fuel', icon: Fuel, label: 'Fuel' },
  { name: 'Home', icon: Home, label: 'Housing' },
  { name: 'Lightbulb', icon: Lightbulb, label: 'Utilities' },
  { name: 'Wifi', icon: Wifi, label: 'Internet' },
  { name: 'Phone', icon: Phone, label: 'Phone' },
  { name: 'Tv', icon: Tv, label: 'Streaming' },
  { name: 'Pill', icon: Pill, label: 'Medicine' },
  { name: 'Stethoscope', icon: Stethoscope, label: 'Health' },
  { name: 'Heart', icon: Heart, label: 'Wellness' },
  { name: 'Dumbbell', icon: Dumbbell, label: 'Fitness' },
  { name: 'BookOpen', icon: BookOpen, label: 'Education' },
  { name: 'GraduationCap', icon: GraduationCap, label: 'School' },
  { name: 'Clapperboard', icon: Clapperboard, label: 'Movies' },
  { name: 'Music', icon: Music, label: 'Music' },
  { name: 'Gamepad2', icon: Gamepad2, label: 'Gaming' },
  { name: 'Briefcase', icon: Briefcase, label: 'Work' },
  { name: 'Gift', icon: Gift, label: 'Gifts' },
  { name: 'Baby', icon: Baby, label: 'Kids' },
  { name: 'PawPrint', icon: PawPrint, label: 'Pets' },
  { name: 'Wrench', icon: Wrench, label: 'Repairs' },
  { name: 'Scissors', icon: Scissors, label: 'Personal care' },
  { name: 'Landmark', icon: Landmark, label: 'Banking' },
  { name: 'TrendingUp', icon: TrendingUp, label: 'Investments' },
  { name: 'Leaf', icon: Leaf, label: 'Nature' },
  { name: 'Wallet', icon: Wallet, label: 'Other' },
];

const ICON_MAP = new Map(CATEGORY_ICONS.map((e) => [e.name, e.icon]));

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function iconColorForBg(bgColor: string | null | undefined): string {
  if (!bgColor) return 'white';
  const rgb = hexToRgb(bgColor);
  if (!rgb) return 'white';
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.35 ? 'rgba(0,0,0,0.65)' : 'white';
}

interface CategoryIconProps {
  iconName: string | null | undefined;
  color: string | null | undefined;
  size?: number;
  containerSize?: number;
  borderRadius?: number;
  fallbackLetter?: string;
}

export function CategoryIcon({
  iconName,
  color,
  size = 16,
  containerSize = 32,
  borderRadius = 8,
  fallbackLetter,
}: CategoryIconProps) {
  const IconComponent = iconName ? ICON_MAP.get(iconName) : undefined;
  const iconColor = iconColorForBg(color);

  return (
    <div
      style={{
        width: containerSize,
        height: containerSize,
        borderRadius,
        background: color ?? 'var(--cream-darker)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {IconComponent ? (
        <IconComponent size={size} color={iconColor} strokeWidth={1.75} />
      ) : (
        <span style={{ fontSize: Math.round(containerSize * 0.4), fontWeight: 700, color: iconColor, lineHeight: 1 }}>
          {fallbackLetter ?? '?'}
        </span>
      )}
    </div>
  );
}
