export type NavigationPillar = 'CORE PROTOCOL' | 'AUTONOMOUS AI' | 'TREASURY & FISCAL' | 'UTILITY ENGINE';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string;
  badgeVariant?: 'alert' | 'ai' | 'neutral';
}

export interface NavSection {
  pillar: NavigationPillar;
  isAiPillar?: boolean;
  items: NavItem[];
}

export type SupportedCurrency = 'USD' | 'EUR' | 'INR';
