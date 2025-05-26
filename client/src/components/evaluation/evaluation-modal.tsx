import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, Loader2, Brain, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: number;
  categoryId: number;
  skillId: number;
  question: string;
  questionAr?: string;
  options: string[];
  optionsAr?: string[];
  correctAnswer: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  timeLimit: number;
  onComplete: (results: { score: number; level: string }) => void;
  onPause: () => void;
  isPaused: boolean;
  timeRemaining: number;
  isEvaluating: boolean;
}

export default function EvaluationModal({
  isOpen,
  onClose,
  questions,
  timeLimit,
  onComplete,
  onPause,
  isPaused,
  timeRemaining,
  isEvaluating
}: EvaluationModalProps) {
  const { t, i18n } = useTranslation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    setAiThinking(true);
    setSelectedAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = answerIndex;
      return newAnswers;
    });
    // Simulate AI processing
    setTimeout(() => setAiThinking(false), 500);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    const score = calculateScore();
    setFinalScore(score);
    setShowFinalScore(true);
  };

  const handleClose = () => {
    if (!showFinalScore) {
      onPause();
      return;
    }
    const level = determineLevel(finalScore);
    onComplete({ score: finalScore, level });
    setShowFinalScore(false);
    onClose();
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    return (correctAnswers / questions.length) * 100;
  };

  const determineLevel = (score: number): string => {
    if (score >= 80) return 'advanced';
    if (score >= 60) return 'intermediate';
    return 'beginner';
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (!isOpen) return null;

  if (!questions || questions.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {t('evaluation.title')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative">
              <Brain className="h-12 w-12 text-primary animate-pulse" />
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-ping" />
            </div>
            <p className="text-center text-muted-foreground mt-4">
              {t('evaluation.loadingQuestions')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (showFinalScore) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {t('evaluation.completed')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative mb-6">
              <div className="text-4xl font-bold">{Math.round(finalScore)}/100</div>
              <Sparkles className="h-6 w-6 text-primary absolute -top-2 -right-2 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-center text-muted-foreground">
                {t('evaluation.levelUpdated', { level: determineLevel(finalScore) })}
              </p>
            </div>
            <Button onClick={handleClose} className="mt-4">
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span>{t('evaluation.title')}</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <Progress value={progress} className="h-2 flex-1 mr-4" />
            <span className="text-sm text-muted-foreground">{currentQuestion + 1}/{questions.length}</span>
          </div>
          
          <div className="space-y-6 mt-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4 flex items-start gap-2">
                <span className="text-primary">Q{currentQuestion + 1}.</span>
                {i18n.language === 'ar' && questions[currentQuestion]?.questionAr
                  ? questions[currentQuestion].questionAr
                  : questions[currentQuestion]?.question}
              </h3>
              
              <RadioGroup
                value={selectedAnswers[currentQuestion]?.toString()}
                onValueChange={(value) => handleAnswer(parseInt(value))}
                className="space-y-3"
              >
                {questions[currentQuestion].options.map((option, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                      selectedAnswers[currentQuestion] === index 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {i18n.language === 'ar' && questions[currentQuestion].optionsAr
                        ? questions[currentQuestion].optionsAr[index]
                        : option}
                    </Label>
                    {aiThinking && selectedAnswers[currentQuestion] === index && (
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0 || isSubmitting}
                className="gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                {t('evaluation.previous')}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestion] === undefined || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('evaluation.submitting')}
                  </>
                ) : currentQuestion === questions.length - 1 ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t('evaluation.submit')}
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4" />
                    {t('evaluation.next')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 