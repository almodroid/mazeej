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
        
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-background text-muted-foreground">
              {t("auth.orContinueWith")}
            </span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            type="button" 
            className="w-full hover-lift"
            size="sm"
          >
            <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.0003 2C6.47731 2 2.00031 6.477 2.00031 12C2.00031 16.991 5.65731 21.128 10.4383 21.879V14.89H7.89831V12H10.4383V9.797C10.4383 7.291 11.9313 5.907 14.2153 5.907C15.3093 5.907 16.4543 6.102 16.4543 6.102V8.562H15.1913C13.9513 8.562 13.5623 9.333 13.5623 10.124V12H16.3363L15.8923 14.89H13.5623V21.879C18.3433 21.129 22.0003 16.99 22.0003 12C22.0003 6.477 17.5233 2 12.0003 2Z" />
            </svg>
          </Button>
          
          <Button 
            variant="outline" 
            type="button" 
            className="w-full hover-lift"
            size="sm"
          >
            <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </Button>
          
          <Button 
            variant="outline" 
            type="button" 
            className="w-full hover-lift"
            size="sm"
          >
            <svg className="h-5 w-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.9999 2C17.5229 2 21.9999 6.477 21.9999 12c0 5.523-4.477 10-10.0001 10-5.5229 0-9.99995-4.477-9.99995-10C1.99995 6.477 6.47695 2 11.9999 2zm-.8437 6.8347c-2.27454 0-4.1251 1.8507-4.1251 4.1253 0 2.2747 1.85056 4.1252 4.1251 4.1252 2.2746 0 4.1252-1.8505 4.1252-4.1252 0-2.2746-1.8506-4.1253-4.1252-4.1253zm0 1.4996c1.4439 0 2.6256 1.1816 2.6256 2.6257 0 1.444-1.1817 2.6256-2.6256 2.6256-1.444 0-2.6257-1.1816-2.6257-2.6256 0-1.4441 1.1817-2.6257 2.6257-2.6257z"/>
            </svg>
          </Button>
        </div>
      </form>
    </Form>
  );
}
