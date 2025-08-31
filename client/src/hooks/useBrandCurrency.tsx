import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, type SupportedCurrency } from "@/lib/currency";

export function useBrandCurrency() {
  const { user } = useAuth();
  
  // Fetch brand profile data (including currency preference)
  const { data: brandProfileData, isLoading } = useQuery({
    queryKey: ['/api/brand/profile'],
    enabled: !!user && (user as any)?.role === 'brand'
  });

  const brandProfile = (brandProfileData as any)?.profile;
  const preferredCurrency = (brandProfile?.preferredCurrency as SupportedCurrency) || 'INR';

  // Helper function to format currency using the brand's preference
  const formatBrandCurrency = (amount: number | string, options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  }) => {
    return formatCurrency(amount, preferredCurrency, options);
  };

  return {
    preferredCurrency,
    formatBrandCurrency,
    isLoading
  };
}