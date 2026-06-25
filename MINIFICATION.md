# Minification & Performance Notes

## كيفية ضغط الملفات للإنتاج

### 1. CSS Minification
```bash
# باستخدام cssnano عبر npx
npx cssnano styles.css styles.min.css
npx cssnano admin.css admin.min.css
```

### 2. JavaScript Minification
```bash
# باستخدام terser
npx terser app.js -o app.min.js --compress --mangle
npx terser admin.js -o admin.min.js --compress --mangle
npx terser firebase-config.js -o firebase-config.min.js --compress --mangle
```

### 3. HTML Minification
```bash
# باستخدام html-minifier
npx html-minifier-terser --collapse-whitespace --remove-comments --minify-css --minify-js -o index.min.html index.html
```

### 4. Image Optimization
```bash
# تحويل الصور لـ WebP
npx sharp-cli -i assets/*.jpeg -o assets/ -f webp
npx sharp-cli -i assets/*.jpg -o assets/ -f webp
npx sharp-cli -i assets/*.png -o assets/ -f webp
```

## ملاحظات
- الصور حالياً بتستخدم `loading="lazy"` لتحسين الأداء
- الموقع بيستخدم Tailwind CSS من CDN — ممكن يتحوّل لبناء محلي لتقليل الحجم
- Service Worker بيعمل cache للملفات الأساسية
