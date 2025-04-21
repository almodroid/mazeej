import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTranslation } from "react-i18next"
import { Moon, Sun } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="focus-visible:ring-0">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("common.toggleTheme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" dir={isRTL ? "rtl" : "ltr"}>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t("common.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t("common.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t("common.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}