import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Search, Briefcase, Star, Users, Globe, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import SearchBar from "@/components/search/search-bar";
import HeroModern from './hero-modern';

export default function HeroSection() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const isRTL = i18n.language === 'ar';

  return (
    <>
      <HeroModern />
      
    </>
  );
}
