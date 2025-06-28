import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PhoneInputField } from "@/components/ui/phone-input";
import { CountrySelect } from "@/components/ui/country-select";
import { cn } from "@/lib/utils";
import countries from "i18n-iso-countries";

const registerSchema = z.object({
  username: z.string().min(3, "auth.usernameTooShort"),
  email: z.string().email("auth.invalidEmail"),
  fullName: z.string().min(2, "auth.fullNameRequired"),
  password: z.string().min(6, "auth.passwordLength"),
  confirmPassword: z.string(),
  role: z.enum(["client", "freelancer"]),
  country: z.string().min(1, "auth.countryRequired"),
  phone: z.string().min(1, "auth.phoneRequired"),
}).refine(data => data.password === data.confirmPassword, {
  message: "auth.passwordMismatch",
  path: ["confirmPassword"],
}).refine(data => {
  // For freelancers, country must be Saudi Arabia
  if (data.role === "freelancer" && data.country !== "SA") {
    return false;
  }
  return true;
}, {
  message: "auth.freelancerSaudiOnly",
  path: ["country"],
}).refine(data => {
  // For freelancers, phone must start with +966
  if (data.role === "freelancer" && !data.phone.startsWith("966")) {
    return false;
  }
  return true;
}, {
  message: "auth.freelancerSaudiPhoneOnly",
  path: ["phone"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  initialRole?: "client" | "freelancer";
  onAuthSuccess?: () => void;
}

export default function RegisterForm({ initialRole = "client", onAuthSuccess }: RegisterFormProps) {
  const { t, i18n } = useTranslation();
  const { registerMutation } = useAuth();
  const isRTL = i18n.language === "ar";
  const currentLocale = isRTL ? "ar" : "en";
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      role: initialRole,
      country: initialRole === "freelancer" ? "SA" : "",
      phone: "",
    },
  });
  
  const selectedRole = form.watch("role");
  
  // Add state for selected country
  const [selectedCountry, setSelectedCountry] = useState(initialRole === "freelancer" ? "SA" : "");

  // Prepare localization for phone input
  const localization = Object.fromEntries(
    Object.entries(countries.getAlpha2Codes()).map(([code]) => [
      code.toLowerCase(),
      countries.getName(code, currentLocale) || code,
    ])
  );

  // Update the role field when initialRole prop changes
  useEffect(() => {
    form.setValue("role", initialRole);
    // Set default country for freelancers
    if (initialRole === "freelancer") {
      form.setValue("country", "SA");
    }
  }, [initialRole, form]);

  // Update country when role changes
  useEffect(() => {
    if (selectedRole === "freelancer") {
      form.setValue("country", "SA");
    }
  }, [selectedRole, form]);

  useEffect(() => {
    // Only auto-select for clients (not freelancers, who are always SA)
    if (selectedRole === "client" && !selectedCountry) {
      fetch("https://ipapi.co/json/")
        .then(res => res.json())
        .then(data => {
          if (data && data.country) {
            setSelectedCountry(data.country);
            form.setValue("country", data.country);
          }
        })
        .catch(() => {});
    }
  }, [selectedRole, selectedCountry, form]);

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.username,
      password: data.password,
      confirmPassword: data.confirmPassword,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      country: data.country,
      phone: data.phone,
    }, {
      onSuccess: () => {
        // Call the success handler if provided
        if (onAuthSuccess) {
          onAuthSuccess();
        }
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.fullName")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t("auth.fullNamePlaceholder")} 
                    className="rounded-lg h-11"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.username")}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t("auth.usernamePlaceholder")} 
                    className="rounded-lg h-11"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  className="rounded-lg h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.country")}</FormLabel>
                <FormControl>
                  <CountrySelect
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setSelectedCountry(val);
                    }}
                    restrictToSaudi={selectedRole === "freelancer"}
                    disabled={selectedRole === "freelancer"}
                    error={!!form.formState.errors.country}
                    
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem dir="ltr" className="text-right">
                <FormLabel>{t("auth.phone")}</FormLabel>
                <FormControl>
                  <PhoneInputField
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    restrictToSaudi={selectedRole === "freelancer"}
                    error={!!form.formState.errors.phone}
                    placeholder={t("auth.phonePlaceholder")}                    
                    country={selectedCountry.toLowerCase()}
                    localization={localization}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.password")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    className="rounded-lg h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    className="rounded-lg h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{t("auth.accountType")}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  className="flex flex-col space-y-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir={isRTL ? "rtl" : "ltr"}>
                    <FormItem className={`relative flex flex-col items-start space-y-0 rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${field.value === 'client' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <FormControl>
                        <RadioGroupItem value="client" className="sr-only" />
                      </FormControl>
                      <FormLabel className="font-medium text-base cursor-pointer flex items-center w-full justify-between">
                        {t("auth.client")}
                        {field.value === 'client' && (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs">
                            ✓
                          </span>
                        )}
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {t("auth.clientDescription")}
                      </p>
                    </FormItem>
                    
                    <FormItem className={`relative flex flex-col items-start space-y-0 rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${field.value === 'freelancer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <FormControl>
                        <RadioGroupItem value="freelancer" className="sr-only" />
                      </FormControl>
                      <FormLabel className="font-medium text-base cursor-pointer flex items-center w-full justify-between">
                        {t("auth.freelancer")}
                        {field.value === 'freelancer' && (
                          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs">
                            ✓
                          </span>
                        )}
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {t("auth.freelancerDescription")}
                      </p>
                    </FormItem>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full h-11 rounded-lg mt-2"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <span className="flex items-center justify-center">
              <svg
                className={`animate-spin ${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 text-white`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t("common.loading")}
            </span>
          ) : (
            t("auth.createAccount")
          )}
        </Button>
      </form>
    </Form>
  );
}
