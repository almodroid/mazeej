import React from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MobileFilterDrawerProps {
  children: React.ReactNode;
  activeFiltersCount: number;
  isRTL?: boolean;
}

export default function MobileFilterDrawer({
  children,
  activeFiltersCount,
  isRTL = false
}: MobileFilterDrawerProps) {
  const { t } = useTranslation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 lg:hidden"
        >
          <Filter className="h-4 w-4" />
          {t("filters.title")}
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        side={isRTL ? "right" : "left"}
        className="w-[320px] sm:w-[400px] overflow-y-auto"
      >
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("filters.title")}
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
} 