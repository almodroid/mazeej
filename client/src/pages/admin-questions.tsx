import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/admin-layout";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  categoryId: number;
  skillId: number;
  question: string;
  questionAr: string; // Arabic translation
  options: string[];
  optionsAr: string[]; // Arabic translations for options
  correctAnswer: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface Category {
  id: number;
  name: string;
}

interface Skill {
  id: number;
  name: string;
  categoryId: number;
}

export default function AdminQuestionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);

  // Fetch questions
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery({
    queryKey: ["/api/admin/questions", selectedCategory, selectedSkill],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('categoryId', selectedCategory.toString());
      }
      if (selectedSkill) {
        params.append('skillId', selectedSkill.toString());
      }
      const response = await apiRequest("GET", `/api/admin/questions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/categories");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Fetch skills
  const { data: skills = [] } = useQuery({
    queryKey: ["/api/skills"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/skills");
      return response.json();
    },
    enabled: !!user && user.role === "admin"
  });

  // Add question mutation
  const addQuestionMutation = useMutation({
    mutationFn: async (newQuestion: Omit<Question, 'id'>) => {
      const response = await apiRequest("POST", "/api/admin/questions", newQuestion);
      if (!response.ok) throw new Error("Failed to add question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      setIsAddingQuestion(false);
      toast({
        title: t("common.success"),
        description: t("questions.added"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("questions.errorAdding"),
        variant: "destructive",
      });
    },
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async (question: Question) => {
      const response = await apiRequest("PUT", `/api/admin/questions/${question.id}`, question);
      if (!response.ok) throw new Error("Failed to update question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      setEditingQuestion(null);
      toast({
        title: t("common.success"),
        description: t("questions.updated"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("questions.errorUpdating"),
        variant: "destructive",
      });
    },
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/questions/${questionId}`);
      if (!response.ok) throw new Error("Failed to delete question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/questions"] });
      toast({
        title: t("common.success"),
        description: t("questions.deleted"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("questions.errorDeleting"),
        variant: "destructive",
      });
    },
  });

  const handleAddQuestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newQuestion = {
      categoryId: parseInt(formData.get('categoryId') as string),
      skillId: parseInt(formData.get('skillId') as string),
      question: formData.get('question') as string,
      questionAr: formData.get('questionAr') as string,
      options: [
        formData.get('option1') as string,
        formData.get('option2') as string,
        formData.get('option3') as string,
        formData.get('option4') as string,
      ],
      optionsAr: [
        formData.get('option1Ar') as string,
        formData.get('option2Ar') as string,
        formData.get('option3Ar') as string,
        formData.get('option4Ar') as string,
      ],
      correctAnswer: parseInt(formData.get('correctAnswer') as string),
      difficulty: formData.get('difficulty') as 'beginner' | 'intermediate' | 'advanced',
    };
    addQuestionMutation.mutate(newQuestion);
  };

  const handleUpdateQuestion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const formData = new FormData(e.currentTarget);
    const updatedQuestion = {
      ...editingQuestion,
      categoryId: parseInt(formData.get('categoryId') as string),
      skillId: parseInt(formData.get('skillId') as string),
      question: formData.get('question') as string,
      questionAr: formData.get('questionAr') as string,
      options: [
        formData.get('option1') as string,
        formData.get('option2') as string,
        formData.get('option3') as string,
        formData.get('option4') as string,
      ],
      optionsAr: [
        formData.get('option1Ar') as string,
        formData.get('option2Ar') as string,
        formData.get('option3Ar') as string,
        formData.get('option4Ar') as string,
      ],
      correctAnswer: parseInt(formData.get('correctAnswer') as string),
      difficulty: formData.get('difficulty') as 'beginner' | 'intermediate' | 'advanced',
    };
    updateQuestionMutation.mutate(updatedQuestion);
  };

  const handleDeleteQuestion = (questionId: number) => {
    if (window.confirm(t("questions.confirmDelete"))) {
      deleteQuestionMutation.mutate(questionId);
    }
  };

  const filteredQuestions = questions.filter((q: Question) => {
    if (selectedCategory && q.categoryId !== selectedCategory) return false;
    if (selectedSkill && q.skillId !== selectedSkill) return false;
    return true;
  });

  const filteredSkills = skills.filter((s: Skill) => 
    !selectedCategory || s.categoryId === selectedCategory
  );

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("questions.title")}</h1>
            <p className="text-muted-foreground">{t("questions.description")}</p>
          </div>
          <Dialog open={isAddingQuestion} onOpenChange={setIsAddingQuestion}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                {t("questions.add")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("questions.add")}</DialogTitle>
                <DialogDescription>{t("questions.addDescription")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">{t("questions.category")}</Label>
                    <Select name="categoryId" required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("questions.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skillId">{t("questions.skill")}</Label>
                    <Select name="skillId" required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("questions.selectSkill")} />
                      </SelectTrigger>
                      <SelectContent>
                        {skills.map((skill: Skill) => (
                          <SelectItem key={skill.id} value={skill.id.toString()}>
                            {skill.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question">{t("questions.question")} (English)</Label>
                  <Textarea name="question" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionAr">{t("questions.question")} (العربية)</Label>
                  <Textarea name="questionAr" required dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{t("questions.options")} (English)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input name="option1" placeholder={t("questions.option1")} required />
                    <Input name="option2" placeholder={t("questions.option2")} required />
                    <Input name="option3" placeholder={t("questions.option3")} required />
                    <Input name="option4" placeholder={t("questions.option4")} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("questions.options")} (العربية)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input name="option1Ar" placeholder={t("questions.option1")} required dir="rtl" />
                    <Input name="option2Ar" placeholder={t("questions.option2")} required dir="rtl" />
                    <Input name="option3Ar" placeholder={t("questions.option3")} required dir="rtl" />
                    <Input name="option4Ar" placeholder={t("questions.option4")} required dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer">{t("questions.correctAnswer")}</Label>
                    <Select name="correctAnswer" required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("questions.selectCorrect")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">{t("questions.option1")}</SelectItem>
                        <SelectItem value="1">{t("questions.option2")}</SelectItem>
                        <SelectItem value="2">{t("questions.option3")}</SelectItem>
                        <SelectItem value="3">{t("questions.option4")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">{t("questions.difficulty")}</Label>
                    <Select name="difficulty" required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("questions.selectDifficulty")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{t("questions.beginner")}</SelectItem>
                        <SelectItem value="intermediate">{t("questions.intermediate")}</SelectItem>
                        <SelectItem value="advanced">{t("questions.advanced")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addQuestionMutation.isPending}>
                    {addQuestionMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {t("questions.add")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("questions.filters")}</CardTitle>
            <CardDescription>{t("questions.filtersDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("questions.category")}</Label>
                <Select
                  value={selectedCategory?.toString() || "all"}
                  onValueChange={(value) => {
                    setSelectedCategory(value === "all" ? null : parseInt(value));
                    setSelectedSkill(null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("questions.allCategories")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("questions.allCategories")}</SelectItem>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("questions.skill")}</Label>
                <Select
                  value={selectedSkill?.toString() || "all"}
                  onValueChange={(value) => setSelectedSkill(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("questions.allSkills")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("questions.allSkills")}</SelectItem>
                    {filteredSkills.map((skill: Skill) => (
                      <SelectItem key={skill.id} value={skill.id.toString()}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="p-0">
            {isLoadingQuestions ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("questions.question")} (English)</TableHead>
                    <TableHead>{t("questions.question")} (العربية)</TableHead>
                    <TableHead>{t("questions.category")}</TableHead>
                    <TableHead>{t("questions.skill")}</TableHead>
                    <TableHead>{t("questions.difficulty")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question: Question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-md truncate">{question.question}</TableCell>
                      <TableCell className="max-w-md truncate" dir="rtl">{question.questionAr}</TableCell>
                      <TableCell>
                        {categories.find((c: Category) => c.id === question.categoryId)?.name}
                      </TableCell>
                      <TableCell>
                        {skills.find((s: Skill) => s.id === question.skillId)?.name}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          question.difficulty === 'beginner' && "bg-green-100 text-green-700",
                          question.difficulty === 'intermediate' && "bg-yellow-100 text-yellow-700",
                          question.difficulty === 'advanced' && "bg-red-100 text-red-700"
                        )}>
                          {t(`questions.${question.difficulty}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingQuestion(question)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("questions.edit")}</DialogTitle>
              <DialogDescription>{t("questions.editDescription")}</DialogDescription>
            </DialogHeader>
            {editingQuestion && (
              <form onSubmit={handleUpdateQuestion} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">{t("questions.category")}</Label>
                    <Select name="categoryId" defaultValue={editingQuestion.categoryId.toString()} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("questions.selectCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: Category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skillId">{t("questions.skill")}</Label>
                    <Select name="skillId" defaultValue={editingQuestion.skillId.toString()} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("questions.selectSkill")} />
                      </SelectTrigger>
                      <SelectContent>
                        {skills.map((skill: Skill) => (
                          <SelectItem key={skill.id} value={skill.id.toString()}>
                            {skill.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question">{t("questions.question")} (English)</Label>
                  <Textarea name="question" defaultValue={editingQuestion.question} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="questionAr">{t("questions.question")} (العربية)</Label>
                  <Textarea name="questionAr" defaultValue={editingQuestion.questionAr} required dir="rtl" />
                </div>
                <div className="space-y-2">
                  <Label>{t("questions.options")} (English)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input name="option1" defaultValue={editingQuestion.options[0]} required />
                    <Input name="option2" defaultValue={editingQuestion.options[1]} required />
                    <Input name="option3" defaultValue={editingQuestion.options[2]} required />
                    <Input name="option4" defaultValue={editingQuestion.options[3]} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("questions.options")} (العربية)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input name="option1Ar" defaultValue={editingQuestion.optionsAr[0]} required dir="rtl" />
                    <Input name="option2Ar" defaultValue={editingQuestion.optionsAr[1]} required dir="rtl" />
                    <Input name="option3Ar" defaultValue={editingQuestion.optionsAr[2]} required dir="rtl" />
                    <Input name="option4Ar" defaultValue={editingQuestion.optionsAr[3]} required dir="rtl" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer">{t("questions.correctAnswer")}</Label>
                    <Select name="correctAnswer" defaultValue={editingQuestion.correctAnswer.toString()} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("questions.selectCorrect")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">{t("questions.option1")}</SelectItem>
                        <SelectItem value="1">{t("questions.option2")}</SelectItem>
                        <SelectItem value="2">{t("questions.option3")}</SelectItem>
                        <SelectItem value="3">{t("questions.option4")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">{t("questions.difficulty")}</Label>
                    <Select name="difficulty" defaultValue={editingQuestion.difficulty} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("questions.selectDifficulty")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">{t("questions.beginner")}</SelectItem>
                        <SelectItem value="intermediate">{t("questions.intermediate")}</SelectItem>
                        <SelectItem value="advanced">{t("questions.advanced")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={updateQuestionMutation.isPending}>
                    {updateQuestionMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {t("questions.save")}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 