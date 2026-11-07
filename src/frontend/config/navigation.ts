import { NavSection } from "@/shared/types/navigation";

export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    pillar: "CORE PROTOCOL",
    items: [
      { id: "overview", label: "Overview", href: "/dashboard", icon: "dashboard" },
      { id: "invoices", label: "Invoices", href: "/invoices", icon: "payments" },
      { id: "reminders", label: "Payment Reminders", href: "/reminders", icon: "notifications_active" },
      { id: "milestones", label: "Milestones", href: "/milestones", icon: "flag" },
      { id: "transactions", label: "Transactions", href: "/transactions", icon: "receipt_long" },
    ],
  },
  {
    pillar: "AUTONOMOUS AI",
    isAiPillar: true,
    items: [
      { id: "copilot", label: "AI Copilot", href: "/ai/copilot", icon: "auto_awesome" },
      { id: "rescue", label: "Rescue Mode", href: "/ai/rescue", icon: "crisis_alert", badge: "ALERT", badgeVariant: "alert" },
      { id: "forecast", label: "Forecast Radar", href: "/forecast", icon: "show_chart" },
      { id: "client-intel", label: "Client Intelligence", href: "/clients", icon: "group" },
      { id: "negotiator", label: "Payment Negotiator", href: "/ai/negotiator", icon: "handshake" },
      { id: "client-memory", label: "Client Memory Dossier", href: "/clients/memory", icon: "psychology" },
      { id: "what-if", label: "What-If Simulator", href: "/simulator", icon: "tune" },
    ],
  },
  {
    pillar: "TREASURY & FISCAL",
    items: [
      { id: "fees-currency", label: "Fee & Currency", href: "/treasury/currency", icon: "currency_exchange" },
      { id: "spending", label: "Spending Insights", href: "/spending", icon: "pie_chart" },
      { id: "subscriptions", label: "Subscriptions", href: "/subscriptions", icon: "autorenew" },
      { id: "tax", label: "Tax Shield Estimator", href: "/tax", icon: "account_balance" },
      { id: "profitability", label: "Project Profitability", href: "/profitability", icon: "timer" },
    ],
  },
  {
    pillar: "UTILITY ENGINE",
    items: [
      { id: "scanner", label: "AI Document Scanner", href: "/scanner", icon: "document_scanner" },
      { id: "reports", label: "Reports & P&L", href: "/reports", icon: "analytics" },
      { id: "settings", label: "Settings & AI Policy", href: "/settings", icon: "settings" },
    ],
  },
];
