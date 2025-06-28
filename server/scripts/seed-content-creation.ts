import { db } from "../db";
import { categories, skills } from "@shared/schema";
import { eq } from "drizzle-orm";

// Content Creation Categories and Skills
const contentCreationData = [
  {
    category: {
      name: "إنشاء المحتوى",
      icon: "edit-3",
      freelancerCount: 1200,
      translations: {
        en: "Content Creation",
        ar: "إنشاء المحتوى"
      }
    },
    skills: [
      {
        name: "كتابة المقالات",
        translations: {
          en: "Article Writing",
          ar: "كتابة المقالات"
        }
      },
      {
        name: "كتابة المحتوى التسويقي",
        translations: {
          en: "Marketing Content Writing",
          ar: "كتابة المحتوى التسويقي"
        }
      },
      {
        name: "كتابة الإعلانات",
        translations: {
          en: "Copywriting",
          ar: "كتابة الإعلانات"
        }
      },
      {
        name: "كتابة المحتوى التقني",
        translations: {
          en: "Technical Writing",
          ar: "كتابة المحتوى التقني"
        }
      },
      {
        name: "كتابة المحتوى التعليمي",
        translations: {
          en: "Educational Content Writing",
          ar: "كتابة المحتوى التعليمي"
        }
      },
      {
        name: "كتابة المحتوى الإبداعي",
        translations: {
          en: "Creative Writing",
          ar: "كتابة المحتوى الإبداعي"
        }
      }
    ]
  },
  {
    category: {
      name: "إدارة وسائل التواصل الاجتماعي",
      icon: "share-2",
      freelancerCount: 950,
      translations: {
        en: "Social Media Management",
        ar: "إدارة وسائل التواصل الاجتماعي"
      }
    },
    skills: [
      {
        name: "إدارة حسابات فيسبوك",
        translations: {
          en: "Facebook Management",
          ar: "إدارة حسابات فيسبوك"
        }
      },
      {
        name: "إدارة حسابات إنستغرام",
        translations: {
          en: "Instagram Management",
          ar: "إدارة حسابات إنستغرام"
        }
      },
      {
        name: "إدارة حسابات تويتر",
        translations: {
          en: "Twitter Management",
          ar: "إدارة حسابات تويتر"
        }
      },
      {
        name: "إدارة حسابات تيك توك",
        translations: {
          en: "TikTok Management",
          ar: "إدارة حسابات تيك توك"
        }
      },
      {
        name: "إدارة حسابات لينكد إن",
        translations: {
          en: "LinkedIn Management",
          ar: "إدارة حسابات لينكد إن"
        }
      },
      {
        name: "إدارة حسابات يوتيوب",
        translations: {
          en: "YouTube Management",
          ar: "إدارة حسابات يوتيوب"
        }
      },
      {
        name: "استراتيجية وسائل التواصل الاجتماعي",
        translations: {
          en: "Social Media Strategy",
          ar: "استراتيجية وسائل التواصل الاجتماعي"
        }
      },
      {
        name: "تحليل أداء وسائل التواصل الاجتماعي",
        translations: {
          en: "Social Media Analytics",
          ar: "تحليل أداء وسائل التواصل الاجتماعي"
        }
      }
    ]
  },
  {
    category: {
      name: "تصميم المحتوى المرئي",
      icon: "image",
      freelancerCount: 800,
      translations: {
        en: "Visual Content Design",
        ar: "تصميم المحتوى المرئي"
      }
    },
    skills: [
      {
        name: "تصميم المنشورات",
        translations: {
          en: "Post Design",
          ar: "تصميم المنشورات"
        }
      },
      {
        name: "تصميم الشعارات",
        translations: {
          en: "Logo Design",
          ar: "تصميم الشعارات"
        }
      },
      {
        name: "تصميم البانرات",
        translations: {
          en: "Banner Design",
          ar: "تصميم البانرات"
        }
      },
      {
        name: "تصميم الإنفوجرافيك",
        translations: {
          en: "Infographic Design",
          ar: "تصميم الإنفوجرافيك"
        }
      },
      {
        name: "تصميم الكتب الإلكترونية",
        translations: {
          en: "E-book Design",
          ar: "تصميم الكتب الإلكترونية"
        }
      },
      {
        name: "تصميم العروض التقديمية",
        translations: {
          en: "Presentation Design",
          ar: "تصميم العروض التقديمية"
        }
      },
      {
        name: "تصميم الكروت الشخصية",
        translations: {
          en: "Business Card Design",
          ar: "تصميم الكروت الشخصية"
        }
      }
    ]
  },
  {
    category: {
      name: "إنتاج الفيديو",
      icon: "video",
      freelancerCount: 650,
      translations: {
        en: "Video Production",
        ar: "إنتاج الفيديو"
      }
    },
    skills: [
      {
        name: "تصوير الفيديو",
        translations: {
          en: "Video Shooting",
          ar: "تصوير الفيديو"
        }
      },
      {
        name: "مونتاج الفيديو",
        translations: {
          en: "Video Editing",
          ar: "مونتاج الفيديو"
        }
      },
      {
        name: "إنتاج فيديوهات تعليمية",
        translations: {
          en: "Educational Video Production",
          ar: "إنتاج فيديوهات تعليمية"
        }
      },
      {
        name: "إنتاج فيديوهات تسويقية",
        translations: {
          en: "Marketing Video Production",
          ar: "إنتاج فيديوهات تسويقية"
        }
      },
      {
        name: "إنتاج فيديوهات للتواصل الاجتماعي",
        translations: {
          en: "Social Media Video Production",
          ar: "إنتاج فيديوهات للتواصل الاجتماعي"
        }
      },
      {
        name: "إنتاج فيديوهات الشركات",
        translations: {
          en: "Corporate Video Production",
          ar: "إنتاج فيديوهات الشركات"
        }
      },
      {
        name: "إنتاج فيديوهات قصيرة",
        translations: {
          en: "Short Video Production",
          ar: "إنتاج فيديوهات قصيرة"
        }
      }
    ]
  },
  {
    category: {
      name: "التسويق الرقمي",
      icon: "trending-up",
      freelancerCount: 1100,
      translations: {
        en: "Digital Marketing",
        ar: "التسويق الرقمي"
      }
    },
    skills: [
      {
        name: "التسويق عبر البريد الإلكتروني",
        translations: {
          en: "Email Marketing",
          ar: "التسويق عبر البريد الإلكتروني"
        }
      },
      {
        name: "التسويق عبر محركات البحث",
        translations: {
          en: "Search Engine Marketing",
          ar: "التسويق عبر محركات البحث"
        }
      },
      {
        name: "تحسين محركات البحث",
        translations: {
          en: "SEO",
          ar: "تحسين محركات البحث"
        }
      },
      {
        name: "التسويق عبر الإعلانات المدفوعة",
        translations: {
          en: "Paid Advertising",
          ar: "التسويق عبر الإعلانات المدفوعة"
        }
      },
      {
        name: "التسويق بالمحتوى",
        translations: {
          en: "Content Marketing",
          ar: "التسويق بالمحتوى"
        }
      },
      {
        name: "التسويق عبر المؤثرين",
        translations: {
          en: "Influencer Marketing",
          ar: "التسويق عبر المؤثرين"
        }
      },
      {
        name: "تحليل البيانات التسويقية",
        translations: {
          en: "Marketing Analytics",
          ar: "تحليل البيانات التسويقية"
        }
      }
    ]
  },
  {
    category: {
      name: "الترجمة واللغات",
      icon: "globe",
      freelancerCount: 750,
      translations: {
        en: "Translation & Languages",
        ar: "الترجمة واللغات"
      }
    },
    skills: [
      {
        name: "الترجمة من العربية إلى الإنجليزية",
        translations: {
          en: "Arabic to English Translation",
          ar: "الترجمة من العربية إلى الإنجليزية"
        }
      },
      {
        name: "الترجمة من الإنجليزية إلى العربية",
        translations: {
          en: "English to Arabic Translation",
          ar: "الترجمة من الإنجليزية إلى العربية"
        }
      },
      {
        name: "ترجمة المحتوى التقني",
        translations: {
          en: "Technical Translation",
          ar: "ترجمة المحتوى التقني"
        }
      },
      {
        name: "ترجمة المحتوى الأدبي",
        translations: {
          en: "Literary Translation",
          ar: "ترجمة المحتوى الأدبي"
        }
      },
      {
        name: "ترجمة المحتوى التجاري",
        translations: {
          en: "Business Translation",
          ar: "ترجمة المحتوى التجاري"
        }
      },
      {
        name: "المراجعة اللغوية",
        translations: {
          en: "Language Review",
          ar: "المراجعة اللغوية"
        }
      },
      {
        name: "التدقيق اللغوي",
        translations: {
          en: "Proofreading",
          ar: "التدقيق اللغوي"
        }
      }
    ]
  }
];

