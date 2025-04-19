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
import { Checkbox } from "@/components/ui/checkbox";
import { AtSign, Lock, User } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "auth.required"),
  password: z.string().min(1, "auth.required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { t, i18n } = useTranslation();
  const { loginMutation } = useAuth();
  const isRTL = i18n.language === "ar";
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    }, {
      onSuccess: (user: any) => {
        if (user && user.role === "admin") {
          window.location.href = "/admin";
        }
        // Optionally, handle redirect for regular users here if needed
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground font-medium">
                {t("auth.usernameOrEmail")}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <AtSign className="h-5 w-5" />
                  </div>
                  <Input 
                    placeholder={t("auth.usernameOrEmailPlaceholder")} 
                    className="pl-10 rounded-lg h-11"
                    {...field} 
                  />
                </div>
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
              <div className="flex justify-between items-center">
                <FormLabel className="text-foreground font-medium">
                  {t("auth.password")}
                </FormLabel>
                <a
                  href="#"
                  className="text-xs text-primary hover:underline transition-colors"
                >
                  {t("auth.forgotPassword")}
                </a>
              </div>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input 
                    type="password" 
                    placeholder={t("auth.passwordPlaceholder")} 
                    className="pl-10 rounded-lg h-11"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </FormControl>
              <FormLabel className="text-sm font-normal cursor-pointer text-muted-foreground">
                {t("auth.rememberMe")}
              </FormLabel>
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full h-11 rounded-lg shadow-md hover:shadow-lg transition-shadow mt-2"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
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
            t("auth.signIn")
          )}
        </Button>
        
        
      </form>
    </Form>
  );
}
