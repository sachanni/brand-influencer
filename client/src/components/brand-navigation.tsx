import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Building, 
  BarChart3, 
  Target, 
  Users, 
  MessageSquare, 
  Settings,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface BrandNavigationProps {
  currentPage: string;
}

export function BrandNavigation({ currentPage }: BrandNavigationProps) {
  const { user } = useAuth();

  const navigation = [
    { name: "Brand Profile", href: "/brand-dashboard", icon: Building },
    { name: "Campaign Management", href: "/brand-campaign-management", icon: Target },
    { name: "Influencer Discovery", href: "/brand-influencer-discovery", icon: Users },
    { name: "Analytics", href: "/brand-analytics", icon: BarChart3 },
    { name: "Messages", href: "/brand-messages", icon: MessageSquare },
    { name: "Settings", href: "/brand-settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Brand Dashboard</span>
            </div>
            
            <nav className="flex space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.name;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-100 text-teal-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    data-testid={`nav-${item.name.toLowerCase().replace(/ /g, '-')}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:block">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                {(user as any)?.firstName || 'Brand'} {(user as any)?.lastName || 'User'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}