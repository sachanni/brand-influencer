import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import InfluencerDashboard from "@/pages/influencer-dashboard";
import InfluencerPortfolio from "@/pages/influencer-portfolio";
import AudienceDemographics from "@/pages/audience-demographics";
import PerformanceMetrics from "@/pages/performance-metrics";
import InfluencerSettings from "@/pages/influencer-settings";
import BrandDashboard from "@/pages/brand-dashboard";
import BrandCampaignManagement from "@/pages/brand-campaign-management";
import BrandInfluencerDiscovery from "@/pages/brand-influencer-discovery";
import BrandAnalytics from "@/pages/brand-analytics";
import BrandMessages from "@/pages/brand-messages";
import BrandSettings from "@/pages/brand-settings";
import SettingsPayment from "@/pages/settings-payment";
import InfluencerMessages from "@/pages/influencer-messages";
import CampaignsPage from "@/pages/campaigns";
import ProfileImport from "@/pages/profile-import";
import { ProfileReview } from "@/pages/profile-review";
import TrendsDashboard from "@/pages/trends-dashboard";
import GamificationDashboard from "@/pages/gamification-dashboard";
import InvoiceManagement from "@/pages/invoice-management";
import AdminDashboard from "@/pages/admin-dashboard";
import CommissionTest from "@/pages/commission-test";
import CommissionOverview from "@/pages/commission-overview";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={() => {
            const userRole = (user as any)?.role;
            const hasCompletedProfile = (user as any)?.bio || (user as any)?.socialAccounts?.length > 0;
            
            // New users should complete profile setup first
            if (!hasCompletedProfile && userRole === 'influencer') {
              return <ProfileImport />;
            }
            
            if (userRole === 'influencer') {
              return <InfluencerDashboard />;
            } else if (userRole === 'brand') {
              return <BrandDashboard />;
            } else {
              return <Home />;
            }
          }} />
          <Route path="/profile-import" component={ProfileImport} />
          <Route path="/profile-review" component={ProfileReview} />
          <Route path="/influencer-dashboard" component={InfluencerDashboard} />
          <Route path="/influencer-portfolio" component={InfluencerPortfolio} />
          <Route path="/audience-demographics" component={AudienceDemographics} />
          <Route path="/performance-metrics" component={PerformanceMetrics} />
          <Route path="/trends-dashboard" component={TrendsDashboard} />
          <Route path="/gamification" component={GamificationDashboard} />
          <Route path="/influencer-settings" component={InfluencerSettings} />
          <Route path="/influencer-messages" component={InfluencerMessages} />
          <Route path="/brand-dashboard" component={BrandDashboard} />
          <Route path="/brand-campaign-management" component={BrandCampaignManagement} />
          <Route path="/brand-influencer-discovery" component={BrandInfluencerDiscovery} />
          <Route path="/brand-analytics" component={BrandAnalytics} />
          <Route path="/brand-messages" component={BrandMessages} />
          <Route path="/brand-settings" component={BrandSettings} />
          <Route path="/settings-payment" component={SettingsPayment} />
          <Route path="/settings/payment" component={SettingsPayment} />
          <Route path="/invoice-management" component={InvoiceManagement} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/commission-test" component={CommissionTest} />
          <Route path="/commission-overview" component={CommissionOverview} />
          <Route path="/campaigns" component={CampaignsPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
