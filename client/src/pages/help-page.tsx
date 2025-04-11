import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import ChatWidget from "@/components/chat/chat-widget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Mail, MessageSquare, Phone } from "lucide-react";

export default function HelpPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Ensure the document has the correct RTL direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow flex">
        <DashboardSidebar />
        <main className="flex-grow p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-cairo font-bold mb-6">
              {t("help.title")}
            </h1>

            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <Input
                  className="pl-10"
                  placeholder={t("help.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="faq" className="w-full">
              <TabsList>
                <TabsTrigger value="faq">{t("help.faq")}</TabsTrigger>
                <TabsTrigger value="contact">{t("help.contactUs")}</TabsTrigger>
                <TabsTrigger value="guides">{t("help.guides")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="faq" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("help.frequentlyAskedQuestions")}</CardTitle>
                    <CardDescription>{t("help.faqDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>{t("help.faq1")}</AccordionTrigger>
                        <AccordionContent>
                          {t("help.faq1Answer")}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>{t("help.faq2")}</AccordionTrigger>
                        <AccordionContent>
                          {t("help.faq2Answer")}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>{t("help.faq3")}</AccordionTrigger>
                        <AccordionContent>
                          {t("help.faq3Answer")}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4">
                        <AccordionTrigger>{t("help.faq4")}</AccordionTrigger>
                        <AccordionContent>
                          {t("help.faq4Answer")}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5">
                        <AccordionTrigger>{t("help.faq5")}</AccordionTrigger>
                        <AccordionContent>
                          {t("help.faq5Answer")}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contact" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("help.contactSupport")}</CardTitle>
                    <CardDescription>{t("help.contactDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center">
                            <div className="bg-primary/10 p-3 rounded-full mb-4">
                              <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium mb-2">{t("help.email")}</h3>
                            <p className="text-sm text-neutral-500 mb-4">{t("help.emailDescription")}</p>
                            <Button variant="outline" size="sm">
                              support@mazeej.com
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center">
                            <div className="bg-primary/10 p-3 rounded-full mb-4">
                              <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium mb-2">{t("help.liveChat")}</h3>
                            <p className="text-sm text-neutral-500 mb-4">{t("help.liveChatDescription")}</p>
                            <Button variant="outline" size="sm" onClick={() => setChatOpen(true)}>
                              {t("help.startChat")}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center">
                            <div className="bg-primary/10 p-3 rounded-full mb-4">
                              <Phone className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-medium mb-2">{t("help.phone")}</h3>
                            <p className="text-sm text-neutral-500 mb-4">{t("help.phoneDescription")}</p>
                            <Button variant="outline" size="sm">
                              +966 123 456 789
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="guides" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("help.userGuides")}</CardTitle>
                    <CardDescription>{t("help.guidesDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2">{t("help.guide1")}</h3>
                          <p className="text-sm text-neutral-500">{t("help.guide1Description")}</p>
                          <Button variant="link" className="px-0 mt-2">
                            {t("help.readMore")} →
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2">{t("help.guide2")}</h3>
                          <p className="text-sm text-neutral-500">{t("help.guide2Description")}</p>
                          <Button variant="link" className="px-0 mt-2">
                            {t("help.readMore")} →
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2">{t("help.guide3")}</h3>
                          <p className="text-sm text-neutral-500">{t("help.guide3Description")}</p>
                          <Button variant="link" className="px-0 mt-2">
                            {t("help.readMore")} →
                          </Button>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-medium mb-2">{t("help.guide4")}</h3>
                          <p className="text-sm text-neutral-500">{t("help.guide4Description")}</p>
                          <Button variant="link" className="px-0 mt-2">
                            {t("help.readMore")} →
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <Footer />
      <ChatWidget isOpen={chatOpen} setIsOpen={setChatOpen} />
    </div>
  );
}