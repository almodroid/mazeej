import { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, ClipboardCheck, Play, AlertTriangle, X, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EvaluationBubbleProps {
  isEvaluating: boolean;
  progress: number;
  timeRemaining: number;
  onStartEvaluation: () => void;
  onContinueEvaluation: () => void;
  onExitEvaluation: () => void;
  isPaused: boolean;
  isModalOpen: boolean;
  cooldownTime: number;
}

export default function EvaluationBubble({ 
  isEvaluating, 
  progress, 
  timeRemaining,
  onStartEvaluation,
  onContinueEvaluation,
  onExitEvaluation,
  isPaused,
  isModalOpen,
  cooldownTime
}: EvaluationBubbleProps) {
  const { t } = useTranslation();
  const [isMinimized, setIsMinimized] = useState(false);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // If user is in cooldown period and not currently evaluating, don't show the bubble
  if (cooldownTime > 0 && !isEvaluating) {
    return null;
  }

  return (
    <div className="fixed bottom-32 start-24 z-50">
      {isEvaluating ? (
        <div className={cn(
          "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64",
          isPaused && "border-2 border-red-500 animate-pulse",
          !isModalOpen && !isPaused && "border-2 border-orange-500"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isPaused ? (
                <AlertTriangle className="h-4 w-4 text-red-500 animate-bounce" />
              ) : !isModalOpen ? (
                <Clock className="h-4 w-4 text-orange-500 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 text-primary" />
              )}
              <span className={cn(
                "text-sm font-medium",
                isPaused ? "text-red-500 font-bold" : !isModalOpen ? "text-orange-500 font-bold" : ""
              )}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <span className={cn(
              "text-sm",
              isPaused ? "text-red-500 font-bold" : !isModalOpen ? "text-orange-500 font-bold" : "text-muted-foreground"
            )}>
              {progress}%
            </span>
          </div>
          <Progress 
            value={progress} 
            className={cn(
              "h-2 mb-3",
              isPaused ? "bg-red-100 [&>div]:bg-red-500 [&>div]:animate-pulse" : 
              !isModalOpen ? "bg-orange-100 [&>div]:bg-orange-500" : ""
            )} 
          />
          <div className="space-y-2">
            {isPaused && (
              <Button 
                className="w-full animate-pulse" 
                onClick={onContinueEvaluation}
                size="sm"
                variant="destructive"
              >
                <Play className="w-4 h-4 mr-2" />
                {t('evaluation.continue')}
              </Button>
            )}
            {!isModalOpen && !isPaused && (
              <Button 
                className="w-full" 
                onClick={onContinueEvaluation}
                size="sm"
                variant="outline"
              >
                <Play className="w-4 h-4 mr-2" />
                {t('evaluation.return')}
              </Button>
            )}
            <Button 
              className="w-full" 
              onClick={onExitEvaluation}
              size="sm"
              variant="ghost"
              disabled={cooldownTime > 0}
            >
              {cooldownTime > 0 ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  {t('evaluation.cooldown', { time: formatTime(cooldownTime) })}
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  {t('evaluation.exit')}
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {cooldownTime > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64 border-2 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-orange-500" />
                  <span className="text-orange-500 font-bold text-lg">
                    {formatTime(cooldownTime)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 p-0"
                >
                  {isMinimized ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!isMinimized && (
                <>
                  <span className="text-sm text-muted-foreground block mb-2">
                    {t('evaluation.cooldownMessage', { hours: 24 })}
                  </span>
                  <Progress 
                    value={(cooldownTime / (24 * 60 * 60)) * 100} 
                    className="h-2 w-full bg-orange-100 [&>div]:bg-orange-500" 
                  />
                </>
              )}
            </div>
          ) : (
            <Button
              className="rounded-full w-14 h-14 shadow-lg"
              onClick={onStartEvaluation}
            >
              <ClipboardCheck className="w-6 h-6" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 