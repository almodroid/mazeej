import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

const registerSchema = z.object({
  username: z.string().min(3, "auth.usernameTooShort"),
  email: z.string().email("auth.invalidEmail"),
  fullName: z.string().min(2, "auth.fullNameRequired"),
  password: z.string().min(6, "auth.passwordLength"),
  confirmPassword: z.string(),
  role: z.enum(["client", "freelancer"]),
}).refine(data => data.password === data.confirmPassword, {
  message: "auth.passwordMismatch",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const { t } = useTranslation();
  const { registerMutation } = useAuth();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
      role: "client",
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      password: data.password,
      confirmPassword: data.confirmPassword,
      role: data.role,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.fullName")}</FormLabel>
              <FormControl>
                <Input placeholder={t("auth.fullName")} {...field} />
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
                <Input placeholder={t("auth.username")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("auth.email")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.password")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("auth.password")}
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
                  placeholder={t("auth.confirmPassword")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                    <FormControl>
                      <RadioGroupItem value="client" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t("auth.client")}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                    <FormControl>
                      <RadioGroupItem value="freelancer" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {t("auth.freelancer")}
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
            t("auth.register")
          )}
        </Button>
      </form>
    </Form>
  );
}
