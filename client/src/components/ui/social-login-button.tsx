import { Button } from "./button";
import { cn } from "@/lib/utils";

interface SocialLoginButtonProps {
  provider: 'google' | 'instagram' | 'tiktok' | 'facebook' | 'youtube';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const providerStyles = {
  google: "bg-red-500 hover:bg-red-600 text-white",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white",
  tiktok: "bg-black hover:bg-gray-800 text-white",
  facebook: "bg-blue-600 hover:bg-blue-700 text-white",
  youtube: "bg-red-600 hover:bg-red-700 text-white",
};

export function SocialLoginButton({ provider, children, onClick, className }: SocialLoginButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default OAuth flow
      window.location.href = `/api/auth/${provider}`;
    }
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center justify-center gap-3 py-3",
        providerStyles[provider],
        className
      )}
    >
      {children}
    </Button>
  );
}
