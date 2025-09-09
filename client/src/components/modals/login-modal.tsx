import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SocialLoginButton } from "@/components/ui/social-login-button";
import { X, Users } from "lucide-react";
import { SiGoogle, SiInstagram, SiTiktok } from "react-icons/si";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // Login successful - reload page to update auth state
        window.location.reload();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-white rounded-2xl border-0">
        <div className="p-8 relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Users className="text-brand-teal text-3xl mr-2" />
              <span className="text-2xl font-bold text-gray-900">Influencer Hub</span>
            </div>
            <p className="text-gray-600">Welcome back! Sign in to your account</p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <SocialLoginButton provider="google">
              <SiGoogle className="h-5 w-5" />
              Continue with Google
            </SocialLoginButton>
            <SocialLoginButton provider="instagram">
              <SiInstagram className="h-5 w-5" />
              Continue with Instagram
            </SocialLoginButton>
            <SocialLoginButton provider="tiktok">
              <SiTiktok className="h-5 w-5" />
              Continue with TikTok
            </SocialLoginButton>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              required
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              required
              disabled={isLoading}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stayLoggedIn"
                  checked={stayLoggedIn}
                  onCheckedChange={(checked) => setStayLoggedIn(checked === true)}
                />
                <label htmlFor="stayLoggedIn" className="text-sm text-gray-600">
                  Stay logged in
                </label>
              </div>
              <Button variant="link" className="text-sm text-brand-teal hover:text-brand-teal-dark p-0">
                Forgot Password?
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-brand-teal text-white py-3 rounded-lg hover:bg-brand-teal-dark transition-colors font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <span className="text-gray-600">Don't have an account? </span>
            <Button 
              variant="link" 
              onClick={onSwitchToSignup}
              className="text-brand-teal hover:text-brand-teal-dark font-semibold p-0"
            >
              Create Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
