import { db } from "../db";
import { badges } from "../../shared/schema";

async function seedBadges() {
  console.log("🌱 Seeding badges...");

  try {
    // Plan-based badges
    const planBadges = [
      {
        name: "Wameed",
        description: "Free plan member",
        icon: "🌟",
        color: "bg-blue-500 text-white",
        type: "plan" as const,
        planKey: "wameed",
        isActive: true,
        translations: {
          en: {
            name: "Wameed",
            description: "Free plan member"
          },
          ar: {
            name: "وامد",
            description: "عضو الخطة المجانية"
          }
        }
      },
      {
        name: "Nabd",
        description: "Basic plan member",
        icon: "⭐",
        color: "bg-yellow-500 text-white",
        type: "plan" as const,
        planKey: "nabd",
        isActive: true,
        translations: {
          en: {
            name: "Nabd",
            description: "Basic plan member"
          },
          ar: {
            name: "نبض",
            description: "عضو الخطة الأساسية"
          }
        }
      },
      {
        name: "Athar",
        description: "Professional plan member",
        icon: "💎",
        color: "bg-purple-500 text-white",
        type: "plan" as const,
        planKey: "athar",
        isActive: true,
        translations: {
          en: {
            name: "Athar",
            description: "Professional plan member"
          },
          ar: {
            name: "أثر",
            description: "عضو الخطة الاحترافية"
          }
        }
      },
      {
        name: "Tamweel",
        description: "Premium plan member",
        icon: "👑",
        color: "bg-green-500 text-white",
        type: "plan" as const,
        planKey: "tamweel",
        isActive: true,
        translations: {
          en: {
            name: "Tamweel",
            description: "Premium plan member"
          },
          ar: {
            name: "تمويل",
            description: "عضو الخطة المميزة"
          }
        }
      }
    ];

    // Custom badges
    const customBadges = [
      {
        name: "Top Performer",
        description: "Awarded to freelancers with exceptional performance",
        icon: "🏆",
        color: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white",
        type: "custom" as const,
        planKey: null,
        isActive: true,
        translations: {
          en: {
            name: "Top Performer",
            description: "Awarded to freelancers with exceptional performance"
          },
          ar: {
            name: "أداء متميز",
            description: "ممنوح للمستقلين ذوي الأداء الاستثنائي"
          }
        }
      },
      {
        name: "Verified Expert",
        description: "Certified expert in their field",
        icon: "✅",
        color: "bg-green-600 text-white",
        type: "custom" as const,
        planKey: null,
        isActive: true,
        translations: {
          en: {
            name: "Verified Expert",
            description: "Certified expert in their field"
          },
          ar: {
            name: "خبير موثق",
            description: "خبير معتمد في مجاله"
          }
        }
      },
      {
        name: "Fast Delivery",
        description: "Known for quick project delivery",
        icon: "⚡",
        color: "bg-blue-600 text-white",
        type: "custom" as const,
        planKey: null,
        isActive: true,
        translations: {
          en: {
            name: "Fast Delivery",
            description: "Known for quick project delivery"
          },
          ar: {
            name: "تسليم سريع",
            description: "معروف بالتسليم السريع للمشاريع"
          }
        }
      },
      {
        name: "Client Favorite",
        description: "Highly rated by clients",
        icon: "❤️",
        color: "bg-pink-500 text-white",
        type: "custom" as const,
        planKey: null,
        isActive: true,
        translations: {
          en: {
            name: "Client Favorite",
            description: "Highly rated by clients"
          },
          ar: {
            name: "مفضل العملاء",
            description: "تقييم عالي من العملاء"
          }
        }
      }
    ];

    // Insert all badges
    const allBadges = [...planBadges, ...customBadges];
    
    for (const badge of allBadges) {
      await db.insert(badges).values(badge).onConflictDoNothing();
    }

    console.log("✅ Badges seeded successfully!");
    console.log(`📊 Created ${allBadges.length} badges (${planBadges.length} plan-based, ${customBadges.length} custom)`);

  } catch (error) {
    console.error("❌ Error seeding badges:", error);
    throw error;
  }
}

// Run the seed function
seedBadges()
  .then(() => {
    console.log("🎉 Badge seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Badge seeding failed:", error);
    process.exit(1);
  }); 