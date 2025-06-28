import { db } from '../db';
import { exerciseCategories, exercises, skills, categories } from '@shared/schema';

async function seedExercises() {
  console.log('🌱 Seeding exercise data...');

  try {
    // Get existing skills and categories
    const existingSkills = await db.select().from(skills);
    const existingCategories = await db.select().from(categories);

    if (existingSkills.length === 0 || existingCategories.length === 0) {
      console.log('❌ No skills or categories found. Please seed them first.');
      return;
    }

    // Create exercise categories
    const exerciseCategoryData = [
      {
        name: 'Web Development',
        nameAr: 'تطوير الويب',
        description: 'Exercises for web development skills',
        descriptionAr: 'تمارين لمهارات تطوير الويب',
        icon: '🌐',
        color: '#3B82F6',
        order: 1,
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: 'Mobile Development',
        nameAr: 'تطوير الجوال',
        description: 'Exercises for mobile app development',
        descriptionAr: 'تمارين لتطوير تطبيقات الجوال',
        icon: '📱',
        color: '#10B981',
        order: 2,
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: 'Design',
        nameAr: 'التصميم',
        description: 'Exercises for design and UI/UX skills',
        descriptionAr: 'تمارين لمهارات التصميم وواجهة المستخدم',
        icon: '🎨',
        color: '#F59E0B',
        order: 3,
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: 'Content Creation',
        nameAr: 'إنشاء المحتوى',
        description: 'Exercises for content creation and writing',
        descriptionAr: 'تمارين لإنشاء المحتوى والكتابة',
        icon: '✍️',
        color: '#8B5CF6',
        order: 4,
        isActive: true,
        createdAt: new Date(),
      },
      {
        name: 'Digital Marketing',
        nameAr: 'التسويق الرقمي',
        description: 'Exercises for digital marketing skills',
        descriptionAr: 'تمارين لمهارات التسويق الرقمي',
        icon: '📈',
        color: '#EF4444',
        order: 5,
        isActive: true,
        createdAt: new Date(),
      },
    ];

    const createdCategories = await db.insert(exerciseCategories).values(exerciseCategoryData).returning();
    console.log(`✅ Created ${createdCategories.length} exercise categories`);

    // Create sample exercises
    const exerciseData = [
      // Web Development Exercises
      {
        title: 'Build a Responsive Landing Page',
        titleAr: 'إنشاء صفحة هبوط متجاوبة',
        description: 'Create a modern, responsive landing page for a fictional product or service. Use HTML, CSS, and JavaScript to build an interactive page with smooth animations and mobile-first design.',
        descriptionAr: 'أنشئ صفحة هبوط حديثة ومتجاوبة لمنتج أو خدمة خيالية. استخدم HTML و CSS و JavaScript لبناء صفحة تفاعلية مع رسوم متحركة سلسة وتصميم يركز على الجوال.',
        categoryId: createdCategories[0].id,
        skillId: existingSkills.find(s => s.name.toLowerCase().includes('html'))?.id || existingSkills[0].id,
        difficulty: 'beginner',
        estimatedHours: 4,
        budget: 80,
        requirements: [
          'Use semantic HTML5 elements',
          'Implement responsive design with CSS Grid/Flexbox',
          'Add smooth scroll animations',
          'Include a contact form with validation',
          'Optimize for mobile devices'
        ],
        requirementsAr: [
          'استخدم عناصر HTML5 الدلالية',
          'طبق التصميم المتجاوب مع CSS Grid/Flexbox',
          'أضف رسوم متحركة للتمرير السلس',
          'أضف نموذج اتصال مع التحقق من الصحة',
          'حسّن للأجهزة المحمولة'
        ],
        deliverables: [
          'Complete HTML structure',
          'Responsive CSS styles',
          'JavaScript functionality',
          'Mobile-optimized design',
          'Cross-browser compatibility'
        ],
        deliverablesAr: [
          'هيكل HTML كامل',
          'أنماط CSS متجاوبة',
          'وظائف JavaScript',
          'تصميم محسّن للجوال',
          'توافق مع مختلف المتصفحات'
        ],
        aiGenerated: false,
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        title: 'Create a REST API with Node.js',
        titleAr: 'إنشاء واجهة برمجة REST مع Node.js',
        description: 'Build a RESTful API using Node.js, Express, and MongoDB. Implement CRUD operations, authentication, and data validation for a blog or e-commerce system.',
        descriptionAr: 'أنشئ واجهة برمجة RESTful باستخدام Node.js و Express و MongoDB. طبق عمليات CRUD والمصادقة والتحقق من صحة البيانات لنظام مدونة أو تجارة إلكترونية.',
        categoryId: createdCategories[0].id,
        skillId: existingSkills.find(s => s.name.toLowerCase().includes('node'))?.id || existingSkills[0].id,
        difficulty: 'intermediate',
        estimatedHours: 8,
        budget: 150,
        requirements: [
          'Set up Express.js server',
          'Implement MongoDB connection',
          'Create RESTful endpoints',
          'Add JWT authentication',
          'Implement input validation',
          'Add error handling middleware'
        ],
        requirementsAr: [
          'إعداد خادم Express.js',
          'تنفيذ اتصال MongoDB',
          'إنشاء نقاط نهاية RESTful',
          'إضافة مصادقة JWT',
          'تنفيذ التحقق من صحة المدخلات',
          'إضافة معالجة الأخطاء'
        ],
        deliverables: [
          'Complete API documentation',
          'Authentication system',
          'Database models',
          'Error handling',
          'Testing endpoints'
        ],
        deliverablesAr: [
          'توثيق API كامل',
          'نظام المصادقة',
          'نماذج قاعدة البيانات',
          'معالجة الأخطاء',
          'اختبار نقاط النهاية'
        ],
        aiGenerated: false,
        isActive: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Mobile Development Exercises
      {
        title: 'Build a React Native Todo App',
        titleAr: 'إنشاء تطبيق مهام React Native',
        description: 'Create a cross-platform todo application using React Native. Implement local storage, state management, and smooth animations for a polished user experience.',
        descriptionAr: 'أنشئ تطبيق مهام متعدد المنصات باستخدام React Native. طبق التخزين المحلي وإدارة الحالة والرسوم المتحركة السلسة لتجربة مستخدم مثالية.',
        categoryId: createdCategories[1].id,
        skillId: existingSkills.find(s => s.name.toLowerCase().includes('react'))?.id || existingSkills[0].id,
        difficulty: 'beginner',
        estimatedHours: 6,
        budget: 120,
        requirements: [
          'Set up React Native project',
          'Implement todo CRUD operations',
          'Add local storage with AsyncStorage',
          'Create smooth animations',
          'Implement dark/light theme',
          'Add swipe gestures'
        ],
        requirementsAr: [
          'إعداد مشروع React Native',
          'تنفيذ عمليات CRUD للمهام',
          'إضافة التخزين المحلي مع AsyncStorage',
          'إنشاء رسوم متحركة سلسة',
          'تنفيذ السمة الداكنة/الفاتحة',
          'إضافة إيماءات السحب'
        ],
        deliverables: [
          'Working iOS/Android app',
          'Local data persistence',
          'Smooth animations',
          'Theme switching',
          'Gesture handling'
        ],
        deliverablesAr: [
          'تطبيق iOS/Android يعمل',
          'استمرارية البيانات المحلية',
          'رسوم متحركة سلسة',
          'تبديل السمات',
          'معالجة الإيماءات'
        ],
        aiGenerated: false,
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Design Exercises
      {
        title: 'Design a Mobile App UI Kit',
        titleAr: 'تصميم مجموعة واجهة تطبيق جوال',
        description: 'Create a comprehensive UI kit for a mobile application. Design components, icons, and layouts that follow modern design principles and accessibility guidelines.',
        descriptionAr: 'أنشئ مجموعة شاملة لواجهة تطبيق جوال. صمم المكونات والأيقونات والتخطيطات التي تتبع مبادئ التصميم الحديثة وإرشادات إمكانية الوصول.',
        categoryId: createdCategories[2].id,
        skillId: existingSkills.find(s => s.name.toLowerCase().includes('ui') || s.name.toLowerCase().includes('design'))?.id || existingSkills[0].id,
        difficulty: 'intermediate',
        estimatedHours: 10,
        budget: 200,
        requirements: [
          'Design system with color palette',
          'Create component library',
          'Design custom icons',
          'Implement accessibility features',
          'Create responsive layouts',
          'Add micro-interactions'
        ],
        requirementsAr: [
          'نظام تصميم مع لوحة ألوان',
          'إنشاء مكتبة مكونات',
          'تصميم أيقونات مخصصة',
          'تنفيذ ميزات إمكانية الوصول',
          'إنشاء تخطيطات متجاوبة',
          'إضافة التفاعلات الصغيرة'
        ],
        deliverables: [
          'Complete design system',
          'Component library',
          'Icon set',
          'Style guide',
          'Prototype files'
        ],
        deliverablesAr: [
          'نظام تصميم كامل',
          'مكتبة المكونات',
          'مجموعة الأيقونات',
          'دليل الأنماط',
          'ملفات النموذج الأولي'
        ],
        aiGenerated: false,
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Content Creation Exercises
      {
        title: 'Write a Technical Blog Post',
        titleAr: 'كتابة مقال تقني للمدونة',
        description: 'Write a comprehensive technical blog post about a programming concept, framework, or best practice. Include code examples, diagrams, and practical tips.',
        descriptionAr: 'اكتب مقال تقني شامل عن مفهوم برمجي أو إطار عمل أو أفضل الممارسات. أضف أمثلة كود ورسوم بيانية ونصائح عملية.',
        categoryId: createdCategories[3].id,
        skillId: existingSkills.find(s => s.name.toLowerCase().includes('writing') || s.name.toLowerCase().includes('content'))?.id || existingSkills[0].id,
        difficulty: 'beginner',
        estimatedHours: 3,
        budget: 60,
        requirements: [
          'Choose a relevant technical topic',
          'Research and gather information',
          'Write clear, engaging content',
          'Include code examples',
          'Add relevant images/diagrams',
          'Optimize for SEO'
        ],
        requirementsAr: [
          'اختر موضوع تقني ذا صلة',
          'ابحث واجمع المعلومات',
          'اكتب محتوى واضح وجذاب',
          'أضف أمثلة كود',
          'أضف صور/رسوم بيانية ذات صلة',
          'حسّن لمحركات البحث'
        ],
        deliverables: [
          '1500+ word article',
          'Code examples',
          'Visual aids',
          'SEO optimization',
          'Proofread content'
        ],
        deliverablesAr: [
          'مقال 1500+ كلمة',
          'أمثلة كود',
          'وسائل مساعدة بصرية',
          'تحسين محركات البحث',
          'محتوى منقح'
        ],
        aiGenerated: false,
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Digital Marketing Exercises
      {
        title: 'Create a Social Media Campaign',
        titleAr: 'إنشاء حملة وسائل التواصل الاجتماعي',
        description: 'Design and plan a complete social media marketing campaign for a product or service. Include content strategy, visual assets, and performance metrics.',
        descriptionAr: 'صمم وخطط حملة تسويق وسائل التواصل الاجتماعي الكاملة لمنتج أو خدمة. أضف استراتيجية المحتوى والأصول البصرية ومقاييس الأداء.',
        categoryId: createdCategories[4].id,
        skillId: existingSkills.find(s => s.name.toLowerCase().includes('marketing') || s.name.toLowerCase().includes('social'))?.id || existingSkills[0].id,
        difficulty: 'intermediate',
        estimatedHours: 8,
        budget: 160,
        requirements: [
          'Define target audience',
          'Create content calendar',
          'Design visual assets',
          'Write engaging copy',
          'Plan hashtag strategy',
          'Set up tracking metrics'
        ],
        requirementsAr: [
          'حدد الجمهور المستهدف',
          'أنشئ تقويم المحتوى',
          'صمم الأصول البصرية',
          'اكتب نسخة جذابة',
          'خطط استراتيجية الهاشتاج',
          'أعد مقاييس التتبع'
        ],
        deliverables: [
          'Complete campaign strategy',
          'Content calendar',
          'Visual assets',
          'Copy for all posts',
          'Performance tracking plan'
        ],
        deliverablesAr: [
          'استراتيجية حملة كاملة',
          'تقويم المحتوى',
          'الأصول البصرية',
          'نسخة لجميع المنشورات',
          'خطة تتبع الأداء'
        ],
        aiGenerated: false,
        isActive: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const createdExercises = await db.insert(exercises).values(exerciseData).returning();
    console.log(`✅ Created ${createdExercises.length} exercises`);

    console.log('🎉 Exercise seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding exercises:', error);
  }
}

// Run the seed function
seedExercises()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  }); 