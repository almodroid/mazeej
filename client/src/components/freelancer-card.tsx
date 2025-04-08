import { useTranslation } from "react-i18next";
import { Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";

type FreelancerCardProps = {
  freelancer: Omit<User, 'password'>;
};

export default function FreelancerCard({ freelancer }: FreelancerCardProps) {
  const { t } = useTranslation();
  
  // Mock rating data (would come from reviews in a real implementation)
  const rating = 4.8;
  const reviewCount = 56;
  
  // Mock skills (would come from user_skills table in a real implementation)
  const skills = ["تصميم هوية", "واجهات المستخدم", "مواقع إلكترونية"];
  
  // Format the hourly rate with the correct currency
  const hourlyRate = freelancer.hourlyRate || 40;

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full overflow-hidden bg-neutral-200">
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
          <div className="mr-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              {freelancer.fullName || freelancer.username}
            </h3>
            <p className="text-sm text-neutral-500">
              {freelancer.freelancerType === 'content_creator' 
                ? t('profile.contentCreator') 
                : t('profile.expert')}
            </p>
            <div className="flex items-center mt-1">
              <div className="flex text-accent">
                {renderStars(rating)}
              </div>
              <span className="text-sm text-neutral-500 mr-1">
                {rating} ({reviewCount} {t('freelancers.ratings')})
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-neutral-600 text-sm line-clamp-2">
            {freelancer.bio || "متخصص في مجاله مع خبرة متنوعة"}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              {skill}
            </span>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between items-center">
          <span className="font-semibold text-neutral-900">
            <span className="text-accent">${hourlyRate}</span> {t('common.perHour')}
          </span>
          <Button size="sm" className="bg-primary hover:bg-primary-dark text-white">
            {t('common.contactMe')}
          </Button>
        </div>
      </div>
    </div>
  );
}
