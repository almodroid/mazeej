import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string, country: any) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  className?: string;
  // For freelancers, restrict to Saudi Arabia only
  restrictToSaudi?: boolean;
  country?: string;
  localization?: Record<string, string>;
}

export function PhoneInputField({
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  placeholder,
  className,
  restrictToSaudi = false,
  country,
  localization,
}: PhoneInputFieldProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <div className={cn("relative", className)}>
      <PhoneInput
        country={country || (restrictToSaudi ? "sa" : undefined)}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        enableSearch={!restrictToSaudi}
        searchPlaceholder={isRTL ? "البحث عن بلد..." : "Search for a country..."}
        searchNotFound={isRTL ? "لا يوجد بلد" : "No country found"}
        preferredCountries={restrictToSaudi ? ["sa"] : ["us", "sa", "ae", "kw", "bh", "om", "qa"]}
        onlyCountries={restrictToSaudi ? ["sa"] : undefined}
        countryCodeEditable={!restrictToSaudi}
        autoFormat={true}
        localization={localization}
        inputClass={cn(
          "!w-full !h-11 !rounded-lg !border !border-input !bg-background !px-3 !py-2 !text-sm !ring-offset-background",
          "!placeholder:text-muted-foreground",
          "focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-ring focus-visible:!ring-offset-2",
          "disabled:!cursor-not-allowed disabled:!opacity-50",
          error && "!border-destructive focus-visible:!ring-destructive",
          className
        )}
        buttonClass={cn(
          "!border !border-input !bg-background !rounded-l-lg",
          error && "!border-destructive"
        )}
        dropdownClass={cn(
          "!bg-background !border !border-input !rounded-lg !shadow-lg",
        )}
        containerClass={cn(
          "!w-full"
        )}
      />
    </div>
  );
} 