async function seedContentCreation() {
  console.log("🌱 Starting content creation seeding...");

  try {
    for (const data of contentCreationData) {
      // Check if category already exists
      const existingCategory = await db
        .select()
        .from(categories)
        .where(eq(categories.name, data.category.name))
        .limit(1);

      let categoryId: number;

      if (existingCategory.length === 0) {
        // Create new category
        const [newCategory] = await db
          .insert(categories)
          .values({
            name: data.category.name,
            icon: data.category.icon,
            freelancerCount: data.category.freelancerCount,
            translations: data.category.translations
          })
          .returning();

        categoryId = newCategory.id;
        console.log(`✅ Created category: ${data.category.name}`);
      } else {
        categoryId = existingCategory[0].id;
        console.log(`ℹ️  Category already exists: ${data.category.name}`);
      }

      // Create skills for this category
      for (const skillData of data.skills) {
        // Check if skill already exists
        const existingSkill = await db
          .select()
          .from(skills)
          .where(eq(skills.name, skillData.name))
          .limit(1);

        if (existingSkill.length === 0) {
          // Create new skill
          await db
            .insert(skills)
            .values({
              name: skillData.name,
              categoryId: categoryId,
              translations: skillData.translations
            });

          console.log(`  ✅ Created skill: ${skillData.name}`);
        } else {
          console.log(`  ℹ️  Skill already exists: ${skillData.name}`);
        }
      }
    }

    console.log("🎉 Content creation seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding content creation data:", error);
    throw error;
  }
}

// Run the seeding function
seedContentCreation()
  .then(() => {
    console.log("✅ Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }); 