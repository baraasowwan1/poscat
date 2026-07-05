// Multi-Sector POS Configuration
// Each sector defines its theme colors, Arabic terminology, enabled modules, and extra product fields.

export type SectorId =
  | "supermarket"
  | "restaurant"
  | "pharmacy"
  | "clothing"
  | "cafe"
  | "electronics"
  | "salon"
  | "bakery";

export interface SectorLabels {
  // Navigation labels
  navProducts: string;       // المنتجات / الأطباق / الأدوية / الأصناف
  navInventory: string;      // المخزون / المستودع
  navCustomers: string;      // العملاء / الزبائن / المرضى
  navSuppliers: string;      // الموردون / شركات الأدوية
  navPurchases: string;      // المشتريات / طلبات التوريد
  navPOS: string;            // نقطة البيع / الكاشير / الطلبات
  // Product terminology
  product: string;           // منتج / طبق / دواء / صنف
  products: string;          // منتجات / أطباق / أدوية / أصناف
  addProduct: string;        // إضافة منتج / إضافة طبق ...
  productName: string;       // اسم المنتج / اسم الطبق ...
  stock: string;             // مخزون / كمية
  category: string;          // فئة / تصنيف / قسم
  barcode: string;           // باركود / رمز المنتج
  unitCost: string;          // تكلفة الوحدة
  unitPrice: string;         // سعر الوحدة / سعر البيع
  // POS / Sale
  posTitle: string;          // نقطة البيع / الكاشير / طلب جديد
  invoice: string;           // فاتورة / إيصال / وصل
  customer: string;          // عميل / زبون / مريض / ضيف
  customers: string;         // العملاء / الزبائن / المرضى / الضيوف
  // Supplier
  supplier: string;          // مورد / شركة دواء / موزع
  suppliers: string;         // الموردون / شركات التوريد
}

export interface SectorTheme {
  // Primary color (used for buttons, active nav, highlights)
  primary: string;
  primaryFg: string;
  // Accent (secondary highlight)
  accent: string;
  accentFg: string;
  // Sidebar gradient
  sidebarFrom: string;
  sidebarTo: string;
  sidebarBorder: string;
  sidebarActiveText: string;
  sidebarActiveBg: string;
  // Ring / focus
  ring: string;
  // Subtle background & card tints for the main content area
  bgTint: string;   // e.g. "rgba(59,130,246,0.03)"
  cardTint: string; // e.g. "rgba(59,130,246,0.02)"
  // Top accent bar color (1px line at top of sidebar)
  topBar: string;
}

export interface SectorModule {
  tables: boolean;        // إدارة الطاولات (مطعم/كافيه)
  kitchen: boolean;       // شاشة المطبخ (مطعم)
  appointments: boolean;  // المواعيد (صالون)
  prescriptions: boolean; // الوصفات الطبية (صيدلية)
  variants: boolean;      // المقاسات والألوان (ملابس)
  serialNumbers: boolean; // الأرقام التسلسلية (إلكترونيات)
  production: boolean;    // الإنتاج اليومي (مخبزة)
}

export interface ExtraProductField {
  key: string;
  label: string;
  type: "text" | "select" | "number";
  options?: string[];
  required?: boolean;
}

export interface SectorConfig {
  id: SectorId;
  nameAr: string;
  emoji: string;
  description: string;
  theme: SectorTheme;
  labels: SectorLabels;
  modules: SectorModule;
  extraProductFields: ExtraProductField[];
  // Which nav items to hide for this sector
  hiddenModules?: Array<"inventory" | "purchases" | "suppliers" | "customers">;
  // Product categories for this sector
  categories: string[];
  defaultCategory: string;
}

// ─── Sector Definitions ───────────────────────────────────────────────────────

const ALL_MODULES: SectorModule = {
  tables: false, kitchen: false, appointments: false,
  prescriptions: false, variants: false, serialNumbers: false, production: false,
};

