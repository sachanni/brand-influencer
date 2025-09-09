import { Link, useLocation } from "wouter";
import { 
  Building,
  Target,
  Users,
  BarChart3,
  MessageSquare,
  Settings,
  Receipt
} from "lucide-react";

// Simple, reliable navigation component for brand dashboard
export function BrandNav() {
  const [location] = useLocation();
  
  const navItems = [
    { 
      label: "Profile", 
      path: "/brand-dashboard",
      icon: Building
    },
    { 
      label: "Campaigns", 
      path: "/brand-campaign-management",
      icon: Target
    },
    { 
      label: "Discovery", 
      path: "/brand-influencer-discovery",
      icon: Users
    },
    { 
      label: "Analytics", 
      path: "/brand-analytics",
      icon: BarChart3
    },
    { 
      label: "Invoices", 
      path: "/invoice-management",
      icon: Receipt
    },
    { 
      label: "Messages", 
      path: "/brand-messages",
      icon: MessageSquare
    },
    { 
      label: "Settings", 
      path: "/brand-settings",
      icon: Settings
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <nav className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path} className="flex-1">
              <button
                className={`w-full px-4 py-4 flex flex-col items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? "border-teal-500 text-teal-600 bg-teal-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}