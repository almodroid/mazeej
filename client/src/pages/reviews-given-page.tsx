import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import ChatWidget from "@/components/chat/chat-widget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Calendar, Edit } from "lucide-react";
import { Link } from "wouter";

interface Review {
  id: string;
  projectId: string;
  projectTitle: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ReviewsGivenPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Mock reviews data (would come from API in real implementation)
  const reviews: Review[] = [
    {
      id: "1",
      projectId: "p1",
      projectTitle: "E-commerce Website Development",
      freelancerId: "f1",
      freelancerName: "Mohammed Ali",
      rating: 5,
      comment: "Excellent work! Mohammed delivered the project on time and exceeded our expectations. Very professional and responsive throughout the project.",
      createdAt: "2023-06-15"
    },
    {
      id: "2",
      projectId: "p2",
      projectTitle: "Mobile App UI Design",
      freelancerId: "f2",
      freelancerName: "Fatima Hassan",
      rating: 4,
      comment: "Great design skills and attention to detail. Would recommend for UI/UX projects.",
      createdAt: "2023-06-01"
    },
    {
      id: "3",
      projectId: "p3",
      projectTitle: "CRM System Integration",
      freelancerId: "f3",
      freelancerName: "Khalid Ibrahim",
      rating: 5,
      comment: "Outstanding technical knowledge and problem-solving skills. Completed a complex integration project flawlessly.",
      createdAt: "2023-05-15"
    },
  ];

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex">
        <DashboardSidebar />
        <main className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-cairo font-bold mb-6">
              {t("reviews.givenReviews")}
            </h1>

            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <p className="text-neutral-500">{t("reviews.noReviews")}</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={review.freelancerAvatar} alt={review.freelancerName} />
                              <AvatarFallback>{review.freelancerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{review.freelancerName}</h3>
                              <p className="text-sm text-neutral-500">{review.projectTitle}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex mr-2">
                              {renderStars(review.rating)}
                            </div>
                            <div className="flex items-center text-sm text-neutral-500 mr-4">
                              <Calendar size={14} className="mr-1" />
                              {formatDate(review.createdAt)}
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/reviews/edit/${review.id}`}>
                                <Edit size={14} className="mr-1" />
                                {t("common.edit")}
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <p className="text-neutral-700">{review.comment}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} />
    </div>
  );
}