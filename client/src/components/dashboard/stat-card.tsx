import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  Briefcase,
  CheckCircle,
  FileText,
  Users,
  Star,
  Clock,
  Activity,
  SaudiRiyal
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  title: string;
  value: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
  percent?: number;
};

export default function StatCard({ 
  title, 
  value, 
  icon = "activity", 
  trend = "neutral",
  percent = 0
}: StatCardProps) {
  const { t, i18n } = useTranslation();

  // Icon mapping
  const iconMap: Record<string, React.ReactNode> = {
    activity: <Activity className="h-6 w-6" />,
    briefcase: <Briefcase className="h-6 w-6" />,
    "check-circle": <CheckCircle className="h-6 w-6" />,
    "file-text": <FileText className="h-6 w-6" />,
    "saudi-sign": i18n.language === "ar" ? <SaudiRiyal className="h-6 w-6" /> : "SAR",
    users: <Users className="h-6 w-6" />,
    star: <Star className="h-6 w-6" />,
    clock: <Clock className="h-6 w-6" />,
  };

  // Color mapping for trends
  const trendColorClass = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-neutral-600",
  };

  // Icon component based on trend
  const TrendIcon = trend === "up" ? ArrowUpIcon : trend === "down" ? ArrowDownIcon : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {iconMap[icon]}
          </div>
          {trend !== "neutral" && percent > 0 && (
            <div className={cn("flex items-center text-sm", trendColorClass[trend])}>
              {TrendIcon && <TrendIcon className="h-4 w-4 mr-1" />}
              <span>{percent}%</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-medium text-neutral-600">{title}</h3>
        <div className="text-3xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
