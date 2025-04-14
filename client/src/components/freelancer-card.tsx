import { useTranslation } from "react-i18next";
import { 
  Star, 
  StarHalf, 
  MessageCircle, 
  Clock, 
  Award, 
  CheckCircle, 
  Briefcase,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Review, Skill } from "@shared/schema";
import { useState } from "react";
import { StartChatButton } from "./user-actions";
import { useQuery } from "@tanstack/react-query";
import HireMeForm from "./hire-me-form";

type FreelancerCardProps = {
  freelancer: Omit<User, 'password'>;
};

export default function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHireMeOpen, setIsHireMeOpen] = useState(false);
  
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

  return (
    <>
      <div className="bg-card rounded-xl border border-border overflow-hidden hover-lift transition-all duration-300 hover:border-primary/20 group">
        {/* Card header with background cover */}
        <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20 relative">
          {/* Favorite button */}
          <button 
            onClick={toggleFavorite}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-background z-10"
            aria-label={isFavorite ? t('common.removeFromFavorites') : t('common.addToFavorites')}
          >
            <Heart 
              className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} 
            />
          </button>
          
          {/* Online status indicator */}
          {Math.random() > 0.5 && (
            <div className="absolute top-2 left-2 flex items-center bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs z-10">
              <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
              {t('common.online')}
            </div>
          )}
        </div>
        
        {/* Profile content */}
        <div className="p-5 pt-14 relative">
          {/* Profile image overlapping the header */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-background shadow-md">
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
            <h3 className="text-lg font-cairo font-semibold text-foreground mb-1">
              {freelancer.fullName || freelancer.username}
            </h3>
            <p className="text-sm text-muted-foreground">
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
              <span className="text-sm text-muted-foreground ml-1">
                {rating.toFixed(1)} ({reviewCount})
              </span>
            </div>
          </div>
          
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div className="bg-muted/50 p-2 rounded-lg">
              <div className="text-primary font-cairo font-semibold">
                {projectsCompleted}+
              </div>
              <div className="text-xs text-muted-foreground">
                {t('profile.projects')}
              </div>
            </div>
            <div className="bg-muted/50 p-2 rounded-lg">
              <div className="text-accent font-cairo font-semibold">
                {getLevelLabel()}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('profile.level')}
              </div>
            </div>
            <div className="bg-muted/50 p-2 rounded-lg">
              <div className="text-primary font-cairo font-semibold">
                100%
              </div>
              <div className="text-xs text-muted-foreground">
                {t('profile.completion')}
              </div>
            </div>
          </div>
          
          {/* Bio */}
          <div className="mb-4">
            <p className="text-muted-foreground text-sm line-clamp-2 text-center">
              {freelancer.bio || t('profile.defaultBio')}
            </p>
          </div>
          
          {/* Skills */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {skills.map((skill) => (
              <Badge key={skill.id} variant="outline" className="bg-primary/5 hover:bg-primary/10">
                {skill.name}
              </Badge>
            ))}
          </div>
          
          {/* Price and actions */}
          <div className="pt-4 border-t border-border flex justify-between items-center">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-muted-foreground text-sm mr-1">
                {t('common.from')}
              </span>
              <span className="font-cairo font-bold text-foreground">
                ${hourlyRate}
                <span className="text-xs font-normal text-muted-foreground">/{t('common.hr')}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <StartChatButton
                userId={freelancer.id}
                username={freelancer.username}
                fullName={freelancer.fullName}
              />
              <Button 
                size="sm" 
                className="rounded-full"
                onClick={() => setIsHireMeOpen(true)}
              >
                {t('common.hireMe')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <HireMeForm
        freelancer={freelancer}
        isOpen={isHireMeOpen}
        onClose={() => setIsHireMeOpen(false)}
      />
    </>
  );
}
