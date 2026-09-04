declare module 'lucide-react' {
  import { ForwardRefExoticComponent, SVGAttributes } from 'react';

  export interface LucideIconProps extends SVGAttributes<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export type LucideIcon = ForwardRefExoticComponent<LucideIconProps>;

  // Common icons
  export const MessageSquare: LucideIcon;
  export const Bot: LucideIcon;
  export const Zap: LucideIcon;
  export const Lightbulb: LucideIcon;
  export const Copy: LucideIcon;
  export const Send: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Settings: LucideIcon;
  export const LogOut: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const User: LucideIcon;
  export const Building2: LucideIcon;
  export const Bell: LucideIcon;
  export const X: LucideIcon;
  export const Menu: LucideIcon;
  export const Loader2: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Shield: LucideIcon;
  export const Mail: LucideIcon;
  export const Lock: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Home: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const Upload: LucideIcon;
  export const Save: LucideIcon;
  export const Star: LucideIcon;
  export const Users: LucideIcon;
  export const DollarSign: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const Smartphone: LucideIcon;

  // Add more icons as needed
}