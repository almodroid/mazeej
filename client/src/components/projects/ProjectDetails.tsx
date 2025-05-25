import { format } from "date-fns";
import {  Calendar, User, SaudiRiyal, Wallet  } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Project } from "@shared/schema";
import {
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface ProjectDetailsProps {
  project: Project;
  isProjectOwner: boolean;
}

export default function ProjectDetails({ project, isProjectOwner }: ProjectDetailsProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Fetch client information
  const { data: client } = useQuery({
    queryKey: ["/api/users", project.clientId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${project.clientId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!project.clientId,
  });

  const deadlineDate = project.deadline ? new Date(project.deadline) : null;
  const formattedDeadline = deadlineDate ? format(deadlineDate, "MMMM d, yyyy") : "";

  return (
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 m-6">
        <div className="flex items-center">
          <Wallet  className="h-5 w-5 text-muted-foreground mr-3" />
          <div>
            <p className="text-sm text-muted-foreground">{t("projects.budget")}</p>
            <p className={cn("font-medium flex align-middle items-center", isRTL && "flex-row-reverse")}>{isRTL ? <SaudiRiyal  className="h-4 w-4 mr-3" /> : "SAR"}{project.budget}</p>
          </div>
        </div>
        {project.deadline && (
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-muted-foreground mr-3" />
            <div>
              <p className="text-sm text-muted-foreground">{t("projects.deadline")}</p>
              <p className="font-medium">
                {formattedDeadline}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center">
          <User className="h-5 w-5 text-muted-foreground mr-3 " />
          <div>
            <p className="text-sm text-muted-foreground">{t("projects.client")}</p>
            <p className="font-medium">
              {isProjectOwner ? t("common.you") : (client?.fullName || client?.username || project.clientId)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">{t("projects.description")}</h3>
        <p className="whitespace-pre-wrap">{project.description}</p>
      </div>
    </CardContent>
  );
} 