import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, Settings, Brain, FileText, Users, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/layouts/admin-layout';
import { cn } from '@/lib/utils';

interface ExerciseCategory {
  id: number;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
}

interface Exercise {
  id: number;
  title: string;
  titleAr: string;
  description: string;
  categoryId: number;
  skillId: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  budget: number;
  aiGenerated: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  category: {
    id: number;
    name: string;
    nameAr: string;
  };
  skill: {
    id: number;
    name: string;
    nameAr: string;
  };
}

interface ExerciseSubmission {
  id: number;
  status: 'in_progress' | 'submitted' | 'approved' | 'rejected';
  submissionText: string;
  submissionFiles: string[];
  aiFeedback: string;
  aiScore: number;
  adminFeedback: string;
  adminScore: number;
  startedAt: string;
  submittedAt: string;
  reviewedAt: string;
  exercise: {
    id: number;
    title: string;
    titleAr: string;
    difficulty: string;
  };
  freelancer: {
    id: number;
    fullName: string;
    username: string;
    profileImage: string;
  };
}

interface AISettings {
  id: number;
  apiKey: string;
  apiProvider: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  isActive: boolean;
}

export default function AdminExercisesPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [submissions, setSubmissions] = useState<ExerciseSubmission[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ExerciseSubmission | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [showAISettingsDialog, setShowAISettingsDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    icon: '',
    color: '#3B82F6',
    order: 0,
  });

  const [exerciseForm, setExerciseForm] = useState({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    categoryId: '',
    skillId: '',
    difficulty: 'beginner' as const,
    estimatedHours: 2,
    budget: 50,
    requirements: [''],
    requirementsAr: [''],
    deliverables: [''],
    deliverablesAr: [''],
    order: 0,
  });

  const [generateForm, setGenerateForm] = useState({
    skillId: '',
    categoryId: '',
    difficulty: 'beginner' as const,
    freelancerLevel: 'beginner' as const,
    count: 1,
  });

  const [reviewForm, setReviewForm] = useState({
    adminFeedback: '',
    adminScore: 0,
    status: 'approved' as 'in_progress' | 'submitted' | 'approved' | 'rejected',
  });

  const [aiSettingsForm, setAiSettingsForm] = useState({
    apiKey: '',
    apiProvider: 'openai',
    modelName: 'gpt-4',
    maxTokens: 2000,
    temperature: 0.7,
    systemPrompt: 'You are an expert at creating realistic freelance project exercises for skill development.',
    isActive: true,
  });

  // Helper function to get suggested models based on provider
  const getSuggestedModels = (provider: string) => {
    switch (provider) {
      case 'openai':
        return [
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        ];
      case 'anthropic':
        return [
          { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
          { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
          { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
        ];
      case 'openrouter':
        return [
          // Free models (top 5)
          { value: 'mistralai/mistral-7b-instruct', label: 'Mistral 7B Instruct (Free)' },
          { value: 'meta-llama/llama-2-7b-chat', label: 'Llama 2 7B Chat (Free)' },
          { value: 'google/gemini-flash-1.5', label: 'Google Gemini Flash 1.5 (Free)' },
          { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (Free)' },
          { value: 'microsoft/phi-3-mini-4k-instruct', label: 'Microsoft Phi-3 Mini (Free)' },
          // Paid models
          { value: 'openai/gpt-4', label: 'OpenAI GPT-4' },
          { value: 'openai/gpt-4-turbo', label: 'OpenAI GPT-4 Turbo' },
          { value: 'anthropic/claude-3-opus', label: 'Anthropic Claude 3 Opus' },
          { value: 'anthropic/claude-3-sonnet', label: 'Anthropic Claude 3 Sonnet' },
          { value: 'google/gemini-pro', label: 'Google Gemini Pro' },
          { value: 'meta-llama/llama-2-70b-chat', label: 'Meta Llama 2 70B' },
          { value: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
          { value: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesRes, exercisesRes, submissionsRes, aiSettingsRes, skillsRes] = await Promise.all([
        fetch('/api/exercises/admin/categories'),
        fetch('/api/exercises/admin/exercises'),
        fetch('/api/exercises/admin/submissions'),
        fetch('/api/exercises/admin/ai-settings'),
        fetch('/api/skills'),
      ]);

      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (exercisesRes.ok) {
        const data = await exercisesRes.json();
        setExercises(data.exercises || []);
      }
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(data.submissions || []);
      }
      if (aiSettingsRes.ok) setAiSettings(await aiSettingsRes.json());
      if (skillsRes.ok) setSkills(await skillsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('admin.exercises.error'),
        description: t('admin.exercises.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const response = await fetch('/api/exercises/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });

      if (response.ok) {
        toast({
          title: t('admin.exercises.success'),
          description: t('admin.exercises.categoryCreated'),
        });
        setShowCategoryDialog(false);
        setCategoryForm({
          name: '',
          nameAr: '',
          description: '',
          descriptionAr: '',
          icon: '',
          color: '#3B82F6',
          order: 0,
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: t('admin.exercises.error'),
        description: t('admin.exercises.createError'),
        variant: 'destructive',
      });
    }
  };

  const handleCreateExercise = async () => {
    try {
      const response = await fetch('/api/exercises/admin/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...exerciseForm,
          categoryId: parseInt(exerciseForm.categoryId),
          skillId: parseInt(exerciseForm.skillId),
        }),
      });

      if (response.ok) {
        toast({
          title: t('admin.exercises.success'),
          description: t('admin.exercises.exerciseCreated'),
        });
        setShowExerciseDialog(false);
        setExerciseForm({
          title: '',
          titleAr: '',
          description: '',
          descriptionAr: '',
          categoryId: '',
          skillId: '',
          difficulty: 'beginner',
          estimatedHours: 2,
          budget: 50,
          requirements: [''],
          requirementsAr: [''],
          deliverables: [''],
          deliverablesAr: [''],
          order: 0,
        });
        fetchData();
      }
    } catch (error) {
      toast({
        title: t('admin.exercises.error'),
        description: t('admin.exercises.createError'),
        variant: 'destructive',
      });
    }
  };

  const handleGenerateExercises = async () => {
    try {
      const response = await fetch('/api/exercises/admin/exercises/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generateForm,
          skillId: parseInt(generateForm.skillId),
          categoryId: parseInt(generateForm.categoryId),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: t('admin.exercises.success'),
          description: t('admin.exercises.exercisesGenerated', { count: data.exercises.length }),
        });
        setShowGenerateDialog(false);
        fetchData();
      }
    } catch (error) {
      toast({
        title: t('admin.exercises.error'),
        description: t('admin.exercises.generateError'),
        variant: 'destructive',
      });
    }
  };

  const handleUpdateAISettings = async () => {
    try {
      const response = await fetch('/api/exercises/admin/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiSettingsForm),
      });

      if (response.ok) {
        toast({
          title: t('admin.exercises.success'),
          description: t('admin.exercises.aiSettingsUpdated'),
        });
        setShowAISettingsDialog(false);
        fetchData();
      }
    } catch (error) {
      toast({
        title: t('admin.exercises.error'),
        description: t('admin.exercises.updateError'),
        variant: 'destructive',
      });
    }
  };

  const handleOpenAISettings = () => {
    if (aiSettings) {
      setAiSettingsForm({
        apiKey: aiSettings.apiKey || '',
        apiProvider: aiSettings.apiProvider || 'openai',
        modelName: aiSettings.modelName || 'gpt-4',
        maxTokens: aiSettings.maxTokens || 2000,
        temperature: aiSettings.temperature || 0.7,
        systemPrompt: aiSettings.systemPrompt || 'You are an expert at creating realistic freelance project exercises for skill development.',
        isActive: aiSettings.isActive !== undefined ? aiSettings.isActive : true,
      });
    }
    setShowAISettingsDialog(true);
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(`/api/exercises/admin/submissions/${selectedSubmission.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });

      if (response.ok) {
        toast({
          title: t('admin.exercises.success'),
          description: t('admin.exercises.submissionReviewed'),
        });
        setShowReviewDialog(false);
        setSelectedSubmission(null);
        fetchData();
      }
    } catch (error) {
      toast({
        title: t('admin.exercises.error'),
        description: t('admin.exercises.reviewError'),
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_progress: { color: 'bg-yellow-100 text-yellow-800', text: t('admin.exercises.inProgress') },
      submitted: { color: 'bg-blue-100 text-blue-800', text: t('admin.exercises.submitted') },
      approved: { color: 'bg-green-100 text-green-800', text: t('admin.exercises.approved') },
      rejected: { color: 'bg-red-100 text-red-800', text: t('admin.exercises.rejected') },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig = {
      beginner: { color: 'bg-green-100 text-green-800', text: t('admin.exercises.beginner') },
      intermediate: { color: 'bg-yellow-100 text-yellow-800', text: t('admin.exercises.intermediate') },
      advanced: { color: 'bg-red-100 text-red-800', text: t('admin.exercises.advanced') },
    };
    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig];
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-8 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className={cn(
          "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
        )}>
          <div>
            <h1 className="text-3xl font-cairo font-bold mb-2 text-foreground">
              {t('admin.exercises.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('admin.exercises.description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleOpenAISettings} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              {t('admin.exercises.aiSettings')}
            </Button>
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Brain className="h-4 w-4 mr-2" />
              {t('admin.exercises.generateAI')}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="categories">
              <FileText className="h-4 w-4 mr-2" />
              {t('admin.exercises.categories')}
            </TabsTrigger>
            <TabsTrigger value="exercises">
              <Trophy className="h-4 w-4 mr-2" />
              {t('admin.exercises.exercises')}
            </TabsTrigger>
            <TabsTrigger value="submissions">
              <Users className="h-4 w-4 mr-2" />
              {t('admin.exercises.submissions')}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <Trophy className="h-4 w-4 mr-2" />
              {t('admin.exercises.analytics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">{t('admin.exercises.categories')}</CardTitle>
                  <Button onClick={() => setShowCategoryDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.exercises.addCategory')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.exercises.name')}</TableHead>
                        <TableHead>{t('admin.exercises.description')}</TableHead>
                        <TableHead>{t('admin.exercises.order')}</TableHead>
                        <TableHead>{t('admin.exercises.status')}</TableHead>
                        <TableHead className="text-right">{t('admin.exercises.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </div>
                          </TableCell>
                          <TableCell>{category.description}</TableCell>
                          <TableCell>{category.order}</TableCell>
                          <TableCell>
                            <Badge variant={category.isActive ? 'default' : 'secondary'}>
                              {category.isActive ? t('admin.exercises.active') : t('admin.exercises.inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">{t('admin.exercises.exercises')}</CardTitle>
                  <Button onClick={() => setShowExerciseDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('admin.exercises.addExercise')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.exercises.title')}</TableHead>
                        <TableHead>{t('admin.exercises.category')}</TableHead>
                        <TableHead>{t('admin.exercises.skill')}</TableHead>
                        <TableHead>{t('admin.exercises.difficulty')}</TableHead>
                        <TableHead>{t('admin.exercises.budget')}</TableHead>
                        <TableHead>{t('admin.exercises.status')}</TableHead>
                        <TableHead className="text-right">{t('admin.exercises.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exercises.map((exercise) => (
                        <TableRow key={exercise.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{exercise.title}</div>
                              <div className="text-sm text-muted-foreground">{exercise.titleAr}</div>
                            </div>
                          </TableCell>
                          <TableCell>{exercise.category.name}</TableCell>
                          <TableCell>{exercise.skill.name}</TableCell>
                          <TableCell>{getDifficultyBadge(exercise.difficulty)}</TableCell>
                          <TableCell>${exercise.budget}</TableCell>
                          <TableCell>
                            <Badge variant={exercise.isActive ? 'default' : 'secondary'}>
                              {exercise.isActive ? t('admin.exercises.active') : t('admin.exercises.inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">{t('admin.exercises.submissions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.exercises.freelancer')}</TableHead>
                        <TableHead>{t('admin.exercises.exercise')}</TableHead>
                        <TableHead>{t('admin.exercises.status')}</TableHead>
                        <TableHead>{t('admin.exercises.submittedAt')}</TableHead>
                        <TableHead>{t('admin.exercises.score')}</TableHead>
                        <TableHead className="text-right">{t('admin.exercises.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                {submission.freelancer.profileImage ? (
                                  <img
                                    src={submission.freelancer.profileImage}
                                    alt={submission.freelancer.fullName}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <span className="text-sm font-medium">
                                    {submission.freelancer.fullName.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{submission.freelancer.fullName}</div>
                                <div className="text-sm text-muted-foreground">@{submission.freelancer.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{submission.exercise.title}</div>
                              <div className="text-sm text-muted-foreground">{getDifficultyBadge(submission.exercise.difficulty)}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(submission.status)}</TableCell>
                          <TableCell>
                            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell>
                            {submission.adminScore || submission.aiScore ? (
                              <Badge variant="outline">
                                {submission.adminScore || submission.aiScore}/100
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setReviewForm({
                                  adminFeedback: submission.adminFeedback || '',
                                  adminScore: submission.adminScore || 0,
                                  status: submission.status,
                                });
                                setShowReviewDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{t('admin.exercises.totalExercises')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{exercises.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{t('admin.exercises.totalSubmissions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">{t('admin.exercises.activeCategories')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {categories.filter(c => c.isActive).length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.exercises.addCategory')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('admin.exercises.name')}</Label>
                <Input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('admin.exercises.nameAr')}</Label>
                <Input
                  value={categoryForm.nameAr}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('admin.exercises.description')}</Label>
                <Textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('admin.exercises.color')}</Label>
                <Input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateCategory} className="w-full">
                {t('admin.exercises.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exercise Dialog */}
        <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin.exercises.addExercise')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('admin.exercises.title')}</Label>
                  <Input
                    value={exerciseForm.title}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('admin.exercises.titleAr')}</Label>
                  <Input
                    value={exerciseForm.titleAr}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, titleAr: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t('admin.exercises.description')}</Label>
                <Textarea
                  value={exerciseForm.description}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t('admin.exercises.category')}</Label>
                  <Select
                    value={exerciseForm.categoryId}
                    onValueChange={(value) => setExerciseForm({ ...exerciseForm, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('admin.exercises.skill')}</Label>
                  <Select
                    value={exerciseForm.skillId}
                    onValueChange={(value) => setExerciseForm({ ...exerciseForm, skillId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map((skill) => (
                        <SelectItem key={skill.id} value={skill.id.toString()}>
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t('admin.exercises.difficulty')}</Label>
                  <Select
                    value={exerciseForm.difficulty}
                    onValueChange={(value: any) => setExerciseForm({ ...exerciseForm, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{t('admin.exercises.beginner')}</SelectItem>
                      <SelectItem value="intermediate">{t('admin.exercises.intermediate')}</SelectItem>
                      <SelectItem value="advanced">{t('admin.exercises.advanced')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('admin.exercises.estimatedHours')}</Label>
                  <Input
                    type="number"
                    value={exerciseForm.estimatedHours}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, estimatedHours: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>{t('admin.exercises.budget')}</Label>
                  <Input
                    type="number"
                    value={exerciseForm.budget}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, budget: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button onClick={handleCreateExercise} className="w-full">
                {t('admin.exercises.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Generation Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.exercises.generateAI')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('admin.exercises.category')}</Label>
                <Select
                  value={generateForm.categoryId}
                  onValueChange={(value) => setGenerateForm({ ...generateForm, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('admin.exercises.skill')}</Label>
                <Select
                  value={generateForm.skillId}
                  onValueChange={(value) => setGenerateForm({ ...generateForm, skillId: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {skills.map((skill) => (
                      <SelectItem key={skill.id} value={skill.id.toString()}>
                        {skill.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('admin.exercises.difficulty')}</Label>
                <Select
                  value={generateForm.difficulty}
                  onValueChange={(value: any) => setGenerateForm({ ...generateForm, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{t('admin.exercises.beginner')}</SelectItem>
                    <SelectItem value="intermediate">{t('admin.exercises.intermediate')}</SelectItem>
                    <SelectItem value="advanced">{t('admin.exercises.advanced')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('admin.exercises.count')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={generateForm.count}
                  onChange={(e) => setGenerateForm({ ...generateForm, count: parseInt(e.target.value) })}
                />
              </div>
              <Button onClick={handleGenerateExercises} className="w-full">
                {t('admin.exercises.generate')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Settings Dialog */}
        <Dialog open={showAISettingsDialog} onOpenChange={setShowAISettingsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.exercises.aiSettings')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('admin.exercises.apiKey')}</Label>
                <Input
                  type="password"
                  value={aiSettingsForm.apiKey}
                  onChange={(e) => setAiSettingsForm({ ...aiSettingsForm, apiKey: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('admin.exercises.apiProvider')}</Label>
                <Select
                  value={aiSettingsForm.apiProvider}
                  onValueChange={(value) => {
                    const suggestedModels = getSuggestedModels(value);
                    setAiSettingsForm({ 
                      ...aiSettingsForm, 
                      apiProvider: value,
                      modelName: suggestedModels.length > 0 ? suggestedModels[0].value : ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('admin.exercises.modelName')}</Label>
                <Select
                  value={aiSettingsForm.modelName}
                  onValueChange={(value) => setAiSettingsForm({ ...aiSettingsForm, modelName: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getSuggestedModels(aiSettingsForm.apiProvider).map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  You can also enter a custom model name if needed.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('admin.exercises.maxTokens')}</Label>
                  <Input
                    type="number"
                    min="100"
                    max="8000"
                    value={aiSettingsForm.maxTokens}
                    onChange={(e) => setAiSettingsForm({ ...aiSettingsForm, maxTokens: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>{t('admin.exercises.temperature')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={aiSettingsForm.temperature}
                    onChange={(e) => setAiSettingsForm({ ...aiSettingsForm, temperature: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>{t('admin.exercises.systemPrompt')}</Label>
                <Textarea
                  value={aiSettingsForm.systemPrompt}
                  onChange={(e) => setAiSettingsForm({ ...aiSettingsForm, systemPrompt: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={aiSettingsForm.isActive}
                  onCheckedChange={(checked) => setAiSettingsForm({ ...aiSettingsForm, isActive: checked })}
                />
                <Label htmlFor="isActive">{t('admin.exercises.isActive')}</Label>
              </div>
              <Button onClick={handleUpdateAISettings} className="w-full">
                {t('admin.exercises.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Review Dialog */}
        <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin.exercises.reviewSubmission')}</DialogTitle>
            </DialogHeader>
            {selectedSubmission && (
              <div className="space-y-4">
                <div>
                  <Label>{t('admin.exercises.submission')}</Label>
                  <div className="p-4 border rounded-md bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm">{selectedSubmission.submissionText}</pre>
                  </div>
                </div>
                <div>
                  <Label>{t('admin.exercises.feedback')}</Label>
                  <Textarea
                    value={reviewForm.adminFeedback}
                    onChange={(e) => setReviewForm({ ...reviewForm, adminFeedback: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.exercises.score')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={reviewForm.adminScore}
                      onChange={(e) => setReviewForm({ ...reviewForm, adminScore: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>{t('admin.exercises.status')}</Label>
                    <Select
                      value={reviewForm.status}
                      onValueChange={(value: any) => setReviewForm({ ...reviewForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">{t('admin.exercises.approved')}</SelectItem>
                        <SelectItem value="rejected">{t('admin.exercises.rejected')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleReviewSubmission} className="w-full">
                  {t('admin.exercises.submitReview')}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
} 