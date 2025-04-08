import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { FacebookIcon, TwitterIcon, InstagramIcon, LinkedinIcon } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-neutral-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="text-xl font-cairo font-bold">{t("common.appName")}</span>
            </div>
            <p className="text-neutral-400 mb-4">{t("footer.about")}</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white">
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-white">
                <LinkedinIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-cairo font-semibold mb-4">{t("footer.forFreelancers")}</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.howToStart")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.browseProjects")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.earningMethods")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.ratingsReviews")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.premiumAccounts")}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-cairo font-semibold mb-4">{t("footer.forClients")}</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.postProject")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.findFreelancers")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.projectManagement")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.paymentMethods")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.qualityAssurance")}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-cairo font-semibold mb-4">{t("footer.aboutPlatform")}</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.aboutUs")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.termsOfUse")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.privacyPolicy")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.support")}</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white">{t("footer.contactUs")}</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">{t("footer.copyright")}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <img src="https://cdn.worldvectorlogo.com/logos/visa-2.svg" alt="Visa" className="h-8" />
            <img src="https://cdn.worldvectorlogo.com/logos/mastercard-2.svg" alt="MasterCard" className="h-8" />
            <img src="https://is1-ssl.mzstatic.com/image/thumb/Purple122/v4/24/23/b2/2423b2a5-a59c-912f-a5f9-6dec0ab693ef/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/246x0w.webp" alt="Apple Pay" className="h-8" />
            <img src="https://www.aramex.com/themes/aramex/images/svg/payment-methods/mada.svg" alt="Mada" className="h-8" />
          </div>
        </div>
      </div>
    </footer>
  );
}
