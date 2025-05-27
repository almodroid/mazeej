import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { Page } from "@shared/schema";
import TiptapEditor from "@/components/ui/tiptap-editor";
import AdminLayout from "@/components/layouts/admin-layout";
import { cn } from "@/lib/utils";
import ImageUpload from "@/components/ui/image-upload";

const pageSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  titleAr: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  contentAr: z.string().optional(),
  metaDescription: z.string().optional(),
  metaDescriptionAr: z.string().optional(),
  isPublished: z.boolean().default(false),
  thumbnail: z.string().optional(),
});

type PageFormValues = z.infer<typeof pageSchema>;

export default function AdminPages() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageToDeleteId, setPageToDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      slug: "",
      title: "",
      titleAr: "",
      content: "",
      contentAr: "",
      metaDescription: "",
      metaDescriptionAr: "",
      isPublished: false,
      thumbnail: "",
    },
  });

  const { data: pages, isLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/pages");
      return response.json();
    },
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: PageFormValues) => {
      const response = await apiRequest("POST", "/api/admin/pages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: t("common.success"),
        description: t("pages.createSuccess"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PageFormValues }) => {
      const response = await apiRequest("PUT", `/api/admin/pages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      setIsOpen(false);
      setEditingPage(null);
      form.reset();
      toast({
        title: t("common.success"),
        description: t("pages.updateSuccess"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePagePublishedMutation = useMutation({
    mutationFn: async ({ page, isPublished }: { page: Page; isPublished: boolean }) => {
      const { createdAt, updatedAt, ...restOfPage } = page;
      const updatedPageData = { ...restOfPage, isPublished };
      const response = await apiRequest("PUT", `/api/admin/pages/${page.id}`, updatedPageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({
        title: t("common.success"),
        description: t("pages.updateSuccess"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/pages/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast({
        title: t("common.success"),
        description: t("pages.deleteSuccess"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PageFormValues) => {
    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, data });
    } else {
      createPageMutation.mutate(data);
    }
  };

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    form.reset({
      slug: page.slug,
      title: page.title,
      titleAr: page.titleAr || "",
      content: page.content,
      contentAr: page.contentAr || "",
      metaDescription: page.metaDescription || "",
      metaDescriptionAr: page.metaDescriptionAr || "",
      isPublished: page.isPublished ?? false,
      thumbnail: page.thumbnail || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    setPageToDeleteId(id);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t("pages.title")}</h1>
          <Dialog open={isOpen} onOpenChange={(open) => { if (!open) setEditingPage(null); setIsOpen(open); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("pages.create")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader className={i18n.language === 'ar' ? 'text-right' : ''}>
                <DialogTitle className={i18n.language === 'ar' ? 'text-right' : ''}>
                  {editingPage ? t("pages.edit") : t("pages.create")}
                </DialogTitle>
                <DialogDescription className={i18n.language === 'ar' ? 'text-right' : ''}>
                  {editingPage ? t("pages.editDesc") : t("pages.createDesc")}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages.slug")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>{t("pages.published")}</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages.pageTitle")} (EN)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="titleAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages.pageTitle")} (AR)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages.content")} (EN)</FormLabel>
                          <FormControl>
                            <TiptapEditor
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              placeholder={t("pages.contentPlaceholder")}
                              rtl={false}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contentAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages.content")} (AR)</FormLabel>
                          <FormControl>
                            <TiptapEditor
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              placeholder={t("pages.contentPlaceholder")}
                              rtl={true}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="metaDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages.metaDescription")} (EN)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="metaDescriptionAr"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("pages.metaDescription")} (AR)</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("pages.thumbnail")}</FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsOpen(false);
                        setEditingPage(null);
                        form.reset();
                      }}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createPageMutation.isPending || updatePageMutation.isPending
                      }
                    >
                      {(createPageMutation.isPending ||
                        updatePageMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingPage ? t("common.update") : t("common.create")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("pages.slug")}</TableHead>
                <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("pages.title")}</TableHead>
                <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("pages.published")}</TableHead>
                <TableHead className={i18n.language === 'ar' ? 'text-right' : ''}>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages?.map((page: Page) => (
                <TableRow key={page.id}>
                  <TableCell className={i18n.language === 'ar' ? 'text-right' : ''}>{page.slug}</TableCell>
                  <TableCell className={i18n.language === 'ar' ? 'text-right' : ''}>
                    {i18n.language === "ar" && page.titleAr ? page.titleAr : page.title}
                  </TableCell>
                  <TableCell className={i18n.language === 'ar' ? 'text-right' : ''}>
                    <Switch
                      checked={page.isPublished ?? false}
                      onCheckedChange={(checked) => updatePagePublishedMutation.mutate({ page: page, isPublished: checked })}
                      disabled={updatePagePublishedMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className={i18n.language === 'ar' ? 'text-right' : ''}>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/${page.slug}`, '_blank')}
                        title={t("common.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(page)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(page.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!pageToDeleteId} onOpenChange={(open) => { if (!open) setPageToDeleteId(null); }}>
          <DialogContent>
            <DialogHeader className={isRTL ? 'text-right' : ''}>
              <DialogTitle className={isRTL ? 'text-right' : ''}>{t("common.confirmDelete")}</DialogTitle>
              <DialogDescription className={isRTL ? 'text-right' : ''}>
                {t("pages.deleteConfirm")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={cn(
              isRTL ? 'justify-start' : 'justify-end',
              isRTL && 'sm:space-x-reverse'
            )}>
              <Button
                variant="outline"
                onClick={() => setPageToDeleteId(null)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (pageToDeleteId !== null) {
                    deletePageMutation.mutate(pageToDeleteId);
                    setPageToDeleteId(null);
                  }
                }}
                disabled={deletePageMutation.isPending}
              >
                {deletePageMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 