export const SECTOR_CONFIGS: Record<SectorId, SectorConfig> = {

  supermarket: {
    id: "supermarket",
    nameAr: "سوبرماركت",
    emoji: "🛒",
    description: "بقالة، سوبرماركت، هايبرماركت، ميني ماركت",
    theme: {
      primary: "#3B82F6",
      primaryFg: "#ffffff",
      accent: "#10B981",
      accentFg: "#ffffff",
      sidebarFrom: "#071524",
      sidebarTo: "#0B1D35",
      sidebarBorder: "rgba(59,130,246,0.15)",
      sidebarActiveText: "#93C5FD",
      sidebarActiveBg: "rgba(59,130,246,0.18)",
      ring: "#3B82F6",
      bgTint: "rgba(59,130,246,0.025)",
      cardTint: "rgba(59,130,246,0.018)",
      topBar: "#3B82F6",
    },
    labels: {
      navProducts: "المنتجات", navInventory: "المخزون", navCustomers: "العملاء",
      navSuppliers: "الموردون", navPurchases: "المشتريات", navPOS: "نقطة البيع",
      product: "منتج", products: "منتجات", addProduct: "إضافة منتج",
      productName: "اسم المنتج", stock: "مخزون", category: "فئة",
      barcode: "باركود", unitCost: "تكلفة الوحدة", unitPrice: "سعر البيع",
      posTitle: "نقطة البيع", invoice: "فاتورة",
      customer: "عميل", customers: "العملاء",
      supplier: "مورد", suppliers: "الموردون",
    },
    modules: ALL_MODULES,
    extraProductFields: [
      { key: "expiryDate", label: "تاريخ الانتهاء", type: "text" },
      { key: "origin", label: "بلد المنشأ", type: "text" },
    ],
    categories: ["مواد غذائية","مشروبات","ألبان وأجبان","خضار وفواكه","لحوم ودجاج","مخبوزات","منظفات","حلويات وسناكس","معلبات","أخرى"],
    defaultCategory: "مواد غذائية",
  },

  restaurant: {
    id: "restaurant",
    nameAr: "مطعم",
    emoji: "🍽️",
    description: "مطعم، مطبخ، وجبات سريعة، مطعم عائلي",
    theme: {
      primary: "#EF4444",
      primaryFg: "#ffffff",
      accent: "#F97316",
      accentFg: "#ffffff",
      sidebarFrom: "#1a0a06",
      sidebarTo: "#2a1208",
      sidebarBorder: "rgba(239,68,68,0.2)",
      sidebarActiveText: "#FCA5A5",
      sidebarActiveBg: "rgba(239,68,68,0.18)",
      ring: "#EF4444",
      bgTint: "rgba(239,68,68,0.03)",
      cardTint: "rgba(239,68,68,0.022)",
      topBar: "#EF4444",
    },
    labels: {
      navProducts: "قائمة الطعام", navInventory: "المستودع", navCustomers: "الزبائن",
      navSuppliers: "الموردون", navPurchases: "طلبات التوريد", navPOS: "الطلبات",
      product: "طبق", products: "أطباق", addProduct: "إضافة طبق",
      productName: "اسم الطبق", stock: "الكمية المتاحة", category: "قسم",
      barcode: "كود الطبق", unitCost: "تكلفة الإعداد", unitPrice: "سعر الطبق",
      posTitle: "طلب جديد", invoice: "إيصال",
      customer: "زبون", customers: "الزبائن",
      supplier: "مورد", suppliers: "الموردون",
    },
    modules: { ...ALL_MODULES, tables: true, kitchen: true },
    extraProductFields: [
      { key: "preparationTime", label: "وقت التحضير (دقيقة)", type: "number" },
      { key: "calories", label: "السعرات الحرارية", type: "number" },
      { key: "allergens", label: "مسببات الحساسية", type: "text" },
    ],
    hiddenModules: ["inventory"],
    categories: ["مشويات","مقبلات","سلطات","شوربات","وجبات رئيسية","ساندويشات","بيتزا وباستا","مشروبات","حلويات","أطفال","أخرى"],
    defaultCategory: "وجبات رئيسية",
  },

  pharmacy: {
    id: "pharmacy",
    nameAr: "صيدلية",
    emoji: "💊",
    description: "صيدلية، مستلزمات طبية، أدوية",
    theme: {
      primary: "#059669",
      primaryFg: "#ffffff",
      accent: "#0EA5E9",
      accentFg: "#ffffff",
      sidebarFrom: "#031a12",
      sidebarTo: "#052b1d",
      sidebarBorder: "rgba(5,150,105,0.2)",
      sidebarActiveText: "#6EE7B7",
      sidebarActiveBg: "rgba(5,150,105,0.18)",
      ring: "#059669",
      bgTint: "rgba(5,150,105,0.03)",
      cardTint: "rgba(5,150,105,0.022)",
      topBar: "#059669",
    },
    labels: {
      navProducts: "الأدوية", navInventory: "مخزون الأدوية", navCustomers: "المرضى",
      navSuppliers: "شركات الأدوية", navPurchases: "طلبيات الأدوية", navPOS: "الصرف",
      product: "دواء", products: "أدوية", addProduct: "إضافة دواء",
      productName: "اسم الدواء", stock: "الكمية", category: "تصنيف",
      barcode: "باركود الدواء", unitCost: "تكلفة الشراء", unitPrice: "سعر البيع",
      posTitle: "صرف دواء", invoice: "وصل صرف",
      customer: "مريض", customers: "المرضى",
      supplier: "شركة دواء", suppliers: "شركات الأدوية",
    },
    modules: { ...ALL_MODULES, prescriptions: true },
    extraProductFields: [
      { key: "activeIngredient", label: "المادة الفعّالة", type: "text" },
      { key: "dosage", label: "الجرعة", type: "text" },
      { key: "requiresPrescription", label: "يستلزم وصفة", type: "select", options: ["نعم", "لا"] },
      { key: "expiryDate", label: "تاريخ الانتهاء", type: "text", required: true },
      { key: "manufacturer", label: "الشركة المصنّعة", type: "text" },
    ],
    categories: ["مسكنات وخافضات حرارة","مضادات حيوية","فيتامينات ومكملات","أدوية قلب وضغط","أدوية سكري","جهاز هضمي","جهاز تنفسي","جلدية","عيون وأذن","مستلزمات طبية","مستحضرات تجميل","أخرى"],
    defaultCategory: "مسكنات وخافضات حرارة",
  },

  clothing: {
    id: "clothing",
    nameAr: "ملابس",
    emoji: "👕",
    description: "محل ملابس، أزياء، إكسسوارات، أحذية",
    theme: {
      primary: "#8B5CF6",
      primaryFg: "#ffffff",
      accent: "#EC4899",
      accentFg: "#ffffff",
      sidebarFrom: "#0d0820",
      sidebarTo: "#170d30",
      sidebarBorder: "rgba(139,92,246,0.2)",
      sidebarActiveText: "#C4B5FD",
      sidebarActiveBg: "rgba(139,92,246,0.18)",
      ring: "#8B5CF6",
      bgTint: "rgba(139,92,246,0.03)",
      cardTint: "rgba(139,92,246,0.022)",
      topBar: "#8B5CF6",
    },
    labels: {
      navProducts: "الأصناف", navInventory: "المخزون", navCustomers: "العملاء",
      navSuppliers: "الموردون", navPurchases: "المشتريات", navPOS: "نقطة البيع",
      product: "صنف", products: "أصناف", addProduct: "إضافة صنف",
      productName: "اسم الصنف", stock: "الكمية", category: "تصنيف",
      barcode: "باركود", unitCost: "تكلفة الشراء", unitPrice: "سعر البيع",
      posTitle: "نقطة البيع", invoice: "فاتورة",
      customer: "عميل", customers: "العملاء",
      supplier: "مورد", suppliers: "الموردون",
    },
    modules: { ...ALL_MODULES, variants: true },
    extraProductFields: [
      { key: "size", label: "المقاس", type: "select", options: ["XS","S","M","L","XL","XXL","XXXL","فري سايز"] },
      { key: "color", label: "اللون", type: "text" },
      { key: "material", label: "الخامة", type: "text" },
      { key: "gender", label: "الفئة", type: "select", options: ["رجالي","نسائي","أطفال","يونيسكس"] },
      { key: "season", label: "الموسم", type: "select", options: ["صيف","شتاء","خريف","ربيع","كل المواسم"] },
    ],
    categories: ["تيشيرتات","قمصان","بناطيل","فساتين","جاكيتات ومعاطف","رياضي","داخلية وملابس نوم","أحذية","حقائب","إكسسوارات","أطفال","أخرى"],
    defaultCategory: "تيشيرتات",
  },

  cafe: {
    id: "cafe",
    nameAr: "مقهى / كافيه",
    emoji: "☕",
    description: "كافيه، مقهى، مشروبات، حلويات",
    theme: {
      primary: "#B45309",
      primaryFg: "#ffffff",
      accent: "#F59E0B",
      accentFg: "#000000",
      sidebarFrom: "#120b02",
      sidebarTo: "#221508",
      sidebarBorder: "rgba(180,83,9,0.28)",
      sidebarActiveText: "#FDE68A",
      sidebarActiveBg: "rgba(180,83,9,0.25)",
      ring: "#F59E0B",
      bgTint: "rgba(180,83,9,0.04)",
      cardTint: "rgba(180,83,9,0.03)",
      topBar: "#F59E0B",
    },
    labels: {
      navProducts: "قائمة المشروبات", navInventory: "المواد الخام", navCustomers: "الزبائن",
      navSuppliers: "الموردون", navPurchases: "طلبات التوريد", navPOS: "الطلبات",
      product: "صنف", products: "الأصناف", addProduct: "إضافة صنف",
      productName: "اسم الصنف", stock: "الكمية", category: "قسم",
      barcode: "كود الصنف", unitCost: "تكلفة التحضير", unitPrice: "سعر البيع",
      posTitle: "طلب جديد", invoice: "إيصال",
      customer: "زبون", customers: "الزبائن",
      supplier: "مورد", suppliers: "الموردون",
    },
    modules: { ...ALL_MODULES, tables: true },
    extraProductFields: [
      { key: "size", label: "الحجم", type: "select", options: ["صغير","وسط","كبير","إكسترا"] },
      { key: "temperature", label: "درجة الحرارة", type: "select", options: ["ساخن","بارد","عادي"] },
      { key: "calories", label: "السعرات الحرارية", type: "number" },
    ],
    hiddenModules: ["inventory"],
    categories: ["قهوة ساخنة","قهوة باردة","مشروبات باردة","عصائر","شاي وأعشاب","موهيتو وسموذي","حلويات وكيك","سناكس","إضافات","أخرى"],
    defaultCategory: "قهوة ساخنة",
  },

  electronics: {
    id: "electronics",
    nameAr: "إلكترونيات",
    emoji: "💻",
    description: "إلكترونيات، هواتف، أجهزة، إصلاح وصيانة",
    theme: {
      primary: "#0EA5E9",
      primaryFg: "#ffffff",
      accent: "#6366F1",
      accentFg: "#ffffff",
      sidebarFrom: "#020c1b",
      sidebarTo: "#051628",
      sidebarBorder: "rgba(14,165,233,0.2)",
      sidebarActiveText: "#7DD3FC",
      sidebarActiveBg: "rgba(14,165,233,0.2)",
      ring: "#0EA5E9",
      bgTint: "rgba(14,165,233,0.03)",
      cardTint: "rgba(14,165,233,0.022)",
      topBar: "#0EA5E9",
    },
    labels: {
      navProducts: "الأجهزة", navInventory: "المخزون", navCustomers: "العملاء",
      navSuppliers: "الموردون", navPurchases: "المشتريات", navPOS: "نقطة البيع",
      product: "جهاز", products: "أجهزة", addProduct: "إضافة جهاز",
      productName: "اسم الجهاز", stock: "الكمية", category: "تصنيف",
      barcode: "باركود", unitCost: "سعر الشراء", unitPrice: "سعر البيع",
      posTitle: "نقطة البيع", invoice: "فاتورة",
      customer: "عميل", customers: "العملاء",
      supplier: "مورد", suppliers: "الموردون",
    },
    modules: { ...ALL_MODULES, serialNumbers: true },
    extraProductFields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "model", label: "الموديل", type: "text" },
      { key: "warrantyMonths", label: "الضمان (أشهر)", type: "number" },
      { key: "serialNumber", label: "الرقم التسلسلي", type: "text" },
      { key: "color", label: "اللون", type: "text" },
    ],
    categories: ["هواتف وتابلت","لابتوب وكمبيوتر","شاشات وتلفزيونات","سماعات وصوتيات","كاميرات","أجهزة منزلية ذكية","ملحقات وكابلات","ألعاب وترفيه","طابعات وماسحات","قطع غيار","أخرى"],
    defaultCategory: "هواتف وتابلت",
  },

  salon: {
    id: "salon",
    nameAr: "صالون",
    emoji: "✂️",
    description: "صالون حلاقة، كوافير، تجميل، سبا",
    theme: {
      primary: "#DB2777",
      primaryFg: "#ffffff",
      accent: "#F59E0B",
      accentFg: "#000000",
      sidebarFrom: "#1c0511",
      sidebarTo: "#2d0a1e",
      sidebarBorder: "rgba(219,39,119,0.25)",
      sidebarActiveText: "#F9A8D4",
      sidebarActiveBg: "rgba(219,39,119,0.22)",
      ring: "#DB2777",
      bgTint: "rgba(219,39,119,0.03)",
      cardTint: "rgba(219,39,119,0.022)",
      topBar: "#DB2777",
    },
    labels: {
      navProducts: "الخدمات", navInventory: "المستلزمات", navCustomers: "العملاء",
      navSuppliers: "الموردون", navPurchases: "المشتريات", navPOS: "الحجوزات",
      product: "خدمة", products: "خدمات", addProduct: "إضافة خدمة",
      productName: "اسم الخدمة", stock: "الكمية", category: "تصنيف",
      barcode: "كود الخدمة", unitCost: "تكلفة الخدمة", unitPrice: "سعر الخدمة",
      posTitle: "موعد / خدمة", invoice: "إيصال خدمة",
      customer: "عميل", customers: "العملاء",
      supplier: "مورد", suppliers: "الموردون",
    },
    modules: { ...ALL_MODULES, appointments: true },
    extraProductFields: [
      { key: "duration", label: "مدة الخدمة (دقيقة)", type: "number" },
      { key: "gender", label: "الفئة", type: "select", options: ["رجالي","نسائي","مختلط"] },
      { key: "specialist", label: "الاختصاصي المطلوب", type: "text" },
    ],
    hiddenModules: ["inventory", "purchases", "suppliers"],
    categories: ["حلاقة رجالي","حلاقة نسائي","صبغة وكيراتين","مانيكير وباديكير","عناية بالبشرة","رموش وحواجب","مساج","عرائس","أطفال","أخرى"],
    defaultCategory: "حلاقة رجالي",
  },

  bakery: {
    id: "bakery",
    nameAr: "مخبزة",
    emoji: "🥖",
    description: "مخبزة، حلويات، معجنات، كيك",
    theme: {
      primary: "#D97706",
      primaryFg: "#ffffff",
      accent: "#EF4444",
      accentFg: "#ffffff",
      sidebarFrom: "#180d01",
      sidebarTo: "#251503",
      sidebarBorder: "rgba(217,119,6,0.25)",
      sidebarActiveText: "#FDE68A",
      sidebarActiveBg: "rgba(217,119,6,0.22)",
      ring: "#D97706",
      bgTint: "rgba(217,119,6,0.035)",
      cardTint: "rgba(217,119,6,0.025)",
      topBar: "#D97706",
    },
    labels: {
      navProducts: "المنتجات", navInventory: "المواد الخام", navCustomers: "العملاء",
      navSuppliers: "الموردون", navPurchases: "مشتريات المواد", navPOS: "نقطة البيع",
      product: "منتج", products: "منتجات", addProduct: "إضافة منتج",
      productName: "اسم المنتج", stock: "الكمية المنتجة", category: "نوع",
      barcode: "كود المنتج", unitCost: "تكلفة الإنتاج", unitPrice: "سعر البيع",
      posTitle: "نقطة البيع", invoice: "فاتورة",
      customer: "عميل", customers: "العملاء",
      supplier: "مورد", suppliers: "الموردون",
    },
    modules: { ...ALL_MODULES, production: true },
    extraProductFields: [
      { key: "ingredients", label: "المكونات الرئيسية", type: "text" },
      { key: "shelfLife", label: "مدة الصلاحية (ساعة)", type: "number" },
      { key: "weight", label: "الوزن (غرام)", type: "number" },
    ],
    categories: ["خبز يومي","معجنات ومشبك","كيك وتورتات","كناف وقطايف","بسكويت وكوكيز","حلويات شرقية","تشيز كيك","مافن وكاب كيك","شوكولاتة","مناسبات وأعياد","أخرى"],
    defaultCategory: "خبز يومي",
  },
};

export const DEFAULT_SECTOR: SectorId = "supermarket";

export function getSectorConfig(sectorId?: string | null): SectorConfig {
  return SECTOR_CONFIGS[(sectorId as SectorId) ?? DEFAULT_SECTOR] ?? SECTOR_CONFIGS.supermarket;
}

// List for UI display (sector picker)
export const SECTOR_LIST = Object.values(SECTOR_CONFIGS);
