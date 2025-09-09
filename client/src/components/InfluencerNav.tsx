import { Link, useLocation } from "wouter";
import { 
  User,
  FileText,
  Users,
  BarChart3,
  MessageCircle,
  TrendingUp,
  Receipt
} from "lucide-react";

// Simple, reliable navigation component
export function InfluencerNav() {
  const [location] = useLocation();
  
  const navItems = [
    { 
      label: "Profile", 
      path: "/influencer-dashboard",
      icon: User
    },
    { 
      label: "Portfolio", 
      path: "/influencer-portfolio",
      icon: FileText
    },
    { 
      label: "Audience", 
      path: "/audience-demographics",
      icon: Users
    },
    { 
      label: "Performance", 
      path: "/performance-metrics",
      icon: BarChart3
    },
    { 
      label: "Invoices", 
      path: "/invoice-management",
      icon: Receipt
    },
    { 
      label: "Messages", 
      path: "/influencer-messages",
      icon: MessageCircle
    },
    { 
      label: "Trends", 
      path: "/trends-dashboard",
      icon: TrendingUp
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <nav className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/influencer-dashboard" 
            ? (location === "/" || location === "/influencer-dashboard")
            : location === item.path;
          
          return (
            <Link key={item.path} href={item.path} className="flex-1">
              <button
                className={`w-full px-4 py-4 flex flex-col items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                  isActive
                    ? "border-blue-500 text-blue-600 bg-blue-50"
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