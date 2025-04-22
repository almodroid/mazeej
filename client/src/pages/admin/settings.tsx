import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  UserPlus,
  Loader2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Github,
  Plus,
  Trash2,
  Globe,
  Search,
  BarChart,
  Code,
  Settings as SettingsIcon,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAdminSettings } from "@/lib/useAdminSettings";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/layouts/admin-layout";

// Social media platform options with their respective icons
const socialMediaPlatforms = [
  { id: "facebook", name: "Facebook", icon: Facebook },
  { id: "twitter", name: "Twitter", icon: Twitter },
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "youtube", name: "YouTube", icon: Youtube },
  { id: "github", name: "GitHub", icon: Github },
  { id: "snapchat", name: "Snapchat", icon: Globe }, // Use Globe as placeholder
  { id: "tiktok", name: "TikTok", icon: Globe }, // Use Globe as placeholder
  { id: "pexels", name: "Pexels", icon: Globe }, // Use Globe as placeholder
];

// Social media link interface
interface SocialMediaLink {
  id: string;
  platform: string;
  url: string;
}

// SEO Meta interface
interface SeoMetaSettings {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
}

// Google Analytics interface
interface GoogleAnalyticsSettings {
  trackingId: string;
  enableTracking: boolean;
  anonymizeIp: boolean;
}

// Search Console interface
interface SearchConsoleSettings {
  verificationToken: string;
  sitemapUrl: string;
}

