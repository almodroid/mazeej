import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { User } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ConsultationFormProps = {
  freelancer: Omit<User, 'password'>;
  isOpen: boolean;
  onClose: () => void;
};

// Time slot options
const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
];

// Duration options in hours
const durationOptions = [0.5, 1, 1.5, 2, 3, 4];

// Time zones
const timeZones = [
  "Arabia Standard Time (AST)",
  "Gulf Standard Time (GST)",
  "Eastern European Time (EET)",
  "UTC+0",
  "UTC+1",
  "UTC+2",
  "UTC+3",
  "UTC+4"
];

export default function ConsultationForm({ freelancer, isOpen, onClose }: ConsultationFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    duration: 1, // default 1 hour
    timeZone: "Arabia Standard Time (AST)",
    projectType: "consultation" as "consultation" | "mentoring",
  });

  // Calculate hourly rate and total cost
  const hourlyRate = freelancer.hourlyRate || 0;
  const totalCost = hourlyRate * formData.duration;

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationHours: number): string => {
    if (!startTime) return "";
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationHours * 60;
    
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      budget: number;
      projectType: string;
      hourlyRate: number;
      estimatedHours: number;
      consultationDate: string;
      consultationStartTime: string;
      consultationEndTime: string;
      timeZone: string;
      deadline: string;
      freelancerId: number;
      category: number;
    }) => {
      const response = await apiRequest("POST", "/api/projects", data);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create consultation" }));
        throw new Error(errorData.message || "Failed to create consultation");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/consultations"] });
      setError(null);
      onClose();
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleStartTimeChange = (time: string) => {
    const endTime = calculateEndTime(time, formData.duration);
    setFormData({ ...formData, startTime: time, endTime });
  };

  const handleDurationChange = (duration: number) => {
    const endTime = calculateEndTime(formData.startTime, duration);
    setFormData({ ...formData, duration, endTime });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!date) {
      alert(t("consultation.selectDate"));
      return;
    }
    
    if (!formData.startTime) {
      alert(t("consultation.selectTime"));
      return;
    }
    
    createProjectMutation.mutate({
      title: formData.title || `${t("consultation.consultationWith")} ${freelancer.fullName || freelancer.username}`,
      description: formData.description || `${t("consultation.consultationWithDesc")} ${freelancer.fullName || freelancer.username}`,
      budget: totalCost,
      projectType: formData.projectType,
      hourlyRate: hourlyRate,
      estimatedHours: formData.duration,
      consultationDate: date.toISOString(),
      consultationStartTime: formData.startTime,
      consultationEndTime: formData.endTime,
      timeZone: formData.timeZone,
      deadline: date.toISOString(),
      freelancerId: freelancer.id,
      category: 6, // Assuming 6 is the ID for "استشارات وأعمال" (consultingBusiness) category
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("consultation.bookConsultation")}</DialogTitle>
          <DialogDescription>
            {t("consultation.bookConsultationWith", { name: freelancer.fullName || freelancer.username })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="projectType">{t("consultation.consultationType")}</Label>
            <RadioGroup 
              value={formData.projectType} 
              onValueChange={(value) => setFormData({...formData, projectType: value as "consultation" | "mentoring"})}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="consultation" id="consultation" />
                <Label htmlFor="consultation" className="font-normal">
                  {t("consultation.oneTimeConsultation")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mentoring" id="mentoring" />
                <Label htmlFor="mentoring" className="font-normal">
                  {t("consultation.mentoring")}
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">{t("consultation.topic")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t("consultation.topicPlaceholder")}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t("consultation.consultationDetails")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t("consultation.detailsPlaceholder")}
              required
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("consultation.date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : t("consultation.selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeZone">{t("consultation.timeZone")}</Label>
              <Select
                value={formData.timeZone}
                onValueChange={(value) => setFormData({ ...formData, timeZone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("consultation.selectTimeZone")} />
                </SelectTrigger>
                <SelectContent>
                  {timeZones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t("consultation.startTime")}</Label>
              <Select
                value={formData.startTime}
                onValueChange={handleStartTimeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("consultation.selectStartTime")} />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">{t("consultation.duration")}</Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) => handleDurationChange(parseFloat(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("consultation.selectDuration")} />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((hours) => (
                    <SelectItem key={hours} value={hours.toString()}>
                      {hours < 1 ? `${hours * 60} ${t("consultation.minutes")}` : 
                        hours === 1 ? `1 ${t("consultation.hour")}` : 
                        `${hours} ${t("consultation.hours")}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="p-4 border rounded-md bg-muted/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{t("consultation.hourlyRate")}</p>
                <p className="text-2xl font-bold">${hourlyRate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{t("consultation.totalCost")}</p>
                <p className="text-2xl font-bold">${totalCost}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                {t("consultation.totalDuration", { 
                  hours: formData.duration,
                  time: formData.startTime && formData.endTime
                    ? `${formData.startTime} - ${formData.endTime}`
                    : "N/A"
                })}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? t("common.booking") : t("consultation.bookNow")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 