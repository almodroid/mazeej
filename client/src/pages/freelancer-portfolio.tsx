import { useTranslation } from "react-i18next";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  StarHalf, 
  MessageCircle, 
  Clock, 
  Award, 
  CheckCircle, 
  Briefcase, 
  SaudiRiyal,
  MapPin,
  Calendar,
  Globe,
  ExternalLink,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { StartChatButton } from "@/components/user-actions";
import { User, Review, Skill, PortfolioProject } from "@shared/schema";
import { apiRequest } from "@/lib/api";
import { Loader2 } from "lucide-react";
import HireMeForm from "@/components/hire-me-form";
import ConsultationForm from "@/components/consultation-form";
import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useUserOnlineStatus } from "@/hooks/use-online-status";
import { FreelancerBadges } from "@/components/freelancer/freelancer-badges";
import { cn } from "@/lib/utils";

// Define a more complete Review interface
interface ReviewWithoutUser extends Review {
  reviewerId: number;
}

// Project statistics interface
interface ProjectStats {
  completed: number;
  inProgress: number;
  total: number;
  completionRate: number;
}

export default function FreelancerPortfolioPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isHireMeOpen, setIsHireMeOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const isRTL = i18n.language === "ar";

  // Use real online status
  const { isOnline, lastSeen } = useUserOnlineStatus(parseInt(id || "0"));

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  // Fetch freelancer data
  const { data: freelancer, isLoading: isLoadingFreelancer } = useQuery<Omit<User, 'password'>>({ 
    queryKey: [`/api/users/${id}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${id}`);
      if (!response.ok) throw new Error(t('common.errorFetchingData'));
      return response.json();
    },
  });

  // Fetch freelancer's skills
  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: [`/api/users/${id}/skills`],
    enabled: !!freelancer,
  });

  // Fetch freelancer's reviews
  const { data: reviewsData = [] } = useQuery<ReviewWithoutUser[]>({
    queryKey: [`/api/users/${id}/reviews`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${id}/reviews`);
      if (!response.ok) throw new Error(t('common.errorFetchingData'));
      return response.json();
    },
    enabled: !!freelancer,
  });

  // Fetch project statistics
  const { data: projectStats = { completed: 0, inProgress: 0, total: 0, completionRate: 0 } } = useQuery<ProjectStats>({
    queryKey: [`/api/users/${id}/projects/completed`],
    enabled: !!freelancer,
  });

  // Fetch all reviewer users in one query
  const reviewerIds = reviewsData.map(review => review.reviewerId);
  const { data: reviewerUsers = [] } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ['reviewers', reviewerIds],
    queryFn: async () => {
      if (reviewerIds.length === 0) return [];
      const promises = reviewerIds.map(reviewerId => 
        apiRequest("GET", `/api/users/${reviewerId}`)
          .then(res => res.ok ? res.json() : null)
      );
      return (await Promise.all(promises)).filter(Boolean);
    },
    enabled: reviewerIds.length > 0,
  });

  // Combine reviews with user data
  const reviews = reviewsData.map(review => {
    const reviewer = reviewerUsers.find(user => user.id === review.reviewerId);
    return { 
      ...review, 
      reviewer
    };
  });

  // Fetch freelancer's portfolio projects
  const { data: projects = [] } = useQuery<PortfolioProject[]>({
    queryKey: [`/api/portfolio/${id}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/portfolio/${id}`);
      if (!response.ok) throw new Error(t('common.errorFetchingData'));
      return response.json();
    },
    enabled: !!freelancer,
  });

  // Calculate average rating
  const rating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  // Check if current user is a beginner freelancer
  const isCurrentUserBeginnerFreelancer = 
    user?.role === 'freelancer' && user?.freelancerLevel === 'beginner';

  // Determine if consultation is available
  const canBookConsultation = freelancer?.freelancerType === 'expert' && isCurrentUserBeginnerFreelancer;

  // Function to render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-accent text-accent" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-accent text-accent" />);
    }
    
    return stars;
  };

  // Function to get level label
  const getLevelLabel = () => {
    switch (freelancer?.freelancerLevel) {
      case 'beginner':
        return t('profile.beginner');
      case 'intermediate':
        return t('profile.intermediate');
      case 'advanced':
        return t('profile.advanced');
      default:
        return t('profile.intermediate');
    }
  };

  // Function to format last seen
  const formatLastSeen = (lastSeen: Date | null) => {
    if (!lastSeen) return '';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('common.justNow');
    if (diffInMinutes < 60) return t('common.minutesAgo', { minutes: diffInMinutes });
    if (diffInMinutes < 1440) return t('common.hoursAgo', { hours: Math.floor(diffInMinutes / 60) });
    return t('common.daysAgo', { days: Math.floor(diffInMinutes / 1440) });
  };

  if (isLoadingFreelancer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container py-16 m-auto">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container py-16 m-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("common.notFound")}</h1>
          <p className="text-muted-foreground">{t("profile.freelancerNotFound")}</p>
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container py-16 m-auto">
      {/* Header Section */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-8">
          <div className="h-48 bg-gradient-to-r from-primary/20 to-accent/20 relative">
            {/* Online status indicator */}
            {isOnline && (
              <div className="absolute top-4 left-4 flex items-center bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm z-10">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                {t('common.online')}
              </div>
            )}
            {!isOnline && lastSeen && (
              <div className="absolute top-4 left-4 flex items-center bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm z-10">
                <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                {t('common.lastSeen')} {formatLastSeen(lastSeen)}
              </div>
            )}
          </div>
        <div className="relative px-6 pb-6">
          {/* Profile Image */}
          <div className="absolute -top-16">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
              {freelancer.profileImage ? (
                <img 
                  src={freelancer.profileImage} 
                  alt={freelancer.fullName || freelancer.username} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white text-3xl font-semibold">
                  {(freelancer.fullName || freelancer.username).charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="pt-20">
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-cairo font-bold">
                {freelancer.fullName || freelancer.username}
              </h1>
              {freelancer.isVerified && (
                <CheckCircle className="h-6 w-6 text-primary" />
              )}
                <FreelancerBadges userId={freelancer.id} className="ml-2" />
            </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <p className="text-lg text-muted-foreground">
              {freelancer.freelancerType === 'content_creator' 
                ? t('profile.contentCreator') 
                : t('profile.expert')}
            </p>
                <Badge variant="outline" className="text-sm">
                  {getLevelLabel()}
                </Badge>
                {freelancer.city && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{freelancer.city}</span>
                  </div>
                )}
              </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {renderStars(rating)}
                </div>
                <span className="text-sm text-muted-foreground">
                    {rating.toFixed(1)} ({reviews.length} {t('reviews.reviews')})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("profile.hourlyRate")}</span>
                  <span className="flex items-center gap-1 font-semibold">
                    {freelancer.hourlyRate || 40}
                    {isRTL ? <SaudiRiyal className="h-4 w-4" /> : " SAR"}
                    <span className="text-xs text-muted-foreground">/{t('common.hr')}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <StartChatButton
                userId={freelancer.id}
                username={freelancer.username}
                fullName={freelancer.fullName}
              />
              {canBookConsultation ? (
                <Button 
                  size="sm" 
                  className=""
                  onClick={() => setIsConsultationOpen(true)}
                >
                  {t('consultation.bookConsultation')}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="px-6 py-2 bg-primary text-white hover:bg-primary/90"
                  onClick={() => setIsHireMeOpen(true)}
                >
                  {t('common.hireMe')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.completed')}</p>
                  <p className="text-2xl font-bold">{projectStats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.inProgress')}</p>
                  <p className="text-2xl font-bold">{projectStats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.total')}</p>
                  <p className="text-2xl font-bold">{projectStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.completion')}</p>
                  <p className="text-2xl font-bold">{projectStats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* About Section */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t('profile.about')}
                </CardTitle>
              </CardHeader>
              <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {freelancer.bio || t('profile.defaultBio')}
              </p>
            </CardContent>
          </Card>

          {/* Skills Section */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {t('profile.skills')}
                </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill.id} variant="outline" className="bg-primary/5 hover:bg-primary/10">
                    {skill.name}
                  </Badge>
                ))}
                  {skills.length === 0 && (
                    <p className="text-muted-foreground text-sm">{t('profile.noSkills')}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t('profile.contactInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {freelancer.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{freelancer.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{t('profile.memberSince')} {freelancer.createdAt ? new Date(freelancer.createdAt).getFullYear() : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{t('profile.availability')}: {isOnline ? t('common.online') : t('common.offline')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Projects Section */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {t('portfolio.title')} ({projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
              {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('portfolio.noProjects')}</p>
                  </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className="group relative overflow-hidden rounded-lg border border-border hover:border-primary/20 transition-all duration-300">
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        {project.image ? (
                          <img
                            src={project.image}
                            alt={project.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-primary/5">
                            <Briefcase className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                          <h3 className="font-semibold mb-2">{project.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {project.description}
                        </p>
                          <div className="flex items-center justify-between">
                            {project.date && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(project.date).toLocaleDateString()}
                              </span>
                            )}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            {t('portfolio.viewProject')}
                                <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                          </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                {t('reviews.title')} ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
              {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('reviews.noReviews')}</p>
                  </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.reviewer?.profileImage || undefined} />
                          <AvatarFallback>{review.reviewer?.fullName?.charAt(0) || review.reviewer?.username?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{review.reviewer?.fullName || review.reviewer?.username || t('common.anonymous')}</span>
                            <div className="flex">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                              ))}
                            </div>
                          </div>
                            <p className="text-muted-foreground mb-2">{review.comment}</p>
                            <span className="text-xs text-muted-foreground">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forms */}
      {canBookConsultation ? (
        <ConsultationForm
          freelancer={freelancer}
          isOpen={isConsultationOpen}
          onClose={() => setIsConsultationOpen(false)}
        />
      ) : (
        <HireMeForm
          freelancer={freelancer}
          isOpen={isHireMeOpen}
          onClose={() => setIsHireMeOpen(false)}
        />
      )}
      </main>
      <Footer />
    </div>
  );
}