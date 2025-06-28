import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Loader2, Search, Filter, Trophy, Clock, DollarSign, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Exercise {
  id: number;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  categoryId: number;
  skillId: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  budget: number;
  requirements: string[];
  requirementsAr: string[];
  deliverables: string[];
  deliverablesAr: string[];
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
}

interface ExerciseProgress {
  id: number;
  skillId: number;
  exercisesCompleted: number;
  totalScore: number;
  averageScore: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  lastExerciseAt: string;
  skill: {
    id: number;
    name: string;
    nameAr: string;
  };
}

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

export default function ExercisesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [submissions, setSubmissions] = useState<ExerciseSubmission[]>([]);
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<ExerciseSubmission | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    categoryId: 'all',
    skillId: 'all',
    difficulty: 'all',
    search: '',
  });

  // Submission form
  const [submissionForm, setSubmissionForm] = useState({
    submissionText: '',
    submissionFiles: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exercisesRes, submissionsRes, progressRes, categoriesRes, skillsRes] = await Promise.all([
        fetch('/api/exercises/exercises'),
        fetch('/api/exercises/submissions'),
        fetch('/api/exercises/progress'),
        fetch('/api/exercises/categories'),
        fetch('/api/skills'),
      ]);

      if (exercisesRes.ok) {
        const data = await exercisesRes.json();
        setExercises(data.exercises || []);
      }
      if (submissionsRes.ok) {
        const data = await submissionsRes.json();
        setSubmissions(data.submissions || []);
      }
      if (progressRes.ok) {
        setProgress(await progressRes.json());
      }
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
      if (skillsRes.ok) {
        setSkills(await skillsRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: t('exercises.error'),
        description: t('exercises.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = async (exerciseId: number) => {
    try {
      const response = await fetch(`/api/exercises/exercises/${exerciseId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const submission = await response.json();
        setCurrentSubmission(submission);
        setSelectedExercise(exercises.find(e => e.id === exerciseId) || null);
        setShowSubmissionDialog(true);
        toast({
          title: t('exercises.success'),
          description: t('exercises.exerciseStarted'),
        });
      }
    } catch (error) {
      toast({
        title: t('exercises.error'),
        description: t('exercises.startError'),
        variant: 'destructive',
      });
    }
  };

  const handleSubmitExercise = async () => {
    if (!currentSubmission) return;

    try {
      const response = await fetch(`/api/exercises/exercises/${currentSubmission.exercise.id}/submit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionForm),
      });

      if (response.ok) {
        toast({
          title: t('exercises.success'),
          description: t('exercises.exerciseSubmitted'),
        });
        setShowSubmissionDialog(false);
        setCurrentSubmission(null);
        setSelectedExercise(null);
        setSubmissionForm({ submissionText: '', submissionFiles: [] });
        fetchData();
      }
    } catch (error) {
      toast({
        title: t('exercises.error'),
        description: t('exercises.submitError'),
        variant: 'destructive',
      });
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig = {
      beginner: { color: 'bg-green-100 text-green-800', text: t('exercises.beginner') },
      intermediate: { color: 'bg-yellow-100 text-yellow-800', text: t('exercises.intermediate') },
      advanced: { color: 'bg-red-100 text-red-800', text: t('exercises.advanced') },
    };
    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig];
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_progress: { color: 'bg-yellow-100 text-yellow-800', text: t('exercises.inProgress') },
      submitted: { color: 'bg-blue-100 text-blue-800', text: t('exercises.submitted') },
      approved: { color: 'bg-green-100 text-green-800', text: t('exercises.approved') },
      rejected: { color: 'bg-red-100 text-red-800', text: t('exercises.rejected') },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const filteredExercises = exercises.filter(exercise => {
    if (filters.categoryId && filters.categoryId !== 'all' && exercise.categoryId !== parseInt(filters.categoryId)) return false;
    if (filters.skillId && filters.skillId !== 'all' && exercise.skillId !== parseInt(filters.skillId)) return false;
    if (filters.difficulty && filters.difficulty !== 'all' && exercise.difficulty !== filters.difficulty) return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const titleMatch = exercise.title.toLowerCase().includes(searchTerm);
      const titleArMatch = exercise.titleAr.toLowerCase().includes(searchTerm);
      const descriptionMatch = exercise.description.toLowerCase().includes(searchTerm);
      return titleMatch || titleArMatch || descriptionMatch;
    }
    return true;
  });

  const getSubmissionForExercise = (exerciseId: number) => {
    return submissions.find(s => s.exercise.id === exerciseId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Check if user is a freelancer
  if (!user || user.role !== 'freelancer') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('exercises.accessDenied')}</h3>
            <p className="text-muted-foreground">{t('exercises.freelancersOnly')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{t('exercises.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('exercises.description')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">
              <BookOpen className="h-4 w-4 mr-2" />
              {t('exercises.browse')}
            </TabsTrigger>
            <TabsTrigger value="my-exercises">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('exercises.myExercises')}
            </TabsTrigger>
            <TabsTrigger value="progress">
              <Trophy className="h-4 w-4 mr-2" />
              {t('exercises.progress')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {t('exercises.filters')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>{t('exercises.search')}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('exercises.searchPlaceholder')}
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{t('exercises.category')}</Label>
                    <Select
                      value={filters.categoryId}
                      onValueChange={(value) => setFilters({ ...filters, categoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('exercises.allCategories')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('exercises.allCategories')}</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {i18n.language === 'ar' ? category.nameAr : category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('exercises.skill')}</Label>
                    <Select
                      value={filters.skillId}
                      onValueChange={(value) => setFilters({ ...filters, skillId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('exercises.allSkills')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('exercises.allSkills')}</SelectItem>
                        {skills.map((skill) => (
                          <SelectItem key={skill.id} value={skill.id.toString()}>
                            {i18n.language === 'ar' ? skill.nameAr : skill.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('exercises.difficulty')}</Label>
                    <Select
                      value={filters.difficulty}
                      onValueChange={(value) => setFilters({ ...filters, difficulty: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('exercises.allDifficulties')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('exercises.allDifficulties')}</SelectItem>
                        <SelectItem value="beginner">{t('exercises.beginner')}</SelectItem>
                        <SelectItem value="intermediate">{t('exercises.intermediate')}</SelectItem>
                        <SelectItem value="advanced">{t('exercises.advanced')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exercises Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map((exercise) => {
                const submission = getSubmissionForExercise(exercise.id);
                const isStarted = submission && submission.status === 'in_progress';
                const isCompleted = submission && ['submitted', 'approved', 'rejected'].includes(submission.status);

                return (
                  <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">
                            {i18n.language === 'ar' ? exercise.titleAr : exercise.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {getDifficultyBadge(exercise.difficulty)}
                            <Badge variant="outline">
                              {i18n.language === 'ar' ? exercise.category.nameAr : exercise.category.name}
                            </Badge>
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {i18n.language === 'ar' ? exercise.descriptionAr : exercise.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {exercise.estimatedHours}h
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          ${exercise.budget}
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{t('exercises.requirements')}:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(i18n.language === 'ar' ? exercise.requirementsAr : exercise.requirements).slice(0, 2).map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-xs">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                          {exercise.requirements.length > 2 && (
                            <li className="text-xs text-muted-foreground">
                              +{exercise.requirements.length - 2} {t('exercises.more')}
                            </li>
                          )}
                        </ul>
                      </div>

                      <Button
                        onClick={() => handleStartExercise(exercise.id)}
                        className="w-full"
                        disabled={isCompleted}
                      >
                        {isStarted ? t('exercises.continue') : 
                         isCompleted ? t('exercises.completed') : 
                         t('exercises.start')}
                      </Button>

                      {submission && (
                        <div className="text-center">
                          {getStatusBadge(submission.status)}
                          {submission.adminScore && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {t('exercises.score')}: {submission.adminScore}/100
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredExercises.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('exercises.noExercises')}</h3>
                  <p className="text-muted-foreground">{t('exercises.noExercisesDescription')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-exercises" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('exercises.myExercises')}</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t('exercises.noSubmissions')}</h3>
                    <p className="text-muted-foreground">{t('exercises.noSubmissionsDescription')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <Card key={submission.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h4 className="font-medium">
                              {i18n.language === 'ar' ? submission.exercise.titleAr : submission.exercise.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(submission.status)}
                              {getDifficultyBadge(submission.exercise.difficulty)}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm text-muted-foreground">
                              {submission.submittedAt
                                ? new Date(submission.submittedAt).toLocaleDateString()
                                : new Date(submission.startedAt).toLocaleDateString()}
                            </div>
                            {submission.adminScore && (
                              <div className="text-sm font-medium">
                                {submission.adminScore}/100
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {submission.adminFeedback && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-md">
                            <h5 className="font-medium text-sm mb-2">{t('exercises.feedback')}:</h5>
                            <p className="text-sm text-muted-foreground">{submission.adminFeedback}</p>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progress.map((skillProgress) => (
                <Card key={skillProgress.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {i18n.language === 'ar' ? skillProgress.skill.nameAr : skillProgress.skill.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('exercises.exercisesCompleted')}</span>
                        <span>{skillProgress.exercisesCompleted}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('exercises.averageScore')}</span>
                        <span>{skillProgress.averageScore}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('exercises.currentLevel')}</span>
                        <span>{getDifficultyBadge(skillProgress.currentLevel)}</span>
                      </div>
                    </div>
                    
                    <Progress value={skillProgress.averageScore} className="w-full" />
                    
                    {skillProgress.lastExerciseAt && (
                      <div className="text-xs text-muted-foreground">
                        {t('exercises.lastExercise')}: {new Date(skillProgress.lastExerciseAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {progress.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t('exercises.noProgress')}</h3>
                  <p className="text-muted-foreground">{t('exercises.noProgressDescription')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Exercise Details Dialog */}
        <Dialog open={showExerciseDialog} onOpenChange={setShowExerciseDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedExercise && (i18n.language === 'ar' ? selectedExercise.titleAr : selectedExercise.title)}
              </DialogTitle>
            </DialogHeader>
            {selectedExercise && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">{t('exercises.description')}</h3>
                  <p className="text-muted-foreground">
                    {i18n.language === 'ar' ? selectedExercise.descriptionAr : selectedExercise.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">{t('exercises.requirements')}</h3>
                    <ul className="space-y-2">
                      {(i18n.language === 'ar' ? selectedExercise.requirementsAr : selectedExercise.requirements).map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-sm">•</span>
                          <span className="text-sm">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">{t('exercises.deliverables')}</h3>
                    <ul className="space-y-2">
                      {(i18n.language === 'ar' ? selectedExercise.deliverablesAr : selectedExercise.deliverables).map((del, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-sm">•</span>
                          <span className="text-sm">{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{selectedExercise.estimatedHours}h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-sm">${selectedExercise.budget}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleStartExercise(selectedExercise.id)}>
                    {t('exercises.start')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Submission Dialog */}
        <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('exercises.submitExercise')}</DialogTitle>
            </DialogHeader>
            {selectedExercise && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">
                    {i18n.language === 'ar' ? selectedExercise.titleAr : selectedExercise.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {i18n.language === 'ar' ? selectedExercise.descriptionAr : selectedExercise.description}
                  </p>
                </div>

                <div>
                  <Label htmlFor="submission">{t('exercises.yourSubmission')}</Label>
                  <Textarea
                    id="submission"
                    placeholder={t('exercises.submissionPlaceholder')}
                    value={submissionForm.submissionText}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, submissionText: e.target.value })}
                    rows={10}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSubmissionDialog(false)}>
                    {t('exercises.cancel')}
                  </Button>
                  <Button onClick={handleSubmitExercise}>
                    {t('exercises.submit')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 