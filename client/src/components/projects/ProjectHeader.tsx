import { format } from "date-fns";
import { Edit, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ProjectHeaderProps {
  project: Project;
  hasSubmittedProposal: boolean;
  canSubmitProposal: boolean;
  canEditProject: boolean;
  isFreelancer: boolean;
  onNavigateToSubmitProposal: () => void;
  onEditProposal: () => void;
  onDeleteProposal: () => void; 
  onEditProject: () => void;
  onDeleteProject: () => void;
}

// Map status to badge color
export const getStatusBadge = (status: string | null) => {
  const { t, i18n } = useTranslation();
  const finalStatus = status ?? 'draft';

  switch (finalStatus) {
    case 'open':
      return <Badge className="bg-green-500">{t('project.statusOpen')}</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500">{t('project.statusInProgress')}</Badge>;
    case 'completed':
      return <Badge className="bg-purple-500">{t('project.statusCompleted')}</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500">{t('project.statusCancelled')}</Badge>;
    default:
      return <Badge>{t('project.statusPending')}</Badge>;
  }
};

export default function ProjectHeader({
  project,
  hasSubmittedProposal,
  canSubmitProposal,
  canEditProject,
  isFreelancer,
  onNavigateToSubmitProposal,
  onEditProposal,
  onDeleteProposal,
  onEditProject,
  onDeleteProject
}: ProjectHeaderProps) {
  const { t, i18n } = useTranslation();
  
  const formattedCreatedAt = project.createdAt 
    ? format(new Date(project.createdAt), "MMMM d, yyyy") 
    : "";
    
  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">{project.title}</CardTitle>
            <CardDescription className="mt-2">
              {getStatusBadge(project.status)} 
              <span className="mx-2">•</span>
              {t("projects.postedOn")} {formattedCreatedAt}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {canSubmitProposal ? (
              <Button onClick={onNavigateToSubmitProposal}>
                {t("proposals.submitProposal")}
              </Button>
            ) : isFreelancer && hasSubmittedProposal && (
              <>
                <div className="mr-2 flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-md">
                  <span className="mr-2">{t("proposals.alreadySubmitted")}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onEditProposal}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t("proposals.edit")}
                  </Button>
                  <Button variant="outline" className="text-red-500" onClick={onDeleteProposal}>
                    <Trash className="h-4 w-4 mr-2" />
                    {t("proposals.delete")}
                  </Button>
                </div>
              </>
            )}
            
            {/* Edit/Delete buttons for project owner if no proposals */}
            {canEditProject && (
              <>
                <Button 
                  variant="outline" 
                  size="icon"
                  title={t("common.edit")}
                  onClick={onEditProject}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="text-red-500"
                  title={t("common.delete")}
                  onClick={onDeleteProject}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
} 