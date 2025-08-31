import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/modals/login-modal";
import { RegistrationModal } from "@/components/modals/registration-modal";
import { useAuth } from "@/hooks/useAuth";
import { Users, Trophy } from "lucide-react";

export function Navigation() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationRole, setRegistrationRole] = useState<'influencer' | 'brand' | undefined>();
  const { isAuthenticated, user } = useAuth();

  const handleJoinAsRole = (role: 'influencer' | 'brand') => {
    setRegistrationRole(role);
    setShowRegistrationModal(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      // Redirect to home page instead of reloading current page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <Users className="text-brand-teal text-2xl mr-2" />
                  <span className="text-xl font-bold text-gray-900">Influencer Hub</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <a 
                    href="/gamification"
                    className="flex items-center space-x-1 px-3 py-2 text-gray-700 hover:text-brand-teal hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-medium">Leaderboard</span>
                  </a>
                  <span className="text-gray-700">Welcome, {(user as any)?.firstName || 'User'}</span>
                  <Button 
                    variant="outline"
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-brand-teal transition-colors"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost"
                    onClick={() => setShowLoginModal(true)}
                    className="text-gray-700 hover:text-brand-teal transition-colors"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => setShowRegistrationModal(true)}
                    className="bg-brand-teal text-white px-4 py-2 rounded-lg hover:bg-brand-teal-dark transition-colors"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false);
          setShowRegistrationModal(true);
        }}
      />

      <RegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setRegistrationRole(undefined);
        }}
        onSwitchToLogin={() => {
          setShowRegistrationModal(false);
          setShowLoginModal(true);
        }}
        initialRole={registrationRole}
      />
    </>
  );
}
