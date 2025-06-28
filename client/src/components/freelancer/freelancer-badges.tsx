import { useEffect, useState } from "react";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

interface Badge {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  type: "plan" | "custom";
  planKey?: string;
  translations?: Record<string, { name: string; description: string }>;
}

interface UserBadge {
  id: number;
  badge: Badge;
  assignedAt?: string;
  expiresAt?: string | null;
  isActive: boolean;
}

export function FreelancerBadges({ userId, className = "" }: { userId: number; className?: string }) {
  const { t, i18n } = useTranslation();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}/badges`).then(res => res.json()).then(setBadges).finally(() => setLoading(false));
  }, [userId]);

  if (loading || !badges.length) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      <TooltipProvider>
        {badges.map((userBadge) => {
          const badge = userBadge.badge;
          const lang = i18n.language;
          const label = badge.translations?.[lang]?.name || badge.name;
          const desc = badge.translations?.[lang]?.description || badge.description;
          return (
            <Tooltip key={userBadge.id}>
              <TooltipTrigger asChild>
                <UIBadge className={badge.color + " flex items-center gap-1 px-2 py-1 text-xs font-medium"}>
                  {badge.icon && <span className="mr-1">{badge.icon}</span>}
                  {label}
                </UIBadge>
              </TooltipTrigger>
              <TooltipContent>{desc}</TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

export default FreelancerBadges; 