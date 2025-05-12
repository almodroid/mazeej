import { useTranslation } from "react-i18next";
import { 
  Star, 
  StarHalf, 
  MessageCircle, 
  Clock, 
  Award, 
  CheckCircle, 
  Briefcase,
  Heart,
  ExternalLink,
  SaudiRiyal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Review, Skill } from "@shared/schema";
import { useState } from "react";
import { StartChatButton } from "./user-actions";
import { useQuery } from "@tanstack/react-query";
import HireMeForm from "./hire-me-form";
import ConsultationForm from "./consultation-form";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

type FreelancerCardProps = {
  freelancer: Omit<User, 'password'>;
};

export default function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isRTL = i18n.language === "ar";
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHireMeOpen, setIsHireMeOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  
  // Check if this freelancer is an expert
  const isExpert = freelancer.freelancerType === 'expert';
  
  // Check if current user is a beginner freelancer
  const isCurrentUserBeginnerFreelancer = 
    user?.role === 'freelancer' && user?.freelancerLevel === 'beginner';
  
  // Determine if consultation is available
  const canBookConsultation = isExpert && isCurrentUserBeginnerFreelancer;
  
  // Fetch freelancer's skills
  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: [`/api/users/${freelancer.id}/skills`],
  });

  // Fetch freelancer's reviews and calculate rating
  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: [`/api/users/${freelancer.id}/reviews`],
  });

  // Calculate average rating and review count
  const rating = reviews.length > 0 
    ? reviews.reduce((acc: number, review: Review) => acc + review.rating, 0) / reviews.length 
    : 0;
  const reviewCount = reviews.length;

  // Format the hourly rate with the correct currency
  const hourlyRate = freelancer.hourlyRate || 40;
  
  // Function to get level label
  const getLevelLabel = () => {
    switch (freelancer.freelancerLevel) {
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
  
  // Fetch completed projects count
  const { data: projectsCompleted = 0 } = useQuery<number>({
    queryKey: [`/api/users/${freelancer.id}/projects/completed`],
  });

  // Function to render stars based on rating
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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Handle consultation button click
  const handleConsultationClick = () => {
    setIsConsultationOpen(true);
  };

  // Handle hire me button click
  const handleHireMeClick = () => {
    setIsHireMeOpen(true);
  };

  return (
    <>
      <div className="bg-card dark:bg-gray-800 rounded-xl border border-border dark:border-gray-700 overflow-hidden hover-lift transition-all duration-300 hover:border-primary/20 group">
        {/* Card header with background cover */}
        <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20 dark:from-primary/30 dark:to-accent/30 relative">
          {/* Favorite button */}
          <button 
            onClick={toggleFavorite}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-background dark:hover:bg-gray-900 z-10"
            aria-label={isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
          >
            <Heart 
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
            />
          </button>
          
          {/* Online status indicator */}
          {Math.random() > 0.5 && (
            <div className="absolute top-2 left-2 flex items-center bg-background/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs z-10">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
              {t('common.online')}
            </div>
          )}
        </div>
        
        <div className="relative pt-12 pb-4 px-4">
          {/* Profile image overlapping the header */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-background dark:border-gray-800 shadow-md">
              {freelancer.profileImage ? (
                <img 
                  src={freelancer.profileImage} 
                  alt={freelancer.fullName || freelancer.username} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary text-white text-xl font-semibold">
                  {(freelancer.fullName || freelancer.username).charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          {/* User info */}
          <div className="text-center mb-4">
            <Link href={`/freelancers/${freelancer.id}`} className={cn("group/link inline-flex items-center gap-2 hover:text-primary transition-colors", "text-lg font-cairo font-semibold text-foreground dark:text-white mb-1")}>
              {freelancer.fullName || freelancer.username}
              <ExternalLink className="h-4 w-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </Link>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              {freelancer.freelancerType === 'content_creator' 
                ? t('profile.contentCreator') 
                : t('profile.expert')}
            </p>
            
            {/* Verification Badge */}
            {freelancer.isVerified && (
              <div className="flex items-center justify-center mt-1 gap-1 text-xs">
                <CheckCircle className="h-3 w-3 text-primary" />
                <span className="text-primary font-medium">{t('profile.verified')}</span>
              </div>
            )}
            
            {/* Rating */}
            <div className="flex items-center justify-center mt-2">
              <div className="flex">
                {renderStars(rating)}
              </div>
              <span className="text-sm text-muted-foreground dark:text-gray-400 ml-1">
                {rating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          </div>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-muted/50 dark:bg-gray-700/50 p-2 rounded-lg">
              <div className="text-primary font-cairo font-semibold">
                {projectsCompleted}+
              </div>
              <div className="text-xs text-muted-foreground dark:text-gray-400">
                {t('profile.projects')}
              </div>
            </div>
            <div className="bg-muted/50 dark:bg-gray-700/50 p-2 rounded-lg">
              <div className="text-accent font-cairo font-semibold">
                {getLevelLabel()}
              </div>
              <div className="text-xs text-muted-foreground dark:text-gray-400">
                {t('profile.level')}
              </div>
            </div>
            <div className="bg-muted/50 dark:bg-gray-700/50 p-2 rounded-lg">
              <div className="text-primary font-cairo font-semibold">
                100%
              </div>
              <div className="text-xs text-muted-foreground dark:text-gray-400">
                {t('profile.completion')}
              </div>
            </div>
          </div>
          
          {/* Bio */}
          <div className="mb-4">
            <p className="text-muted-foreground dark:text-gray-300 text-sm line-clamp-2 text-center">
              {freelancer.bio || t('profile.defaultBio')}
            </p>
          </div>
          
          {/* Skills */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {skills.map((skill) => (
              <Badge key={skill.id} variant="outline" className="bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20">
                {skill.name}
              </Badge>
            ))}
          </div>
          
          {/* Price and actions */}
          <div className="pt-4 border-t border-border dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-muted-foreground dark:text-gray-400 text-sm mr-1">
                {t('common.from')}
              </span>
              <span className="font-cairo font-bold text-foreground flex items-center gap-1 dark:text-white">
                <span className="flex items-center gap-1 flex-row-reverse">
                {isRTL ? <SaudiRiyal className="h-4 w-4" /> : "SAR"}
                
                {hourlyRate}
                </span>
                <span className="text-xs font-normal text-muted-foreground dark:text-gray-400">/ {t('common.hr')}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <StartChatButton
                userId={freelancer.id}
                username={freelancer.username}
                fullName={freelancer.fullName}
              />
              {canBookConsultation ? (
                <Button 
                  size="sm" 
                  className="rounded-full"
                  onClick={handleConsultationClick}
                >
                  {t('consultation.bookConsultationShort')}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  className="rounded-full"
                  onClick={handleHireMeClick}
                >
                  {t('common.hireMe')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
}
