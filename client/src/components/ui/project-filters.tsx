import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { X, Filter, RotateCcw, SaudiRiyal } from "lucide-react";
import { Category, Skill } from "@shared/schema";

interface ProjectFiltersProps {
  categories: Category[];
  skills: Skill[];
  cities: string[];
  filters: {
    budgetRange: [number, number];
    category: string;
    status: string;
    postedDate: string;
    skills: string[];
    projectType: string;
    city: string;
  };
  onFilterChange: (filters: any) => void;
  onReset: () => void;
  isRTL?: boolean;
  showCityFilter?: boolean;
}

export default function ProjectFilters({
  categories,
  skills,
  cities,
  filters,
  onFilterChange,
  onReset,
  isRTL = false,
  showCityFilter = true
}: ProjectFiltersProps) {
  const { t } = useTranslation();

  const handleBudgetChange = (value: number[]) => {
    onFilterChange({
      ...filters,
      budgetRange: value as [number, number]
    });
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({
      ...filters,
      category: value
    });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value
    });
  };

  const handlePostedDateChange = (value: string) => {
    onFilterChange({
      ...filters,
      postedDate: value
    });
  };

  const handleSkillToggle = (skillId: string) => {
    const newSkills = filters.skills.includes(skillId)
      ? filters.skills.filter(id => id !== skillId)
      : [...filters.skills, skillId];
    
    onFilterChange({
      ...filters,
      skills: newSkills
    });
  };

  const handleProjectTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      projectType: value
    });
  };

  const handleCityChange = (value: string) => {
    onFilterChange({
      ...filters,
      city: value
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category && filters.category !== "all") count++;
    if (filters.status && filters.status !== "all") count++;
    if (filters.postedDate && filters.postedDate !== "all") count++;
    if (filters.projectType && filters.projectType !== "all") count++;
    if (filters.skills.length > 0) count++;
    if (filters.budgetRange[0] > 0 || filters.budgetRange[1] < 10000) count++;
    if (filters.city && filters.city !== "all") count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("filters.title", "Filters")}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Budget Range */}
        <div className="space-y-3">
          <Label>{t("filters.budgetRange", "Budget Range")}</Label>
          <div className="space-y-2">
            <Slider
              value={filters.budgetRange}
              onValueChange={handleBudgetChange}
              max={10000}
              min={0}
              step={100}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {filters.budgetRange[0].toLocaleString()}
                {isRTL ? <SaudiRiyal className="h-3 w-3" /> : " SAR"}
              </span>
              <span className="flex items-center gap-1">
                {filters.budgetRange[1].toLocaleString()}
                {isRTL ? <SaudiRiyal className="h-3 w-3" /> : " SAR"}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Category */}
        <div className="space-y-3">
          <Label>{t("filters.category", "Category")}</Label>
          <Select value={filters.category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.selectCategory", "Select category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allCategories", "All Categories")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Status */}
        <div className="space-y-3">
          <Label>{t("filters.status", "Status")}</Label>
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.selectStatus", "Select status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStatuses", "All Statuses")}</SelectItem>
              <SelectItem value="open">{t("project.statusOpen", "Open")}</SelectItem>
              <SelectItem value="in_progress">{t("project.statusInProgress", "In Progress")}</SelectItem>
              <SelectItem value="completed">{t("project.statusCompleted", "Completed")}</SelectItem>
              <SelectItem value="cancelled">{t("project.statusCancelled", "Cancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Posted Date */}
        <div className="space-y-3">
          <Label>{t("filters.postedDate", "Posted Date")}</Label>
          <Select value={filters.postedDate} onValueChange={handlePostedDateChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.selectDate", "Select date")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.anyTime", "Any Time")}</SelectItem>
              <SelectItem value="1">{t("filters.last24Hours", "Last 24 Hours")}</SelectItem>
              <SelectItem value="7">{t("filters.last7Days", "Last 7 Days")}</SelectItem>
              <SelectItem value="30">{t("filters.last30Days", "Last 30 Days")}</SelectItem>
              <SelectItem value="90">{t("filters.last90Days", "Last 90 Days")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Project Type */}
        <div className="space-y-3">
          <Label>{t("filters.projectType", "Project Type")}</Label>
          <Select value={filters.projectType} onValueChange={handleProjectTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.selectType", "Select type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allTypes", "All Types")}</SelectItem>
              <SelectItem value="standard">{t("project.typeStandard", "Standard")}</SelectItem>
              <SelectItem value="consultation">{t("project.typeConsultation", "Consultation")}</SelectItem>
              <SelectItem value="mentoring">{t("project.typeMentoring", "Mentoring")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showCityFilter && (
          <>
            <Separator />
            {/* City */}
            <div className="space-y-3">
              <Label>{t("filters.city", "City")}</Label>
              <Select value={filters.city} onValueChange={handleCityChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("filters.selectCity", "Select city")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allCities", "All Cities")}</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Separator />

        {/* Skills */}
        <div className="space-y-3">
          <Label>{t("filters.skills", "Skills")}</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {skills.map((skill) => (
              <div key={skill.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`skill-${skill.id}`}
                  checked={filters.skills.includes(skill.id.toString())}
                  onCheckedChange={() => handleSkillToggle(skill.id.toString())}
                />
                <Label
                  htmlFor={`skill-${skill.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {skill.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 