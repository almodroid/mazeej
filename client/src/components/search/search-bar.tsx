import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function SearchBar() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const isRTL = i18n.language === "ar";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="flex items-center shadow-2xl rounded-md border border-input bg-white/80 dark:bg-card/90 overflow-hidden">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("common.searchPlaceholder", { defaultValue: isRTL ? "ابحث عن مستقل، مهارة، أو فئة..." : "Search freelancer, skill, or category..." })}
          className={`py-3 px-4 flex-1 bg-transparent border-0 focus:outline-none text-primary placeholder:text-primary ${isRTL ? "text-right" : "text-left"}`}
        />
        <button className="py-2 px-8 mx-1 flex-shrink-0 bg-primary text-white rounded-md hover:bg-secondary hover:text-white transition-colors text-md shadow-lg">
          {t("common.searchButton", { defaultValue: isRTL ? "بحث" : "Search" })}
        </button>
      </div>
    </form>
  );
}