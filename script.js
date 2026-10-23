/* Mr. Singh Publications: shared logic for index.html, login.html and admin.html */
(function () {
  'use strict';

  /* ---------- Constants ---------- */
  var KEY = {
    products: 'msp_products',
    offer: 'msp_offer',
    users: 'msp_users',
    session: 'msp_session',
    cart: 'msp_cart',
    coupon: 'msp_coupon',
    orders: 'msp_orders'
  };
  var ADMIN = { email: 'admin@mrsingh.com', password: 'admin123', name: 'Admin' };
  var AUTHOR = 'Dayashankar Singh';
  var MAX_QTY = 10;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var CATS = { exam: 'Exam preparation', psychology: 'Psychology', finance: 'Personal finance', growth: 'Self growth' };
  var READMORE = { code: 'READMORE', percent: 15, minItems: 2, text: 'Buy 2 or more books and save 15%' };
  var SEED_PRODUCTS = [
    { id: 'p-mind-mastery', title: 'Mind Mastery', author: AUTHOR, price: 499, salePrice: 399, category: 'psychology', image: '', stock: 'in' },
    { id: 'p-bpsc-geography-2', title: 'BPSC Geography Vol. 2: Indian & Bihar Geography', author: AUTHOR, price: 349, salePrice: 299, category: 'exam', image: '', stock: 'in' },
    { id: 'p-financial-freedom', title: 'Financial Freedom Guide', author: AUTHOR, price: 299, salePrice: 249, category: 'finance', image: '', stock: 'in' },
    { id: 'p-focus-discipline', title: 'Focus and Discipline', author: AUTHOR, price: 249, salePrice: 199, category: 'growth', image: '', stock: 'in' },
    { id: 'p-bihar-gk', title: 'Bihar GK Quick Revision', author: AUTHOR, price: 199, salePrice: 199, category: 'exam', image: '', stock: 'in' },
    { id: 'p-money-habits', title: 'Money Habits Workbook', author: AUTHOR, price: 179, salePrice: 149, category: 'finance', image: '', stock: 'in' }
  ];
  var DEFAULT_OFFER = { active: true, text: 'Welcome offer: 10% off your first order', percent: 10, code: 'WELCOME10' };

  /* ---------- Helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function read(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return '₹' + Number(n).toLocaleString('en-IN'); }

  var toastTimer;
  function toast(msg) {
    var t = $('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', function done() {
      el.classList.remove('shake');
      el.removeEventListener('animationend', done);
    });
  }

  function setErr(input, msg) {
    var field = input.closest('.field');
    if (!field) { return; }
    field.classList.toggle('invalid', !!msg);
    var p = field.querySelector('.field-error');
    if (p) { p.textContent = msg || ''; }
  }

  function getSession() {
    var s = read(KEY.session, null);
    return s && s.role ? s : null;
  }
  function setSession(user) { write(KEY.session, { role: user.role, name: user.name, email: user.email }); }
  function clearSession() { try { localStorage.removeItem(KEY.session); } catch (e) { /* ignore */ } }

  function getProducts() {
    var p = read(KEY.products, null);
    if (!Array.isArray(p)) {
      p = clone(SEED_PRODUCTS);
      write(KEY.products, p);
    }
    return p;
  }
  function norm(p) {
    var price = Number(p.price) || 0;
    var sale = Number(p.salePrice) > 0 ? Number(p.salePrice) : price;
    if (sale > price) { sale = price; }
    return {
      id: String(p.id), title: String(p.title || ''), author: String(p.author || AUTHOR),
      price: price, salePrice: sale, category: p.category, image: String(p.image || ''),
      stock: p.stock === 'out' ? 'out' : 'in'
    };
  }
  function getOffer() {
    var o = read(KEY.offer, null);
    if (!o || typeof o !== 'object') { o = DEFAULT_OFFER; }
    return {
      active: !!o.active,
      text: String(o.text || ''),
      percent: Math.max(0, Number(o.percent) || 0),
      code: String(o.code || '').trim().toUpperCase()
    };
  }

  /* ---------- Shared page behaviour ---------- */
  function initCommon() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.btn');
      if (!b || b.disabled) { return; }
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height), d = document.createElement('span');
      d.className = 'ripple';
      d.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      b.appendChild(d);
      setTimeout(function () { d.remove(); }, 650);
    });
    var year = $('year');
    if (year) { year.textContent = new Date().getFullYear(); }
  }

  /* =====================================================
     STOREFRONT (index.html)
     ===================================================== */
  function initStore() {
    var grid = $('productGrid');
    var filters = { q: '', cat: 'all', sort: 'featured' };
    var lastAdded = null;
    var prevCount = null;
    var lastFocus = null;

    /* Navbar */
    var navbar = $('navbar'), menuToggle = $('menuToggle'), navLinks = $('navLinks');
    var linkEls = Array.prototype.slice.call(navLinks.querySelectorAll('a'));
    function onScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
      var pos = window.scrollY + 140, current = null;
      linkEls.forEach(function (a) {
        var sec = $(a.getAttribute('href').slice(1));
        if (sec && sec.offsetTop <= pos) { current = a; }
      });
      linkEls.forEach(function (a) { a.classList.toggle('active', a === current); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    menuToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    /* Products */
    function discountPct(p) { return p.price > p.salePrice ? Math.round((1 - p.salePrice / p.price) * 100) : 0; }

    function renderProducts() {
      var all = getProducts().map(norm);
      var q = filters.q.trim().toLowerCase();
      var list = all.filter(function (p) {
        if (filters.cat !== 'all' && p.category !== filters.cat) { return false; }
        if (!q) { return true; }
        return (p.title + ' ' + p.author + ' ' + (CATS[p.category] || '')).toLowerCase().indexOf(q) > -1;
      });
      if (filters.sort === 'price-low') { list.sort(function (a, b) { return a.salePrice - b.salePrice; }); }
      if (filters.sort === 'price-high') { list.sort(function (a, b) { return b.salePrice - a.salePrice; }); }
      if (filters.sort === 'title') { list.sort(function (a, b) { return a.title.localeCompare(b.title); }); }

      var status = $('gridStatus');
      if (!all.length) { status.textContent = 'No books are listed yet. Please check back soon.'; }
      else if (!list.length) { status.textContent = 'No books match your search. Try another word or subject.'; }
      else { status.textContent = ''; }

      grid.innerHTML = list.map(function (p) {
        var off = discountPct(p);
        var out = p.stock === 'out';
        var badge = out ? '<span class="product-badge out">Out of stock</span>' : (off ? '<span class="product-badge">' + off + '% off</span>' : '');
        var img = p.image ? '<img class="cover-img" src="' + esc(p.image) + '" alt="Cover of ' + esc(p.title) + '" loading="lazy">' : '';
        var price = off ? '<span class="price">' + money(p.salePrice) + '</span><span class="old-price">' + money(p.price) + '</span>' : '<span class="price">' + money(p.price) + '</span>';
        return '<article class="product-card' + (out ? ' is-out' : '') + '">' +
          '<div class="product-cover">' + badge +
            '<img class="cover-logo" src="logo.png" alt="">' +
            '<span class="cover-title">' + esc(p.title) + '</span>' +
            '<span class="cover-author">' + esc(p.author) + '</span>' + img +
          '</div>' +
          '<div class="product-body">' +
            '<h3 class="product-title">' + esc(p.title) + '</h3>' +
            '<p class="product-meta">' + esc(p.author) + ' · ' + esc(CATS[p.category] || 'Books') + '</p>' +
            '<div class="product-foot"><div>' + price + '</div>' +
              '<button class="btn btn-gold btn-sm" type="button" data-add="' + esc(p.id) + '"' + (out ? ' disabled' : '') + '>' + (out ? 'Unavailable' : 'Add to cart') + '</button>' +
            '</div>' +
          '</div></article>';
      }).join('');
    }

    grid.addEventListener('error', function (e) {
      if (e.target.classList && e.target.classList.contains('cover-img')) { e.target.remove(); }
    }, true);
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-add]');
      if (btn) { addToCart(btn.getAttribute('data-add')); }
    });

    $('searchInput').addEventListener('input', function () { filters.q = this.value; renderProducts(); });
    $('categoryFilter').addEventListener('change', function () {
      filters.cat = this.value;
      renderProducts();
      toast(this.value === 'all' ? 'Showing all subjects.' : 'Showing ' + CATS[this.value] + ' books.');
    });
    $('sortSelect').addEventListener('change', function () {
      filters.sort = this.value;
      renderProducts();
      toast('Sorted: ' + this.options[this.selectedIndex].text + '.');
    });

    /* Offers strip */
    function renderOffers() {
      var o = getOffer();
      var html = '';
      if (o.active && o.text) {
        var action = '';
        if (o.percent > 0 && o.code) { action = '<button class="copy-code" type="button" data-copy="' + esc(o.code) + '">Copy ' + esc(o.code) + '</button>'; }
        else if (o.percent > 0) { action = '<span class="code-chip">Applied automatically</span>'; }
        html += '<div class="offer-chip"><p>' + esc(o.text) + '</p>' + action + '</div>';
      }
      html += '<div class="offer-chip"><p>' + esc(READMORE.text) + '</p>' +
        '<button class="copy-code" type="button" data-copy="' + READMORE.code + '">Copy ' + READMORE.code + '</button></div>';
      $('offerTrack').innerHTML = html;
    }

    function copyText(text) {
      return new Promise(function (resolve, reject) {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(resolve, reject);
          return;
        }
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
        if (ok) { resolve(); } else { reject(new Error('copy failed')); }
      });
    }

    $('offerTrack').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy]');
      if (!btn) { return; }
      var code = btn.getAttribute('data-copy');
      $('couponInput').value = code;
      copyText(code).then(function () {
        toast('Code ' + code + ' copied. Paste it in your cart.');
      }, function () {
        toast('Code ' + code + ' is ready in your cart.');
      });
      btn.classList.add('copied');
      setTimeout(function () { btn.classList.remove('copied'); }, 1200);
    });

    /* Cart data */
    function getCart() {
      var raw = read(KEY.cart, []);
      if (!Array.isArray(raw)) { raw = []; }
      var products = getProducts().map(norm);
      var lines = [];
      raw.forEach(function (r) {
        var p = products.filter(function (x) { return x.id === r.id; })[0];
        var q = Math.min(MAX_QTY, Math.floor(Number(r.qty)) || 0);
        if (p && q > 0 && p.stock !== 'out') { lines.push({ product: p, qty: q }); }
      });
      return lines;
    }
    function saveCart(lines) {
      write(KEY.cart, lines.map(function (l) { return { id: l.product.id, qty: l.qty }; }));
    }

    function evalCode(code, qty) {
      var o = getOffer();
      if (o.active && o.code && o.code === code) {
        return o.percent > 0 ? { pct: o.percent, msg: '' } : { pct: 0, msg: 'This code has no discount right now.' };
      }
      if (code === READMORE.code) {
        return qty >= READMORE.minItems ? { pct: READMORE.percent, msg: '' } : { pct: 0, msg: 'READMORE needs 2 or more books in your cart.' };
      }
      return { pct: 0, msg: 'That code is not valid.', invalid: true };
    }

    function totals(lines) {
      var subtotal = 0, qty = 0;
      lines.forEach(function (l) { subtotal += l.product.salePrice * l.qty; qty += l.qty; });
      var o = getOffer();
      var auto = o.active && !o.code && o.percent > 0 ? o.percent : 0;
      var code = String(read(KEY.coupon, '') || '');
      var ev = code ? evalCode(code, qty) : { pct: 0, msg: '' };
      var pct = Math.max(auto, ev.pct);
      var discount = Math.round(subtotal * pct / 100);
      return { subtotal: subtotal, qty: qty, auto: auto, code: code, ev: ev, pct: pct, discount: discount, total: subtotal - discount };
    }

    /* Cart UI */
    function renderCart() {
      var lines = getCart();
      var t = totals(lines);

      $('cartCount').textContent = t.qty;
      if (prevCount !== null && t.qty > prevCount) {
        var badge = $('cartCount');
        badge.classList.remove('bump');
        void badge.offsetWidth;
        badge.classList.add('bump');
      }
      prevCount = t.qty;

      $('cartItems').innerHTML = lines.map(function (l) {
        var p = l.product;
        var thumb = p.image ? '<img src="' + esc(p.image) + '" alt="">' : '<div class="cart-thumb"></div>';
        return '<li class="cart-item' + (p.id === lastAdded ? ' is-new' : '') + '">' + thumb +
          '<div><h3>' + esc(p.title) + '</h3><span class="price">' + money(p.salePrice) + '</span>' +
            '<div class="qty">' +
              '<button type="button" data-act="dec" data-id="' + esc(p.id) + '" aria-label="Decrease quantity">−</button>' +
              '<span aria-live="polite">' + l.qty + '</span>' +
              '<button type="button" data-act="inc" data-id="' + esc(p.id) + '" aria-label="Increase quantity">+</button>' +
            '</div></div>' +
          '<button class="remove-btn" type="button" data-act="remove" data-id="' + esc(p.id) + '">Remove</button></li>';
      }).join('');
      lastAdded = null;
      $('cartEmpty').classList.toggle('show', !lines.length);

      var msg = $('couponMsg');
      msg.className = 'coupon-msg';
      if (t.code && t.ev.pct > 0 && t.ev.pct >= t.auto) {
        msg.textContent = 'Code ' + t.code + ' applied: ' + t.ev.pct + '% off.';
        msg.classList.add('ok');
      } else if (t.auto > 0) {
        msg.textContent = 'Store offer applied: ' + t.auto + '% off.';
        msg.classList.add('ok');
      } else if (t.code) {
        msg.textContent = t.ev.msg;
        msg.classList.add('error');
      } else {
        msg.textContent = '';
      }

      document.querySelector('.totals div:nth-child(2) dt').textContent = t.pct > 0 ? 'Discount (' + t.pct + '%)' : 'Discount';
      $('subtotal').textContent = money(t.subtotal);
      $('discount').textContent = '−' + money(t.discount);
      $('total').textContent = money(t.total);
    }

    function addToCart(id) {
      var p = getProducts().map(norm).filter(function (x) { return x.id === id; })[0];
      if (!p) { toast('This book is no longer available.'); renderProducts(); return; }
      if (p.stock === 'out') { toast(p.title + ' is out of stock.'); return; }
      var lines = getCart();
      var line = lines.filter(function (l) { return l.product.id === id; })[0];
      if (line) {
        if (line.qty >= MAX_QTY) { toast('You can add up to ' + MAX_QTY + ' copies of a book.'); return; }
        line.qty += 1;
      } else {
        lines.push({ product: p, qty: 1 });
      }
      lastAdded = id;
      saveCart(lines);
      renderCart();
      toast('Added to cart: ' + p.title);
    }

    function changeQty(id, delta) {
      var lines = getCart();
      var line = lines.filter(function (l) { return l.product.id === id; })[0];
      if (!line) { return; }
      var next = line.qty + delta;
      if (next > MAX_QTY) { toast('You can add up to ' + MAX_QTY + ' copies of a book.'); return; }
      if (next < 1) { removeItem(id); return; }
      line.qty = next;
      saveCart(lines);
      renderCart();
      toast('Quantity updated: ' + line.product.title + ' × ' + next);
    }

    function removeItem(id) {
      var lines = getCart();
      var line = lines.filter(function (l) { return l.product.id === id; })[0];
      if (!line) { return; }
      saveCart(lines.filter(function (l) { return l.product.id !== id; }));
      renderCart();
      toast('Removed from cart: ' + line.product.title);
    }

    $('cartItems').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) { return; }
      var id = btn.getAttribute('data-id'), act = btn.getAttribute('data-act');
      if (act === 'inc') { changeQty(id, 1); }
      if (act === 'dec') { changeQty(id, -1); }
      if (act === 'remove') { removeItem(id); }
    });

    $('couponForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('couponInput');
      var code = input.value.trim().toUpperCase();
      var current = String(read(KEY.coupon, '') || '');
      if (!code) {
        if (current) {
          write(KEY.coupon, '');
          renderCart();
          toast('Discount code removed.');
        } else {
          toast('Enter a discount code first.');
        }
        return;
      }
      var lines = getCart();
      if (!lines.length) { toast('Add a book to your cart before using a code.'); return; }
      var ev = evalCode(code, totals(lines).qty);
      if (ev.pct <= 0) {
        $('couponMsg').className = 'coupon-msg error';
        $('couponMsg').textContent = ev.msg;
        shake($('couponForm'));
        toast(ev.msg);
        return;
      }
      write(KEY.coupon, code);
      input.value = '';
      renderCart();
      toast('Offer applied: ' + code + ' (' + ev.pct + '% off)');
    });

    $('checkoutBtn').addEventListener('click', function () {
      var lines = getCart();
      if (!lines.length) { toast('Your cart is empty.'); return; }
      var session = getSession();
      if (!session) {
        toast('Please login to checkout.');
        setTimeout(function () { location.href = 'login.html'; }, 1200);
        return;
      }
      var t = totals(lines);
      var orders = read(KEY.orders, []);
      if (!Array.isArray(orders)) { orders = []; }
      orders.push({
        id: 'ORD' + Date.now().toString(36).toUpperCase(),
        email: session.email,
        date: new Date().toISOString(),
        items: lines.map(function (l) { return { id: l.product.id, title: l.product.title, qty: l.qty, price: l.product.salePrice }; }),
        subtotal: t.subtotal, discount: t.discount, total: t.total
      });
      if (!write(KEY.orders, orders)) { toast('The order could not be saved. Allow site data and try again.'); return; }
      write(KEY.cart, []);
      write(KEY.coupon, '');
      renderCart();
      closeCart();
      toast('Order placed! Total ' + money(t.total));
    });

    /* Drawer */
    var drawer = $('cartDrawer'), overlay = $('overlay');
    function openCart() {
      lastFocus = document.activeElement;
      drawer.classList.add('open');
      overlay.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      $('closeCart').focus();
    }
    function closeCart() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    }
    $('cartBtn').addEventListener('click', openCart);
    $('closeCart').addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (drawer.classList.contains('open')) { closeCart(); }
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    /* Login button */
    function updateAuthButton() {
      var s = getSession();
      $('loginBtn').textContent = !s ? 'Login' : (s.role === 'admin' ? 'Dashboard' : 'Logout');
    }
    $('loginBtn').addEventListener('click', function () {
      var s = getSession();
      if (!s) { location.href = 'login.html'; return; }
      if (s.role === 'admin') { location.href = 'admin.html'; return; }
      clearSession();
      updateAuthButton();
      toast('You are logged out.');
    });

    /* Contact form */
    var contact = $('contactForm');
    if (contact) {
      contact.addEventListener('submit', function () { toast('Opening your email app…'); });
    }

    /* Keep the store in sync when the admin changes data in another tab */
    window.addEventListener('storage', function (e) {
      if (e.key === null || e.key === KEY.products || e.key === KEY.offer || e.key === KEY.cart || e.key === KEY.coupon || e.key === KEY.session) {
        renderProducts();
        renderOffers();
        renderCart();
        updateAuthButton();
      }
    });

    renderProducts();
    renderOffers();
    renderCart();
    updateAuthButton();
  }

  /* =====================================================
     LOGIN (login.html)
     ===================================================== */
  function initLogin() {
    var isSignup = false;

    function clearForm(form) {
      Array.prototype.forEach.call(form.querySelectorAll('input[type="email"],input[type="text"],input[type="password"]'), function (i) { setErr(i, ''); });
      var m = form.querySelector('.form-msg');
      if (m) { m.textContent = ''; }
    }
    function busy(btn, on) { btn.classList.toggle('loading', on); btn.disabled = on; }
    function showMsg(form, text) { form.querySelector('.form-msg').textContent = text; shake(form); }

    function bindForm(form, validate, action) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearForm(form);
        if (!validate()) { shake(form); toast('Please fix the highlighted fields.'); return; }
        var btn = form.querySelector('button[type="submit"]');
        busy(btn, true);
        setTimeout(function () { busy(btn, false); action(); }, 650);
      });
      form.addEventListener('input', function (e) {
        if (e.target.closest('.field')) { setErr(e.target, ''); }
        form.querySelector('.form-msg').textContent = '';
      });
    }
    function checkEmail(input) {
      var v = input.value.trim();
      if (!v) { setErr(input, 'Enter your email address.'); return false; }
      if (!EMAIL_RE.test(v)) { setErr(input, 'Enter a valid email, like name@example.com.'); return false; }
      return true;
    }
    function checkRequired(input, msg) {
      if (!input.value) { setErr(input, msg); return false; }
      return true;
    }

    /* Tabs */
    var tabs = $('tabs'), tabUser = $('tabUser'), tabAdmin = $('tabAdmin');
    function selectTab(which) {
      var admin = which === 'admin';
      tabs.classList.toggle('is-admin', admin);
      tabUser.setAttribute('aria-selected', String(!admin));
      tabAdmin.setAttribute('aria-selected', String(admin));
      tabUser.tabIndex = admin ? -1 : 0;
      tabAdmin.tabIndex = admin ? 0 : -1;
      $('panelUser').hidden = admin;
      $('panelAdmin').hidden = !admin;
      $('authTitle').textContent = admin ? 'Admin sign in' : (isSignup ? 'Create your account' : 'Sign in');
      $('authSub').textContent = admin ? 'Manage books, prices and offers.' : (isSignup ? 'Join to save your cart and track orders.' : 'Access your orders and saved books.');
      var panel = admin ? $('panelAdmin') : $('panelUser');
      panel.style.animation = 'none';
      void panel.offsetWidth;
      panel.style.animation = '';
    }
    tabUser.addEventListener('click', function () { selectTab('user'); });
    tabAdmin.addEventListener('click', function () { selectTab('admin'); });
    tabs.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var toAdmin = tabUser.getAttribute('aria-selected') === 'true';
        selectTab(toAdmin ? 'admin' : 'user');
        (toAdmin ? tabAdmin : tabUser).focus();
      }
    });

    function setMode(signup) {
      isSignup = signup;
      $('modeLogin').classList.toggle('active', !signup);
      $('modeSignup').classList.toggle('active', signup);
      $('loginForm').hidden = signup;
      $('signupForm').hidden = !signup;
      clearForm($('loginForm'));
      clearForm($('signupForm'));
      selectTab('user');
    }
    $('modeLogin').addEventListener('click', function () { setMode(false); });
    $('modeSignup').addEventListener('click', function () { setMode(true); });

    Array.prototype.forEach.call(document.querySelectorAll('[data-show]'), function (box) {
      box.addEventListener('change', function () {
        box.getAttribute('data-show').split(' ').forEach(function (id) { $(id).type = box.checked ? 'text' : 'password'; });
      });
    });

    /* User login */
    var loginForm = $('loginForm');
    bindForm(loginForm, function () {
      var a = checkEmail($('loginEmail'));
      var b = checkRequired($('loginPass'), 'Enter your password.');
      return a && b;
    }, function () {
      var email = $('loginEmail').value.trim().toLowerCase();
      var users = read(KEY.users, []);
      var user = (Array.isArray(users) ? users : []).filter(function (u) { return u.email === email; })[0];
      if (!user || user.password !== $('loginPass').value) {
        showMsg(loginForm, 'Email or password is incorrect. New here? Choose Sign up.');
        toast('Login failed. Check your details.');
        return;
      }
      setSession({ role: 'user', name: user.name, email: user.email });
      toast('Welcome back, ' + user.name.split(' ')[0] + '.');
      setTimeout(function () { location.href = 'index.html'; }, 900);
    });

    /* User signup */
    var signupForm = $('signupForm');
    bindForm(signupForm, function () {
      var ok = true;
      var name = $('signName'), pass = $('signPass'), pass2 = $('signPass2');
      if (name.value.trim().length < 2) { setErr(name, 'Enter your full name.'); ok = false; }
      if (!checkEmail($('signEmail'))) { ok = false; }
      if (pass.value.length < 8 || !/\d/.test(pass.value) || !/[A-Za-z]/.test(pass.value)) {
        setErr(pass, 'Use at least 8 characters with letters and a number.'); ok = false;
      }
      if (!pass2.value) { setErr(pass2, 'Type the password again.'); ok = false; }
      else if (pass2.value !== pass.value) { setErr(pass2, 'The passwords do not match.'); ok = false; }
      return ok;
    }, function () {
      var users = read(KEY.users, []);
      if (!Array.isArray(users)) { users = []; }
      var email = $('signEmail').value.trim().toLowerCase();
      if (email === ADMIN.email || users.some(function (u) { return u.email === email; })) {
        setErr($('signEmail'), 'An account with this email already exists. Choose Login.');
        shake(signupForm);
        toast('That email is already registered.');
        return;
      }
      var user = { name: $('signName').value.trim(), email: email, password: $('signPass').value };
      users.push(user);
      if (!write(KEY.users, users)) {
        showMsg(signupForm, 'Your browser blocked saving the account. Allow site data and try again.');
        return;
      }
      setSession({ role: 'user', name: user.name, email: user.email });
      toast('Account created. Welcome, ' + user.name.split(' ')[0] + '.');
      setTimeout(function () { location.href = 'index.html'; }, 900);
    });

    /* Admin login */
    var adminForm = $('adminForm');
    bindForm(adminForm, function () {
      var a = checkEmail($('adminEmail'));
      var b = checkRequired($('adminPass'), 'Enter the admin password.');
      return a && b;
    }, function () {
      var email = $('adminEmail').value.trim().toLowerCase();
      if (email !== ADMIN.email || $('adminPass').value !== ADMIN.password) {
        showMsg(adminForm, 'Admin email or password is incorrect.');
        toast('Admin login failed.');
        return;
      }
      setSession({ role: 'admin', name: ADMIN.name, email: ADMIN.email });
      toast('Signed in as admin.');
      setTimeout(function () { location.href = 'admin.html'; }, 700);
    });

    if (/[?&]tab=admin/.test(location.search) || location.hash === '#admin') { selectTab('admin'); }
  }

  /* =====================================================
     ADMIN (admin.html)
     ===================================================== */
  function initAdmin() {
    var session = getSession();
    if (!session || session.role !== 'admin') {
      location.replace('login.html?tab=admin');
      return;
    }
    $('logoutBtn').addEventListener('click', function () {
      clearSession();
      toast('You are logged out.');
      setTimeout(function () { location.href = 'login.html'; }, 500);
    });

    var products = getProducts();
    var form = $('productForm');
    var state = { img: '', editId: null };

    function updatePreview() {
      $('imgPreview').style.backgroundImage = state.img ? 'url("' + state.img.replace(/"/g, '%22') + '")' : 'none';
    }
    function resetForm() {
      form.reset();
      state.img = '';
      state.editId = null;
      ['pTitle', 'pAuthor', 'pPrice', 'pSale', 'pImage'].forEach(function (id) { setErr($(id), ''); });
      $('fileError').textContent = '';
      $('formTitle').textContent = 'Add a product';
      $('saveProduct').textContent = 'Add product';
      $('cancelEdit').hidden = true;
      updatePreview();
    }

    $('pImage').addEventListener('input', function () {
      state.img = this.value.trim();
      $('pFile').value = '';
      $('fileError').textContent = '';
      setErr(this, '');
      updatePreview();
    });

    function compress(file, done) {
      var reader = new FileReader();
      reader.onerror = function () { done(null); };
      reader.onload = function () {
        var im = new Image();
        im.onerror = function () { done(null); };
        im.onload = function () {
          var scale = Math.min(1, 600 / Math.max(im.width, im.height));
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(im.width * scale));
          c.height = Math.max(1, Math.round(im.height * scale));
          var x = c.getContext('2d');
          x.fillStyle = '#ffffff';
          x.fillRect(0, 0, c.width, c.height);
          x.drawImage(im, 0, 0, c.width, c.height);
          done(c.toDataURL('image/jpeg', 0.82));
        };
        im.src = reader.result;
      };
      reader.readAsDataURL(file);
    }

    $('pFile').addEventListener('change', function () {
      var input = this, file = input.files && input.files[0], err = $('fileError');
      err.textContent = '';
      if (!file) { return; }
      if (file.type.indexOf('image/') !== 0) { err.textContent = 'Choose an image file (JPG, PNG or WebP).'; input.value = ''; return; }
      if (file.size > 5 * 1024 * 1024) { err.textContent = 'This image is over 5 MB. Choose a smaller one.'; input.value = ''; return; }
      compress(file, function (data) {
        if (!data) { err.textContent = 'This image could not be read. Try another file.'; input.value = ''; return; }
        state.img = data;
        $('pImage').value = '';
        setErr($('pImage'), '');
        updatePreview();
        toast('Cover image added.');
      });
    });

    $('clearImg').addEventListener('click', function () {
      state.img = '';
      $('pImage').value = '';
      $('pFile').value = '';
      $('fileError').textContent = '';
      updatePreview();
      toast('Cover image removed.');
    });

    form.addEventListener('input', function (e) {
      if (e.target.closest('.field') && e.target.id !== 'pImage') { setErr(e.target, ''); }
    });

    function validateProduct() {
      var ok = true;
      var t = $('pTitle'), a = $('pAuthor'), p = $('pPrice'), s = $('pSale'), u = $('pImage');
      [t, a, p, s, u].forEach(function (el) { setErr(el, ''); });
      if (t.value.trim().length < 2) { setErr(t, 'Enter the book title.'); ok = false; }
      if (!a.value.trim()) { setErr(a, 'Enter the author name.'); ok = false; }
      var price = parseFloat(p.value);
      if (!(price > 0)) { setErr(p, 'Enter a price greater than 0.'); ok = false; }
      if (s.value.trim() !== '') {
        var sale = parseFloat(s.value);
        if (!(sale > 0)) { setErr(s, 'Enter a price greater than 0, or leave it blank.'); ok = false; }
        else if (price > 0 && sale > price) { setErr(s, 'The discounted price cannot be higher than the original price.'); ok = false; }
      }
      var url = u.value.trim();
      if (url && !/^(https?:\/\/\S+|[\w\-.\/]+\.(png|jpe?g|webp|gif|svg))$/i.test(url)) {
        setErr(u, 'Use a full http(s) link or a file name such as cover.jpg.'); ok = false;
      }
      return ok;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateProduct()) { shake(form); toast('Please fix the highlighted fields.'); return; }
      var price = parseFloat($('pPrice').value);
      var saleRaw = $('pSale').value.trim();
      var item = {
        id: state.editId || ('p' + Date.now().toString(36)),
        title: $('pTitle').value.trim(),
        author: $('pAuthor').value.trim(),
        price: price,
        salePrice: saleRaw === '' ? price : parseFloat(saleRaw),
        category: $('pCategory').value,
        image: state.img,
        stock: $('pStock').value
      };
      var next = getProducts().slice();
      var idx = -1;
      next.forEach(function (p, i) { if (p.id === item.id) { idx = i; } });
      if (idx > -1) { next[idx] = item; } else { next.push(item); }
      if (!write(KEY.products, next)) {
        toast('Storage is full. Use a smaller image or an image URL.');
        return;
      }
      products = next;
      resetForm();
      render();
      toast('Product saved: ' + item.title);
    });

    $('cancelEdit').addEventListener('click', function () { resetForm(); toast('Edit cancelled.'); });

    function render() {
      var body = $('productRows');
      $('productCount').textContent = products.length;
      if (!products.length) {
        body.innerHTML = '<tr class="empty-row"><td colspan="6">No products yet. Add your first book using the form above.</td></tr>';
        return;
      }
      body.innerHTML = products.map(function (p) {
        var n = norm(p);
        var thumb = n.image ? '<img class="thumb" src="' + esc(n.image) + '" alt="" loading="lazy">' : '<div class="thumb"></div>';
        var price = n.salePrice < n.price
          ? '<span class="price">' + money(n.salePrice) + '</span><span class="old-price">' + money(n.price) + '</span>'
          : '<span class="price">' + money(n.price) + '</span>';
        var stock = n.stock === 'out' ? '<span class="pill out">Out of stock</span>' : '<span class="pill in">In stock</span>';
        return '<tr>' +
          '<td>' + thumb + '</td>' +
          '<td><span class="cell-title">' + esc(n.title) + '</span><span class="cell-sub">' + esc(n.author) + '</span></td>' +
          '<td>' + esc(CATS[n.category] || n.category || '') + '</td>' +
          '<td>' + price + '</td>' +
          '<td>' + stock + '</td>' +
          '<td><div class="row-actions">' +
            '<button class="btn btn-outline btn-sm" type="button" data-action="edit" data-id="' + esc(n.id) + '">Edit</button>' +
            '<button class="btn btn-danger btn-sm" type="button" data-action="delete" data-id="' + esc(n.id) + '">Delete</button>' +
          '</div></td></tr>';
      }).join('');
    }

    $('productRows').addEventListener('error', function (e) {
      if (e.target.tagName === 'IMG') {
        var d = document.createElement('div');
        d.className = 'thumb';
        e.target.replaceWith(d);
      }
    }, true);

    $('productRows').addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-action]');
      if (!btn) { return; }
      var id = btn.getAttribute('data-id');
      products = getProducts();
      var p = products.filter(function (x) { return String(x.id) === id; })[0];
      if (!p) { render(); return; }
      var n = norm(p);
      if (btn.getAttribute('data-action') === 'edit') {
        state.editId = n.id;
        state.img = n.image;
        $('pTitle').value = n.title;
        $('pAuthor').value = n.author;
        $('pCategory').value = CATS[n.category] ? n.category : 'exam';
        $('pPrice').value = n.price;
        $('pSale').value = n.salePrice < n.price ? n.salePrice : '';
        $('pStock').value = n.stock;
        $('pImage').value = state.img.indexOf('data:') === 0 ? '' : state.img;
        $('pFile').value = '';
        $('formTitle').textContent = 'Edit product';
        $('saveProduct').textContent = 'Update product';
        $('cancelEdit').hidden = false;
        updatePreview();
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        $('pTitle').focus({ preventScroll: true });
        toast('Editing: ' + n.title);
      } else {
        if (!window.confirm('Delete "' + n.title + '"? This cannot be undone.')) { return; }
        var next = products.filter(function (x) { return String(x.id) !== id; });
        if (!write(KEY.products, next)) { toast('The product could not be deleted. Try again.'); return; }
        products = next;
        if (state.editId === id) { resetForm(); }
        render();
        toast('Product deleted: ' + n.title);
      }
    });

    /* Offer management */
    var offerForm = $('offerForm');

    function fillOffer(o) {
      $('oText').value = o.text;
      $('oPercent').value = o.percent > 0 ? o.percent : '';
      $('oCode').value = o.code;
      $('oActive').checked = o.active;
    }
    function previewOffer() {
      var on = $('oActive').checked;
      var pct = parseFloat($('oPercent').value) || 0;
      var code = $('oCode').value.trim().toUpperCase();
      $('offerState').textContent = on ? 'Active' : 'Inactive';
      $('offerPreview').classList.toggle('off', !on);
      $('prevText').textContent = $('oText').value.trim() || 'Your banner text appears here';
      $('prevPct').hidden = !(pct > 0);
      $('prevPct').textContent = pct + '% off';
      $('prevCode').hidden = !code;
      $('prevCode').textContent = 'Code: ' + code;
    }
    offerForm.addEventListener('input', function (e) {
      if (e.target.closest('.field')) { setErr(e.target, ''); }
      previewOffer();
    });
    $('oActive').addEventListener('change', previewOffer);

    offerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var t = $('oText'), p = $('oPercent'), c = $('oCode');
      [t, p, c].forEach(function (el) { setErr(el, ''); });
      if (t.value.trim().length < 5) { setErr(t, 'Enter the banner text (at least 5 characters).'); ok = false; }
      var pct = p.value.trim() === '' ? 0 : parseFloat(p.value);
      if (isNaN(pct) || pct < 0 || pct > 90) { setErr(p, 'Enter a discount between 0 and 90.'); ok = false; }
      var code = c.value.trim().toUpperCase();
      if (code && !/^[A-Z0-9]{3,20}$/.test(code)) { setErr(c, 'Use 3 to 20 letters or numbers, with no spaces.'); ok = false; }
      if (code === READMORE.code) { setErr(c, 'READMORE is reserved for the 2-book offer. Choose another code.'); ok = false; }
      if (!ok) { shake(offerForm); toast('Please fix the highlighted fields.'); return; }
      var saved = { active: $('oActive').checked, text: t.value.trim(), percent: pct, code: code };
      if (!write(KEY.offer, saved)) { toast('The offer could not be saved. Allow site data and try again.'); return; }
      c.value = code;
      previewOffer();
      toast(saved.active ? 'Offer applied. It is live in the store.' : 'Offer saved. It is inactive.');
    });

    fillOffer(getOffer());
    previewOffer();
    render();
  }

  /* ---------- Start ---------- */
  function start() {
    getProducts();
    initCommon();
    if ($('productGrid') && $('cartDrawer')) { initStore(); }
    if ($('loginForm') && $('tabs')) { initLogin(); }
    if ($('productForm') && $('offerForm')) { initAdmin(); }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', start); } else { start(); }
})();