export default function AdminSettingsPage() {
  const { settings: adminSettings, isLoading: settingsLoading, saveSettings } = useAdminSettings();
  
  // State for general settings
  const [generalSettings, setGeneralSettings] = useState({
    platformName: "Mazeej Platform",
    platformFee: 5
  });
  
  // New states for pixel/API settings
  const [facebookPixel, setFacebookPixel] = useState("");
  const [snapchatPixel, setSnapchatPixel] = useState("");
  const [tiktokPixel, setTiktokPixel] = useState("");
  const [pexelsApiKey, setPexelsApiKey] = useState("");
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingTestAccounts, setIsCreatingTestAccounts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isRTL = i18n.language === "ar";
  const [activeTab, setActiveTab] = useState("general");
  const isMobile = useIsMobile();
  
  // State for social media links
  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMediaLink[]>([
    { id: "1", platform: "facebook", url: "https://facebook.com/mazeej" },
    { id: "2", platform: "instagram", url: "https://instagram.com/mazeej" },
  ]);
  
  // State for SEO meta settings
  const [seoSettings, setSeoSettings] = useState<SeoMetaSettings>({
    title: "Mazeej - Freelance Platform",
    description: "Connect with top freelancers and find projects in the MENA region",
    keywords: "freelance, projects, MENA, skills, remote work",
    ogTitle: "Mazeej - Freelance Platform",
    ogDescription: "Connect with top freelancers and find projects in the MENA region",
    ogImage: "/og-image.jpg",
    twitterCard: "summary_large_image",
    twitterTitle: "Mazeej - Freelance Platform",
    twitterDescription: "Connect with top freelancers and find projects in the MENA region",
    twitterImage: "/twitter-image.jpg"
  });
  
  // State for Google Analytics settings
  const [analyticsSettings, setAnalyticsSettings] = useState<GoogleAnalyticsSettings>({
    trackingId: "",
    enableTracking: false,
    anonymizeIp: true
  });
  
  // State for Search Console settings
  const [searchConsoleSettings, setSearchConsoleSettings] = useState<SearchConsoleSettings>({
    verificationToken: "",
    sitemapUrl: "/sitemap.xml"
  });

  // Load settings when they're available
  useEffect(() => {
    if (adminSettings) {
      // Update all state from loaded settings
      setGeneralSettings(adminSettings.generalSettings || generalSettings);
      setSeoSettings(adminSettings.seoSettings || seoSettings);
      setAnalyticsSettings(adminSettings.analyticsSettings || analyticsSettings);
      setSearchConsoleSettings(adminSettings.searchConsoleSettings || searchConsoleSettings);
      setSocialMediaLinks(adminSettings.socialMediaLinks || socialMediaLinks);
      setFacebookPixel(adminSettings.facebookPixel || "");
      setSnapchatPixel(adminSettings.snapchatPixel || "");
      setTiktokPixel(adminSettings.tiktokPixel || "");
      setPexelsApiKey(adminSettings.pexelsApiKey || "");
    }
  }, [adminSettings]);

  // Function to create test accounts
  const createTestAccounts = async () => {
    try {
      setIsCreatingTestAccounts(true);
      
      const response = await apiRequest('POST', '/api/create-test-accounts');
      const data = await response.json();
      
      toast({
        title: t("common.success"),
        description: t("admin.testAccountsCreated"),
        variant: "default",
      });
      
      // Refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("admin.testAccountsError"),
        variant: "destructive",
      });
    } finally {
      setIsCreatingTestAccounts(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto py-6">
        <div className={cn(
          "flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
        )}>
          <div>
            <h1 className="text-3xl font-cairo font-bold mb-2 text-foreground">
              {t("auth.admin.settings")}
            </h1>
            <p className="text-muted-foreground">
              {t("auth.admin.settingsDescription", {defaultValue: "Configure platform settings"})}
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-2">
            
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
              {isMobile ? (
                <div className="mb-6">
                  <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full" dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir={isRTL ? 'rtl' : 'ltr'}>
                      <SelectItem value="general">
                        {t("common.generalSettings")}
                      </SelectItem>
                      <SelectItem value="seo">
                        {t("common.seoSettings", {defaultValue: "SEO & Meta"})}
                      </SelectItem>
                      <SelectItem value="analytics">
                        {t("common.analyticsSettings", {defaultValue: "Analytics"})}
                      </SelectItem>
                      <SelectItem value="search-console">
                        {t("common.searchConsole", {defaultValue: "Search Console"})}
                      </SelectItem>
                      <SelectItem value="social">
                        {t("common.socialMedia", {defaultValue: "Social Media"})}
                      </SelectItem>
                      <SelectItem value="pixels">
                        {t("common.pixelsAndApi", {defaultValue: "Pixels & API"})}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <TabsList className="grid grid-cols-6 mb-6" dir={isRTL ? 'rtl' : 'ltr'}>
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    {t("common.generalSettings")}
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t("common.seoSettings", {defaultValue: "SEO & Meta"})}
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart className="h-4 w-4" />
                    {t("common.analyticsSettings", {defaultValue: "Analytics"})}
                  </TabsTrigger>
                  <TabsTrigger value="search-console" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    {t("common.searchConsole", {defaultValue: "Search Console"})}
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    {t("common.socialMedia", {defaultValue: "Social Media"})}
                  </TabsTrigger>
                  <TabsTrigger value="pixels" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    {t("common.pixelsAndApi", {defaultValue: "Pixels & API"})}
                  </TabsTrigger>
                </TabsList>
              )}
              
              <TabsContent value="general" className="space-y-6">
                <div className="grid gap-3">
                  <h3 className="text-lg font-medium">{t("common.generalSettings")}</h3>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("common.platformName")}</label>
                    <Input 
                      value={generalSettings.platformName} 
                      onChange={(e) => setGeneralSettings({...generalSettings, platformName: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("common.platformFee")} (%)</label>
                    <Input 
                      type="number" 
                      value={generalSettings.platformFee} 
                      onChange={(e) => setGeneralSettings({...generalSettings, platformFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="seo" className="space-y-6">
                <div className="grid gap-3">
                  <h3 className="text-lg font-medium">{t("common.seoSettings", {defaultValue: "SEO & Meta Settings"})}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.seoDescription", {defaultValue: "Configure SEO and meta tags for your website"})}
                  </p>
                  
                  <div className="grid gap-4 pt-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">{t("common.siteTitle", {defaultValue: "Site Title"})}</label>
                      <Input 
                        value={seoSettings.title} 
                        onChange={(e) => setSeoSettings({...seoSettings, title: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">{t("common.metaDescription", {defaultValue: "Meta Description"})}</label>
                      <Input 
                        value={seoSettings.description} 
                        onChange={(e) => setSeoSettings({...seoSettings, description: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">{t("admin.metaDescriptionHint", {defaultValue: "Recommended length: 150-160 characters"})}</p>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">{t("common.keywords", {defaultValue: "Keywords"})}</label>
                      <Input 
                        value={seoSettings.keywords} 
                        onChange={(e) => setSeoSettings({...seoSettings, keywords: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">{t("admin.keywordsHint", {defaultValue: "Comma-separated list of keywords"})}</p>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-base font-medium mb-2">{t("common.openGraph", {defaultValue: "Open Graph (Social Sharing)"})}</h4>
                      
                      <div className="grid gap-2 mb-3">
                        <label className="text-sm font-medium">{t("common.ogTitle", {defaultValue: "OG Title"})}</label>
                        <Input 
                          value={seoSettings.ogTitle} 
                          onChange={(e) => setSeoSettings({...seoSettings, ogTitle: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2 mb-3">
                        <label className="text-sm font-medium">{t("common.ogDescription", {defaultValue: "OG Description"})}</label>
                        <Input 
                          value={seoSettings.ogDescription} 
                          onChange={(e) => setSeoSettings({...seoSettings, ogDescription: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">{t("common.ogImage", {defaultValue: "OG Image URL"})}</label>
                        <Input 
                          value={seoSettings.ogImage} 
                          onChange={(e) => setSeoSettings({...seoSettings, ogImage: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="text-base font-medium mb-2">{t("common.twitterCard", {defaultValue: "Twitter Card"})}</h4>
                      
                      <div className="grid gap-2 mb-3">
                        <label className="text-sm font-medium">{t("common.twitterCardType", {defaultValue: "Card Type"})}</label>
                        <select 
                          className="w-full bg-background border border-input rounded-md px-3 py-2"
                          value={seoSettings.twitterCard}
                          onChange={(e) => setSeoSettings({...seoSettings, twitterCard: e.target.value})}
                        >
                          <option value="summary">Summary</option>
                          <option value="summary_large_image">Summary with Large Image</option>
                        </select>
                      </div>
                      
                      <div className="grid gap-2 mb-3">
                        <label className="text-sm font-medium">{t("common.twitterTitle", {defaultValue: "Twitter Title"})}</label>
                        <Input 
                          value={seoSettings.twitterTitle} 
                          onChange={(e) => setSeoSettings({...seoSettings, twitterTitle: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2 mb-3">
                        <label className="text-sm font-medium">{t("common.twitterDescription", {defaultValue: "Twitter Description"})}</label>
                        <Input 
                          value={seoSettings.twitterDescription} 
                          onChange={(e) => setSeoSettings({...seoSettings, twitterDescription: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">{t("common.twitterImage", {defaultValue: "Twitter Image URL"})}</label>
                        <Input 
                          value={seoSettings.twitterImage} 
                          onChange={(e) => setSeoSettings({...seoSettings, twitterImage: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <div className="grid gap-3">
                  <h3 className="text-lg font-medium">{t("common.analyticsSettings", {defaultValue: "Google Analytics Settings"})}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.analyticsDescription", {defaultValue: "Configure Google Analytics for your website"})}
                  </p>
                  
                  <div className="grid gap-4 pt-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">{t("common.gaTrackingId", {defaultValue: "Tracking ID (GA4)"})}</label>
                      <Input 
                        placeholder="G-XXXXXXXXXX" 
                        value={analyticsSettings.trackingId} 
                        onChange={(e) => setAnalyticsSettings({...analyticsSettings, trackingId: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">{t("admin.gaTrackingIdHint", {defaultValue: "Your Google Analytics 4 Measurement ID"})}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        id="enableTracking" 
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={analyticsSettings.enableTracking}
                        onChange={(e) => setAnalyticsSettings({...analyticsSettings, enableTracking: e.target.checked})}
                      />
                      <label htmlFor="enableTracking" className="text-sm font-medium">
                        {t("common.enableTracking", {defaultValue: "Enable Analytics Tracking"})}
                      </label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="anonymizeIp" 
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={analyticsSettings.anonymizeIp}
                        onChange={(e) => setAnalyticsSettings({...analyticsSettings, anonymizeIp: e.target.checked})}
                      />
                      <label htmlFor="anonymizeIp" className="text-sm font-medium">
                        {t("common.anonymizeIp", {defaultValue: "Anonymize IP Addresses"})}
                      </label>
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-md mt-2">
                      <p className="text-sm">
                        {t("admin.analyticsNote", {defaultValue: "Note: Make sure to comply with privacy regulations like GDPR when implementing analytics."})}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="search-console" className="space-y-6">
                <div className="grid gap-3">
                  <h3 className="text-lg font-medium">{t("common.searchConsole", {defaultValue: "Google Search Console"})}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.searchConsoleDescription", {defaultValue: "Configure Google Search Console verification and sitemap settings"})}
                  </p>
                  
                  <div className="grid gap-4 pt-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">{t("common.verificationToken", {defaultValue: "Verification Meta Tag"})}</label>
                      <Input 
                        placeholder="meta tag verification code" 
                        value={searchConsoleSettings.verificationToken} 
                        onChange={(e) => setSearchConsoleSettings({...searchConsoleSettings, verificationToken: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">{t("admin.verificationTokenHint", {defaultValue: "The full meta tag provided by Google Search Console"})}</p>
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">{t("common.sitemapUrl", {defaultValue: "Sitemap URL"})}</label>
                      <Input 
                        placeholder="/sitemap.xml" 
                        value={searchConsoleSettings.sitemapUrl} 
                        onChange={(e) => setSearchConsoleSettings({...searchConsoleSettings, sitemapUrl: e.target.value})}
                      />
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-md mt-2">
                      <p className="text-sm">
                        {t("admin.searchConsoleNote", {defaultValue: "After adding your site to Google Search Console, submit your sitemap URL to help Google index your pages."})}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="social" className="space-y-6">
                <div className="grid gap-3">
                  <h3 className="text-lg font-medium">{t("common.socialMediaLinks", {defaultValue: "Social Media Links"})}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("admin.socialMediaDescription", {defaultValue: "Configure social media links that will be displayed on your website"})}
                  </p>
                  
                  {/* Social media links list */}
                  <div className="space-y-3">
                    {socialMediaLinks.map((link, index) => {
                      const platform = socialMediaPlatforms.find(p => p.id === link.platform);
                      const Icon = platform?.icon || Facebook;
                      
                      return (
                        <div key={link.id} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-muted">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-grow">
                            <select 
                              className="w-full bg-background border border-input rounded-md px-3 py-2 mb-2"
                              value={link.platform}
                              onChange={(e) => {
                                const newLinks = [...socialMediaLinks];
                                newLinks[index].platform = e.target.value;
                                setSocialMediaLinks(newLinks);
                              }}
                            >
                              {socialMediaPlatforms.map(platform => (
                                <option key={platform.id} value={platform.id}>{platform.name}</option>
                              ))}
                            </select>
                            <Input 
                              placeholder="URL" 
                              value={link.url} 
                              onChange={(e) => {
                                const newLinks = [...socialMediaLinks];
                                newLinks[index].url = e.target.value;
                                setSocialMediaLinks(newLinks);
                              }}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="flex-shrink-0"
                            onClick={() => {
                              const newLinks = socialMediaLinks.filter((_, i) => i !== index);
                              setSocialMediaLinks(newLinks);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Add new social media link button */}
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      const newLink: SocialMediaLink = {
                        id: Date.now().toString(),
                        platform: "facebook",
                        url: ""
                      };
                      setSocialMediaLinks([...socialMediaLinks, newLink]);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t("admin.addSocialMedia", {defaultValue: "Add Social Media"})}
                  </Button>
                </div>
              </TabsContent>
              
              {/* Pixel & API Settings Section */}
              <TabsContent value="pixels" className="space-y-6">
                <div className="grid gap-3">
                  <h3 className="text-lg font-medium">{t("common.facebookPixel", {defaultValue: "Facebook Pixel ID"})}</h3>
                  <Input
                    placeholder="1234567890"
                    value={facebookPixel}
                    onChange={e => setFacebookPixel(e.target.value)}
                  />
                  <h3 className="text-lg font-medium">{t("common.snapchatPixel", {defaultValue: "Snapchat Pixel ID"})}</h3>
                  <Input
                    placeholder="Snap Pixel ID"
                    value={snapchatPixel}
                    onChange={e => setSnapchatPixel(e.target.value)}
                  />
                  <h3 className="text-lg font-medium">{t("common.tiktokPixel", {defaultValue: "TikTok Pixel ID"})}</h3>
                  <Input
                    placeholder="TikTok Pixel ID"
                    value={tiktokPixel}
                    onChange={e => setTiktokPixel(e.target.value)}
                  />
                  <h3 className="text-lg font-medium">{t("common.pexelsApiKey", {defaultValue: "Pexels API Key"})}</h3>
                  <Input
                    placeholder="Pexels API Key"
                    value={pexelsApiKey}
                    onChange={e => setPexelsApiKey(e.target.value)}
                  />
                </div>
              </TabsContent>

              <div className="mt-6">
                <Button 
                  className="w-full md:w-auto" 
                  type="button" 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : (
                    t("common.saveChanges")
                  )}
                </Button>
              </div>

              {/* Pixels & API Tab Content */}
              <TabsContent value="pixels" className="space-y-6">
                <div className="grid gap-3">
                  <h3 className="text-lg font-medium">{t("common.pixelsAndApi", {defaultValue: "Pixels & API Settings"})}</h3>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("common.facebookPixel", {defaultValue: "Facebook Pixel ID"})}</label>
                    <Input
                      placeholder="1234567890"
                      value={facebookPixel}
                      onChange={e => setFacebookPixel(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("common.snapchatPixel", {defaultValue: "Snapchat Pixel ID"})}</label>
                    <Input
                      placeholder="Snap Pixel ID"
                      value={snapchatPixel}
                      onChange={e => setSnapchatPixel(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("common.tiktokPixel", {defaultValue: "TikTok Pixel ID"})}</label>
                    <Input
                      placeholder="TikTok Pixel ID"
                      value={tiktokPixel}
                      onChange={e => setTiktokPixel(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("common.pexelsApiKey", {defaultValue: "Pexels API Key"})}</label>
                    <Input
                      placeholder="Pexels API Key"
                      value={pexelsApiKey}
                      onChange={e => setPexelsApiKey(e.target.value)}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    {t("common.pixelsApiHint", {defaultValue: "These values are used for analytics and integrations. Changes take effect after reload."})}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );

  // Save handler
  async function handleSaveSettings() {
    setIsSaving(true);
    try {
      // Collect all settings
      const settingsPayload = {
        generalSettings,
        seoSettings,
        analyticsSettings,
        searchConsoleSettings,
        socialMediaLinks,
        facebookPixel,
        snapchatPixel,
        tiktokPixel,
        pexelsApiKey
      };
      
      // Use the hook's saveSettings method
      const success = await saveSettings(settingsPayload);
      
      if (success) {
        // Show message about reload
        toast({
          title: t('common.success'),
          description: t('common.saveChanges') + ' (Will take effect on next reload)',
          variant: 'default',
        });
      }
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('common.saveChanges'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }
} 