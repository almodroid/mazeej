import { useTranslation } from "react-i18next";
import { Proposal } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { AlertCircle } from "lucide-react";

type RecentProposalsProps = {
  proposals: Proposal[];
};

export default function RecentProposals({ proposals }: RecentProposalsProps) {
  const { t, i18n } = useTranslation();

  // Format the date based on the current language
  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: i18n.language === 'ar' ? ar : enUS,
    });
  };

  // Map status to badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">قيد الانتظار</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">مقبول</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">مرفوض</Badge>;
      default:
        return null;
    }
  };

  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-medium text-neutral-700 mb-2">
            {t("dashboard.noPendingProposals")}
          </h3>
          <p className="text-neutral-500 text-center">
            {t("dashboard.noProposalsDescription")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-200">
          {proposals.map((proposal) => (
            <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
              <a className="block p-4 hover:bg-neutral-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-neutral-900">
                    {t("proposals.projectProposal")} #{proposal.projectId}
                  </h3>
                  {getStatusBadge(proposal.status)}
                </div>
                <p className="text-neutral-600 text-sm line-clamp-2 mb-2">
                  {proposal.description}
                </p>
                <div className="flex justify-between items-center text-sm text-neutral-500">
                  <span>${proposal.price}</span>
                  <span>{proposal.createdAt && formatDate(proposal.createdAt)}</span>
                </div>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
