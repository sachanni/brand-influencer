import { Button } from "@/components/ui/button";
import { ArrowRight, Star, TrendingUp, Users, Zap } from "lucide-react";

interface HeroSectionProps {
  onJoinAsBrand: () => void;
  onJoinAsInfluencer: () => void;
}

export function HeroSection({ onJoinAsBrand, onJoinAsInfluencer }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-16 h-16 border border-white/10 rotate-45 animate-float"></div>
      <div className="absolute top-3/4 right-1/4 w-12 h-12 border border-purple-400/20 rounded-full animate-float animation-delay-1000"></div>
      <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-60 animate-float animation-delay-3000"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            {/* Trust indicators */}
            <div className="flex items-center justify-center lg:justify-start gap-6 mb-8">
              <div className="flex items-center gap-2 text-purple-200">
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">10,000+ Creators</span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <Star className="w-5 h-5" />
                <span className="text-sm font-medium">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-medium">200% ROI Avg</span>
              </div>
            </div>
            
            {/* Main heading with gradient text */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-8">
              <span className="bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
                Connect with 
              </span>
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent block">
                Top Influencers
              </span>
              <span className="text-white block text-4xl sm:text-5xl lg:text-6xl mt-2">
                for Your Brand
              </span>
            </h1>
            
            {/* Enhanced description */}
            <p className="text-xl sm:text-2xl text-purple-100 mb-10 leading-relaxed max-w-2xl">
              Transform your marketing with <span className="text-purple-300 font-semibold">authentic partnerships</span> that drive real results. Connect with verified creators who align with your brand values.
            </p>
            
            {/* Modern CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <Button 
                onClick={onJoinAsBrand}
                size="lg"
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Join as Brand
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity -z-10"></div>
              </Button>
              
              <Button 
                onClick={onJoinAsInfluencer}
                size="lg"
                variant="outline"
                className="group relative border-2 border-white/30 text-white hover:text-purple-900 px-10 py-4 rounded-2xl font-bold text-lg backdrop-blur-sm bg-white/10 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Join as Influencer
                </span>
              </Button>
            </div>
            
            {/* Success metrics */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-white/10">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-white mb-1">500K+</div>
                <div className="text-purple-200 text-sm">Successful Campaigns</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-white mb-1">\u20b920Cr+</div>
                <div className="text-purple-200 text-sm">Creator Earnings</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-white mb-1">98%</div>
                <div className="text-purple-200 text-sm">Client Satisfaction</div>
              </div>
            </div>
          </div>
          
          {/* Enhanced image section */}
          <div className="relative flex items-center justify-center">
            {/* Glassmorphism container */}
            <div className="relative p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800" 
                alt="Person creating social media content with phone" 
                className="rounded-2xl w-full max-w-md h-auto shadow-2xl"
              />
              
              {/* Floating stats cards */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-2xl shadow-xl backdrop-blur-sm">
                <div className="text-2xl font-bold">+150%</div>
                <div className="text-sm opacity-90">Engagement</div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4 rounded-2xl shadow-xl backdrop-blur-sm">
                <div className="text-2xl font-bold">2.5M</div>
                <div className="text-sm opacity-90">Reach</div>
              </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-20 blur-2xl -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
