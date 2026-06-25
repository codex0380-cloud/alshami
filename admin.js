/* ===================== شاورما الشامي — Admin Dashboard Logic ===================== */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Config ---------- */
  const PHONE_NUMBERS = ['01037775765', '01038437067'];
  
  const STATUS_MAP = {
    new: { label: 'جديد', badge: 'badge-new', icon: '🆕' },
    preparing: { label: 'جاري التحضير', badge: 'badge-preparing', icon: '👨‍🍳' },
    out_for_delivery: { label: 'في الطريق', badge: 'badge-out', icon: '🚚' },
    delivered: { label: 'تم التسليم', badge: 'badge-delivered', icon: '✅' },
    cancelled: { label: 'ملغي', badge: 'badge-cancelled', icon: '❌' },
  };

  const METHOD_MAP = { delivery: '🚚 دليفري', pickup: '🛍️ تيك أواي' };
  const PAYMENT_MAP = { cash: '💵 كاش', vodafone: '📱 فودافون' };

  let soundEnabled = true;
  let activeFilter = 'all';
  let activeDateFilter = 'today';
  let searchQuery = '';
  let orders = {};
  let isFirstLoad = true;
  let adminSettings = {};
  let adminMenu = [];
  let adminCoupons = [];
  let adminReviews = [];
  let currentEditItemId = null;

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

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg, type = 'success') {
    const t = $('#adminToast');
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    t.innerHTML = `<div class="admin-toast-msg toast-${type}">${icons[type] || ''} ${escapeHTML(msg)}</div>`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.innerHTML = ''; }, 3200);
  }

  function writeAuditLog(orderKey, action, details = {}) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    const user = firebase.auth && firebase.auth().currentUser;
    return db.ref('auditLogs').push({
      orderKey,
      action,
      details,
      actor: user ? (user.email || user.uid) : 'unknown',
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      createdAt: new Date().toISOString(),
    }).catch(err => console.warn('Audit log failed:', err));
  }

  /* ---------- Auth ---------- */
  function checkAuth() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn('Firebase Auth not configured');
      showLogin();
      return;
    }
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        showDashboard();
      } else {
        showLogin();
      }
    });
  }

  function showLogin() {
    const overlay = $('#loginOverlay');
    if (overlay) overlay.style.display = 'grid';
    const dashboard = $('#dashboard');
    if (dashboard) dashboard.style.display = 'none';
  }

  function showDashboard() {
    const overlay = $('#loginOverlay');
    if (overlay) overlay.style.display = 'none';
    const dashboard = $('#dashboard');
    if (dashboard) dashboard.style.display = 'block';
    initFirebase();
  }

  function handleLogin() {
    const input = $('#loginPassword');
    const error = $('#loginError');
    const btn = $('#loginBtn');
    const password = input.value;
    
    if (!password) {
      error.style.display = 'block';
      error.textContent = '❌ ادخل كلمة السر';
      return;
    }

    const origText = btn.innerHTML;
    btn.innerHTML = '⏳ جاري الدخول...';
    btn.disabled = true;

    firebase.auth().signInWithEmailAndPassword('admin@alshami.com', password)
      .then(() => {
        error.style.display = 'none';
        btn.innerHTML = origText;
        btn.disabled = false;
        input.value = '';
      })
      .catch((err) => {
        if (err.code === 'auth/user-not-found') {
          firebase.auth().createUserWithEmailAndPassword('admin@alshami.com', password)
            .then(() => {
              error.style.display = 'none';
              btn.innerHTML = origText;
              btn.disabled = false;
              input.value = '';
            })
            .catch((regErr) => {
              console.error(regErr);
              error.style.display = 'block';
              error.textContent = '❌ فشل إنشاء الحساب: ' + regErr.message;
              btn.innerHTML = origText;
              btn.disabled = false;
            });
        } else {
          console.error(err);
          error.style.display = 'block';
          error.textContent = '❌ كلمة السر غلط.';
          btn.innerHTML = origText;
          btn.disabled = false;
          input.value = '';
          input.focus();
        }
      });
  }

  function handleLogout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      firebase.auth().signOut().then(() => {
        orders = {};
        isFirstLoad = true;
        if (typeof db !== 'undefined' && db) {
          try { db.ref('orders').off(); } catch (e) {}
        }
        showToast('تم تسجيل الخروج بنجاح', 'info');
      });
    }
  }

  /* ---------- Firebase listener ---------- */
  function initFirebase() {
    if (typeof db === 'undefined' || !db) {
      console.warn('Firebase not configured');
      renderOrders();
      return;
    }

    db.ref('orders').orderByChild('timestamp').on('value', (snapshot) => {
      const prev = Object.keys(orders);
      orders = {};
      snapshot.forEach((child) => {
        orders[child.key] = { firebaseKey: child.key, ...child.val() };
      });

      if (!isFirstLoad) {
        const current = Object.keys(orders);
        const newKeys = current.filter(k => !prev.includes(k));
        if (newKeys.length > 0) {
          playNotification('new_order');
          showToast(`🎉 طلب جديد وصل! (${newKeys.length})`, 'info');
          setTimeout(() => {
            newKeys.forEach(k => {
              const card = $(`[data-key="${k}"]`);
              if (card) card.classList.add('new-order-flash');
            });
          }, 100);
        }
      }
      isFirstLoad = false;

      renderStats();
      renderOrders();
      renderReportsSection();
    });

    db.ref('settings').on('value', (snap) => {
      adminSettings = snap.val() || {};
      renderSettings();
    });

    db.ref('menu').on('value', (snap) => {
      const data = snap.val() || {};
      adminMenu = Object.values(data);
      renderMenuAdmin();
    });

    db.ref('coupons').on('value', (snap) => {
      const data = snap.val() || {};
      adminCoupons = Object.entries(data).map(([key, val]) => ({ firebaseKey: key, ...val }));
      renderCoupons();
    });

    db.ref('reviews').on('value', (snap) => {
      const data = snap.val() || {};
      adminReviews = Object.entries(data).map(([key, val]) => ({ firebaseKey: key, ...val }));
      adminReviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      renderReviewsAdmin();
    });
  }

  /* ---------- Admin View Logic ---------- */
  function renderSettings() {
    const statusSelect = $('#storeStatusSelect');
    if (statusSelect && adminSettings.store_status) {
      statusSelect.value = adminSettings.store_status;
    }
    const zonesList = $('#zonesList');
    if (zonesList && adminSettings.delivery_zones) {
      zonesList.innerHTML = adminSettings.delivery_zones.map(z => `
        <div class="flex items-center gap-2 mb-2">
          <input type="text" class="search-input flex-1 zone-name-input" value="${escapeHTML(z.name)}" placeholder="اسم المنطقة">
          <input type="number" class="search-input w-24 zone-price-input" value="${z.price}" placeholder="السعر">
          <button class="btn-primary" style="background:#ef4444;border:none;border-radius:8px;padding:.5rem;cursor:pointer" onclick="this.parentElement.remove()">❌</button>
        </div>
      `).join('');
    } else if (zonesList) {
      zonesList.innerHTML = '';
    }
  }

  function renderMenuAdmin() {
    const tbody = $('#menuTbody');
    if (!tbody) return;
    if (adminMenu.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding:2rem;text-align:center">لا توجد أصناف في المنيو</td></tr>';
      return;
    }
    tbody.innerHTML = adminMenu.map(m => `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:.75rem;font-weight:bold;color:var(--text)">${escapeHTML(m.name)}</td>
        <td style="padding:.75rem;color:var(--gold);font-weight:bold">${m.price} ج.م</td>
        <td style="padding:.75rem;font-size:.9rem">${escapeHTML(m.cat)}</td>
        <td style="padding:.75rem">${m.disabled ? '<span style="color:#ef4444;font-size:.85rem">متوقف</span>' : '<span style="color:#22c55e;font-size:.85rem">متاح</span>'}</td>
        <td style="padding:.75rem">
          <button onclick="toggleMenuItem('${m.id}', ${!m.disabled})" style="background:none;border:none;cursor:pointer" title="${m.disabled ? 'تفعيل' : 'إيقاف'}">${m.disabled ? '🟢' : '🔴'}</button>
          <button onclick="editMenuItem('${m.id}')" style="background:none;border:none;cursor:pointer;color:#3b82f6" title="تعديل">✏️</button>
          <button onclick="deleteMenuItem('${m.id}')" style="background:none;border:none;cursor:pointer;color:#ef4444" title="حذف">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  window.toggleMenuItem = function(id, disable) {
    if (typeof db !== 'undefined' && db) {
      db.ref('menu/' + id).update({ disabled: disable });
      showToast(disable ? 'تم إيقاف الصنف مؤقتاً' : 'تم تفعيل الصنف', 'info');
    }
  };

  /* ---------- Coupon Management ---------- */
  function renderCoupons() {
    const tbody = $('#couponsTbody');
    if (!tbody) return;
    if (adminCoupons.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding:2rem;text-align:center">لا توجد كوبونات</td></tr>';
      return;
    }
    tbody.innerHTML = adminCoupons.map(c => `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:.75rem;font-weight:bold;color:var(--text);font-family:'Poppins',sans-serif">${escapeHTML(c.firebaseKey)}</td>
        <td style="padding:.75rem;color:var(--gold)">${c.type === 'percent' ? c.value + '%' : c.value + ' ج.م'}</td>
        <td style="padding:.75rem">${c.min_order} ج.م</td>
        <td style="padding:.75rem">${c.active ? '<span style="color:#22c55e;font-size:.85rem">فعال</span>' : '<span style="color:#ef4444;font-size:.85rem">متوقف</span>'}</td>
        <td style="padding:.75rem">
          <button onclick="deleteCoupon('${c.firebaseKey}')" style="background:none;border:none;cursor:pointer" title="حذف">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  function renderReviewsAdmin() {
    const tbody = $('#reviewsTbody');
    const badge = $('#reviewsCountBadge');
    if (badge) badge.textContent = `${adminReviews.length} تقييم`;
    if (!tbody) return;
    
    if (adminReviews.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding:2rem;text-align:center">لا توجد تقييمات حتى الآن</td></tr>';
      return;
    }
    
    tbody.innerHTML = adminReviews.map(r => `
      <tr style="border-bottom:1px solid var(--border)">
        <td style="padding:.75rem;font-weight:bold;color:var(--text)">${escapeHTML(r.name || 'مجهول')}</td>
        <td style="padding:.75rem;color:var(--gold);font-weight:bold">${'★'.repeat(r.stars || 5)}${'☆'.repeat(5 - (r.stars || 5))}</td>
        <td style="padding:.75rem;font-size:.9rem;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHTML(r.text)}">${escapeHTML(r.text)}</td>
        <td style="padding:.75rem;font-size:.85rem;color:var(--text-muted)">${r.createdAt ? new Date(r.createdAt).toLocaleDateString('ar-EG') : ''}</td>
        <td style="padding:.75rem">
          <button onclick="deleteReview('${r.firebaseKey}')" style="background:none;border:none;cursor:pointer;color:#ef4444" title="حذف">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  window.deleteCoupon = function(code) {
    if(!confirm(`متأكد إنك عايز تحذف كود الخصم: ${code}؟`)) return;
    if (typeof db !== 'undefined' && db) {
      db.ref('coupons/' + code).remove().then(() => showToast('تم الحذف', 'success')).catch(console.error);
    }
  };

  window.deleteReview = function(id) {
    if(!confirm('متأكد إنك عايز تحذف التقييم ده؟')) return;
    if (typeof db !== 'undefined' && db) {
      db.ref('reviews/' + id).remove().then(() => {
        showToast('تم حذف التقييم بنجاح', 'success');
      }).catch(err => {
        showToast('خطأ في الحذف', 'error');
        console.error(err);
      });
    }
  };

  window.editMenuItem = function(id) {
    const item = adminMenu.find(m => m.id === id);
    if (!item) return;
    
    currentEditItemId = id;
    const modalTitle = $('#modalTitle');
    const modalDesc = $('#modalDesc');
    if(modalTitle) modalTitle.innerText = '✏️ تعديل صنف';
    if(modalDesc) modalDesc.innerText = 'تعديل بيانات الصنف المحدد';
    
    $('#newItemName').value = item.name || '';
    $('#newItemDesc').value = item.desc || '';
    $('#newItemPrice').value = item.price || '';
    $('#newItemPriceL').value = item.priceL || '';
    $('#newItemCat').value = item.cat || '';
    $('#newItemImg').value = item.img || 'assets/shawarma_arabi.jpeg';
    $('#newItemBest').checked = !!item.best;
    $('#newItemSizes').checked = !!(item.sizes && item.sizes.length);
    
    $('#addMenuItemModal').classList.add('active');
  };

  window.deleteMenuItem = function(id) {
    if (confirm('هل أنت متأكد من حذف الصنف نهائياً؟')) {
      if (typeof db !== 'undefined' && db) {
        db.ref('menu/' + id).remove();
        showToast('تم حذف الصنف', 'success');
      }
    }
  };

  /* ---------- Sound (varied) ---------- */
  function playNotification(type = 'new_order') {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const sounds = {
        new_order: { notes: [523.25, 659.25, 783.99], type: 'sine', vol: 0.3, gap: 0.15, dur: 0.4 },
        status_change: { notes: [440, 554.37], type: 'triangle', vol: 0.2, gap: 0.12, dur: 0.3 },
        cancelled: { notes: [330, 277.18], type: 'sawtooth', vol: 0.15, gap: 0.2, dur: 0.35 },
        success: { notes: [523.25, 659.25, 783.99, 1046.50], type: 'sine', vol: 0.25, gap: 0.1, dur: 0.3 },
        error: { notes: [200, 180], type: 'square', vol: 0.1, gap: 0.25, dur: 0.4 },
      };
      const s = sounds[type] || sounds.new_order;
      s.notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = s.type;
        gain.gain.setValueAtTime(s.vol, ctx.currentTime + i * s.gap);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * s.gap + s.dur);
        osc.start(ctx.currentTime + i * s.gap);
        osc.stop(ctx.currentTime + i * s.gap + s.dur);
      });
    } catch (e) { console.log('Sound not supported'); }
  }

  /* ---------- Date filter helpers ---------- */
  function getDateRange(filter) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (filter) {
      case 'today':
        return { start: todayStart.toISOString(), end: null };
      case 'yesterday': {
        const yStart = new Date(todayStart);
        yStart.setDate(yStart.getDate() - 1);
        return { start: yStart.toISOString(), end: todayStart.toISOString() };
      }
      case 'week': {
        const wStart = new Date(todayStart);
        wStart.setDate(wStart.getDate() - 7);
        return { start: wStart.toISOString(), end: null };
      }
      default:
        return { start: null, end: null };
    }
  }

  function filterByDate(list) {
    if (activeDateFilter === 'all') return list;
    const range = getDateRange(activeDateFilter);
    return list.filter(o => {
      if (!o.createdAt) return false;
      const d = o.createdAt;
      if (range.start && d < range.start) return false;
      if (range.end && d >= range.end) return false;
      return true;
    });
  }

  function filterBySearch(list) {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter(o => {
      const name = (o.customer?.name || '').toLowerCase();
      const phone = (o.customer?.phone || '').toLowerCase();
      const orderNum = (o.orderNumber || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || orderNum.includes(q);
    });
  }

  /* ---------- Stats ---------- */
  function renderStats() {
    const list = Object.values(orders);
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = list.filter(o => o.createdAt && o.createdAt.startsWith(today));
    
    const newCount = list.filter(o => o.status === 'new').length;
    const prepCount = list.filter(o => o.status === 'preparing' || o.status === 'out_for_delivery').length;
    const delCount = todayOrders.filter(o => o.status === 'delivered').length;
    const todayTotal = todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);

    $('#statNew').textContent = newCount;
    $('#statPreparing').textContent = prepCount;
    $('#statDelivered').textContent = delCount;
    $('#statTotal').textContent = todayTotal.toLocaleString('ar-EG');

    const dateFiltered = filterByDate(list);
    const el = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    el('#countAll', dateFiltered.length);
    el('#countNew', dateFiltered.filter(o => o.status === 'new').length);
    el('#countPreparing', dateFiltered.filter(o => o.status === 'preparing').length);
    el('#countOut', dateFiltered.filter(o => o.status === 'out_for_delivery').length);
    el('#countDelivered', dateFiltered.filter(o => o.status === 'delivered').length);
    el('#countCancelled', dateFiltered.filter(o => o.status === 'cancelled').length);
  }

  /* ---------- Reports / Advanced Stats ---------- */
  function renderReportsSection() {
    const container = $('#reportsContent');
    if (!container) return;
    const list = Object.values(orders);
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = list.filter(o => o.createdAt && o.createdAt.startsWith(today));
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekOrders = list.filter(o => o.createdAt && new Date(o.createdAt) >= weekAgo);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const monthOrders = list.filter(o => o.createdAt && new Date(o.createdAt) >= monthAgo);

    const calcTotal = (arr) => arr.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
    const calcCount = (arr) => arr.filter(o => o.status !== 'cancelled').length;

    // Top selling items
    const itemCounts = {};
    list.filter(o => o.status !== 'cancelled').forEach(o => {
      (o.items || []).forEach(item => {
        const name = item.name;
        itemCounts[name] = (itemCounts[name] || 0) + (item.qty || 1);
      });
    });
    const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxQty = topItems.length > 0 ? topItems[0][1] : 1;

    container.innerHTML = `
      <div class="report-cards">
        <div class="report-card">
          <div class="report-period">📅 انهاردة</div>
          <div class="report-big-num">${calcTotal(todayOrders).toLocaleString('ar-EG')} <small>ج.م</small></div>
          <div class="report-sub">${calcCount(todayOrders)} طلب</div>
        </div>
        <div class="report-card">
          <div class="report-period">📅 آخر أسبوع</div>
          <div class="report-big-num">${calcTotal(weekOrders).toLocaleString('ar-EG')} <small>ج.م</small></div>
          <div class="report-sub">${calcCount(weekOrders)} طلب</div>
        </div>
        <div class="report-card">
          <div class="report-period">📅 آخر 30 يوم</div>
          <div class="report-big-num">${calcTotal(monthOrders).toLocaleString('ar-EG')} <small>ج.م</small></div>
          <div class="report-sub">${calcCount(monthOrders)} طلب</div>
        </div>
        <div class="report-card">
          <div class="report-period">📊 إجمالي كل الطلبات</div>
          <div class="report-big-num">${calcTotal(list).toLocaleString('ar-EG')} <small>ج.م</small></div>
          <div class="report-sub">${calcCount(list)} طلب</div>
        </div>
      </div>

      <div class="report-section">
        <h3>🏆 الأكثر مبيعاً</h3>
        <div class="top-items-list">
          ${topItems.map(([name, qty], i) => `
            <div class="top-item">
              <span class="top-rank">${i + 1}</span>
              <span class="top-name">${escapeHTML(name)}</span>
              <div class="top-bar-wrap">
                <div class="top-bar" style="width:${(qty / maxQty * 100)}%"></div>
              </div>
              <span class="top-qty">${qty}×</span>
            </div>
          `).join('')}
          ${topItems.length === 0 ? '<p style="color:var(--text-2);text-align:center;padding:1rem">مفيش بيانات كافية</p>' : ''}
        </div>
      </div>
    `;
  }

  /* ---------- Export CSV ---------- */
  function exportOrdersCSV() {
    let list = Object.values(orders);
    list = filterByDate(list);
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (list.length === 0) { showToast('مفيش طلبات للتصدير', 'warning'); return; }

    const BOM = '\uFEFF';
    const headers = ['رقم الطلب', 'الاسم', 'الموبايل', 'العنوان', 'الأصناف', 'الإجمالي', 'الطريقة', 'الدفع', 'الحالة', 'التاريخ', 'ملاحظات'];
    const rows = list.map(o => [
      o.orderNumber || '',
      o.customer?.name || '',
      o.customer?.phone || '',
      o.customer?.address || '',
      (o.items || []).map(i => `${i.name} x${i.qty}`).join(' | '),
      o.total || 0,
      METHOD_MAP[o.method] || o.method || '',
      PAYMENT_MAP[o.payment] || o.payment || '',
      STATUS_MAP[o.status]?.label || o.status || '',
      o.createdAt ? new Date(o.createdAt).toLocaleString('ar-EG') : '',
      o.notes || '',
    ]);

    const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alshami-orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`تم تصدير ${list.length} طلب بنجاح 📁`, 'success');
  }

  /* ---------- Print Receipt ---------- */
  function printOrder(key) {
    const order = orders[key];
    if (!order) return;
    const status = STATUS_MAP[order.status] || STATUS_MAP.new;
    const method = METHOD_MAP[order.method] || escapeHTML(order.method || '');
    const payment = PAYMENT_MAP[order.payment] || escapeHTML(order.payment || '');
    const time = order.createdAt ? new Date(order.createdAt).toLocaleString('ar-EG') : '';
    const itemsHtml = (order.items || []).map(i =>
      `<tr><td style="padding:4px 8px">${escapeHTML(i.name)}</td><td style="padding:4px 8px;text-align:center">${i.qty}</td><td style="padding:4px 8px;text-align:left">${i.qty * i.price} ج.م</td></tr>`
    ).join('');

    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
      <title>إيصال طلب #${escapeHTML(order.orderNumber)}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: 'Cairo','Tajawal',sans-serif; padding:20px; font-size:13px; color:#111; max-width:380px; margin:0 auto; }
      .header { text-align:center; border-bottom:2px dashed #333; padding-bottom:12px; margin-bottom:12px; }
      .header h1 { font-size:18px; margin-bottom:4px; }
      .header p { font-size:11px; color:#666; }
      .order-num { font-size:24px; font-weight:900; text-align:center; margin:8px 0; }
      .info { margin:10px 0; }
      .info div { display:flex; justify-content:space-between; padding:3px 0; }
      table { width:100%; border-collapse:collapse; margin:10px 0; }
      th { background:#f0f0f0; padding:6px 8px; text-align:right; font-size:12px; }
      th:last-child { text-align:left; }
      td { border-bottom:1px solid #eee; }
      .total { text-align:center; font-size:20px; font-weight:900; margin:12px 0; padding:10px; background:#f7f1e6; border-radius:8px; }
      .footer { text-align:center; border-top:2px dashed #333; padding-top:10px; margin-top:12px; font-size:11px; color:#666; }
      @media print { body { padding:10px; } }
    </style></head><body>
      <div class="header">
        <h1>🍽️ شاورما الشامي</h1>
        <p>طعم أصيل.. من قلب الشام</p>
        <p>إيتاي البارود - حديقة الطفل - شارع تاون تيم</p>
        <p>📞 01037775765</p>
      </div>
      <div class="order-num">#${escapeHTML(order.orderNumber) || '----'}</div>
      <div class="info">
        <div><span>👤 الاسم:</span><span>${escapeHTML(order.customer?.name) || '---'}</span></div>
        <div><span>📞 الموبايل:</span><span dir="ltr">${escapeHTML(order.customer?.phone) || '---'}</span></div>
        ${order.customer?.address ? `<div><span>📍 العنوان:</span><span>${escapeHTML(order.customer.address)}</span></div>` : ''}
        <div><span>📦 الاستلام:</span><span>${method}</span></div>
        <div><span>💳 الدفع:</span><span>${payment}</span></div>
        <div><span>🕐 التاريخ:</span><span>${time}</span></div>
        <div><span>📋 الحالة:</span><span>${status.icon} ${status.label}</span></div>
      </div>
      <table>
        <thead><tr><th>الصنف</th><th style="text-align:center">الكمية</th><th style="text-align:left">السعر</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      ${order.deliveryFee ? `<div class="info"><div><span>🚚 رسوم التوصيل:</span><span>${order.deliveryFee} ج.م</span></div></div>` : ''}
      ${order.discount ? `<div class="info"><div><span>🎫 خصم (${escapeHTML(order.coupon || '')}):</span><span>-${order.discount} ج.م</span></div></div>` : ''}
      <div class="total">💰 الإجمالي: ${order.total || 0} ج.م</div>
      ${order.notes ? `<p style="margin:8px 0;font-size:12px">📝 ملاحظات: ${escapeHTML(order.notes)}</p>` : ''}
      <div class="footer">
        <p>شكراً لاختيارك شاورما الشامي ❤️</p>
        <p>بالهنا والشفا! 😊🔥</p>
      </div>
      <script>setTimeout(()=>window.print(),300);</script>
    </body></html>`);
    win.document.close();
  }

  /* ---------- Confirmation Modal ---------- */
  function showConfirmModal(title, message, onConfirm) {
    let modal = $('#confirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'confirmModal';
      modal.className = 'confirm-modal-overlay';
      modal.innerHTML = `
        <div class="confirm-modal-card">
          <div class="confirm-modal-icon" id="confirmIcon"></div>
          <h3 id="confirmTitle"></h3>
          <p id="confirmMsg"></p>
          <div class="confirm-modal-actions">
            <button id="confirmYes" class="confirm-yes"></button>
            <button id="confirmNo" class="confirm-no">لا، رجوع</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    $('#confirmTitle').textContent = title;
    $('#confirmMsg').textContent = message;
    $('#confirmIcon').textContent = '⚠️';
    $('#confirmYes').textContent = 'نعم، أكيد';
    modal.classList.add('active');

    const cleanup = () => { modal.classList.remove('active'); };
    $('#confirmYes').onclick = () => { cleanup(); onConfirm(); };
    $('#confirmNo').onclick = cleanup;
    modal.addEventListener('click', (e) => { if (e.target === modal) cleanup(); }, { once: true });
  }

  /* ---------- Render Orders ---------- */
  function renderOrders() {
    const container = $('#ordersContainer');
    let list = Object.values(orders);
    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    list = filterByDate(list);
    list = filterBySearch(list);
    if (activeFilter !== 'all') {
      list = list.filter(o => o.status === activeFilter);
    }

    if (list.length === 0) {
      const emptyMsg = searchQuery.trim() 
        ? `مفيش نتائج لـ "${searchQuery}"` 
        : (activeFilter === 'all' ? 'مفيش طلبات لسه' : 'مفيش طلبات في الحالة دي');
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">${searchQuery.trim() ? '🔍' : '📋'}</div>
          <h3>${emptyMsg}</h3>
          <p>الطلبات الجديدة هتظهر هنا تلقائياً مع صوت تنبيه 🔔</p>
        </div>`;
      return;
    }

    container.innerHTML = list.map(order => renderOrderCard(order)).join('');

    $$('[data-action]', container).forEach(btn => {
      btn.addEventListener('click', () => handleAction(btn.dataset.key, btn.dataset.action, btn));
    });
    $$('[data-whatsapp]', container).forEach(btn => {
      btn.addEventListener('click', () => sendWhatsApp(btn.dataset.whatsapp));
    });
    $$('[data-print]', container).forEach(btn => {
      btn.addEventListener('click', () => printOrder(btn.dataset.print));
    });
  }

  function renderOrderCard(order) {
    const status = STATUS_MAP[order.status] || STATUS_MAP.new;
    const method = METHOD_MAP[order.method] || escapeHTML(order.method || '');
    const payment = PAYMENT_MAP[order.payment] || escapeHTML(order.payment || '');
    const time = order.createdAt ? formatTime(order.createdAt) : '';
    const timeAgo = order.createdAt ? getTimeAgo(order.createdAt) : '';
    const phone = escapeHTML(order.customer?.phone || '');
    const orderKey = escapeHTML(order.firebaseKey || '');
    const safeStatus = escapeHTML(order.status || 'new');
    const safeOrderNumber = escapeHTML(order.orderNumber || '----');
    
    const itemsHtml = (order.items || []).map(item => `
      <tr>
        <td>${escapeHTML(item.name)}</td>
        <td class="item-qty">${item.qty}x</td>
        <td class="item-price">${item.price} ج.م</td>
        <td class="item-price">${item.total || item.qty * item.price} ج.م</td>
      </tr>
    `).join('');

    const actionsHtml = getActionsForStatus(order.status, orderKey);
    const whatsappBtn = phone ? `<button class="action-btn btn-whatsapp" data-whatsapp="${orderKey}">💬 واتساب</button>` : '';
    const printBtn = `<button class="action-btn btn-print" data-print="${orderKey}">🖨️ طباعة</button>`;

    // Show discount/delivery info if present
    let extrasHtml = '';
    if (order.deliveryFee) extrasHtml += `<div class="order-extra">🚚 توصيل: ${order.deliveryFee} ج.م</div>`;
    if (order.discount) extrasHtml += `<div class="order-extra">🎫 خصم (${escapeHTML(order.coupon || '')}): -${order.discount} ج.م</div>`;

    return `
    <div class="order-card status-${safeStatus}" data-key="${orderKey}">
      <div class="order-header">
        <div style="display:flex;align-items:center;gap:.8rem;flex-wrap:wrap">
          <span class="order-num">#${safeOrderNumber}</span>
          <span class="order-status-badge ${status.badge}">${status.icon} ${status.label}</span>
          <span style="color:var(--text-2);font-size:.82rem">${method} • ${payment}</span>
        </div>
        <div class="order-time">
          🕐 ${time}
          <span style="margin-right:.5rem;color:var(--gold);font-weight:600">${timeAgo}</span>
        </div>
      </div>
      <div class="order-body">
        <div class="customer-info">
          <div class="info-item"><span class="icon">👤</span> ${escapeHTML(order.customer?.name) || 'غير محدد'}</div>
          <div class="info-item"><span class="icon">📞</span> <a href="tel:${phone}" dir="ltr">${phone || 'غير محدد'}</a></div>
          ${order.customer?.address ? `<div class="info-item"><span class="icon">📍</span> ${escapeHTML(order.customer.address)}</div>` : ''}
        </div>
        <table class="items-table">
          <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td colspan="3">الإجمالي الكلي</td><td class="item-price">${order.total || 0} ج.م</td></tr></tfoot>
        </table>
        ${extrasHtml}
        ${order.notes ? `<div class="order-notes"><span class="icon">📝</span> ${escapeHTML(order.notes)}</div>` : ''}
      </div>
      <div class="order-footer">
        <div class="order-total-display"><small>الإجمالي</small>${order.total || 0} ج.م</div>
        <div class="order-actions">
          ${phone ? `<a href="tel:${phone}" class="action-btn btn-call">📞 اتصل</a>` : ''}
          ${whatsappBtn}
          ${printBtn}
          ${actionsHtml}
        </div>
      </div>
    </div>`;
  }

  function getActionsForStatus(status, key) {
    switch (status) {
      case 'new':
        return `
          <button class="action-btn btn-prepare" data-key="${key}" data-action="preparing">👨‍🍳 جاري التحضير</button>
          <button class="action-btn btn-cancel" data-key="${key}" data-action="cancelled">❌ إلغاء</button>`;
      case 'preparing':
        return `
          <button class="action-btn btn-out" data-key="${key}" data-action="out_for_delivery">🚚 في الطريق</button>
          <button class="action-btn btn-deliver" data-key="${key}" data-action="delivered">✅ تم التسليم</button>
          <button class="action-btn btn-cancel" data-key="${key}" data-action="cancelled">❌ إلغاء</button>`;
      case 'out_for_delivery':
        return `
          <button class="action-btn btn-deliver" data-key="${key}" data-action="delivered">✅ تم التسليم</button>
          <button class="action-btn btn-cancel" data-key="${key}" data-action="cancelled">❌ إلغاء</button>`;
      case 'delivered':
        return `<button class="action-btn btn-delete" data-key="${key}" data-action="delete">🗑️ حذف</button>`;
      case 'cancelled':
        return `<button class="action-btn btn-delete" data-key="${key}" data-action="delete">🗑️ حذف</button>`;
      default:
        return '';
    }
  }

  /* ---------- WhatsApp ---------- */
  function sendWhatsApp(key) {
    const order = orders[key];
    if (!order || !order.customer?.phone) return;
    let phone = order.customer.phone.replace(/\s+/g, '');
    if (phone.startsWith('0')) phone = '2' + phone;
    if (!phone.startsWith('+')) phone = '+' + phone;
    const status = STATUS_MAP[order.status] || STATUS_MAP.new;
    const itemsList = (order.items || []).map(i => `• ${i.name} × ${i.qty} = ${i.qty * i.price} ج.م`).join('\n');
    const msg = `🧾 *شاورما الشامي — تفاصيل طلبك*\n\nمرحباً ${order.customer.name} 👋\n\n*رقم الطلب:* #${order.orderNumber || '----'}\n*الحالة:* ${status.icon} ${status.label}\n\n*الأصناف:*\n${itemsList}\n\n💰 *الإجمالي:* ${order.total || 0} ج.م\n📦 *طريقة الاستلام:* ${METHOD_MAP[order.method] || order.method}\n💳 *الدفع:* ${PAYMENT_MAP[order.payment] || order.payment}\n\n${order.status === 'preparing' ? '👨‍🍳 طلبك جاري تحضيره وهيوصلك في أقرب وقت!' : ''}\n${order.status === 'out_for_delivery' ? '🚚 طلبك في الطريق إليك!' : ''}\n${order.status === 'delivered' ? '✅ تم تسليم طلبك. بالهنا والشفا! 😊' : ''}\n${order.status === 'new' ? '🆕 تم استلام طلبك وهنبدأ نحضره دلوقتي!' : ''}\n\nشكراً لاختيارك *شاورما الشامي* ❤️🔥`;
    window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  /* ---------- Actions ---------- */
  function handleAction(key, action, btn) {
    if (!key) { showToast('مفيش key للطلب ده', 'error'); return; }
    if (typeof db === 'undefined' || !db) { showToast('Firebase مش متصل', 'error'); return; }

    const origText = btn.innerHTML;
    const origDisabled = btn.disabled;

    if (action === 'delete') {
      showConfirmModal(
        'حذف الطلب نهائياً',
        'متأكد إنك عايز تحذف الطلب ده؟ الحذف نهائي ومش هتقدر ترجعه.',
        () => {
          btn.innerHTML = '⏳ جاري الحذف...';
          btn.disabled = true;
          db.ref('orders/' + key).remove()
            .then(() => writeAuditLog(key, 'delete_order'))
            .then(() => { playNotification('success'); showToast('تم حذف الطلب بنجاح 🗑️', 'success'); })
            .catch((err) => {
              console.error('Delete error:', err);
              playNotification('error');
              showToast('فشل حذف الطلب! حاول تاني.', 'error');
              btn.innerHTML = origText;
              btn.disabled = origDisabled;
            });
        }
      );
    } else if (action === 'cancelled') {
      showConfirmModal(
        'إلغاء الطلب',
        'متأكد إنك عايز تلغي الطلب ده؟',
        () => {
          btn.innerHTML = '⏳ جاري التحديث...';
          btn.disabled = true;
          db.ref('orders/' + key).update({ status: action })
            .then(() => writeAuditLog(key, 'status_change', { status: action }))
            .then(() => { playNotification('cancelled'); showToast('تم إلغاء الطلب ❌', 'warning'); })
            .catch((err) => {
              console.error('Update error:', err);
              playNotification('error');
              showToast('فشل تحديث الحالة! حاول تاني.', 'error');
              btn.innerHTML = origText;
              btn.disabled = origDisabled;
            });
        }
      );
    } else if (action === 'out_for_delivery') {
      const dispatchModal = $('#dispatchModal');
      if (dispatchModal) {
        dispatchModal.classList.add('active');
        $('#dispatchBoyName').value = '';
        $('#dispatchBoyPhone').value = '';
        $('#dispatchEta').value = '30';
        
        const confirmBtn = $('#dispatchConfirmBtn');
        const cancelBtn = $('#dispatchCancelBtn');
        
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newCancelBtn.addEventListener('click', () => {
          dispatchModal.classList.remove('active');
        });
        
        newConfirmBtn.addEventListener('click', () => {
          const boyName = $('#dispatchBoyName').value.trim();
          const boyPhone = $('#dispatchBoyPhone').value.trim();
          const eta = parseInt($('#dispatchEta').value) || 30;
          
          dispatchModal.classList.remove('active');
          btn.innerHTML = '⏳ جاري التحديث...';
          btn.disabled = true;
          
          const updates = { 
            status: action,
            etaMinutes: eta
          };
          if (typeof firebase !== 'undefined') {
            updates.dispatchedAt = firebase.database.ServerValue.TIMESTAMP;
          } else {
            updates.dispatchedAt = Date.now();
          }

          if (boyName || boyPhone) {
            updates.deliveryBoy = { name: boyName, phone: boyPhone };
          }

          db.ref('orders/' + key).update(updates)
            .then(() => writeAuditLog(key, 'status_change', { status: action, eta }))
            .then(() => { playNotification('out'); showToast('تم تحديث الحالة لخروج للتوصيل ✅', 'success'); })
            .catch((err) => {
              console.error('Update error:', err);
              playNotification('error');
              showToast('فشل تحديث الحالة! حاول تاني.', 'error');
              btn.innerHTML = origText;
              btn.disabled = origDisabled;
            });
        });
      }
    } else {
      const statusLabel = STATUS_MAP[action]?.label || action;
      btn.innerHTML = '⏳ جاري التحديث...';
      btn.disabled = true;
      db.ref('orders/' + key).update({ status: action })
        .then(() => writeAuditLog(key, 'status_change', { status: action }))
        .then(() => { playNotification('status_change'); showToast(`تم تحديث الحالة إلى "${statusLabel}" ✅`, 'success'); })
        .catch((err) => {
          console.error('Update error:', err);
          playNotification('error');
          showToast('فشل تحديث الحالة! حاول تاني.', 'error');
          btn.innerHTML = origText;
          btn.disabled = origDisabled;
        });
    }
  }

  /* ---------- Helpers ---------- */
  function formatTime(iso) {
    try {
      return new Date(iso).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', hour12: true });
    } catch (e) { return iso; }
  }

  function getTimeAgo(iso) {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'الآن';
      if (mins < 60) return `منذ ${mins} د`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `منذ ${hours} س`;
      return `منذ ${Math.floor(hours / 24)} يوم`;
    } catch (e) { return ''; }
  }

  /* ---------- Init ---------- */
  function init() {
    checkAuth();

    const loginBtn = $('#loginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
      $('#loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
    }
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const soundBtn = $('#soundToggle');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '🔔' : '🔕';
        soundBtn.classList.toggle('muted', !soundEnabled);
      });
    }

    $$('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeFilter = tab.dataset.filter;
        $$('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderStats();
        renderOrders();
      });
    });

    const dateFilter = $('#dateFilter');
    if (dateFilter) {
      dateFilter.addEventListener('change', () => {
        activeDateFilter = dateFilter.value;
        renderStats();
        renderOrders();
        renderReportsSection();
      });
    }

    const searchInput = $('#searchInput');
    const clearBtn = $('#clearSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        searchQuery = searchInput.value;
        clearBtn.style.display = searchQuery ? 'block' : 'none';
        renderOrders();
      });
    }
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearBtn.style.display = 'none';
        renderOrders();
        searchInput.focus();
      });
    }

    const exportBtn = $('#exportCSV');
    if (exportBtn) exportBtn.addEventListener('click', exportOrdersCSV);

    // Tab Navigation
    $$('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.admin-tab').forEach(t => t.classList.remove('active'));
        $$('.view-section').forEach(v => v.classList.remove('active'));
        tab.classList.add('active');
        const viewId = tab.dataset.view;
        const view = $('#' + viewId);
        if (view) view.classList.add('active');
      });
    });

    // Save Settings logic
    const saveStoreStatusBtn = $('#saveStoreStatusBtn');
    if (saveStoreStatusBtn) {
      saveStoreStatusBtn.addEventListener('click', () => {
        const status = $('#storeStatusSelect').value;
        if (typeof db !== 'undefined' && db) {
          db.ref('settings/store_status').set(status)
            .then(() => writeAuditLog('settings', 'store_status_change', { status }))
            .then(() => showToast('تم حفظ حالة المطعم', 'success'));
        }
      });
    }

    const addZoneBtn = $('#addZoneBtn');
    if (addZoneBtn) {
      addZoneBtn.addEventListener('click', () => {
        const zonesList = $('#zonesList');
        const id = 'z' + Date.now();
        const html = `
          <div class="flex items-center gap-2 mb-2">
            <input type="text" class="search-input flex-1 zone-name-input" placeholder="اسم المنطقة">
            <input type="number" class="search-input w-24 zone-price-input" value="10" placeholder="السعر">
            <button class="btn-primary" style="background:#ef4444;border:none;border-radius:8px;padding:.5rem;cursor:pointer" onclick="this.parentElement.remove()">❌</button>
          </div>
        `;
        zonesList.insertAdjacentHTML('beforeend', html);
      });
    }

    const saveZonesBtn = $('#saveZonesBtn');
    if (saveZonesBtn) {
      saveZonesBtn.addEventListener('click', () => {
        const zones = [];
        $$('#zonesList > div').forEach((row, i) => {
          const name = $('.zone-name-input', row).value;
          const price = parseFloat($('.zone-price-input', row).value) || 0;
          if (name) zones.push({ id: 'z' + i, name, price });
        });
        if (typeof db !== 'undefined' && db) {
          db.ref('settings/delivery_zones').set(zones)
            .then(() => writeAuditLog('settings', 'delivery_zones_update', { count: zones.length }))
            .then(() => showToast('تم حفظ المناطق والتسعيرة بنجاح', 'success'));
        }
      });
    }

    // Add Menu Item Modal
    const addMenuItemBtn = $('#addMenuItemBtn');
    const addItemModal = $('#addMenuItemModal');
    if (addMenuItemBtn && addItemModal) {
      addMenuItemBtn.addEventListener('click', () => {
        currentEditItemId = null;
        const modalTitle = $('#modalTitle');
        const modalDesc = $('#modalDesc');
        if(modalTitle) modalTitle.innerText = '➕ إضافة صنف جديد';
        if(modalDesc) modalDesc.innerText = 'أدخل بيانات الصنف الجديد';
        $('#newItemName').value = '';
        $('#newItemDesc').value = '';
        $('#newItemPrice').value = '';
        $('#newItemPriceL').value = '';
        $('#newItemCat').value = '';
        $('#newItemImg').value = 'assets/shawarma_arabi.jpeg';
        $('#newItemBest').checked = false;
        $('#newItemSizes').checked = false;
        addItemModal.classList.add('active');
      });
      $('#cancelNewItemBtn').addEventListener('click', () => addItemModal.classList.remove('active'));
      addItemModal.addEventListener('click', (e) => { if (e.target === addItemModal) addItemModal.classList.remove('active'); });
      $('#saveNewItemBtn').addEventListener('click', () => {
        const name = $('#newItemName').value.trim();
        const desc = $('#newItemDesc').value.trim();
        const price = parseFloat($('#newItemPrice').value) || 0;
        const priceL = parseFloat($('#newItemPriceL').value) || 0;
        const cat = $('#newItemCat').value;
        const img = $('#newItemImg').value.trim() || 'assets/shawarma_arabi.jpeg';
        const best = $('#newItemBest').checked;
        const hasSizes = $('#newItemSizes').checked;
        if (!name || !cat || !price) {
          showToast('الاسم والسعر والقسم مطلوبين', 'error');
          return;
        }
        const id = currentEditItemId || ('item_' + Date.now());
        const item = { id, name, desc, price, cat, img, best };
        if (hasSizes) {
          item.sizes = ['عادي', 'كبير'];
          if (priceL) item.priceL = priceL;
        } else {
          item.sizes = null;
          item.priceL = null;
        }
        if (typeof db !== 'undefined' && db) {
          db.ref('menu/' + id).update(item)
            .then(() => {
              showToast(currentEditItemId ? `✅ تم تعديل "${name}" بنجاح` : `✅ تم إضافة "${name}" للمنيو`, 'success');
              addItemModal.classList.remove('active');
            })
            .catch(() => showToast(currentEditItemId ? 'فشل تعديل الصنف' : 'فشل إضافة الصنف', 'error'));
        }
      });
    }

    // Coupon management
    const addCouponBtn = $('#addCouponBtn');
    if (addCouponBtn) {
      addCouponBtn.addEventListener('click', () => {
        adminCoupons.push({ code: '', type: 'percent', value: 10, minOrder: 0, label: '' });
        renderCoupons();
      });
    }

    const saveCouponsBtn = $('#saveCouponsBtn');
    if (saveCouponsBtn) {
      saveCouponsBtn.addEventListener('click', () => {
        const coupons = collectCoupons();
        const obj = {};
        coupons.forEach(c => { obj[c.code] = { type: c.type, value: c.value, minOrder: c.minOrder, label: c.label }; });
        if (typeof db !== 'undefined' && db) {
          db.ref('coupons').set(obj)
            .then(() => writeAuditLog('settings', 'coupons_update', { count: coupons.length }))
            .then(() => showToast('تم حفظ الكوبونات بنجاح', 'success'));
        }
      });
    }

    setInterval(() => { renderOrders(); }, 30000);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
