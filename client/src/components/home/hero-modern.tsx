import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Briefcase, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SearchBar from '../search/search-bar';

const images = [
  {
    src: 'https://placehold.co/400x500?text=Image+1',
    quote: 'Creativity is intelligence having fun.',
  },
  {
    src: 'https://placehold.co/400x500?text=Image+2',
    quote: 'Collaboration breeds innovation.',
  },
  {
    src: 'https://placehold.co/400x500?text=Image+3',
    quote: 'Quality is not an act, it is a habit.',
  },
];

const stats = [
  { icon: <Users className="w-5 h-5 inline-block mr-1 text-primary" />, value: '+500', label: 'Freelancers' },
  { icon: <Briefcase className="w-5 h-5 inline-block mr-1 text-primary" />, value: '+150', label: 'Clients' },
  { icon: <Star className="w-5 h-5 inline-block mr-1 text-primary" />, value: '90%', label: 'Satisfaction' },
];

export default function HeroModern() {
  const [current, setCurrent] = useState(0);
  const { t, i18n } = useTranslation();
  const nextSlide = () => setCurrent((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);
  const isRTL = i18n.language === 'ar';

  return (
    <section className="w-full bg-[#f8fafc] dark:bg-background py-8 md:py-16 px-2 md:px-0 animate-fade-in relative overflow-hidden">
      {/* Decorative Logo Background */}
      <svg
        className="absolute bottom-[-80px] right-[-120px] w-[500px] h-[300px] md:w-[700px] md:h-[420px] opacity-10 pointer-events-none z-0"
        viewBox="0 0 630 351"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g>
          <path d="M0 175.5C0 78.5856 78.5856 0 175.5 0C272.414 0 351 78.5856 351 175.5C351 272.414 272.414 351 175.5 351C78.5856 351 0 272.414 0 175.5ZM175.5 40C100.383 40 40 100.383 40 175.5C40 250.617 100.383 311 175.5 311C250.617 311 311 250.617 311 175.5C311 100.383 250.617 40 175.5 40Z" fill="url(#paint0_linear)"/>
          <path d="M630 175.5C630 272.414 551.414 351 454.5 351C357.586 351 279 272.414 279 175.5C279 78.5856 357.586 0 454.5 0C551.414 0 630 78.5856 630 175.5ZM454.5 40C529.617 40 590 100.383 590 175.5C590 250.617 529.617 311 454.5 311C379.383 311 319 250.617 319 175.5C319 100.383 379.383 40 454.5 40Z" fill="url(#paint1_linear)"/>
        </g>
        <defs>
          <linearGradient id="paint0_linear" x1="0" y1="0" x2="351" y2="351" gradientUnits="userSpaceOnUse">
            <stop stop-color="#1CA7A6"/>
            <stop offset="1" stop-color="#3F2B96"/>
          </linearGradient>
          <linearGradient id="paint1_linear" x1="279" y1="0" x2="630" y2="351" gradientUnits="userSpaceOnUse">
            <stop stop-color="#3F2B96"/>
            <stop offset="1" stop-color="#1CA7A6"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="container mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Left: Hero Content */}
        <div className="flex-1 w-full max-w-xl">
          <h1 className="text-3xl md:text-5xl font-extrabold text-primary mb-4 leading-tight">
            {isRTL ? 'ابدأ رحلتك مع مزيج' : 'Start Your Journey with Mazeej'}
          </h1>
          <p className="text-lg md:text-xl text-primary max-w-2xl mb-8">
            {isRTL ? (
              <>
                تبحث عن مبدعين سعوديين ينجزون طلبك؟<br />
                أو أنت مستقل جاهز يقدّم خدماته؟<br />
                في صُنّاع مزيج، نربط أفضل الكفاءات بأفضل الفرص
              </>
            ) : (
              <>
                Looking for talented Saudis to get your job done?<br />
                Or are you a freelancer ready to offer your services?<br />
                At Mazeej, we connect the best talents with the best opportunities.
              </>
            )}
          </p>
          <div className="w-full max-w-2xl mx-auto mb-4">
            <div className="w-full">
              <SearchBar />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto m-4">
            <button className="flex-1 py-3 px-5 rounded-md bg-primary text-white hover:bg-secondary hover:shadow-lg hover:transition-shadow transition-colors text-md shadow-lg">
              <a href="/auth?register=true">{t('hero.clientButton')}</a>
            </button>
            <button className="flex-1 py-3 px-4 rounded-md bg-secondary text-white hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg hover:transition-shadow transition-colors text-md shadow-lg">
              {t('hero.freelancerButton')}
            </button>
          </div>
        </div>
        {/* Right: 3D Carousel Card */}
        <div className="flex-1 w-full flex justify-center items-center">
          <div className="relative rounded-2xl shadow-2xl p-4 md:p-8 flex flex-col items-center min-h-[420px] min-w-[320px] max-w-[420px] overflow-hidden">
            {/* Carousel Controls */}
            <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary rounded-full p-2 shadow transition"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-primary rounded-full p-2 shadow transition"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg></button>
            {/* 3D Rotating Image (now fade left) */}
            <div className="relative w-[260px] h-[340px] md:w-[320px] md:h-[400px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.img
                  key={images[current].src}
                  src={images[current].src}
                  alt="Hero Slide"
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 60, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeInOut' }}
                  className="rounded-xl shadow-xl object-cover w-full h-full"
                  style={{ backfaceVisibility: 'hidden' }}
                />
              </AnimatePresence>
              {/* Animated Quote */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={images[current].quote}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="absolute left-0 bottom-4 md:bottom-6 bg-white/90 dark:bg-zinc-900/90 text-primary dark:text-primary px-4 py-2 rounded-lg shadow-lg text-sm md:text-base font-semibold max-w-[80%]"
                >
                  {images[current].quote}
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Floating Info Badges */}
            <div className="absolute top-6 right-6 bg-white/90 dark:bg-zinc-900/90 px-4 py-2 rounded-lg shadow text-primary text-xs font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> 500+ Job Vacancy
            </div>
            <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-zinc-900/90 px-4 py-2 rounded-lg shadow text-primary text-xs font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" /> 50k+ Member Active
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 