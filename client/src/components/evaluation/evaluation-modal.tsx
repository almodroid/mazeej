import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock, Loader2 } from "lucide-react";

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

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = answerIndex;
      return newAnswers;
    });
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('evaluation.title')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-center text-muted-foreground">
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('evaluation.completed')}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-4xl font-bold mb-4">{Math.round(finalScore)}/100</div>
            <p className="text-center text-muted-foreground mb-6">
              {t('evaluation.levelUpdated', { level: determineLevel(finalScore) })}
            </p>
            <Button onClick={handleClose}>
              {t('common.close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('evaluation.title')}</span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Progress value={progress} className="h-2 mb-6" />
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">
                {i18n.language === 'ar' && questions[currentQuestion]?.questionAr
                  ? questions[currentQuestion].questionAr
                  : questions[currentQuestion]?.question}
              </h3>
              
              <RadioGroup
                value={selectedAnswers[currentQuestion]?.toString()}
                onValueChange={(value) => handleAnswer(parseInt(value))}
              >
                {questions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>
                      {i18n.language === 'ar' && questions[currentQuestion].optionsAr
                        ? questions[currentQuestion].optionsAr[index]
                        : option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0 || isSubmitting}
              >
                {t('evaluation.previous')}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestion] === undefined || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('evaluation.submitting')}
                  </>
                ) : currentQuestion === questions.length - 1 ? (
                  t('evaluation.submit')
                ) : (
                  t('evaluation.next')
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 