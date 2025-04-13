import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { insertProposalSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Project } from "@shared/schema";
import DashboardLayout from "@/components/layouts/dashboard-layout";

const proposalFormSchema = insertProposalSchema.extend({}).omit({ projectId: true });

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

export default function SubmitProposalPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);

  // Extract projectId from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const projectIdIndex = pathParts.indexOf('projects') + 1;
    if (projectIdIndex > 0 && projectIdIndex < pathParts.length) {
      const id = pathParts[projectIdIndex];
      if (id && !isNaN(Number(id))) {
        setProjectId(Number(id));
      } else {
        // Invalid project ID, redirect to projects page
        navigate("/projects");
      }
    } else {
      navigate("/projects");
    }
  }, [navigate]);

  // Fetch project details
  const { data: project, isLoading: projectLoading, error: projectError } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("Project ID is required");
      const response = await apiRequest("GET", `/api/projects/${projectId}`);
      return response.json();
    },
    enabled: !!projectId,
  });

  // Check if the user already has a proposal for this project
  const { data: existingProposals, isLoading: proposalsLoading } = useQuery({
    queryKey: ["/api/proposals/my"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/proposals/my");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user && user.role === "freelancer",
  });

  // Check if there's an existing proposal for this project
  const existingProposal = existingProposals?.find((p: any) => p.projectId === projectId);

  // Redirect if user already has a proposal
  useEffect(() => {
    if (existingProposal && projectId) {
      toast({
        title: t("proposals.alreadyExists"),
        description: t("proposals.alreadyExistsDescription"),
        variant: "destructive"
      });
      navigate(`/projects/${projectId}`);
    }
  }, [existingProposal, projectId, navigate, toast, t]);

  // Form handling
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      description: "",
      price: 0,
      deliveryTime: 7,
    },
  });

  // Submit proposal mutation
  const submitProposalMutation = useMutation({
    mutationFn: async (formData: ProposalFormValues) => {
      if (!projectId) throw new Error("Project ID is required");
      setIsLoading(true);
      
      const response = await apiRequest("POST", `/api/projects/${projectId}/proposals`, formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("proposals.submittedSuccess"),
        description: t("proposals.submittedSuccessDescription"),
      });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("proposals.submissionError"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Form submission handler
  function onSubmit(data: ProposalFormValues) {
    submitProposalMutation.mutate(data);
  }

  if (!user || user.role !== 'freelancer') {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("common.unauthorized")}</h1>
          <p className="mb-6">{t("proposals.freelancerOnly")}</p>
          <Button onClick={() => navigate("/projects")}>
            {t("common.back")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (projectLoading) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4">{t("common.loading")}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (projectError || !project) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("common.error")}</h1>
          <p className="mb-6">{t("projects.notFound")}</p>
          <Button onClick={() => navigate("/projects")}>
            {t("common.back")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // If project is not open, don't allow proposals
  if (project.status !== 'open') {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("common.unavailable")}</h1>
          <p className="mb-6">{t("proposals.projectNotOpen")}</p>
          <Button onClick={() => navigate("/projects")}>
            {t("common.back")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">{t("proposals.submitProposal")}</h1>
      
      {/* Project Card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold">{project.title}</h2>
            <Badge>{project.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-2">{project.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">{t("projects.budget")}</span>
              <p className="font-semibold">${project.budget}</p>
            </div>
            {project.deadline && (
              <div>
                <span className="text-sm text-muted-foreground">{t("projects.deadline")}</span>
                <p className="font-semibold">
                  {new Date(project.deadline).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Proposal Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{t("proposals.yourProposal")}</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("proposals.description")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("proposals.descriptionPlaceholder")} 
                      className="min-h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("proposals.yourPrice")}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("proposals.deliveryTime")} ({t("proposals.days")})</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        placeholder="7"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-2 rtl:space-x-reverse">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(`/projects`)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || submitProposalMutation.isPending}
              >
                {isLoading || submitProposalMutation.isPending ? (
                  <span>{t("common.submitting")}...</span>
                ) : (
                  t("proposals.submit")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}