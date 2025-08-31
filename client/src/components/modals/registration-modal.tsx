import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SocialLoginButton } from "@/components/ui/social-login-button";
import { X, Users, Star, Building, Camera, CheckCircle, Globe, MapPin, CreditCard, Briefcase } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SiGoogle, SiInstagram, SiTiktok } from "react-icons/si";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  initialRole?: 'influencer' | 'brand';
}

type RegistrationStep = 'role' | 'credentials' | 'brand-details' | 'otp' | 'import' | 'review';

export function RegistrationModal({ isOpen, onClose, onSwitchToLogin, initialRole }: RegistrationModalProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(initialRole ? 'credentials' : 'role');
  const [selectedRole, setSelectedRole] = useState<'influencer' | 'brand' | ''>(initialRole || '');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    phone: '',
    firstName: '',
    lastName: '',
    otp: '',
  });
  const [brandData, setBrandData] = useState({
    companyName: '',
    industry: '',
    website: '',
    companySize: '',
    targetAudienceAge: '',
    targetAudienceGender: '',
    targetAudienceLocation: '',
    budgetRange: '',
    campaignTypes: [] as string[],
    businessRegistrationNumber: '',
    description: '',
  });
  const [profileData, setProfileData] = useState({
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@gmail.com",
    bio: "Fashion & lifestyle creator with focus on sustainable fashion and beauty tips. Passionate about helping others express their style authentically.",
    profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b632?w=400",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetModal = () => {
    setCurrentStep(initialRole ? 'credentials' : 'role');
    setSelectedRole(initialRole || '');
    setAuthData({
      email: '',
      password: '',
      phone: '',
      firstName: '',
      lastName: '',
      otp: '',
    });
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleGoogleSignup = () => {
    if (!selectedRole) {
      // Note: This component doesn't have toast imported, using console warning instead
      console.warn('Please select your role first');
      setError('Please select your role first');
      return;
    }
    // Simulate OAuth flow
    setTimeout(() => {
      setCurrentStep('import');
    }, 1000);
  };

  const handleEmailRegistration = async () => {
    if (!authData.email || !authData.password || !authData.firstName || !authData.lastName) {
      setError('Please fill in all required fields');
      return;
    }
    
    // For brands, show brand details step first
    if (selectedRole === 'brand') {
      setCurrentStep('brand-details');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password,
          firstName: authData.firstName,
          lastName: authData.lastName,
          phone: authData.phone,
          role: selectedRole,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentStep('otp');
        // For development: auto-fill OTP if provided
        if (data.developmentOtp) {
          setAuthData(prev => ({ ...prev, otp: data.developmentOtp }));
          setError(`Development Mode: OTP is ${data.developmentOtp}`);
        } else {
          setError(data.message || 'OTP sent successfully');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBrandRegistration = async () => {
    if (!brandData.companyName || !brandData.industry) {
      setError('Please fill in company name and industry');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authData.email,
          password: authData.password,
          firstName: authData.firstName,
          lastName: authData.lastName,
          phone: authData.phone,
          role: selectedRole,
          ...brandData,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentStep('otp');
        // For development: auto-fill OTP if provided
        if (data.developmentOtp) {
          setAuthData(prev => ({ ...prev, otp: data.developmentOtp }));
          setError(`Development Mode: OTP is ${data.developmentOtp}`);
        } else {
          setError(data.message || 'OTP sent successfully');
        }
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!authData.otp || authData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authData.email,
          phone: authData.phone,
          otp: authData.otp,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Registration complete, redirect to dashboard
        window.location.href = selectedRole === 'influencer' ? '/influencer-dashboard' : '/brand-dashboard';
        handleClose();
      } else {
        setError(data.message || 'OTP verification failed');
      }
    } catch (error) {
      setError('OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authData.email,
          phone: authData.phone,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        // For development: auto-fill new OTP if provided
        if (data.developmentOtp) {
          setAuthData(prev => ({ ...prev, otp: data.developmentOtp }));
          setError(`Development Mode: New OTP is ${data.developmentOtp}`);
        } else {
          setError(data.message || 'New OTP sent successfully');
        }
      }
    } catch (error) {
      setError('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = () => {
    // Handle registration logic
    console.log('Registration completed', { selectedRole, profileData, agreedToTerms, marketingConsent });
    handleClose();
  };

  const renderRoleSelection = () => (
    <div className="p-8 relative">
      <Button
        onClick={handleClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </Button>
      
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Users className="text-brand-teal text-3xl mr-2" />
          <span className="text-2xl font-bold text-gray-900">Join Influencer Hub</span>
        </div>
        <p className="text-gray-600">Let's Get You Started</p>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-center mb-6">Choose Your Role</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => setSelectedRole('influencer')}
            className={`p-6 h-auto flex-col space-y-2 border-2 transition-all ${
              selectedRole === 'influencer' 
                ? 'border-brand-teal bg-teal-50 text-brand-teal' 
                : 'border-gray-200 hover:border-brand-teal hover:bg-teal-50'
            }`}
          >
            <Star className="h-8 w-8 text-brand-teal" />
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-1">Influencer</h4>
              <p className="text-sm text-gray-600">Share your content and collaborate with brands</p>
            </div>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setSelectedRole('brand')}
            className={`p-6 h-auto flex-col space-y-2 border-2 transition-all ${
              selectedRole === 'brand' 
                ? 'border-brand-teal bg-teal-50 text-brand-teal' 
                : 'border-gray-200 hover:border-brand-teal hover:bg-teal-50'
            }`}
          >
            <Building className="h-8 w-8 text-brand-teal" />
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-1">Brand</h4>
              <p className="text-sm text-gray-600">Find influencers to promote your products</p>
            </div>
          </Button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <SocialLoginButton provider="google" onClick={handleGoogleSignup}>
          <SiGoogle className="h-5 w-5" />
          Quick Sign Up
        </SocialLoginButton>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or continue manually</span>
        </div>
      </div>

      <Button 
        onClick={() => selectedRole && setCurrentStep('credentials')}
        disabled={!selectedRole}
        className="w-full border-2 border-brand-teal text-brand-teal bg-white py-3 rounded-lg hover:bg-brand-teal hover:text-white transition-colors font-semibold"
      >
        Continue
      </Button>

      <div className="text-center mt-6">
        <span className="text-gray-600">Already have an account? </span>
        <Button 
          variant="link" 
          onClick={onSwitchToLogin}
          className="text-brand-teal hover:text-brand-teal-dark font-semibold p-0"
        >
          Sign In
        </Button>
      </div>
    </div>
  );

  const renderProfileImport = () => (
    <div className="p-8 relative max-h-[90vh] overflow-y-auto">
      <div className="bg-brand-teal text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Complete Your Profile</h3>
          <span className="text-sm opacity-90">Step 2 of 3</span>
        </div>
        <p className="text-teal-100 mt-1">We've imported your profile. Please verify your information.</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
          <div className="w-8 h-1 bg-brand-teal"></div>
          <div className="w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
          <div className="w-8 h-1 bg-gray-300"></div>
          <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Picture */}
        <div className="text-center">
          <div className="mb-4">
            <img 
              src={profileData.profileImageUrl} 
              alt="Profile" 
              className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-brand-teal" 
            />
          </div>
          <Button variant="link" className="text-brand-teal hover:text-brand-teal-dark text-sm font-medium">
            <Camera className="h-4 w-4 mr-1" />
            Change Photo
          </Button>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <Input
              value={profileData.firstName}
              onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <Input
              value={profileData.lastName}
              onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <Textarea
          rows={3}
          value={profileData.bio}
          onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
          className="w-full"
        />
      </div>

      {/* Social Media Accounts */}
      <div className="mt-6">
        <h4 className="font-medium text-gray-900 mb-4">Connected Social Media Accounts</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <SiInstagram className="text-pink-500 text-xl mr-3" />
              <div>
                <p className="font-medium">@sarahchen_style</p>
                <p className="text-sm text-gray-500">125K followers</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 text-sm mr-2">Connected</span>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center">
              <SiTiktok className="text-black text-xl mr-3" />
              <div>
                <p className="font-medium">@sarahstyle</p>
                <p className="text-sm text-gray-500">67K followers</p>
              </div>
            </div>
            <Button variant="link" className="text-brand-teal hover:text-brand-teal-dark text-sm font-medium">
              Connect
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep('role')}
          className="px-6 py-2"
        >
          Back
        </Button>
        <Button 
          onClick={() => setCurrentStep('review')}
          className="px-6 py-2 bg-brand-teal text-white hover:bg-brand-teal-dark"
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderProfileReview = () => (
    <div className="p-8 relative max-h-[90vh] overflow-y-auto">
      <div className="bg-brand-teal text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Almost Done!</h3>
          <span className="text-sm opacity-90">Step 3 of 3</span>
        </div>
        <p className="text-teal-100 mt-1">Review your profile and finish setting up your account.</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">✓</div>
          <div className="w-8 h-1 bg-brand-teal"></div>
          <div className="w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">✓</div>
          <div className="w-8 h-1 bg-brand-teal"></div>
          <div className="w-8 h-8 bg-brand-teal text-white rounded-full flex items-center justify-center text-sm font-semibold">3</div>
        </div>
      </div>

      {/* Profile Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <div className="flex items-start space-x-4">
          <img 
            src={profileData.profileImageUrl} 
            alt="Profile preview" 
            className="w-16 h-16 rounded-full object-cover" 
          />
          <div className="flex-1">
            <h4 className="font-semibold text-lg text-gray-900">{profileData.firstName} {profileData.lastName}</h4>
            <p className="text-sm text-gray-600 mb-2 capitalize">{selectedRole}</p>
            <p className="text-sm text-gray-700">{profileData.bio}</p>
            
            <div className="flex items-center space-x-4 mt-3">
              <div className="flex items-center text-sm text-gray-600">
                <SiInstagram className="text-pink-500 mr-1" />
                <span>125K</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span>❤️ 4.2% eng.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Categories */}
      <div className="mb-6">
        <h5 className="font-medium text-gray-900 mb-3">Content Categories (Auto-detected)</h5>
        <div className="flex flex-wrap gap-2">
          <span className="bg-brand-teal text-white px-3 py-1 rounded-full text-sm">Fashion</span>
          <span className="bg-brand-teal text-white px-3 py-1 rounded-full text-sm">Beauty</span>
          <span className="bg-brand-teal text-white px-3 py-1 rounded-full text-sm">Lifestyle</span>
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">Sustainability</span>
        </div>
      </div>

      {/* Terms and Privacy */}
      <div className="mb-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
          />
          <label htmlFor="terms" className="text-sm text-gray-600">
            I agree to the <Button variant="link" className="p-0 h-auto text-brand-teal hover:text-brand-teal-dark">Terms of Service</Button> and{' '}
            <Button variant="link" className="p-0 h-auto text-brand-teal hover:text-brand-teal-dark">Privacy Policy</Button>
          </label>
        </div>
      </div>

      {/* Marketing Preferences */}
      <div className="mb-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketing"
            checked={marketingConsent}
            onCheckedChange={(checked) => setMarketingConsent(checked === true)}
          />
          <label htmlFor="marketing" className="text-sm text-gray-600">
            I want to receive marketing communications and collaboration opportunities
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep('import')}
          className="px-6 py-2"
        >
          Back
        </Button>
        <Button 
          onClick={handleCompleteRegistration}
          disabled={!agreedToTerms}
          className="px-8 py-2 bg-brand-teal text-white hover:bg-brand-teal-dark font-semibold"
        >
          Complete Registration
        </Button>
      </div>
    </div>
  );

  const renderCredentialsForm = () => (
    <div className="p-8 relative">
      <Button
        onClick={handleClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </Button>
      
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Users className="text-brand-teal text-3xl mr-2" />
          <span className="text-2xl font-bold text-gray-900">Create Your Account</span>
        </div>
        <p className="text-gray-600">Enter your details to get started</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <Input
              value={authData.firstName}
              onChange={(e) => setAuthData(prev => ({ ...prev, firstName: e.target.value }))}
              placeholder="Enter your first name"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <Input
              value={authData.lastName}
              onChange={(e) => setAuthData(prev => ({ ...prev, lastName: e.target.value }))}
              placeholder="Enter your last name"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <Input
            type="email"
            value={authData.email}
            onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email address"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <Input
            type="password"
            value={authData.password}
            onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Create a strong password"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
          <Input
            type="tel"
            value={authData.phone}
            onChange={(e) => setAuthData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+1 (555) 123-4567"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">We'll send an OTP for verification. Use international format: +1234567890</p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep('role')}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button 
          onClick={handleEmailRegistration}
          disabled={isLoading}
          className="bg-brand-teal hover:bg-brand-teal/90"
        >
          {isLoading ? 'Creating Account...' : 'Continue'}
        </Button>
      </div>

      <div className="text-center mt-6">
        <span className="text-gray-600">Already have an account? </span>
        <Button 
          variant="link" 
          onClick={onSwitchToLogin}
          className="text-brand-teal hover:text-brand-teal-dark font-semibold p-0"
        >
          Sign In
        </Button>
      </div>
    </div>
  );

  const renderBrandDetails = () => (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
        <h2 className="text-2xl font-bold text-gray-900">Tell Us About Your Brand</h2>
        <p className="text-gray-600">Help us understand your company and campaign needs</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Company Name*</Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Your Company Ltd."
              value={brandData.companyName}
              onChange={(e) => setBrandData(prev => ({ ...prev, companyName: e.target.value }))}
              data-testid="input-company-name"
            />
          </div>
          <div>
            <Label htmlFor="industry">Industry*</Label>
            <Select value={brandData.industry} onValueChange={(value) => setBrandData(prev => ({ ...prev, industry: value }))}>
              <SelectTrigger data-testid="select-industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fashion">Fashion & Beauty</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="fitness">Health & Fitness</SelectItem>
                <SelectItem value="food">Food & Beverage</SelectItem>
                <SelectItem value="travel">Travel & Lifestyle</SelectItem>
                <SelectItem value="automotive">Automotive</SelectItem>
                <SelectItem value="finance">Finance & Insurance</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="website"
                type="url"
                placeholder="https://yourcompany.com"
                className="pl-10"
                value={brandData.website}
                onChange={(e) => setBrandData(prev => ({ ...prev, website: e.target.value }))}
                data-testid="input-website"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="companySize">Company Size</Label>
            <Select value={brandData.companySize} onValueChange={(value) => setBrandData(prev => ({ ...prev, companySize: value }))}>
              <SelectTrigger data-testid="select-company-size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                <SelectItem value="small">Small (11-50 employees)</SelectItem>
                <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="targetAge">Target Age</Label>
            <Select value={brandData.targetAudienceAge} onValueChange={(value) => setBrandData(prev => ({ ...prev, targetAudienceAge: value }))}>
              <SelectTrigger data-testid="select-target-age">
                <SelectValue placeholder="Age range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="13-17">Gen Z (13-17)</SelectItem>
                <SelectItem value="18-24">Young Adults (18-24)</SelectItem>
                <SelectItem value="25-34">Millennials (25-34)</SelectItem>
                <SelectItem value="35-44">Gen X (35-44)</SelectItem>
                <SelectItem value="45-54">Boomers (45-54)</SelectItem>
                <SelectItem value="55+">55+ Adults</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="targetGender">Target Gender</Label>
            <Select value={brandData.targetAudienceGender} onValueChange={(value) => setBrandData(prev => ({ ...prev, targetAudienceGender: value }))}>
              <SelectTrigger data-testid="select-target-gender">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="budgetRange">Budget Range</Label>
            <Select value={brandData.budgetRange} onValueChange={(value) => setBrandData(prev => ({ ...prev, budgetRange: value }))}>
              <SelectTrigger data-testid="select-budget-range">
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="₹80K-₹4L">₹80K - ₹4L</SelectItem>
                <SelectItem value="₹4L-₹8L">₹4L - ₹8L</SelectItem>
                <SelectItem value="₹8L-₹20L">₹8L - ₹20L</SelectItem>
                <SelectItem value="₹20L-₹40L">₹20L - ₹40L</SelectItem>
                <SelectItem value="₹40L+">₹40L+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="location">Target Location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="location"
              type="text"
              placeholder="e.g., North America, India, Global"
              className="pl-10"
              value={brandData.targetAudienceLocation}
              onChange={(e) => setBrandData(prev => ({ ...prev, targetAudienceLocation: e.target.value }))}
              data-testid="input-target-location"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="businessReg">Business Registration Number (Optional)</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="businessReg"
              type="text"
              placeholder="GSTIN, EIN, or other business ID"
              className="pl-10"
              value={brandData.businessRegistrationNumber}
              onChange={(e) => setBrandData(prev => ({ ...prev, businessRegistrationNumber: e.target.value }))}
              data-testid="input-business-registration"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Company Description</Label>
          <Textarea
            id="description"
            placeholder="Tell us about your brand, products, and what makes you unique..."
            rows={3}
            value={brandData.description}
            onChange={(e) => setBrandData(prev => ({ ...prev, description: e.target.value }))}
            data-testid="textarea-description"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('credentials')}
          className="flex-1"
          data-testid="button-back-to-credentials"
        >
          Back
        </Button>
        <Button 
          onClick={handleBrandRegistration}
          disabled={isLoading || !brandData.companyName || !brandData.industry}
          className="flex-1"
          data-testid="button-continue-brand"
        >
          {isLoading ? 'Creating Account...' : 'Continue'}
        </Button>
      </div>
    </div>
  );

  const renderOtpVerification = () => (
    <div className="p-8 relative">
      <Button
        onClick={handleClose}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X className="h-5 w-5" />
      </Button>
      
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="text-brand-teal text-3xl mr-2" />
          <span className="text-2xl font-bold text-gray-900">Verify Your Account</span>
        </div>
        <p className="text-gray-600">
          We've sent a 6-digit code to {authData.email}
          {authData.phone && ` and ${authData.phone}`}
        </p>
      </div>

      {error && (
        <div className={`px-4 py-3 rounded-lg mb-6 ${
          error.includes('sent successfully') 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter Verification Code</label>
        <Input
          type="text"
          value={authData.otp}
          onChange={(e) => setAuthData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
          placeholder="000000"
          className="text-center text-2xl tracking-widest font-mono"
          maxLength={6}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-2 text-center">Enter the 6-digit code sent to your email/phone</p>
      </div>

      <Button 
        onClick={handleOtpVerification}
        disabled={isLoading || authData.otp.length !== 6}
        className="w-full bg-brand-teal hover:bg-brand-teal/90 mb-4"
      >
        {isLoading ? 'Verifying...' : 'Verify & Complete Registration'}
      </Button>

      <div className="text-center">
        <span className="text-gray-600">Didn't receive the code? </span>
        <Button 
          variant="link" 
          onClick={handleResendOtp}
          disabled={isLoading}
          className="text-brand-teal hover:text-brand-teal-dark font-semibold p-0"
        >
          Resend OTP
        </Button>
      </div>

      <div className="flex justify-center mt-6">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep('credentials')}
          disabled={isLoading}
        >
          Back to Form
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 bg-white rounded-2xl border-0">
        {currentStep === 'role' && renderRoleSelection()}
        {currentStep === 'credentials' && renderCredentialsForm()}
        {currentStep === 'brand-details' && renderBrandDetails()}
        {currentStep === 'otp' && renderOtpVerification()}
        {currentStep === 'import' && renderProfileImport()}
        {currentStep === 'review' && renderProfileReview()}
      </DialogContent>
    </Dialog>
  );
}
