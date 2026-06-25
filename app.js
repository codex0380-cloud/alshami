/* ===================== الشامي — App Logic ===================== */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const EGP = (n) => n.toLocaleString('ar-EG');

  /* ---------- Security ---------- */
  function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, 
      tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  /* ---------- Safe storage (sandboxed iframes block localStorage) ---------- */
  const mem = {};
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return k in mem ? mem[k] : null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } }
  };

  /* ---------- Data ---------- */
  /* ===== Menu Categories ===== */
  let CATEGORIES = [
    { id: 'all', name: 'الكل', icon: '🍽️' },
    { id: 'shawarma', name: 'سندوتشات شاورما', icon: '🌯' },
    { id: 'western', name: 'سندوتشات غربي', icon: '🍔' },
    { id: 'potato', name: 'سندوتشات بطاطس', icon: '🍟' },
    { id: 'crepe', name: 'الكريب', icon: '🥙' },
    { id: 'meals', name: 'الوجبات', icon: '🍗' },
    { id: 'shawarma_meals', name: 'وجبات الشاورما', icon: '🥘' },
    { id: 'fattah', name: 'الفتة الشامية', icon: '🫕' },
    { id: 'weight', name: 'شاورما بالوزن', icon: '⚖️' },
    { id: 'appetizers', name: 'المقبلات', icon: '🥗' },
    { id: 'sweet', name: 'كريب حلو', icon: '🍫' },
    { id: 'extras', name: 'الإضافات', icon: '➕' },
  ];

  let MEALS = [
    // سندوتشات شاورما
    { id: 's1', name: 'شاورما فراخ سوري', desc: 'شاورما فراخ طازجة بالخبز السوري مع صوص الثومية', price: 75, priceL: 85, cat: 'shawarma', img: 'assets/shawarma_souri.jpeg', best: true, sizes: ['عادي', 'كبير'] },
    { id: 's2', name: 'شاورما فراخ موتزاريلا', desc: 'شاورما فراخ مع جبنة موتزاريلا ذايبة', price: 85, priceL: 95, cat: 'shawarma', img: 'assets/shawarma_arabi.jpeg', best: true, sizes: ['عادي', 'كبير'] },
    { id: 's3', name: 'شاورما فراخ شيدر', desc: 'شاورما فراخ مع جبنة شيدر كريمية', price: 85, priceL: 95, cat: 'shawarma', img: 'assets/shawarma_souri.jpeg', best: false, sizes: ['عادي', 'كبير'] },

    // سندوتشات غربي
    { id: 'w1', name: 'ساندوتش كريسبي', desc: 'قطع دجاج كريسبي مقرمشة في ساندوتش طازج', price: 60, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'w2', name: 'ساندوتش زنجر', desc: 'ساندوتش زنجر حار بالتتبيلة المميزة', price: 60, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'w3', name: 'ساندوتش بانيه', desc: 'بانيه فراخ مقرمش في خبز طازج', price: 60, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'w4', name: 'ساندوتش فاهيتا فراخ', desc: 'فاهيتا فراخ بالفلفل الألوان والصوص', price: 60, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'w5', name: 'ساندوتش برجر لحمة', desc: 'برجر لحمة طازجة مشوية على الفحم', price: 60, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'w6', name: 'ساندوتش برجر فراخ', desc: 'برجر فراخ مقرمش مع صوص خاص', price: 60, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'w7', name: 'ساندوتش كبده لحم', desc: 'كبده لحم بالتتبيلة المصرية', price: 60, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'w8', name: 'ساندوتش سجق', desc: 'سجق مشوي في خبز طازج', price: 60, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'w9', name: 'ساندوتش سوسيس', desc: 'سوسيس مشوي مع صوص مميز', price: 50, cat: 'western', img: 'assets/mixed_grill.jpeg', best: false },

    // سندوتشات البطاطس
    { id: 'p1', name: 'بطاطس سوري', desc: 'بطاطس مقرمشة مع صوص الثومية بالطريقة السورية', price: 25, cat: 'potato', img: 'assets/cheese_fries.jpeg', best: false },
    { id: 'p2', name: 'بطاطس موتزاريلا سوري', desc: 'بطاطس سوري مع جبنة موتزاريلا ذايبة', price: 35, cat: 'potato', img: 'assets/cheese_fries.jpeg', best: true },
    { id: 'p3', name: 'بطاطس شيدر سوري', desc: 'بطاطس سوري مع جبنة شيدر كريمية', price: 35, cat: 'potato', img: 'assets/cheese_fries.jpeg', best: false },
    { id: 'p4', name: 'سندوتش شاورما بطاطس', desc: 'سندوتش شاورما فراخ مع بطاطس مقرمشة', price: 60, cat: 'potato', img: 'assets/cheese_fries.jpeg', best: false },

    // الكريب
    { id: 'c1', name: 'كريب بطاطس', desc: 'كريب محشو بطاطس مقرمشة وصوص', price: 50, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c2', name: 'كريب بطاطس + رومي', desc: 'كريب بطاطس مع جبنة رومي', price: 70, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c3', name: 'كريب جبنة موزاريلا', desc: 'كريب محشو جبنة موزاريلا ذايبة', price: 70, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c4', name: 'كريب جبنة رومي', desc: 'كريب محشو جبنة رومي مميزة', price: 80, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c5', name: 'كريب ميكس جبن', desc: 'كريب محشو ميكس جبن (موزاريلا + رومي + شيدر)', price: 100, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c6', name: 'كريب كريسبي', desc: 'كريب محشو قطع دجاج كريسبي مقرمشة', price: 90, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: true },
    { id: 'c7', name: 'كريب زينجر', desc: 'كريب محشو زينجر حار مع صوص', price: 90, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c8', name: 'كريب شاورما فراخ', desc: 'كريب محشو شاورما فراخ مع ثومية', price: 80, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: true },
    { id: 'c9', name: 'كريب برجر فراخ', desc: 'كريب محشو برجر فراخ مقرمش', price: 80, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c10', name: 'كريب برجر لحمة', desc: 'كريب محشو برجر لحمة طازجة', price: 110, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c11', name: 'كريب سجق', desc: 'كريب محشو سجق مشوي مع صوص', price: 110, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c12', name: 'كريب لحمة مفرومة', desc: 'كريب محشو لحمة مفرومة متبلة', price: 110, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c13', name: 'كريب فاهيتا', desc: 'كريب محشو فاهيتا فراخ بالفلفل', price: 90, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c14', name: 'كريب تشيكن باريكيو', desc: 'كريب محشو دجاج باربيكيو مميز', price: 100, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c15', name: 'كريب تشيكن رانش', desc: 'كريب محشو دجاج مع صوص الرانش', price: 100, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c16', name: 'كريب ميكس لحوم', desc: 'كريب محشو ميكس لحوم متنوعة', price: 100, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'c17', name: 'كريب الشامي', desc: 'كريب الشامي المميز — الأشهر عندنا', price: 120, cat: 'crepe', img: 'assets/shawarma_arabi.jpeg', best: true },

    // قسم الوجبات (Crispy & Zinger)
    { id: 'ml1', name: 'وجبة كريسبي ٣ قطع', desc: 'أرز + بطاطس + ثومية + مخلل + عيش', price: 130, cat: 'meals', img: 'assets/mixed_grill.jpeg', best: true },
    { id: 'ml2', name: 'وجبة كريسبي ٥ قطع', desc: 'أرز + بطاطس + ثومية + مخلل + عيش', price: 200, cat: 'meals', img: 'assets/mixed_grill.jpeg', best: false },
    { id: 'ml3', name: 'وجبة زنجر ٣ قطع', desc: 'أرز + بطاطس + ثومية + مخلل + عيش', price: 130, cat: 'meals', img: 'assets/mixed_grill.jpeg', best: true },
    { id: 'ml4', name: 'وجبة زنجر ٥ قطع', desc: 'أرز + بطاطس + ثومية + مخلل + عيش', price: 200, cat: 'meals', img: 'assets/mixed_grill.jpeg', best: false },

    // وجبات الشاورما
    { id: 'sm1', name: 'ماريا', desc: 'وجبة ماريا المميزة مع الشاورما', price: 120, cat: 'shawarma_meals', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'sm2', name: 'بوكس عربي دبل', desc: 'بوكس شاورما عربي دبل الحجم', price: 180, cat: 'shawarma_meals', img: 'assets/shawarma_arabi.jpeg', best: true },
    { id: 'sm3', name: 'شاورما عربي', desc: 'وجبة شاورما عربي كاملة مع الإضافات', price: 120, cat: 'shawarma_meals', img: 'assets/shawarma_arabi.jpeg', best: true },
    { id: 'sm4', name: 'كريسبي عربي', desc: 'وجبة كريسبي عربي مع الخبز والثومية', price: 120, cat: 'shawarma_meals', img: 'assets/shawarma_arabi.jpeg', best: false },
    { id: 'sm5', name: 'زينجر عربي', desc: 'وجبة زينجر عربي حار مع الخبز', price: 120, cat: 'shawarma_meals', img: 'assets/shawarma_arabi.jpeg', best: false },

    // الفتة الشامية
    { id: 'f1', name: 'فتة شاورما فراخ', desc: 'فتة بخبز مقرمش مع شاورما فراخ وصوص', price: 90, priceL: 120, cat: 'fattah', img: 'assets/fatteh.jpeg', best: true, sizes: ['عادي', 'كبير'] },
    { id: 'f2', name: 'فتة كريسبي', desc: 'فتة بخبز مقرمش مع قطع كريسبي', price: 90, priceL: 120, cat: 'fattah', img: 'assets/fatteh.jpeg', best: false, sizes: ['عادي', 'كبير'] },
    { id: 'f3', name: 'فتة زنجر', desc: 'فتة بخبز مقرمش مع قطع زنجر حار', price: 90, priceL: 120, cat: 'fattah', img: 'assets/fatteh.jpeg', best: false, sizes: ['عادي', 'كبير'] },
    { id: 'f4', name: 'فتة بانية', desc: 'فتة بخبز مقرمش مع بانيه فراخ', price: 90, priceL: 120, cat: 'fattah', img: 'assets/fatteh.jpeg', best: false, sizes: ['عادي', 'كبير'] },
    { id: 'f5', name: 'فتة ميكس', desc: 'فتة ميكس بخبز مقرمش — الأشهر', price: 90, priceL: 120, cat: 'fattah', img: 'assets/fatteh.jpeg', best: true, sizes: ['عادي', 'كبير'] },

    // شاورما بالوزن
    { id: 'wt1', name: '¼ كيلو شاورما فراخ', desc: 'ربع كيلو شاورما فراخ طازجة', price: 170, cat: 'weight', img: 'assets/spit.jpeg', best: true },
    { id: 'wt2', name: '½ كيلو شاورما فراخ', desc: 'نص كيلو شاورما فراخ طازجة — للعائلة', price: 330, cat: 'weight', img: 'assets/spit.jpeg', best: false },

    // المقبلات
    { id: 'a1', name: 'طبق تومية', desc: 'صوص ثومية طازجة', price: 10, cat: 'appetizers', img: 'assets/hummus.jpeg', best: false },
    { id: 'a2', name: 'طبق رز بسمتي', desc: 'أرز بسمتي مطبوخ بالزبدة', price: 40, cat: 'appetizers', img: 'assets/hummus.jpeg', best: false },
    { id: 'a3', name: 'باكيت بطاطس', desc: 'بطاطس مقلية مقرمشة', price: 20, cat: 'appetizers', img: 'assets/cheese_fries.jpeg', best: false },
    { id: 'a4', name: 'طبق مخلل', desc: 'مخلل مشكل طازج', price: 5, cat: 'appetizers', img: 'assets/hummus.jpeg', best: false },
    { id: 'a5', name: 'رغيف عيش', desc: 'رغيف عيش طازج', price: 4, cat: 'appetizers', img: 'assets/hummus.jpeg', best: false },

    // كريب حلو
    { id: 'sw1', name: 'كريب حلو', desc: 'كريب حلو بالشوكولاتة والنوتيلا', price: 80, cat: 'sweet', img: 'assets/shawarma_arabi.jpeg', best: false },

    // الإضافات
    { id: 'x1', name: 'إضافة شاورما', desc: 'إضافة شاورما فراخ على أي ساندوتش', price: 30, cat: 'extras', img: 'assets/shawarma_souri.jpeg', best: false },
    { id: 'x2', name: 'إضافة موتزاريلا', desc: 'إضافة جبنة موتزاريلا ذايبة', price: 10, cat: 'extras', img: 'assets/cheese_fries.jpeg', best: false },
    { id: 'x3', name: 'إضافة شيدر', desc: 'إضافة جبنة شيدر كريمية', price: 10, cat: 'extras', img: 'assets/cheese_fries.jpeg', best: false },
    { id: 'x4', name: 'إضافة بطاطس', desc: 'إضافة بطاطس مقرمشة', price: 5, cat: 'extras', img: 'assets/cheese_fries.jpeg', best: false },
  ];

  const GALLERY = [
    { img: 'assets/gallery2.jpg', span: 'md:col-span-2 md:row-span-2', cap: 'فريق الشامي — شاورما طازجة كل يوم 🔥' },
    { img: 'assets/gallery1.jpg', span: '', cap: 'شاورما الشامي الأصلية' },
    { img: 'assets/gallery5.jpg', span: '', cap: 'وجبات الشامي الكاملة' },
    { img: 'assets/gallery3.jpg', span: 'md:row-span-2', cap: 'شاورما طازجة من إيدينا ليكم' },
    { img: 'assets/gallery4.jpg', span: '', cap: 'شاورما بالصوص الخاص' },
    { img: 'assets/exterior.jpg', span: '', cap: 'واجهة المطعم' },
    { img: 'assets/gallery1.jpg', span: 'md:col-span-2', cap: 'تلات ساندويتشات شاورما — كلهم ليك! 😋' },
    { img: 'assets/gallery5.jpg', span: '', cap: 'بوكس شاورما رز بالصوص' },
  ];

  let REVIEWS = [
    { name: 'محمد أحمد', text: 'شاورما الشامي مفيش زيها! الطعم أصيل والسعر ممتاز. هطلب تاني أكيد.', initial: 'م', stars: 5 },
    { name: 'سارة حسن', text: 'كريب الشامي تحفة! والفتة الشامية طعمها خيالي. أحسن مطعم في إيتاي البارود.', initial: 'س', stars: 5 },
    { name: 'أحمد فؤاد', text: 'وجبة الكريسبي 3 قطع كمية كبيرة والطعم مقرمش فعلاً. خدمة ممتازة.', initial: 'أ', stars: 4 },
    { name: 'منى خليل', text: 'البوكس العربي دبل لازم تجربوه! شاورما طازجة وعيش ساخن. تجربة ولا أروع.', initial: 'م', stars: 5 },
    { name: 'كريم سمير', text: 'بطاطس الموتزاريلا السوري حاجة تانية خالص! والتوصيل سريع جداً.', initial: 'ك', stars: 5 },
    { name: 'ليلى ناصر', text: 'أفضل كريب في المنطقة. كريب تشيكن رانش ممتاز والأسعار معقولة جداً.', initial: 'ل', stars: 5 },
  ];

  const FAQS = [
    { q: 'إيه مواعيد العمل؟', a: 'يومياً من 8 صباحاً إلى 3 صباحاً.' },
    { q: 'إيه أرقام التواصل والطلبات؟', a: 'تقدر تتواصل معانا على: 01037775765 أو 01038437067' },
    { q: 'فين عنوان المطعم؟', a: 'إيتاي البارود - حديقة الطفل - شارع تاون تيم' },
    { q: 'ما طرق الدفع المتاحة؟', a: 'نقبل الدفع نقداً عند الاستلام، فودافون كاش، والبطاقات البنكية.' },
    { q: 'هل يمكنني الطلب للاستلام (تيك أواي)؟', a: 'نعم! اختر "تيك أواي" عند إتمام الطلب وسيكون جاهزاً عند وصولك.' },
    { q: 'هل فيه توصيل؟', a: 'أيوه! نوصلك لباب بيتك. كلمنا على أي رقم من أرقامنا واطلب أوردرك.' },
  ];

  /* ---------- Coupon & Delivery config ---------- */
  let COUPONS = {};
  const DEFAULT_STORE_SETTINGS = {
    store_status: 'open',
    min_order: 0,
    opening_hours: { start: '08:00', end: '03:00' },
    delivery_zones: [{ id: 'default', name: 'توصيل عادي', price: 10 }],
  };
  let DEFAULT_DELIVERY_FEE = 10; // ج.م
  let STORE_SETTINGS = { ...DEFAULT_STORE_SETTINGS };
  let appliedCoupon = null;
  let appliedDiscount = 0;

  /* ---------- Cart state ---------- */
  let cart = {};
  try { cart = JSON.parse(store.get('alshami-cart') || '{}') || {}; } catch (e) { cart = {}; }
  const saveCart = () => store.set('alshami-cart', JSON.stringify(cart));
  const cartList = () => Object.values(cart);
  const cartQty = () => cartList().reduce((s, i) => s + i.qty, 0);
  const cartTotal = () => cartList().reduce((s, i) => s + i.qty * i.price, 0);
  const getDeliveryFee = () => {
    const form = $('#checkoutForm');
    if (!form || !STORE_SETTINGS) return DEFAULT_DELIVERY_FEE;
    try { 
      if (form.method.value === 'pickup') return 0;
      if (form.zone && form.zone.value && STORE_SETTINGS.delivery_zones) {
        const zone = STORE_SETTINGS.delivery_zones.find(z => z.id === form.zone.value);
        if (zone) return zone.price;
      }
      return DEFAULT_DELIVERY_FEE;
    } catch(e) { return DEFAULT_DELIVERY_FEE; }
  };
  const getFinalTotal = () => {
    const sub = cartTotal();
    const delivery = getDeliveryFee();
    return Math.max(0, sub - appliedDiscount + delivery);
  };
  const getMinOrder = () => Number(STORE_SETTINGS?.min_order || 0);
  const isStoreOpenNow = () => {
    if (!STORE_SETTINGS || STORE_SETTINGS.store_status === 'closed') return false;
    const hours = STORE_SETTINGS.opening_hours;
    if (!hours || !hours.start || !hours.end) return true;
    const toMinutes = (value) => {
      const [h, m] = String(value).split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const start = toMinutes(hours.start);
    const end = toMinutes(hours.end);
    return start <= end ? current >= start && current <= end : current >= start || current <= end;
  };

  /* ---------- Render menu ---------- */
  let activeCategory = 'all';

  function renderMenu() {
    const section = $('#menuGrid').parentElement;
    
    // Render category tabs if not already present
    let tabsContainer = $('#categoryTabs');
    if (!tabsContainer) {
      tabsContainer = document.createElement('div');
      tabsContainer.id = 'categoryTabs';
      tabsContainer.className = 'flex flex-wrap justify-center gap-2 mb-10';
      section.insertBefore(tabsContainer, $('#menuGrid'));
    }
    
    tabsContainer.innerHTML = CATEGORIES.map(cat => `
      <button class="cat-tab ${cat.id === activeCategory ? 'active' : ''}" data-cat="${escapeHTML(cat.id)}">
        <span>${escapeHTML(cat.icon)}</span>
        <span>${escapeHTML(cat.name)}</span>
      </button>
    `).join('');
    
    $$('.cat-tab', tabsContainer).forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        renderMenu();
      });
    });

    const filtered = activeCategory === 'all' ? MEALS : MEALS.filter(m => m.cat === activeCategory);
    const grid = $('#menuGrid');
    
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-12 text-ink/50 dark:text-beige/50 font-cairo text-lg">لا توجد أصناف في هذا القسم</div>';
      return;
    }

    grid.innerHTML = filtered.map(m => {
      const hasSizes = m.sizes && m.sizes.length > 0;
      const safeId = escapeHTML(m.id || '');
      const safeName = escapeHTML(m.name || '');
      const safeDesc = escapeHTML(m.desc || '');
      const safeImg = escapeHTML(m.img || 'assets/logo.png');
      
      const addButtons = hasSizes
        ? `<div class="flex flex-col gap-2 w-full mt-4">
            <div class="flex gap-2 w-full">
              <button class="size-btn flex-1" data-add="${safeId}" data-size="small">
                <span class="size-label">${escapeHTML(m.sizes[0])}</span>
                <span class="size-price">${Number(m.price) || 0} ج.م</span>
              </button>
              <button class="size-btn flex-1" data-add="${safeId}" data-size="large">
                <span class="size-label">${escapeHTML(m.sizes[1])}</span>
                <span class="size-price">${Number(m.priceL) || Number(m.price) || 0} ج.م</span>
              </button>
            </div>
          </div>`
        : `<div class="flex items-center justify-between mt-4">
            <span class="font-poppins font-bold text-xl text-darkred dark:text-gold">${Number(m.price) || 0} <span class="text-sm font-tajawal">ج.م</span></span>
            <button class="btn-gold font-cairo font-bold text-sm px-4 py-2" data-add="${safeId}">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
              أضف للسلة
            </button>
          </div>`;
      
      return `
      <article class="meal-card p-6 flex flex-col h-full" data-reveal>
        <div class="flex justify-between items-start mb-3">
          <div class="pl-3">
            <h3 class="font-cairo font-bold text-xl text-ink dark:text-beige">${safeName}</h3>
            ${m.best ? '<span class="inline-flex items-center gap-1 mt-2 text-[0.75rem] font-bold bg-darkred/10 text-darkred dark:bg-gold/15 dark:text-gold px-3 py-1 rounded-full">🔥 الأكثر مبيعاً</span>' : ''}
          </div>
          <button class="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-ink/5 dark:bg-beige/10 hover:scale-110 transition-transform" aria-label="مفضلة" data-fav>
            <svg class="h-4 w-4 text-darkred dark:text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
          </button>
        </div>
        <p class="text-sm text-ink/60 dark:text-beige/60 leading-relaxed flex-1">${safeDesc}</p>
        <div class="mt-4 pt-4 border-t border-ink/5 dark:border-beige/10">
          ${addButtons}
        </div>
      </article>`;
    }).join('');

    $$('[data-add]', grid).forEach(b => {
      b.addEventListener('click', () => {
        const size = b.dataset.size || null;
        addToCart(b.dataset.add, size);
      });
    });
    $$('[data-fav]', grid).forEach(b => b.addEventListener('click', () => {
      b.classList.toggle('text-darkred');
      const svg = $('svg', b); svg.setAttribute('fill', svg.getAttribute('fill') === 'currentColor' ? 'none' : 'currentColor');
    }));
    observeReveals(grid);
  }

  /* ---------- Render gallery ---------- */
  function renderGallery() {
    const g = $('#gallery-grid');
    g.innerHTML = GALLERY.map((item, i) => `
      <figure class="gal-item ${item.span}" data-lightbox="${i}">
        <img src="${item.img}" alt="${item.cap}" loading="lazy">
        <div class="gal-zoom">
          <span class="grid place-items-center h-12 w-12 rounded-full bg-gold/90 text-ink shadow-lg">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>
          </span>
        </div>
      </figure>`).join('');
    $$('[data-lightbox]', g).forEach(el => el.addEventListener('click', () => openLightbox(+el.dataset.lightbox)));
  }

  /* ---------- Lightbox ---------- */
  let lbIndex = 0;
  function openLightbox(i) {
    lbIndex = i;
    let lb = $('#lightbox');
    if (!lb) {
      lb = document.createElement('div');
      lb.id = 'lightbox';
      lb.className = 'fixed inset-0 z-[95] hidden items-center justify-center bg-ink/90 backdrop-blur-md p-4';
      lb.innerHTML = `
        <button id="lbClose" class="absolute top-5 left-5 h-11 w-11 grid place-items-center rounded-full bg-beige/10 text-beige hover:bg-gold hover:text-ink transition"><svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        <button id="lbPrev" class="absolute right-4 sm:right-8 h-12 w-12 grid place-items-center rounded-full bg-beige/10 text-beige hover:bg-gold hover:text-ink transition"><svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 18l6-6-6-6"/></svg></button>
        <button id="lbNext" class="absolute left-4 sm:left-8 h-12 w-12 grid place-items-center rounded-full bg-beige/10 text-beige hover:bg-gold hover:text-ink transition"><svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 18l-6-6 6-6"/></svg></button>
        <figure class="max-w-4xl w-full text-center">
          <img id="lbImg" class="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" alt="">
          <figcaption id="lbCap" class="text-beige/80 font-cairo font-semibold mt-4 text-lg"></figcaption>
        </figure>`;
      document.body.appendChild(lb);
      $('#lbClose', lb).addEventListener('click', closeLightbox);
      $('#lbPrev', lb).addEventListener('click', () => navLightbox(-1));
      $('#lbNext', lb).addEventListener('click', () => navLightbox(1));
      lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    }
    updateLightbox();
    lb.classList.remove('hidden'); lb.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
  function updateLightbox() { $('#lbImg').src = GALLERY[lbIndex].img; $('#lbCap').textContent = GALLERY[lbIndex].cap; }
  function navLightbox(d) { lbIndex = (lbIndex + d + GALLERY.length) % GALLERY.length; updateLightbox(); }
  function closeLightbox() { const lb = $('#lightbox'); if (lb) { lb.classList.add('hidden'); lb.classList.remove('flex'); } document.body.style.overflow = ''; }

  /* ---------- Reviews slider ---------- */
  let reviewInterval = null;
  function renderReviews() {
    const track = $('#reviewTrack');
    if (!track) return;
    track.innerHTML = REVIEWS.map(r => `
      <div class="review-card">
        <div class="flex items-center gap-3 mb-4">
          <span class="grid place-items-center h-12 w-12 rounded-full bg-gradient-to-br from-darkred to-darkred-2 text-gold font-cairo font-black text-lg">${escapeHTML(r.initial || (r.name ? r.name.charAt(0) : '?'))}</span>
          <div>
            <p class="font-cairo font-bold">${escapeHTML(r.name)}</p>
            <div class="text-gold text-sm">${'★'.repeat(r.stars || 5)}${'☆'.repeat(5 - (r.stars || 5))}</div>
          </div>
        </div>
        <p class="text-ink/75 dark:text-beige/75 leading-relaxed">"${escapeHTML(r.text)}"</p>
      </div>`).join('');

    const perView = () => window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
    let idx = 0;
    const dots = $('#reviewDots');
    function pages() { return Math.max(1, REVIEWS.length - perView() + 1); }
    function renderDots() {
      if(!dots) return;
      dots.innerHTML = '';
      for (let i = 0; i < pages(); i++) {
        const d = document.createElement('button');
        d.className = 'review-dot' + (i === idx ? ' active' : '');
        d.addEventListener('click', () => { idx = i; update(); });
        dots.appendChild(d);
      }
    }
    function update() {
      const card = track.children[0];
      if (!card) return;
      const gap = 20;
      const w = card.getBoundingClientRect().width + gap;
      track.style.transform = `translateX(${idx * w}px)`;
      $$('.review-dot', dots).forEach((d, i) => d.classList.toggle('active', i === idx));
    }
    renderDots(); update();
    if(reviewInterval) clearInterval(reviewInterval);
    reviewInterval = setInterval(() => { idx = (idx + 1) % pages(); renderDots(); update(); }, 4500);
    window.addEventListener('resize', () => { idx = 0; renderDots(); update(); });
  }

  /* ---------- FAQ ---------- */
  function renderFAQ() {
    const f = $('#faq');
    f.innerHTML = FAQS.map(item => `
      <div class="faq-item">
        <button class="faq-q">
          <span>${item.q}</span>
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <div class="faq-a"><p>${item.a}</p></div>
      </div>`).join('');
    $$('.faq-item', f).forEach(item => {
      $('.faq-q', item).addEventListener('click', () => {
        const open = item.classList.contains('open');
        $$('.faq-item', f).forEach(o => { o.classList.remove('open'); $('.faq-a', o).style.maxHeight = null; });
        if (!open) { item.classList.add('open'); const a = $('.faq-a', item); a.style.maxHeight = a.scrollHeight + 'px'; }
      });
    });
  }

  /* ---------- Cart ops ---------- */
  function addToCart(id, size) {
    const m = MEALS.find(x => x.id === id);
    if (!m) return;
    
    const hasSizes = m.sizes && m.sizes.length > 0;
    let cartKey = id;
    let price = m.price;
    let displayName = m.name;
    
    if (hasSizes && size) {
      cartKey = `${id}_${size}`;
      if (size === 'large') {
        price = m.priceL;
        displayName = `${m.name} (${m.sizes[1]})`;
      } else {
        displayName = `${m.name} (${m.sizes[0]})`;
      }
    }
    
    if (cart[cartKey]) {
      cart[cartKey].qty++;
    } else {
      cart[cartKey] = { ...m, id: cartKey, name: displayName, price: price, qty: 1, img: m.img };
    }
    saveCart(); updateCartUI(); bumpCart();
    toast(`✅ تمت إضافة ${displayName} للسلة`);
  }
  function changeQty(id, d) {
    if (!cart[id]) return;
    cart[id].qty += d;
    if (cart[id].qty <= 0) delete cart[id];
    saveCart(); updateCartUI();
  }
  function bumpCart() {
    const c = $('#cartCount'); c.classList.add('scale-150'); setTimeout(() => c.classList.remove('scale-150'), 200);
  }
  function updateCartUI() {
    const qty = cartQty();
    const cc = $('#cartCount');
    cc.textContent = qty; cc.classList.toggle('hidden', qty === 0);
    const sub = cartTotal();
    $('#cartTotal').textContent = EGP(sub);
    // Update checkout totals
    const subEl = $('#checkoutSubtotal'); if (subEl) subEl.textContent = EGP(sub);
    const delEl = $('#checkoutDelivery'); if (delEl) delEl.textContent = EGP(getDeliveryFee());
    const discEl = $('#checkoutDiscount'); if (discEl) discEl.textContent = appliedDiscount > 0 ? '-' + EGP(appliedDiscount) : '0';
    const totalEl = $('#checkoutTotal'); if (totalEl) totalEl.textContent = EGP(getFinalTotal());
    const items = $('#cartItems'), empty = $('#cartEmpty'), btn = $('#checkoutBtn');
    const list = cartList();
    if (list.length === 0) { 
      items.classList.add('hidden'); empty.classList.remove('hidden'); btn.disabled = true; 
      if (btn) btn.innerHTML = isStoreOpenNow() ? 'إتمام الطلب' : 'المطعم مغلق حالياً';
      return; 
    }
    items.classList.remove('hidden'); empty.classList.add('hidden'); 
    if (btn) {
      if (!isStoreOpenNow()) {
        btn.disabled = true;
        btn.innerHTML = 'المطعم مغلق حالياً';
      } else {
        btn.disabled = false;
        btn.innerHTML = 'إتمام الطلب';
      }
    }
    items.innerHTML = list.map(i => `
      <div class="cart-item">
        <img src="${i.img}" alt="${i.name}" loading="lazy">
        <div class="flex-1 min-w-0">
          <p class="font-cairo font-bold truncate">${i.name}</p>
          <p class="text-sm text-darkred dark:text-gold font-poppins font-semibold">${i.price} ج.م</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="qty-btn" data-dec="${i.id}">−</button>
          <span class="w-6 text-center font-poppins font-semibold">${i.qty}</span>
          <button class="qty-btn" data-inc="${i.id}">+</button>
        </div>
      </div>`).join('');
    $$('[data-inc]', items).forEach(b => b.onclick = () => changeQty(b.dataset.inc, 1));
    $$('[data-dec]', items).forEach(b => b.onclick = () => changeQty(b.dataset.dec, -1));
  }

  /* ---------- Coupon logic ---------- */
  function applyCoupon() {
    const input = $('#couponInput');
    const msg = $('#couponMsg');
    if (!input || !msg) return;
    const code = input.value.trim().toUpperCase();
    if (!code) { msg.textContent = ''; msg.className = 'coupon-msg'; return; }
    const coupon = COUPONS[code];
    if (!coupon) {
      msg.textContent = '❌ كود غير صالح';
      msg.className = 'coupon-msg coupon-error';
      appliedCoupon = null; appliedDiscount = 0;
      updateCartUI();
      return;
    }
    const sub = cartTotal();
    if (sub < coupon.minOrder) {
      msg.textContent = `⚠️ الحد الأدنى للطلب ${coupon.minOrder} ج.م`;
      msg.className = 'coupon-msg coupon-error';
      appliedCoupon = null; appliedDiscount = 0;
      updateCartUI();
      return;
    }
    if (coupon.type === 'percent') {
      appliedDiscount = Math.round(sub * coupon.value / 100);
    } else {
      appliedDiscount = coupon.value;
    }
    appliedCoupon = code;
    msg.textContent = `✅ تم تطبيق ${coupon.label} — خصم ${EGP(appliedDiscount)} ج.م`;
    msg.className = 'coupon-msg coupon-success';
    updateCartUI();
  }

  /* ---------- Phone validation ---------- */
  function validatePhone(phone) {
    const cleaned = phone.replace(/\s+/g, '');
    return /^01[0125][0-9]{8}$/.test(cleaned);
  }

  /* ---------- Drawers / modals ---------- */
  function openCart() { const d = $('#cartDrawer'); d.classList.remove('hidden'); requestAnimationFrame(() => $('#cartPanel').classList.remove('translate-x-full')); document.body.style.overflow = 'hidden'; }
  function closeCart() { $('#cartPanel').classList.add('translate-x-full'); setTimeout(() => { $('#cartDrawer').classList.add('hidden'); document.body.style.overflow = ''; }, 300); }
  function openCheckout() {
    if (cartList().length === 0) return;
    if (!isStoreOpenNow()) {
      toast('⚠️ المطعم مغلق حاليا. تقدر تتواصل معنا على واتساب.');
      return;
    }
    const minOrder = getMinOrder();
    if (cartTotal() < minOrder) {
      toast(`⚠️ الحد الأدنى للطلب ${EGP(minOrder)} ج.م`);
      return;
    }
    closeCart();
    const m = $('#checkoutModal'); m.classList.remove('hidden');
    requestAnimationFrame(() => { const c = $('#checkoutCard'); c.classList.remove('scale-95', 'opacity-0'); });
    document.body.style.overflow = 'hidden';
  }
  function closeCheckout() { const c = $('#checkoutCard'); c.classList.add('scale-95', 'opacity-0'); setTimeout(() => { $('#checkoutModal').classList.add('hidden'); document.body.style.overflow = ''; }, 250); }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.innerHTML = `<div class="toast-msg">${msg}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.innerHTML = ''; }, 2600);
  }

  /* ---------- Countdown (resets each day) ---------- */
  function countdown() {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    function tick() {
      let diff = Math.max(0, end - new Date());
      const h = Math.floor(diff / 3.6e6); diff -= h * 3.6e6;
      const m = Math.floor(diff / 6e4); diff -= m * 6e4;
      const s = Math.floor(diff / 1000);
      const set = (k, v) => { const el = $(`[data-cd="${k}"]`); if (el) el.textContent = String(v).padStart(2, '0'); };
      set('hours', h); set('minutes', m); set('seconds', s);
    }
    tick(); setInterval(tick, 1000);
  }

  /* ---------- Animated counters ---------- */
  function animateCounter(el) {
    const target = +el.dataset.target;
    const suffix = el.dataset.suffix || '';
    const dur = 1600; const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = EGP(Math.floor(eased * target)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Live orders counter ---------- */
  function liveOrders() {
    const el = $('#liveOrders'); if (!el) return;
    let n = 42 + Math.floor(Math.random() * 30);
    el.textContent = n;
    setInterval(() => { n += Math.floor(Math.random() * 5) - 2; n = Math.max(28, Math.min(120, n)); el.textContent = n; }, 3500);
  }

  /* ---------- Reveal on scroll ---------- */
  const revObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const delay = +el.dataset.delay || 0;
        setTimeout(() => el.classList.add('in'), delay);
        if (el.classList.contains('counter')) animateCounter(el);
        revObserver.unobserve(el);
      }
    });
  }, { threshold: 0.15 });
  function observeReveals(scope = document) {
    if (!('IntersectionObserver' in window)) {
      $$('[data-reveal]', scope).forEach(el => el.classList.add('in'));
      $$('.counter', scope).forEach(animateCounter);
      return;
    }
    $$('[data-reveal], .counter', scope).forEach(el => revObserver.observe(el));
    // Safety net: never leave content invisible
    setTimeout(() => $$('[data-reveal]:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight) el.classList.add('in');
    }), 1200);
  }

  /* ---------- Navbar / scroll ---------- */
  function scrollFx() {
    const nav = $('#navInner'), prog = $('#scrollProgress'), toTop = $('#toTop'), sticky = $('#stickyCta');
    function onScroll() {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 30);
      const h = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
      toTop.classList.toggle('opacity-0', y < 500);
      toTop.classList.toggle('pointer-events-none', y < 500);
      sticky.classList.toggle('translate-y-full', y < 700);
    }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- Theme toggle ---------- */
  function themeToggle() {
    const btn = $('#themeToggle');
    const sync = () => { const d = document.documentElement.classList.contains('dark'); $('.sun', btn).classList.toggle('hidden', d); $('.moon', btn).classList.toggle('hidden', !d); };
    sync();
    btn.addEventListener('click', () => {
      const d = document.documentElement.classList.toggle('dark');
      store.set('alshami-theme', d ? 'dark' : 'light'); sync();
    });
  }

  /* ---------- Mobile menu ---------- */
  function mobileMenu() {
    const menu = $('#mobileMenu'), panel = $('#mobilePanel');
    const open = () => { menu.classList.remove('hidden'); requestAnimationFrame(() => panel.classList.remove('translate-x-full')); document.body.style.overflow = 'hidden'; };
    const close = () => { panel.classList.add('translate-x-full'); setTimeout(() => { menu.classList.add('hidden'); document.body.style.overflow = ''; }, 300); };
    $('#menuBtn').addEventListener('click', open);
    $$('[data-close-menu]').forEach(el => el.addEventListener('click', close));
  }

  /* ---------- Checkout submit ---------- */
  function generateOrderNumber() {
    // Unique order number based on time + random
    const d = new Date();
    const timeStr = String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + String(d.getSeconds()).padStart(2, '0');
    return timeStr + String(Math.floor(100 + Math.random() * 900));
  }

  /* ---------- Success modal ---------- */
  function openSuccessModal(orderNumber, phone) {
    const m = $('#successModal');
    if (!m) return;
    
    // Set order number
    $('#successOrderNum').textContent = orderNumber;
    
    // Set tracking link
    const trackLink = $('#successTrackLink');
    trackLink.href = `track.html?order=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`;
    
    // Set WhatsApp link
    const waLink = $('#successWhatsApp');
    waLink.href = `https://wa.me/201037775765?text=${encodeURIComponent(`مرحباً، أنا عملت طلب رقم ${orderNumber} وعايز أتابعه.`)}`;
    
    // Copy button
    const copyBtn = $('#copyOrderNum');
    if (copyBtn) {
      copyBtn.onclick = () => {
        try {
          navigator.clipboard.writeText(orderNumber).then(() => {
            copyBtn.innerHTML = '✅ تم النسخ!';
            setTimeout(() => { copyBtn.innerHTML = '📋 نسخ رقم الطلب'; }, 2000);
          });
        } catch (e) {
          // Fallback
          const ta = document.createElement('textarea');
          ta.value = orderNumber;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.innerHTML = '✅ تم النسخ!';
          setTimeout(() => { copyBtn.innerHTML = '📋 نسخ رقم الطلب'; }, 2000);
        }
      };
    }
    
    // Save to localStorage
    store.set('alshami-last-order', JSON.stringify({ orderNumber, phone }));
    
    // Show modal
    m.classList.remove('hidden');
    requestAnimationFrame(() => {
      const c = $('#successCard');
      c.classList.remove('scale-95', 'opacity-0');
    });
    document.body.style.overflow = 'hidden';
  }
  function closeSuccessModal() {
    const c = $('#successCard');
    if (!c) return;
    c.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      $('#successModal').classList.add('hidden');
      document.body.style.overflow = '';
    }, 250);
  }

  function checkoutForm() {
    const form = $('#checkoutForm');
    const addrField = $('#addressField');
    const zoneContainer = $('#zoneContainer');
    
    // Listen for zone changes
    const zoneSelect = $('#deliveryZone');
    if (zoneSelect) {
      zoneSelect.addEventListener('change', updateCartUI);
    }

    $$('input[name="method"]', form).forEach(r => r.addEventListener('change', () => {
      const isDelivery = form.method.value === 'delivery';
      if (addrField) addrField.style.display = isDelivery ? '' : 'none';
      if (zoneContainer) zoneContainer.style.display = isDelivery ? '' : 'none';
      $('input[name="address"]', form).required = isDelivery;
      if (zoneSelect) zoneSelect.required = isDelivery;
      updateCartUI(); // recalculate delivery fee
    }));
    $('input[name="address"]', form).required = true;

    // Coupon button
    const couponBtn = $('#applyCoupon');
    if (couponBtn) couponBtn.addEventListener('click', applyCoupon);
    const couponInput = $('#couponInput');
    if (couponInput) couponInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));

      // Phone validation
      if (!validatePhone(data.phone || '')) {
        toast('⚠️ رقم الموبايل مش صح — لازم يبدأ بـ 01 ويكون 11 رقم');
        $('input[name="phone"]', form).focus();
        return;
      }
      if (typeof db === 'undefined' || !db || typeof firebase === 'undefined') {
        toast('⚠️ خدمة قاعدة البيانات غير متصلة الآن.');
        return;
      }

      const minOrder = getMinOrder();
      if (!isStoreOpenNow()) {
        toast('⚠️ المطعم مغلق حاليا. تقدر تتواصل معنا على واتساب.');
        return;
      }
      if (cartTotal() < minOrder) {
        toast(`⚠️ الحد الأدنى للطلب ${EGP(minOrder)} ج.م`);
        return;
      }
      if (!['cash', 'vodafone'].includes(data.payment)) {
        toast('⚠️ اختار طريقة دفع صحيحة.');
        return;
      }

      const orderNumber = generateOrderNumber();
      const deliveryFee = getDeliveryFee();
      const finalTotal = getFinalTotal();
      const zoneSelect = $('#deliveryZone');
      const selectedZone = data.method === 'delivery' && zoneSelect
        ? { id: zoneSelect.value || 'default', name: zoneSelect.selectedOptions[0]?.textContent || '' }
        : null;
      
      const order = {
        orderNumber,
        customer: {
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
        },
        items: cartList().map(i => ({ name: i.name, qty: i.qty, price: i.price, total: i.qty * i.price })),
        subtotal: cartTotal(),
        deliveryFee: deliveryFee,
        discount: appliedDiscount,
        coupon: appliedCoupon || '',
        total: finalTotal,
        method: data.method || 'delivery',
        payment: data.payment || 'cash',
        zone: selectedZone,
        notes: data.notes || '',
        status: 'new',
        createdAt: new Date().toISOString(),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      };

      const submitBtn = $('button[type="submit"]', form);
      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="animate-pulse">جاري الإرسال...</span>';
      submitBtn.disabled = true;

      const cleanup = () => {
        appliedCoupon = null; appliedDiscount = 0;
        cart = {}; saveCart(); updateCartUI(); form.reset();
        $('#addressField').style.display = '';
        const ci = $('#couponInput'); if (ci) ci.value = '';
        const cm = $('#couponMsg'); if (cm) { cm.textContent = ''; cm.className = 'coupon-msg'; }
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
      };

      const onSuccess = () => {
        closeCheckout();
        setTimeout(() => {
          openSuccessModal(orderNumber, data.phone || '');
          // Auto WhatsApp notification
          autoWhatsAppNotify(order);
        }, 350);
        cleanup();
      };

      try {
        if (typeof db !== 'undefined' && db) {
          const orderRef = db.ref('orders').push();
          const firebaseKey = orderRef.key;
          order.firebaseKey = firebaseKey;
          orderRef.set(order)
            .then(onSuccess)
            .catch(err => {
              console.error('Firebase save error:', err);
              toast('❌ فشل إرسال الطلب، تأكد من اتصالك بالإنترنت وحاول تاني.');
              submitBtn.innerHTML = origText;
              submitBtn.disabled = false;
            });
        } else {
          toast('⚠️ خدمة قاعدة البيانات غير متصلة الآن.');
          submitBtn.innerHTML = origText;
          submitBtn.disabled = false;
        }
      } catch (err) {
        console.error(err);
        toast('❌ حدث خطأ غير متوقع.');
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
      }
    });

    $$('[data-close-success]').forEach(el => el.addEventListener('click', closeSuccessModal));
  }

  /* ---------- Auto WhatsApp notify (open for shop owner) ---------- */
  function autoWhatsAppNotify(order) {
    try {
      const itemsList = (order.items || []).map(i => `• ${i.name} ×${i.qty}`).join('\n');
      const msg = `🆕 *طلب جديد #${order.orderNumber}*\n\n👤 ${order.customer?.name}\n📞 ${order.customer?.phone}\n${order.customer?.address ? '📍 ' + order.customer.address + '\n' : ''}\n🧾 *الأصناف:*\n${itemsList}\n\n💰 الإجمالي: ${order.total} ج.م\n📦 ${order.method === 'delivery' ? 'دليفري' : 'تيك أواي'}\n💳 ${order.payment === 'vodafone' ? 'فودافون' : 'كاش'}`;
      // Don't auto-open, just prepare the link in case owner wants it
      // The admin dashboard handles notifications
    } catch (e) { console.error('WhatsApp notify error:', e); }
  }

  /* ---------- Newsletter to Firebase ---------- */
  function handleNewsletter(e) {
    e.preventDefault();
    const form = e.target;
    const email = $('input[type="email"]', form)?.value?.trim();
    if (!email) return;
    if (typeof db !== 'undefined' && db) {
      db.ref('subscribers').push({ email, subscribedAt: new Date().toISOString() })
        .then(() => { form.reset(); toast('📬 تم الاشتراك بنجاح! هنبعتلك العروض الحصرية.'); })
        .catch(() => { form.reset(); toast('📬 تم الاشتراك بنجاح!'); });
    } else {
      form.reset(); toast('📬 تم الاشتراك بنجاح!');
    }
  }

  /* ---------- Add Review ---------- */
  function openReviewModal() {
    const rm = $('#reviewModal');
    if(!rm) return;
    rm.classList.remove('hidden');
    requestAnimationFrame(() => {
      $('#reviewCard').classList.remove('translate-y-full', 'sm:translate-y-0', 'sm:scale-95', 'opacity-0');
    });
    document.body.style.overflow = 'hidden';
  }
  function closeReviewModal() {
    const rc = $('#reviewCard');
    if (!rc) return;
    rc.classList.add('translate-y-full', 'sm:translate-y-0', 'sm:scale-95', 'opacity-0');
    setTimeout(() => {
      $('#reviewModal').classList.add('hidden');
      document.body.style.overflow = '';
    }, 250);
  }

  const reviewBtn = $('#openReviewModalBtn');
  if(reviewBtn) reviewBtn.addEventListener('click', openReviewModal);
  $$('[data-close-review]').forEach(el => el.addEventListener('click', closeReviewModal));

  const stars = $$('#reviewStars .star');
  const ratingInput = $('#reviewRating');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      ratingInput.value = val;
      stars.forEach(s => {
        if(parseInt(s.dataset.val) <= val) {
          s.textContent = '★';
        } else {
          s.textContent = '☆';
        }
      });
    });
  });

  const reviewForm = $('#reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#reviewName').value.trim();
      const text = $('#reviewText').value.trim();
      const starsVal = parseInt(ratingInput.value) || 5;
      
      if (!name || !text) return;
      
      const submitBtn = $('#submitReviewBtn');
      const origText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span class="animate-pulse">جاري الإرسال...</span>';
      submitBtn.disabled = true;

      const reviewData = {
        name: name,
        text: text,
        initial: name.charAt(0),
        stars: starsVal,
        createdAt: new Date().toISOString(),
        timestamp: typeof firebase !== 'undefined' ? firebase.database.ServerValue.TIMESTAMP : Date.now()
      };

      if (typeof db !== 'undefined' && db) {
        db.ref('reviews').push(reviewData).then(() => {
          toast('✅ تم إضافة تقييمك بنجاح. شكراً لك!');
          reviewForm.reset();
          ratingInput.value = 5;
          stars.forEach(s => s.textContent = '★');
          closeReviewModal();
        }).catch(err => {
          console.error(err);
          toast('❌ حدث خطأ أثناء إضافة التقييم.');
        }).finally(() => {
          submitBtn.innerHTML = origText;
          submitBtn.disabled = false;
        });
      } else {
        toast('⚠️ خدمة قاعدة البيانات غير متصلة.');
        submitBtn.innerHTML = origText;
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------- Error tracking ---------- */
  window.addEventListener('error', (e) => {
    console.error('[alshami-error]', e.message, e.filename, e.lineno);
    if (typeof db !== 'undefined' && db) {
      try {
        db.ref('errors').push({
          message: e.message || '',
          file: e.filename || '',
          line: e.lineno || 0,
          col: e.colno || 0,
          url: location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
      } catch (ex) {}
    }
  });

  /* ---------- Init ---------- */
  const safe = (fn, label) => { try { fn(); } catch (e) { console.error('[alshami] ' + label + ' failed:', e); } };

  function init() {
    safe(() => { $('#year').textContent = new Date().getFullYear(); }, 'year');

    const finalizeInit = () => {
      safe(renderMenu, 'menu'); safe(renderGallery, 'gallery'); safe(renderReviews, 'reviews'); safe(renderFAQ, 'faq');
      safe(updateCartUI, 'cartUI');
      safe(countdown, 'countdown'); safe(liveOrders, 'liveOrders'); safe(scrollFx, 'scrollFx');
      safe(themeToggle, 'theme'); safe(mobileMenu, 'mobileMenu'); safe(checkoutForm, 'checkout');
      safe(observeReveals, 'reveals');
      
      // Populate delivery zones
      const zoneSelect = $('#deliveryZone');
      if (zoneSelect && STORE_SETTINGS && STORE_SETTINGS.delivery_zones) {
        zoneSelect.innerHTML = '<option value="" disabled selected>اختر المنطقة</option>' + 
          STORE_SETTINGS.delivery_zones.map(z => `<option value="${escapeHTML(z.id)}">${escapeHTML(z.name)} - ${Number(z.price) || 0} ج.م</option>`).join('');
      } else if (zoneSelect) {
        zoneSelect.innerHTML = `<option value="default" selected>توصيل عادي - ${DEFAULT_DELIVERY_FEE} ج.م</option>`;
      }
    };

    if (typeof db !== 'undefined' && db) {
      // Real-time settings listener
      db.ref('settings').on('value', (snap) => {
        const settings = snap.val();
        if (settings) {
          STORE_SETTINGS = { ...DEFAULT_STORE_SETTINGS, ...settings };
          const zoneSelect = $('#deliveryZone');
          if (zoneSelect && STORE_SETTINGS.delivery_zones) {
            const prev = zoneSelect.value;
            zoneSelect.innerHTML = '<option value="" disabled selected>اختر المنطقة</option>' + 
              STORE_SETTINGS.delivery_zones.map(z => `<option value="${escapeHTML(z.id)}">${escapeHTML(z.name)} - ${Number(z.price) || 0} ج.م</option>`).join('');
            if (prev) zoneSelect.value = prev;
          }
          updateCartUI();
        }
      });

      // Real-time reviews listener
      db.ref('reviews').on('value', (snap) => {
        const data = snap.val();
        if (data) {
          const reviewsArray = Object.keys(data).map(k => ({...data[k], id: k}));
          reviewsArray.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          if(reviewsArray.length > 0) {
            REVIEWS = reviewsArray;
            renderReviews();
          }
        }
      });

      Promise.all([
        db.ref('categories').once('value'),
        db.ref('menu').once('value'),
        db.ref('coupons').once('value'),
      ]).then(([categoriesSnap, menuSnap, couponsSnap]) => {
        const categories = categoriesSnap.val();
        const menu = menuSnap.val();
        const couponsData = couponsSnap.val();
        if (categories) CATEGORIES = Object.values(categories);
        if (menu) {
          MEALS = Object.values(menu).filter(m => !m.disabled);
        }
        if (couponsData) COUPONS = couponsData;
        
        finalizeInit();
      }).catch(err => {
        console.error('Failed to load DB data', err);
        finalizeInit();
      });
    } else {
      finalizeInit();
    }

    $('#cartBtn').addEventListener('click', openCart);
    $$('[data-close-cart]').forEach(el => el.addEventListener('click', closeCart));
    $('#checkoutBtn').addEventListener('click', openCheckout);
    $$('[data-close-checkout]').forEach(el => el.addEventListener('click', closeCheckout));
    $('#newsletterForm').addEventListener('submit', handleNewsletter);

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      closeLightbox(); closeCart(); closeCheckout(); closeSuccessModal();
    });

    $$('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1) { const t = $(id); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } }
    }));
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
