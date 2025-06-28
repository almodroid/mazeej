import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import countries from "i18n-iso-countries";

// Initialize countries with Arabic and English
// Using dynamic imports instead of require for browser compatibility
import("i18n-iso-countries/langs/ar.json").then((ar) => {
  countries.registerLocale(ar.default);
});

import("i18n-iso-countries/langs/en.json").then((en) => {
  countries.registerLocale(en.default);
});

interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  // For freelancers, restrict to Saudi Arabia only
  restrictToSaudi?: boolean;
}

export function CountrySelect({
  value,
  onValueChange,
  disabled = false,
  error = false,
  className,
  restrictToSaudi = false,
}: CountrySelectProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const currentLocale = isRTL ? "ar" : "en";

  // Get all countries or just Saudi Arabia
  const countryCodes = restrictToSaudi ? ["SA"] : countries.getAlpha2Codes();
  
  // Create sorted list of countries
  const countryList = Object.keys(countryCodes)
    .map((code) => ({
      code,
      name: countries.getName(code, currentLocale) || countries.getName(code, "en") || code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, currentLocale));

  // If restricted to Saudi Arabia, only show SA
  const filteredCountries = restrictToSaudi 
    ? countryList.filter(country => country.code === "SA")
    : countryList;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger 
        className={cn(
          "h-11 rounded-lg",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <SelectValue 
          placeholder={
            disabled && value === "SA"
              ? (isRTL ? "المملكة العربية السعودية" : "Saudi Arabia")
              : restrictToSaudi
                ? (isRTL ? "المملكة العربية السعودية" : "Saudi Arabia")
                : (isRTL ? "اختر دولتك" : "Select country")
          } 
        />
      </SelectTrigger>
      <SelectContent 
        className={cn(
          "max-h-60",
          isRTL && "text-right"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {filteredCountries.map((country) => (
          <SelectItem 
            key={country.code} 
            value={country.code}
            className={cn(
              "cursor-pointer",
              isRTL && "text-right"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {getCountryFlag(country.code)}
              </span>
              <span>{country.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Function to get country flag emoji
function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
} 