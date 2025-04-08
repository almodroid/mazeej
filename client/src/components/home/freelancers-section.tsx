import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import FreelancerCard from "@/components/freelancer-card";
import { Link } from "wouter";

export default function FreelancersSection() {
  const { t } = useTranslation();
  
  // Fetch featured freelancers limited to 3
  const { data: freelancers = [], isLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ["/api/freelancers", { limit: 3 }],
  });

  return (
    <section className="py-12 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-cairo font-bold text-neutral-900">
            {t("freelancers.title")}
          </h2>
          <Link href="/browse-freelancers">
            <a className="text-primary hover:text-primary-dark font-medium">
              {t("freelancers.viewAll")}
            </a>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : freelancers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freelancers.map((freelancer) => (
              <FreelancerCard key={freelancer.id} freelancer={freelancer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {t("freelancers.noFreelancers")}
            </h3>
          </div>
        )}
      </div>
    </section>
  );
}
