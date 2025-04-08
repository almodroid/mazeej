import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

export type TestimonialProps = {
  content: string;
  author: {
    name: string;
    title: string;
    avatar: string;
  };
  rating: number;
};

export default function TestimonialCard({ testimonial }: { testimonial: TestimonialProps }) {
  const { t } = useTranslation();
  
  // Function to render stars based on rating
  const renderStars = (rating: number) => {
    const stars = [];
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={`star-${i}`} 
          className={`h-4 w-4 ${i < rating ? 'fill-accent text-accent' : 'text-neutral-300'}`} 
        />
      );
    }
    
    return stars;
  };

  return (
    <div className="bg-neutral-50 rounded-lg p-6 shadow-sm">
      <div className="flex text-accent mb-4">
        {renderStars(testimonial.rating)}
      </div>
      <p className="text-neutral-700 mb-6 line-clamp-4">{testimonial.content}</p>
      <div className="flex items-center">
        <div className="h-12 w-12 rounded-full overflow-hidden bg-neutral-200">
          <img 
            src={testimonial.author.avatar} 
            alt={testimonial.author.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="mr-4">
          <h4 className="font-medium text-neutral-900">{testimonial.author.name}</h4>
          <p className="text-sm text-neutral-500">{testimonial.author.title}</p>
        </div>
      </div>
    </div>
  );
}
