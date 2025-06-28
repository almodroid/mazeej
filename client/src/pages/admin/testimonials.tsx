import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Star, Eye, MoveUp, MoveDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

interface Testimonial {
  id: number;
  content: string;
  contentAr?: string;
  authorName: string;
  authorNameAr?: string;
  authorTitle: string;
  authorTitleAr?: string;
  authorAvatar?: string;
  rating: number;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminTestimonialsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  
  const [newTestimonial, setNewTestimonial] = useState({
    content: "",
    contentAr: "",
    authorName: "",
    authorNameAr: "",
    authorTitle: "",
    authorTitleAr: "",
    authorAvatar: "",
    rating: 5,
    order: 0,
  });

  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  // Fetch testimonials
  const { data: testimonials = [], isLoading: isLoadingTestimonials } = useQuery<Testimonial[]>({
    queryKey: ["/api/admin/testimonials"],
  });

  const handleCreateTestimonial = async () => {
    try {
      await apiRequest("POST", "/api/admin/testimonials", newTestimonial);
      
      toast({
        title: t("common.success"),
        description: t("admin.testimonials.testimonialCreated"),
        variant: "default",
      });
      
      setIsCreateDialogOpen(false);
      setNewTestimonial({
        content: "",
        contentAr: "",
        authorName: "",
        authorNameAr: "",
        authorTitle: "",
        authorTitleAr: "",
        authorAvatar: "",
        rating: 5,
        order: 0,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    } catch (error) {
      console.error("Error creating testimonial:", error);
      toast({
        title: t("common.error"),
        description: t("admin.testimonials.createError"),
        variant: "destructive",
      });
    }
  };

  const handleEditTestimonial = async () => {
    if (!editingTestimonial) return;
    
    try {
      const updateData = {
        content: editingTestimonial.content,
        contentAr: editingTestimonial.contentAr || "",
        authorName: editingTestimonial.authorName,
        authorNameAr: editingTestimonial.authorNameAr || "",
        authorTitle: editingTestimonial.authorTitle,
        authorTitleAr: editingTestimonial.authorTitleAr || "",
        authorAvatar: editingTestimonial.authorAvatar || "",
        rating: editingTestimonial.rating,
        order: editingTestimonial.order,
      };
      
      await apiRequest("PUT", `/api/admin/testimonials/${editingTestimonial.id}`, updateData);
      
      toast({
        title: t("common.success"),
        description: t("admin.testimonials.testimonialUpdated"),
        variant: "default",
      });
      
      setIsEditDialogOpen(false);
      setEditingTestimonial(null);
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    } catch (error) {
      console.error("Error updating testimonial:", error);
      toast({
        title: t("common.error"),
        description: t("admin.testimonials.updateError"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestimonial = async (testimonialId: number) => {
    if (!window.confirm(t("admin.testimonials.deleteTestimonial"))) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/testimonials/${testimonialId}`);
      
      toast({
        title: t("common.success"),
        description: t("admin.testimonials.testimonialDeleted"),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast({
        title: t("common.error"),
        description: t("admin.testimonials.deleteError"),
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (testimonialId: number, isActive: boolean) => {
    try {
      await apiRequest("PATCH", `/api/admin/testimonials/${testimonialId}/toggle`, {
        isActive: !isActive
      });
      
      toast({
        title: t("common.success"),
        description: isActive ? t("admin.testimonials.testimonialDeactivated") : t("admin.testimonials.testimonialActivated"),
        variant: "default",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    } catch (error) {
      console.error("Error toggling testimonial status:", error);
      toast({
        title: t("common.error"),
        description: t("admin.testimonials.errorTogglingTestimonial"),
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (testimonialId: number, direction: 'up' | 'down') => {
    try {
      await apiRequest("PATCH", `/api/admin/testimonials/${testimonialId}/reorder`, {
        direction
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
    } catch (error) {
      console.error("Error reordering testimonial:", error);
      toast({
        title: t("common.error"),
        description: t("admin.testimonials.errorReorderingTestimonial"),
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };

  const sortedTestimonials = [...testimonials].sort((a, b) => a.order - b.order);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t("admin.testimonials.title")}</h1>
            <p className="text-muted-foreground">
              {t("admin.testimonials.description")}
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.testimonials.addTestimonial")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("admin.testimonials.addTestimonial")}</DialogTitle>
                <DialogDescription>
                  {t("admin.testimonials.addTestimonialDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">{t("admin.testimonials.content")} (EN)</Label>
                    <Textarea
                      id="content"
                      value={newTestimonial.content}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                      placeholder={t("admin.testimonials.contentPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contentAr">{t("admin.testimonials.content")} (AR)</Label>
                    <Textarea
                      id="contentAr"
                      value={newTestimonial.contentAr}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, contentAr: e.target.value })}
                      placeholder={t("admin.testimonials.contentPlaceholder")}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authorName">{t("admin.testimonials.authorName")} (EN)</Label>
                    <Input
                      id="authorName"
                      value={newTestimonial.authorName}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, authorName: e.target.value })}
                      placeholder={t("admin.testimonials.authorNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorNameAr">{t("admin.testimonials.authorName")} (AR)</Label>
                    <Input
                      id="authorNameAr"
                      value={newTestimonial.authorNameAr}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, authorNameAr: e.target.value })}
                      placeholder={t("admin.testimonials.authorNamePlaceholder")}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authorTitle">{t("admin.testimonials.authorTitle")} (EN)</Label>
                    <Input
                      id="authorTitle"
                      value={newTestimonial.authorTitle}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, authorTitle: e.target.value })}
                      placeholder={t("admin.testimonials.authorTitlePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorTitleAr">{t("admin.testimonials.authorTitle")} (AR)</Label>
                    <Input
                      id="authorTitleAr"
                      value={newTestimonial.authorTitleAr}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, authorTitleAr: e.target.value })}
                      placeholder={t("admin.testimonials.authorTitlePlaceholder")}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorAvatar">{t("admin.testimonials.authorAvatar")}</Label>
                  <Input
                    id="authorAvatar"
                    value={newTestimonial.authorAvatar}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, authorAvatar: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">{t("admin.testimonials.rating")}</Label>
                    <Select
                      value={newTestimonial.rating.toString()}
                      onValueChange={(value) => setNewTestimonial({ ...newTestimonial, rating: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <SelectItem key={rating} value={rating.toString()}>
                            {rating} {t("admin.testimonials.stars")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">{t("admin.testimonials.order")}</Label>
                    <Input
                      id="order"
                      type="number"
                      value={newTestimonial.order}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, order: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleCreateTestimonial}>
                    {t("common.create")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.testimonials.order")}</TableHead>
                <TableHead>{t("admin.testimonials.author")}</TableHead>
                <TableHead>{t("admin.testimonials.content")}</TableHead>
                <TableHead>{t("admin.testimonials.rating")}</TableHead>
                <TableHead>{t("admin.testimonials.status")}</TableHead>
                <TableHead>{t("admin.testimonials.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTestimonials ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {t("common.loading")}
                  </TableCell>
                </TableRow>
              ) : sortedTestimonials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {t("admin.testimonials.noTestimonials")}
                  </TableCell>
                </TableRow>
              ) : (
                sortedTestimonials.map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(testimonial.id, 'up')}
                          disabled={testimonial.order === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <span className="font-mono">{testimonial.order}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(testimonial.id, 'down')}
                          disabled={testimonial.order === sortedTestimonials.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {testimonial.authorAvatar && (
                          <img
                            src={testimonial.authorAvatar}
                            alt={testimonial.authorName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{testimonial.authorName}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.authorTitle}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-sm line-clamp-2">
                          {isRTL && testimonial.contentAr ? testimonial.contentAr : testimonial.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {renderStars(testimonial.rating)}
                        <span className="text-sm text-muted-foreground">({testimonial.rating})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={testimonial.isActive}
                          onCheckedChange={() => handleToggleActive(testimonial.id, testimonial.isActive)}
                        />
                        <Badge variant={testimonial.isActive ? "default" : "secondary"}>
                          {testimonial.isActive ? t("admin.testimonials.active") : t("admin.testimonials.inactive")}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTestimonial(testimonial);
                            setIsPreviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTestimonial(testimonial);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("admin.testimonials.editTestimonial")}</DialogTitle>
              <DialogDescription>
                {t("admin.testimonials.editTestimonialDescription")}
              </DialogDescription>
            </DialogHeader>
            {editingTestimonial && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-content">{t("admin.testimonials.content")} (EN)</Label>
                    <Textarea
                      id="edit-content"
                      value={editingTestimonial.content}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, content: e.target.value })}
                      placeholder={t("admin.testimonials.contentPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-contentAr">{t("admin.testimonials.content")} (AR)</Label>
                    <Textarea
                      id="edit-contentAr"
                      value={editingTestimonial.contentAr || ""}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, contentAr: e.target.value })}
                      placeholder={t("admin.testimonials.contentPlaceholder")}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-authorName">{t("admin.testimonials.authorName")} (EN)</Label>
                    <Input
                      id="edit-authorName"
                      value={editingTestimonial.authorName}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorName: e.target.value })}
                      placeholder={t("admin.testimonials.authorNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-authorNameAr">{t("admin.testimonials.authorName")} (AR)</Label>
                    <Input
                      id="edit-authorNameAr"
                      value={editingTestimonial.authorNameAr || ""}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorNameAr: e.target.value })}
                      placeholder={t("admin.testimonials.authorNamePlaceholder")}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-authorTitle">{t("admin.testimonials.authorTitle")} (EN)</Label>
                    <Input
                      id="edit-authorTitle"
                      value={editingTestimonial.authorTitle}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorTitle: e.target.value })}
                      placeholder={t("admin.testimonials.authorTitlePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-authorTitleAr">{t("admin.testimonials.authorTitle")} (AR)</Label>
                    <Input
                      id="edit-authorTitleAr"
                      value={editingTestimonial.authorTitleAr || ""}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorTitleAr: e.target.value })}
                      placeholder={t("admin.testimonials.authorTitlePlaceholder")}
                      dir="rtl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-authorAvatar">{t("admin.testimonials.authorAvatar")}</Label>
                  <Input
                    id="edit-authorAvatar"
                    value={editingTestimonial.authorAvatar || ""}
                    onChange={(e) => setEditingTestimonial({ ...editingTestimonial, authorAvatar: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-rating">{t("admin.testimonials.rating")}</Label>
                    <Select
                      value={editingTestimonial.rating.toString()}
                      onValueChange={(value) => setEditingTestimonial({ ...editingTestimonial, rating: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <SelectItem key={rating} value={rating.toString()}>
                            {rating} {t("admin.testimonials.stars")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-order">{t("admin.testimonials.order")}</Label>
                    <Input
                      id="edit-order"
                      type="number"
                      value={editingTestimonial.order}
                      onChange={(e) => setEditingTestimonial({ ...editingTestimonial, order: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleEditTestimonial}>
                    {t("common.update")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("admin.testimonials.testimonialPreview")}</DialogTitle>
            </DialogHeader>
            {selectedTestimonial && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex text-yellow-400 mb-4">
                    {renderStars(selectedTestimonial.rating)}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6">
                    {isRTL && selectedTestimonial.contentAr ? selectedTestimonial.contentAr : selectedTestimonial.content}
                  </p>
                  <div className="flex items-center">
                    {selectedTestimonial.authorAvatar && (
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mr-4">
                        <img 
                          src={selectedTestimonial.authorAvatar} 
                          alt={selectedTestimonial.authorName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {isRTL && selectedTestimonial.authorNameAr ? selectedTestimonial.authorNameAr : selectedTestimonial.authorName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isRTL && selectedTestimonial.authorTitleAr ? selectedTestimonial.authorTitleAr : selectedTestimonial.authorTitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 