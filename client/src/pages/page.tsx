import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

export default function PublicPage() {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const slug = params?.slug;

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/pages/${slug}`);
      return response.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col dark:bg-background">
        <Navbar />
        <main className="flex-grow flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col dark:bg-background">
        <Navbar />
        <main className="flex-grow container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-4">{t("common.pageNotFound")}</h1>
          <p>{t("common.pageNotFoundDescription")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const title = i18n.language === "ar" && page.titleAr ? page.titleAr : page.title;
  const content = i18n.language === "ar" && page.contentAr ? page.contentAr : page.content;
  const metaDescription = i18n.language === "ar" && page.metaDescriptionAr 
    ? page.metaDescriptionAr 
    : page.metaDescription;

  return (
    <div className="min-h-screen flex flex-col dark:bg-background">
      <Helmet>
        <title>{title}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
      </Helmet>
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">{title}</h1>
              {metaDescription && (
                <p className="text-lg text-muted-foreground">{metaDescription}</p>
              )}
            </div>
            <Separator className="mb-12" />
            <article className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-base prose-p:leading-7 prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-lg prose-img:shadow-md prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 