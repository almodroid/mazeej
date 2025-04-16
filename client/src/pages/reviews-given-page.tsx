import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Calendar } from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { reviewApi } from "@/lib/api";

interface Review {
  id: number;
  projectId: number;
  projectTitle: string;
  freelancerId: number;
  freelancerName: string;
  freelancerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewsGivenPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Define RTL state based on language
  const isRTL = i18n.language === "ar";

  // Fetch reviews from API
  const { data: reviews = [], isLoading, error } = useQuery<Review[]>({
    queryKey: ['/api/users/reviews/given'],
    queryFn: async () => {
      return await reviewApi.getReviewsGiven();
    }
  });

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  // Format date to display in a user-friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Render stars based on rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? "text-yellow-500 fill-yellow-500" : "text-neutral-300"}
      />
    ));
  };

  if (!user || user.role !== "client") {
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-neutral-500">{t("common.loading")}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{t("common.error")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className={`text-3xl font-cairo font-bold mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
        {t("reviews.givenReviews")}
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className={`flex flex-col md:flex-row items-center justify-between ${isRTL ? 'md:flex-row-reverse' : ''}`}>
          <div className={`flex items-center mb-4 md:mb-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`bg-primary/10 p-4 rounded-full ${isRTL ? 'ml-4' : 'mr-4'}`}>
              <Star size={24} className="text-primary" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h2 className="text-2xl font-bold">{averageRating.toFixed(1)}</h2>
              <p className="text-neutral-500">{t("reviews.averageRating")}</p>
            </div>
          </div>
          <div className={`flex ${isRTL ? 'space-x-reverse space-x-8' : 'space-x-8'} text-center`}>
            <div>
              <p className="text-2xl font-bold">{reviews.length}</p>
              <p className="text-neutral-500">{t("reviews.totalReviews")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reviews.filter(r => r.rating === 5).length}
              </p>
              <p className="text-neutral-500">{t("reviews.fiveStarReviews")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-neutral-500">{t("reviews.noReviews")}</p>
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Avatar className={`h-10 w-10 ${isRTL ? 'ml-3' : 'mr-3'}`}>
                        <AvatarImage src={review.freelancerAvatar} alt={review.freelancerName} />
                        <AvatarFallback>{review.freelancerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <h3 className="font-medium">{review.freelancerName}</h3>
                        <p className="text-sm text-neutral-500">{review.projectTitle}</p>
                      </div>
                    </div>
                    <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex ${isRTL ? 'ml-2' : 'mr-2'}`}>
                        {renderStars(review.rating)}
                      </div>
                      <div className={`flex items-center text-sm text-neutral-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Calendar size={14} className={isRTL ? 'ml-1' : 'mr-1'} />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>
                  <p className={`text-neutral-700 ${isRTL ? 'text-right' : 'text-left'}`}>{review.comment}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}