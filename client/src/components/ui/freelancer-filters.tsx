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
import { Filter, RotateCcw, Star, SaudiRiyal } from "lucide-react";
import { Category, Skill } from "@shared/schema";

interface FreelancerFiltersProps {
  categories: Category[];
  skills: Skill[];
  cities: string[];
  filters: {
    city: string;
    experienceLevel: string;
    hourlyRateRange: [number, number];
    skills: string[];
    rating: number;
    availability: string;
    verifiedOnly: boolean;
  };
  onFilterChange: (filters: any) => void;
  onReset: () => void;
  isRTL?: boolean;
}

export default function FreelancerFilters({
  categories,
  skills,
  cities,
  filters,
  onFilterChange,
  onReset,
  isRTL = false
}: FreelancerFiltersProps) {
  const { t } = useTranslation();

  const handleCityChange = (value: string) => {
    onFilterChange({
      ...filters,
      city: value
    });
  };

  const handleExperienceLevelChange = (value: string) => {
    onFilterChange({
      ...filters,
      experienceLevel: value
    });
  };

  const handleHourlyRateChange = (value: number[]) => {
    onFilterChange({
      ...filters,
      hourlyRateRange: value as [number, number]
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

  const handleRatingChange = (value: number[]) => {
    onFilterChange({
      ...filters,
      rating: value[0]
    });
  };

  const handleAvailabilityChange = (value: string) => {
    onFilterChange({
      ...filters,
      availability: value
    });
  };

  const handleVerifiedOnlyChange = (checked: boolean) => {
    onFilterChange({
      ...filters,
      verifiedOnly: checked
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.city && filters.city !== "all") count++;
    if (filters.experienceLevel && filters.experienceLevel !== "all") count++;
    if (filters.availability && filters.availability !== "all") count++;
    if (filters.verifiedOnly) count++;
    if (filters.skills.length > 0) count++;
    if (filters.hourlyRateRange[0] > 0 || filters.hourlyRateRange[1] < 200) count++;
    if (filters.rating > 0) count++;
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

        <Separator />

        {/* Experience Level */}
        <div className="space-y-3">
          <Label>{t("filters.experienceLevel", "Experience Level")}</Label>
          <Select value={filters.experienceLevel} onValueChange={handleExperienceLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.selectLevel", "Select level")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allLevels", "All Levels")}</SelectItem>
              <SelectItem value="beginner">{t("profile.beginner", "Beginner")}</SelectItem>
              <SelectItem value="intermediate">{t("profile.intermediate", "Intermediate")}</SelectItem>
              <SelectItem value="advanced">{t("profile.advanced", "Advanced")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Hourly Rate Range */}
        <div className="space-y-3">
          <Label>{t("filters.hourlyRate", "Hourly Rate")}</Label>
          <div className="space-y-2">
            <Slider
              value={filters.hourlyRateRange}
              onValueChange={handleHourlyRateChange}
              max={200}
              min={0}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {filters.hourlyRateRange[0]}/hr
                {isRTL ? <SaudiRiyal className="h-3 w-3" /> : " SAR"}
              </span>
              <span className="flex items-center gap-1">
                {filters.hourlyRateRange[1]}/hr
                {isRTL ? <SaudiRiyal className="h-3 w-3" /> : " SAR"}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div className="space-y-3">
          <Label>{t("filters.rating", "Minimum Rating")}</Label>
          <div className="space-y-2">
            <Slider
              value={[filters.rating]}
              onValueChange={handleRatingChange}
              max={5}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("filters.anyRating", "Any Rating")}</span>
              <div className="flex items-center gap-1">
                <span>{filters.rating}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Availability */}
        <div className="space-y-3">
          <Label>{t("filters.availability", "Availability")}</Label>
          <Select value={filters.availability} onValueChange={handleAvailabilityChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("filters.selectAvailability", "Select availability")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.anyAvailability", "Any Availability")}</SelectItem>
              <SelectItem value="online">{t("filters.online", "Online")}</SelectItem>
              <SelectItem value="offline">{t("filters.offline", "Offline")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Verified Only */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified-only"
              checked={filters.verifiedOnly}
              onCheckedChange={handleVerifiedOnlyChange}
            />
            <Label
              htmlFor="verified-only"
              className="text-sm font-normal cursor-pointer"
            >
              {t("filters.verifiedOnly", "Verified Only")}
            </Label>
          </div>
        </div>

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