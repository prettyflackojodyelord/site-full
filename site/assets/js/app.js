(function () {
  "use strict";

  const books = Array.isArray(window.BOOKS) ? window.BOOKS : [];
  const genres = Array.isArray(window.GENRES) ? window.GENRES : [];
  const CART_KEY = "znanie-cart-v1";
  const FAVORITES_KEY = "znanie-favorites-v1";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function readJSON(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("ru-RU").format(value) + " ₽";
  }

  function getBook(id) {
    return books.find((book) => book.id === id);
  }

  function getCart() {
    const cart = readJSON(CART_KEY, {});
    return cart && typeof cart === "object" && !Array.isArray(cart) ? cart : {};
  }

  function getFavorites() {
    const favorites = readJSON(FAVORITES_KEY, []);
    return Array.isArray(favorites) ? favorites : [];
  }

  function getCartCount() {
    return Object.values(getCart()).reduce((total, quantity) => total + Number(quantity || 0), 0);
  }

  function makeCoverSvg(book) {
    const palette = book.palette || ["#31453d", "#e6dca8"];
    const words = book.title.split(" ");
    const lines = [];
    let current = "";
    words.forEach((word) => {
      if ((current + " " + word).trim().length > 19 && current) {
        lines.push(current);
        current = word;
      } else {
        current = (current + " " + word).trim();
      }
    });
    if (current) lines.push(current);
    const titleLines = lines.slice(0, 4).map((line, index) =>
      `<text x="50%" y="${44 + index * 10}%" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="${palette[1]}">${escapeHTML(line)}</text>`
    ).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="840" viewBox="0 0 600 840" role="img" aria-label="Демонстрационная обложка книги ${escapeHTML(book.title)}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette[0]}"/><stop offset="1" stop-color="#111713"/></linearGradient></defs>
      <rect width="600" height="840" fill="url(#g)"/><rect x="34" y="34" width="532" height="772" rx="18" fill="none" stroke="${palette[1]}" stroke-opacity=".6" stroke-width="3"/>
      <circle cx="300" cy="185" r="72" fill="none" stroke="${palette[1]}" stroke-width="2" opacity=".5"/><path d="M248 185h104M300 133v104" stroke="${palette[1]}" stroke-width="2" opacity=".5"/>
      ${titleLines}<text x="50%" y="72%" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" letter-spacing="3" fill="${palette[1]}" opacity=".9">${escapeHTML(book.author.toUpperCase())}</text>
      <text x="50%" y="92%" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" letter-spacing="4" fill="${palette[1]}" opacity=".65">ЗНАНИЕ · ДЕМО-ОБЛОЖКА</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function coverSource(book) {
    return book.cover || makeCoverSvg(book);
  }

  function coverAlt(book) {
    return book.cover
      ? `Обложка книги «${book.title}»`
      : `Демонстрационная обложка книги «${book.title}»`;
  }

  function bookCard(book) {
    const favorites = getFavorites();
    const isFavorite = favorites.includes(book.id);
    return `<article class="book-card reveal" data-book-id="${escapeHTML(book.id)}">
      <button class="book-card__favorite" type="button" data-favorite="${escapeHTML(book.id)}" aria-label="${isFavorite ? "Удалить из избранного" : "Добавить в избранное"}" aria-pressed="${isFavorite}">♡</button>
      <a class="book-card__media" href="product.html?id=${encodeURIComponent(book.id)}">
        <img src="${coverSource(book)}" alt="${escapeHTML(coverAlt(book))}" loading="lazy" width="600" height="840">
        ${book.badge ? `<span class="badge book-card__badge">${escapeHTML(book.badge)}</span>` : ""}
      </a>
      <div class="book-card__meta"><span>${escapeHTML(book.genreLabel)}</span><span class="rating" aria-label="Демонстрационный рейтинг ${book.rating} из 5">★ ${book.rating.toFixed(1)}</span></div>
      <h3 class="book-card__title"><a href="product.html?id=${encodeURIComponent(book.id)}">${escapeHTML(book.title)}</a></h3>
      <p class="book-card__author">${escapeHTML(book.author)}</p>
      <ul class="book-card__features" aria-label="Характеристики"><li>${book.year}</li><li>${escapeHTML(book.coverType)}</li></ul>
      <div class="book-card__footer">
        <div class="book-price">${book.oldPrice ? `<s>${formatPrice(book.oldPrice)}</s>` : ""}${formatPrice(book.price)}</div>
        <button class="button button--small" type="button" data-add-cart="${escapeHTML(book.id)}">В корзину</button>
      </div>
    </article>`;
  }

  function emptyState(title, message, actionHTML = "") {
    return `<div class="empty-state"><div class="empty-state__icon" aria-hidden="true">⌁</div><h2>${escapeHTML(title)}</h2><p class="muted">${escapeHTML(message)}</p>${actionHTML}</div>`;
  }

  function renderHeader() {
    const root = $("#site-header");
    if (!root) return;
    const current = document.body.dataset.page || "";
    const link = (href, label, page) => `<a class="site-nav__link" href="${href}" ${current === page ? 'aria-current="page"' : ""}>${label}</a>`;
    root.innerHTML = `<a class="skip-link" href="#main-content">К содержанию</a>
      <header class="site-header">
        <div class="container site-header__top">
          <a class="brand brand--full" href="main.html" aria-label="Знание — на главную">
            <img class="brand__mark" src="assets/images/logo-full.png?v=3" alt="Знание — Читай. Учись. Расти." width="240" height="120">
          </a>
          <nav class="site-nav" id="site-nav" aria-label="Основная навигация">
            ${link("main.html", "Главная", "home")}
            ${link("index.html", "Каталог", "catalog")}
            ${link("about.html", "О нас", "about")}
            ${link("contacts.html", "Контакты", "contacts")}
            ${link("info.html", "Оплата и доставка", "info")}
          </nav>
          <form class="header-search" action="search.html" role="search">
            <label class="visually-hidden" for="header-query">Поиск по книгам</label>
            <input id="header-query" name="q" type="search" autocomplete="off" placeholder="Книга или автор" required>
            <button type="submit" aria-label="Найти">⌕</button>
          </form>
          <div class="header-actions">
            <a class="header-action" href="favorites.html" aria-label="Избранное">♡<span class="header-action__count" data-favorites-count>0</span></a>
            <a class="header-action" href="cart.html" aria-label="Корзина">▢<span class="header-action__count" data-cart-count>0</span></a>
            <button class="icon-button menu-toggle" type="button" data-menu-toggle aria-controls="site-nav" aria-expanded="false" aria-label="Открыть меню">☰</button>
          </div>
        </div>
      </header>`;
  }

  function renderFooter() {
    const root = $("#site-footer");
    if (!root) return;
    root.innerHTML = `<footer class="site-footer">
      <div class="container site-footer__grid">
        <div><a class="brand brand--compact" href="main.html" aria-label="Знание — на главную"><img class="brand__mark" src="assets/images/logo-full.png?v=3" alt="Знак книжного магазина «Знание»" width="260" height="130"></a><p>Книжный магазин в эстетике спокойного чтения. Статическая демонстрационная версия.</p></div>
        <div><h2>Покупателям</h2><ul><li><a href="index.html">Каталог</a></li><li><a href="favorites.html">Избранное</a></li><li><a href="cart.html">Корзина</a></li><li><a href="info.html">Оплата и доставка</a></li></ul></div>
        <div><h2>О проекте</h2><ul><li><a href="about.html">О нас</a></li><li><a href="contacts.html">Контакты</a></li><li><a href="about.html#feedback">Обратная связь</a></li><li><a href="../README.md">Документация</a></li></ul></div>
        <div><h2>Связь</h2><ul><li><a href="tel:88882224224">8 888 222-42-24</a></li><li><a href="mailto:hello@example.com">hello@example.com</a></li><li><span>Социальные адреса не указаны в исходных материалах</span></li></ul></div>
      </div>
      <div class="container site-footer__bottom"><span>© 2026 «Знание»</span><span>Учебная статическая версия · без реальной оплаты и отправки данных</span></div>
    </footer>`;
  }

  function updateCounters() {
    $$('[data-cart-count]').forEach((node) => { node.textContent = String(getCartCount()); });
    $$('[data-favorites-count]').forEach((node) => { node.textContent = String(getFavorites().length); });
  }

  function showToast(message) {
    let region = $(".toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      region.setAttribute("aria-live", "polite");
      document.body.append(region);
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    region.append(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  function addToCart(id, quantity = 1) {
    if (!getBook(id)) return;
    const cart = getCart();
    cart[id] = Math.max(1, Number(cart[id] || 0) + quantity);
    writeJSON(CART_KEY, cart);
    updateCounters();
    showToast("Книга добавлена в корзину");
  }

  function toggleFavorite(id) {
    const favorites = getFavorites();
    const index = favorites.indexOf(id);
    if (index >= 0) favorites.splice(index, 1);
    else favorites.push(id);
    writeJSON(FAVORITES_KEY, favorites);
    $$(`[data-favorite="${CSS.escape(id)}"]`).forEach((button) => {
      const active = favorites.includes(id);
      button.setAttribute("aria-pressed", String(active));
      button.setAttribute("aria-label", active ? "Удалить из избранного" : "Добавить в избранное");
    });
    updateCounters();
    showToast(index >= 0 ? "Удалено из избранного" : "Добавлено в избранное");
    if (document.body.dataset.page === "favorites") renderFavorites();
  }

  function bindGlobalActions() {
    document.addEventListener("click", (event) => {
      const cartButton = event.target.closest("[data-add-cart]");
      if (cartButton) addToCart(cartButton.dataset.addCart);

      const favoriteButton = event.target.closest("[data-favorite]");
      if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite);

      const menuButton = event.target.closest("[data-menu-toggle]");
      if (menuButton) {
        const nav = $("#site-nav");
        const isOpen = nav?.classList.toggle("is-open") || false;
        menuButton.setAttribute("aria-expanded", String(isOpen));
      }

      const railButton = event.target.closest("[data-rail-direction]");
      if (railButton) {
        const rail = document.getElementById(railButton.dataset.railTarget);
        const direction = railButton.dataset.railDirection === "next" ? 1 : -1;
        rail?.scrollBy({ left: direction * Math.min(720, rail.clientWidth * 0.8), behavior: "smooth" });
      }
    });
  }

  function renderBookCollection(selector, collection) {
    const root = $(selector);
    if (root) root.innerHTML = collection.map(bookCard).join("");
  }

  function initHome() {
    renderBookCollection("#popular-rail", books.filter((book) => book.rating >= 4.8).slice(0, 9));
    renderBookCollection("#new-rail", [...books].sort((a, b) => b.year - a.year).slice(0, 9));
    const picks = books.filter((book) => ["little-prince", "dune", "three-comrades", "name-of-the-rose"].includes(book.id));
    renderBookCollection("#editor-picks", picks);
  }

  function getCatalogState() {
    const params = new URLSearchParams(location.search);
    return {
      query: params.get("q") || "",
      genre: params.get("genre") || "",
      yearFrom: Number(params.get("yearFrom")) || 0,
      yearTo: Number(params.get("yearTo")) || 9999,
      priceFrom: Number(params.get("priceFrom")) || 0,
      priceTo: Number(params.get("priceTo")) || Number.MAX_SAFE_INTEGER,
      sort: params.get("sort") || "rating-desc"
    };
  }

  function filterBooks(state) {
    const normalized = state.query.trim().toLocaleLowerCase("ru-RU");
    const filtered = books.filter((book) => {
      const text = `${book.title} ${book.author} ${book.genreLabel}`.toLocaleLowerCase("ru-RU");
      return (!normalized || text.includes(normalized)) &&
        (!state.genre || book.genre === state.genre) &&
        book.year >= state.yearFrom && book.year <= state.yearTo &&
        book.price >= state.priceFrom && book.price <= state.priceTo;
    });
    const sorters = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      "year-desc": (a, b) => b.year - a.year,
      "year-asc": (a, b) => a.year - b.year,
      "rating-desc": (a, b) => b.rating - a.rating,
      "title-asc": (a, b) => a.title.localeCompare(b.title, "ru")
    };
    return filtered.sort(sorters[state.sort] || sorters["rating-desc"]);
  }

  function initCatalog() {
    const form = $("#catalog-filters");
    const grid = $("#catalog-grid");
    const count = $("#catalog-count");
    const sort = $("#catalog-sort");
    if (!form || !grid) return;
    const initial = getCatalogState();
    const genreInput = $(`input[name="genre"][value="${CSS.escape(initial.genre)}"]`, form);
    if (genreInput) genreInput.checked = true;
    $("#price-from", form).value = initial.priceFrom || "";
    $("#price-to", form).value = initial.priceTo === Number.MAX_SAFE_INTEGER ? "" : initial.priceTo;
    $("#year-from", form).value = initial.yearFrom || "";
    $("#year-to", form).value = initial.yearTo === 9999 ? "" : initial.yearTo;
    if (sort) sort.value = initial.sort;

    const render = () => {
      const data = new FormData(form);
      const state = {
        query: initial.query,
        genre: data.get("genre") || "",
        yearFrom: Number(data.get("yearFrom")) || 0,
        yearTo: Number(data.get("yearTo")) || 9999,
        priceFrom: Number(data.get("priceFrom")) || 0,
        priceTo: Number(data.get("priceTo")) || Number.MAX_SAFE_INTEGER,
        sort: sort?.value || "rating-desc"
      };
      const result = filterBooks(state);
      count.textContent = `${result.length} ${result.length === 1 ? "книга" : result.length < 5 ? "книги" : "книг"}`;
      grid.innerHTML = result.length
        ? result.map(bookCard).join("")
        : emptyState("Ничего не найдено", "Попробуйте изменить диапазон, жанр или сбросить фильтры.", '<button class="button button--secondary" type="button" data-reset-filters>Сбросить фильтры</button>');
    };

    form.addEventListener("input", render);
    sort?.addEventListener("change", render);
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-reset-filters]")) {
        form.reset();
        if (sort) sort.value = "rating-desc";
        render();
      }
    });
    render();
  }

  function initCategory() {
    const root = $("#category-grid");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("genre") || genres[0]?.id;
    const genre = genres.find((item) => item.id === id) || genres[0];
    $("#category-title").textContent = genre?.label || "Категория";
    $("#category-description").textContent = genre?.description || "Подборка книг";
    document.title = `${genre?.label || "Категория"} — Знание`;
    const collection = books.filter((book) => book.genre === genre?.id);
    root.innerHTML = collection.length ? collection.map(bookCard).join("") : emptyState("Подборка готовится", "В этой категории пока нет книг.");
  }

  function initSearch() {
    const root = $("#search-results");
    if (!root) return;
    const query = new URLSearchParams(location.search).get("q")?.trim() || "";
    $("#search-query-label").textContent = query ? `«${query}»` : "без запроса";
    const result = filterBooks({ query, genre: "", yearFrom: 0, yearTo: 9999, priceFrom: 0, priceTo: Number.MAX_SAFE_INTEGER, sort: "rating-desc" });
    $("#search-count").textContent = query ? `Найдено: ${result.length}` : "Введите запрос в строке поиска";
    root.innerHTML = query
      ? (result.length ? result.map(bookCard).join("") : emptyState("Ничего не найдено", "Проверьте написание или попробуйте другой запрос.", '<a class="button" href="index.html">Открыть каталог</a>'))
      : emptyState("Поиск ждёт запрос", "Введите название книги, автора или жанр в строке сверху.");
  }

  function initProduct() {
    const root = $("#product-content");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id") || books[0]?.id;
    const book = getBook(id);
    if (!book) {
      root.innerHTML = emptyState("Книга не найдена", "Возможно, ссылка устарела.", '<a class="button" href="index.html">Вернуться в каталог</a>');
      return;
    }
    document.title = `${book.title} — Знание`;
    const favorite = getFavorites().includes(book.id);
    root.innerHTML = `<div class="breadcrumbs"><a href="main.html">Главная</a><span>·</span><a href="index.html">Каталог</a><span>·</span><span aria-current="page">${escapeHTML(book.title)}</span></div>
      <div class="product-layout">
        <div class="product-gallery"><div class="product-gallery__main"><img src="${coverSource(book)}" alt="${escapeHTML(coverAlt(book))}" width="600" height="840"></div></div>
        <div class="product-info">
          <p class="product-info__author">${escapeHTML(book.author)}</p>
          <h1>${escapeHTML(book.title)}</h1>
          <div class="product-info__meta"><span class="rating" aria-label="Демонстрационный рейтинг ${book.rating} из 5">★ ${book.rating.toFixed(1)} / 5</span><span>${book.year} — год первого издания</span><span>${escapeHTML(book.genreLabel)}</span></div>
          <p class="muted">${escapeHTML(book.description)}</p>
          <div class="product-info__price">${formatPrice(book.price)} ${book.oldPrice ? `<s class="muted">${formatPrice(book.oldPrice)}</s>` : ""}</div>
          <div class="product-actions"><button class="button" type="button" data-add-cart="${book.id}">Добавить в корзину</button><button class="button button--secondary" type="button" data-favorite="${book.id}" aria-pressed="${favorite}">${favorite ? "В избранном" : "В избранное"}</button></div>
          <p class="muted">Демонстрационная витрина: наличие и оформление заказа не связаны с сервером.</p>
          <dl class="spec-grid"><div><dt>Автор</dt><dd>${escapeHTML(book.author)}</dd></div><div><dt>Жанр</dt><dd>${escapeHTML(book.genreLabel)}</dd></div><div><dt>Страниц</dt><dd>${book.pages}</dd></div><div><dt>Переплёт</dt><dd>${escapeHTML(book.coverType)}</dd></div><div><dt>Формат</dt><dd>${escapeHTML(book.format)}</dd></div><div><dt>Язык</dt><dd>Русский</dd></div></dl>
        </div>
      </div>`;
    const related = books.filter((item) => item.id !== book.id && (item.author === book.author || item.genre === book.genre)).slice(0, 4);
    renderBookCollection("#related-books", related);
    const reviewRoot = $("#product-reviews");
    if (reviewRoot) reviewRoot.innerHTML = [
      { name: "Анна", date: "12 октября 2026", text: "Выразительное издание и удобный формат. Отзыв создан для демонстрации интерфейса." },
      { name: "Илья", date: "3 сентября 2026", text: "Хороший повод перечитать книгу. Это демонстрационный отзыв, не подтверждённый покупкой." }
    ].map((review) => `<article class="review-card"><div class="review-card__header"><strong>${review.name}</strong><span class="muted">${review.date}</span></div><div class="rating">★★★★★</div><p>${review.text}</p></article>`).join("");
  }

  function renderCart() {
    const root = $("#cart-list");
    const summary = $("#cart-summary");
    if (!root || !summary) return;
    const cart = getCart();
    const items = Object.entries(cart).map(([id, quantity]) => ({ book: getBook(id), quantity: Number(quantity) })).filter((item) => item.book && item.quantity > 0);
    if (!items.length) {
      root.innerHTML = emptyState("Корзина пока пуста", "Соберите собственную полку — в каталоге уже 31 разная книга.", '<a class="button" href="index.html">Перейти в каталог</a>');
      summary.innerHTML = `<h2>Итого</h2><div class="summary-row summary-row--total"><span>Сумма</span><strong>${formatPrice(0)}</strong></div><a class="button" href="index.html">Выбрать книги</a>`;
      return;
    }
    root.innerHTML = items.map(({ book, quantity }) => `<article class="cart-item">
      <a class="cart-item__cover" href="product.html?id=${encodeURIComponent(book.id)}"><img src="${coverSource(book)}" alt="${escapeHTML(coverAlt(book))}" width="120" height="170"></a>
      <div><h3><a href="product.html?id=${encodeURIComponent(book.id)}">${escapeHTML(book.title)}</a></h3><p class="muted">${escapeHTML(book.author)}</p><div class="quantity" aria-label="Количество"><button type="button" data-cart-change="${book.id}" data-delta="-1" aria-label="Уменьшить">−</button><span>${quantity}</span><button type="button" data-cart-change="${book.id}" data-delta="1" aria-label="Увеличить">+</button></div></div>
      <div class="cart-item__actions"><strong>${formatPrice(book.price * quantity)}</strong><br><button class="button button--danger button--small" type="button" data-cart-remove="${book.id}">Удалить</button></div>
    </article>`).join("");
    const subtotal = items.reduce((total, item) => total + item.book.price * item.quantity, 0);
    const delivery = subtotal >= 2500 ? 0 : 290;
    summary.innerHTML = `<h2>Итого</h2><div class="summary-row"><span>Товары (${getCartCount()})</span><strong>${formatPrice(subtotal)}</strong></div><div class="summary-row"><span>Доставка</span><strong>${delivery ? formatPrice(delivery) : "Бесплатно"}</strong></div><div class="summary-row summary-row--total"><span>К оплате</span><strong>${formatPrice(subtotal + delivery)}</strong></div><a class="button" href="checkout.html">Оформить заказ</a><p class="muted">Оплата в демонстрационной версии не выполняется.</p>`;
  }

  function initCart() {
    if (!$("#cart-list")) return;
    renderCart();
    document.addEventListener("click", (event) => {
      const change = event.target.closest("[data-cart-change]");
      if (change) {
        const cart = getCart();
        const id = change.dataset.cartChange;
        cart[id] = Math.max(0, Number(cart[id] || 0) + Number(change.dataset.delta));
        if (!cart[id]) delete cart[id];
        writeJSON(CART_KEY, cart);
        updateCounters();
        renderCart();
      }
      const remove = event.target.closest("[data-cart-remove]");
      if (remove) {
        const cart = getCart();
        delete cart[remove.dataset.cartRemove];
        writeJSON(CART_KEY, cart);
        updateCounters();
        renderCart();
        showToast("Позиция удалена из корзины");
      }
    });
  }

  function renderFavorites() {
    const root = $("#favorites-grid");
    if (!root) return;
    const collection = getFavorites().map(getBook).filter(Boolean);
    root.innerHTML = collection.length
      ? collection.map(bookCard).join("")
      : emptyState("Список избранного пуст", "Нажимайте на сердечко в карточках, чтобы сохранять книги.", '<a class="button" href="index.html">Открыть каталог</a>');
  }

  function initFavorites() {
    renderFavorites();
  }

  function validateForm(form) {
    let valid = true;
    $$("[required]", form).forEach((field) => {
      const error = form.querySelector(`[data-error-for="${CSS.escape(field.name)}"]`);
      let message = "";
      const value = field.type === "checkbox" ? field.checked : field.value.trim();
      if (!value) message = field.type === "checkbox" ? "Нужно подтвердить согласие." : "Заполните это поле.";
      else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) message = "Проверьте формат email.";
      else if (field.type === "tel" && field.value.replace(/\D/g, "").length < 10) message = "Введите не менее 10 цифр.";
      else if (field.minLength > 0 && field.value.trim().length < field.minLength) message = `Введите не менее ${field.minLength} символов.`;
      field.setAttribute("aria-invalid", String(Boolean(message)));
      if (error) error.textContent = message;
      if (message) valid = false;
    });
    return valid;
  }

  function initDemoForms() {
    $$('[data-demo-form]').forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const status = $(".form-status", form);
        if (!validateForm(form)) {
          status?.classList.remove("is-visible");
          form.querySelector('[aria-invalid="true"]')?.focus();
          return;
        }
        if (form.dataset.demoForm === "checkout") {
          writeJSON(CART_KEY, {});
          updateCounters();
        }
        form.reset();
        if (status) {
          status.textContent = form.dataset.demoForm === "checkout"
            ? "Демонстрационный заказ сформирован. Данные не отправлялись и оплата не выполнялась."
            : "Спасибо! Это демонстрация: сообщение проверено, но никуда не отправлено.";
          status.classList.add("is-visible");
          status.focus();
        }
      });
      form.addEventListener("input", (event) => {
        const field = event.target;
        if (field.matches("[required]") && field.getAttribute("aria-invalid") === "true") validateForm(form);
      });
    });
  }

  function initCheckout() {
    const summary = $("#checkout-summary");
    if (!summary) return;
    const cart = getCart();
    const items = Object.entries(cart).map(([id, quantity]) => ({ book: getBook(id), quantity: Number(quantity) })).filter((item) => item.book);
    const subtotal = items.reduce((total, item) => total + item.book.price * item.quantity, 0);
    const delivery = subtotal && subtotal < 2500 ? 290 : 0;
    summary.innerHTML = items.length
      ? `<h2>Ваш заказ</h2>${items.map((item) => `<div class="summary-row"><span>${escapeHTML(item.book.title)} × ${item.quantity}</span><strong>${formatPrice(item.book.price * item.quantity)}</strong></div>`).join("")}<div class="summary-row"><span>Доставка</span><strong>${delivery ? formatPrice(delivery) : "Бесплатно"}</strong></div><div class="summary-row summary-row--total"><span>Итого</span><strong>${formatPrice(subtotal + delivery)}</strong></div><p class="muted">Заказ и оплата не передаются на сервер.</p>`
      : `<h2>Ваш заказ</h2><p class="muted">Корзина пуста.</p><a class="button" href="index.html">Вернуться в каталог</a>`;
    const submit = $("#checkout-submit");
    if (submit) submit.disabled = !items.length;
  }

  function initGenreLinks() {
    $$('[data-genre-links]').forEach((root) => {
      root.innerHTML = genres.map((genre, index) => `<a class="category-card" href="category.html?genre=${encodeURIComponent(genre.id)}"><span class="category-card__number">0${index + 1}</span><h3>${escapeHTML(genre.label)}</h3><p class="muted">${escapeHTML(genre.description)}</p></a>`).join("");
    });
  }

  function init() {
    renderHeader();
    renderFooter();
    bindGlobalActions();
    updateCounters();
    initGenreLinks();
    initHome();
    initCatalog();
    initCategory();
    initSearch();
    initProduct();
    initCart();
    initFavorites();
    initCheckout();
    initDemoForms();
  }

  init();
})();
