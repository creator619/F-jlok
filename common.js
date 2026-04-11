// ==========================================
// KONFIGURÁCIÓ
// ==========================================
let BASE_URL = "";
let API_URL = "";

// induláskor lekérjük
async function initConfig() {
    const res = await fetch("/config");
    const data = await res.json();

    BASE_URL = `http://${data.ip}:${data.port}`;
    API_URL = BASE_URL;

    console.log("BASE_URL:", BASE_URL);
}

// ezt hívd meg induláskor
initConfig();

/**
 * Segédfüggvény a termékképek elérési útjának meghatározásához.
 */
function getProductImage(imagePath) {
    if (!imagePath) return `${BASE_URL}/images/hatter.jpg`;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('uploads/')) return `${BASE_URL}/${imagePath}`;
    if (!imagePath.includes('/')) return `${BASE_URL}/images/${imagePath}`;
    return imagePath;
}

/**
 * Toast értesítés megjelenítése a felhasználónak.
 * A képernyő jobb alsó sarkában úszik be, majd 3 másodperc után eltűnik.
 */
function showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>✨</span> ${message}`;

    container.appendChild(toast);

    // Animált eltüntetés időzítése
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Ellenőrzi a bejelentkezési állapotot a LocalStorage-ból,
 * és frissíti a fejlécben található navigációs gombokat (Login helyett Profil/Admin).
 */
function updateAuthUI() {
    const user = JSON.parse(localStorage.getItem("user"));
    const userNav = document.getElementById("user-nav");

    if (user && userNav) {
        // Az új backend 'role' mezőt használ 'is_admin' helyett
        const isAdmin = user.role === 'admin' || user.is_admin;
        const adminLink = isAdmin ? `<span class="username" onclick="window.location.href='/admin'" style="color: var(--accent); margin-right: 15px;">⚙️ Admin</span>` : '';
        userNav.innerHTML = `
            <li class="user-info">
                ${adminLink}
                <span class="username" onclick="window.location.href='/profile'" title="Profil megtekintése">👤 ${user.name}</span>
                <button class="logout-btn" onclick="logout()">Kijelentkezés</button>
            </li>
        `;
    } else if (userNav) {
        userNav.innerHTML = `
            <li onclick="window.location.href='/login'" id="login-link" class="nav-btn">Bejelentkezés</li>
            <li onclick="window.location.href='/register'" id="register-link" class="nav-btn">Regisztráció</li>
        `;
    }
}

/**
 * Kijelentkezés: törli a felhasználói adatokat és visszairányít a főoldalra.
 */
function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    showToast("Sikeres kijelentkezés!");
    setTimeout(() => {
        window.location.href = "/";
    }, 1000);
}

/**
 * Dinamikus kategórialista lekérése és megjelenítése a menüben.
 */
async function loadCategoriesMenu() {
    const menu = document.getElementById("main-menu");
    if (!menu) return;

    try {
        // 1. Kedvencek link előkészítése
        const cartItem = menu.querySelector('.cart-menu');
        if (!menu.querySelector('.wishlist-menu')) {
            const wishlistLi = document.createElement('li');
            wishlistLi.className = 'wishlist-menu';
            wishlistLi.innerHTML = `<a href="/wishlist">Kedvencek</a>`;
            if (cartItem) {
                menu.insertBefore(wishlistLi, cartItem);
            } else {
                menu.appendChild(wishlistLi);
            }
        }

        // 2. Kategóriák lekérése
        const categories = await apiFetch('/products/categories');
        
        // 3. Régi kategóriák törlése
        const staticItems = menu.querySelectorAll('li[data-category]');
        staticItems.forEach(item => item.remove());

        // 4. Új kategóriák beszúrása a Kedvencek elé
        const wishlistLi = menu.querySelector('.wishlist-menu');
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.setAttribute('data-category', cat.id);
            li.textContent = cat.name;
            
            if (wishlistLi) {
                menu.insertBefore(li, wishlistLi);
            } else if (cartItem) {
                menu.insertBefore(li, cartItem);
            } else {
                menu.appendChild(li);
            }
        });

        // Szinkronizálás az URL paraméterrel
        const urlParams = new URLSearchParams(window.location.search);
        const catParam = urlParams.get('category');
        if (catParam) {
            const activeLi = menu.querySelector(`li[data-category="${catParam}"]`);
            if (activeLi) {
                menu.querySelectorAll("li").forEach(li => li.classList.remove("active"));
                activeLi.classList.add("active");
            }
        }
    } catch (err) {
        console.error("Hiba a kategóriák dinamikus betöltésekor:", err);
    }
}

// Alapvető UI események (pl. mobil menü, kategória váltás, GYIK) kezelése betöltéskor
document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    loadCategoriesMenu();

    // 1. Mobil menü nyitás/zárás kezelése
    const toggleBtn = document.getElementById("mobile-menu-toggle");
    const menu = document.getElementById("main-menu");
    if (toggleBtn && menu) {
        toggleBtn.addEventListener("click", () => {
            menu.classList.toggle("active");
            toggleBtn.textContent = menu.classList.contains("active") ? "✕" : "☰";
        });
    }

    // 2. Menü kattintások (kategória váltás / navigáció) kezelése
    if (menu) {
        menu.addEventListener("click", (e) => {
            const item = e.target.closest("li");
            if (!item || item.classList.contains("cart-menu") || item.classList.contains("user-info")) return;

            const cat = item.getAttribute("data-category");
            const isMainPage = window.location.pathname.endsWith("/") || window.location.pathname === "/" || window.location.pathname.endsWith("/");

            // ez itt nem lesz jó
            if (cat !== null) {
                if (isMainPage && typeof applyFilters === 'function') {
                    // Ha a főoldalon vagyunk, aktiváljuk a szűrőt
                    document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active"));
                    item.classList.add("active");
                    applyFilters();
                } else {
                    // Ha más oldalon vagyunk, visszairányítjuk a főoldalra a kategória paraméterrel
                    const targetCat = cat || "";
                    window.location.href = `/${targetCat ? `?category=${targetCat}` : ""}`;
                }

                // Mobil menü bezárása kattintás után
                menu.classList.remove("active");
                if (toggleBtn) toggleBtn.textContent = "☰";
            }
        });
    }

    // 3. GYIK Harmonika (Accordion) működése
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        if (questionBtn) {
            questionBtn.addEventListener('click', () => {
                const currentlyActive = document.querySelector('.faq-item.active');
                if (currentlyActive && currentlyActive !== item) {
                    currentlyActive.classList.remove('active');
                }
                item.classList.toggle('active');
            });
        }
    });

    // 4. Kapcsolati űrlap kezelése
    const contactForm = document.getElementById('contact-form');
    const statusMsg = document.getElementById('contact-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;

            // Gomb tiltása a feldolgozás alatt
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Küldés folyamatban...';
            submitBtn.disabled = true;

            // Valódi backend kérés
            apiFetch('/contact', {
                method: 'POST',
                body: JSON.stringify({ name, email, subject, message })
            })
            .then(() => {
                contactForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                if (statusMsg) {
                    statusMsg.textContent = 'Köszönjük az üzenetet! Hamarosan felvesszük veled a kapcsolatot.';
                    statusMsg.className = 'status-msg success';
                    setTimeout(() => {
                        statusMsg.style.display = 'none';
                        statusMsg.className = 'status-msg'; 
                        setTimeout(() => statusMsg.style.display = '', 100);
                    }, 5000);
                }
                showToast("Üzenet elküldve!");
            })
            .catch(err => {
                console.error(err);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                if (statusMsg) {
                    statusMsg.textContent = 'Hiba történt az üzenet küldésekor: ' + err.message;
                    statusMsg.className = 'status-msg error';
                }
                showToast("Hiba a küldés során!");
            });
        });
    }
});

// ==========================================
// API FETCH ÉS SEGÉDFÜGGVÉNYEK
// ==========================================

// A SUPABASE INICIALIZÁLÁS ELTÁVOLÍTVA - Mostantól saját MySQL backendünket használjuk

/**
 * Segédfüggvény az API hívásokhoz (automatikusan hozzáadja a tokent).
 */
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Hiba: ${response.status}`);
    }
    const data = await response.json();

    // Adat tisztítás és transformáció a SQLite backendhez
    if (Array.isArray(data)) {
        data.forEach(item => {
            // sizes string (S,M,L) -> size_stocks objektum ({S:10, M:10, L:10})
            if (item && item.sizes && !item.size_stocks) {
                const sizeArr = item.sizes.split(',');
                item.size_stocks = {};
                sizeArr.forEach(s => item.size_stocks[s.trim()] = 10); // Alapértelmezett készlet, mivel nincs a táblában
                item.stock = sizeArr.length * 10;
            }
        });
    } else if (data) {
        // Egyedi termék vagy login válasz esetén
        if (data.sizes && !data.size_stocks) {
            const sizeArr = data.sizes.split(',');
            data.size_stocks = {};
            sizeArr.forEach(s => data.size_stocks[s.trim()] = 10);
            data.stock = sizeArr.length * 10;
        }
    }

    return data;
}

// ==========================================
// TERMÉKEK MEGJELENÍTÉSE ÉS LEKÉRÉSE
// ==========================================

/**
 * A kapott terméklistát HTML kártyákká alakítja és beszúrja a megadott konténerbe.
 */
function renderProducts(list, containerId = "product-list") {
    const container = document.getElementById(containerId) || document.getElementById("wishlist-list") || document.getElementById("related-list");
    if (!container) return;

    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align: center; padding: 50px;'>Nincs megjeleníthető termék.</p>";
        return;
    }

    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    list.forEach((p, index) => {
        const isHearted = wishlist.includes(p.id) ? 'active' : '';
        const heartIcon = isHearted ? '❤️' : '🤍';

        const imgSrc = getProductImage(p.image);
        const currentStock = (p.stock === null || p.stock === undefined) ? 10 : p.stock;

        // Készlet állapot szövegezése
        const stockStatus = currentStock > 0 ? `<p class="stock-info">Készleten: ${currentStock} db</p>` : `<p class="stock-info out-of-stock">Elfogyott</p>`;
        const disableClass = currentStock > 0 ? '' : 'disabled';

        container.innerHTML += `
            <div class="product-card ${disableClass}" onclick="${currentStock > 0 ? `openProduct(${p.id})` : ''}" style="animation-delay: ${index * 0.1}s">
                <button class="wishlist-btn ${isHearted}" onclick="toggleWishlist(event, ${p.id})">${heartIcon}</button>
                <img src="${imgSrc}" alt="${p.name}" onerror="this.src='${BASE_URL}/images/hatter.jpg'">
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p class="price">${p.price.toLocaleString()} Ft</p>
                    ${stockStatus}
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCartOnMain(${JSON.stringify(p).replace(/"/g, '&quot;')})">🛒 Kosárba</button>
                </div>
            </div>
        `;
    });
}

/**
 * Termékek lekérése a saját API-ról.
 */
async function fetchProducts() {
    try {
        const data = await apiFetch('/products');

        // Statikus kiegészítések (pl. választható méretek) hozzáfűzése a backend adatokhoz
        const mergedData = data.map(p => {
            const staticInfo = (typeof productsData !== 'undefined') ? productsData.find(sp => sp.id === p.id) : null;
            return { ...p, sizes: staticInfo ? staticInfo.sizes : [] };
        });

        window.allProducts = mergedData;
        renderProducts(mergedData);
    } catch (error) {
        console.warn("Hiba a termékek letöltésekor, statikus adatok használata:", error);
        // Tartalék megoldás: ha a szerver nem érhető el, a products_data.js-ből dolgozunk
        if (typeof productsData !== 'undefined') {
            window.allProducts = productsData;
            renderProducts(productsData);
        } else {
            showToast("Hiba a termékek betöltésekor!");
        }
    }
}

// Kezdő lekérés indítása, ha van terméklista az oldalon
// Ha olyan oldalon vagyunk, ahol szükség van termékadatokra, töltsük le őket
if (document.getElementById("product-list") || document.getElementById("wishlist-list")) {
    fetchProducts();
}

/**
 * Egy konkrét termék részletes oldalának megnyitása.
 */
async function openProduct(id) {
    try {
        // Megpróbáljuk lekérni az API-ról a legfrissebb adatot
        const data = await apiFetch(`/products/${id}`);

        const staticInfo = (typeof productsData !== 'undefined') ? productsData.find(sp => sp.id === data.id) : null;
        const fullProduct = { ...data, sizes: staticInfo ? staticInfo.sizes : [] };

        localStorage.setItem("selectedProduct", JSON.stringify(fullProduct));
        window.location.href = "/product";
    } catch (err) {
        console.error("Hiba a termék részleteinek lekérésekor:", err);
        // Hiba esetén megpróbáljuk a már korábban betöltött listából kikeresni
        const product = window.allProducts?.find(p => p.id === id);
        if (product) {
            localStorage.setItem("selectedProduct", JSON.stringify(product));
            window.location.href = "/product";
        }
    }
}

// ==========================================
// KOSÁR ÉS KÍVÁNSÁGLISTA KEZELÉSE
// ==========================================

/**
 * Frissíti a menüben a kosár melletti számot (tételek összesítése).
 */
function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cart.reduce((total, item) => total + (item.quantity || 1), 0);
    const countSpan = document.getElementById("cart-count");
    if (countSpan) {
        countSpan.textContent = `(${count})`;
    }
}

/**
 * Termék hozzáadása a kosárhoz.
 */
function addToCart(product, quantity = 1) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Készlet ellenőrzése
    let availableStock = 0;
    const sizeStocks = product.size_stocks || {};

    if (!product.size) {
        showToast("Kérlek válassz méretet a vásárláshoz!");
        return;
    }

    if (sizeStocks[product.size] !== undefined) {
        // Csak azt engedjük, ami a konkrét mérethez van írva
        availableStock = sizeStocks[product.size];
    } else {
        // Ha nem szerepel a listában a méret -> 0 db
        availableStock = 0;
    }

    if (availableStock < quantity) {
        showToast(`Sajnos a választott (${product.size}) méret jelenleg nem elérhető.`);
        return;
    }

    // Ha ugyanaz a termék ugyanabban a méretben már benne van, csak a mennyiséget növeljük
    const existingItem = cart.find(item => item.id === product.id && item.size === product.size);

    if (existingItem) {
        const totalQty = (existingItem.quantity || 1) + quantity;
        if (totalQty > availableStock) {
            showToast("Nincs több készleten!");
            return;
        }
        existingItem.quantity = totalQty;
    } else {
        product.quantity = quantity;
        cart.push(product);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    showToast("Hozzáadva a kosárhoz!");
    updateCartCount();
}

/**
 * Gyors vásárlás a főoldalról (alapértelmezett méret választása).
 */
function addToCartOnMain(product) {
    // Alapértelmezett méret keresése a készlet alapján
    const sizeStocks = product.size_stocks || {};
    const availableSizes = Object.keys(sizeStocks).filter(s => sizeStocks[s] > 0);
    
    if (availableSizes.length > 0) {
        product.size = availableSizes[0]; // Az első elérhető méret
        addToCart(product, 1);
    } else {
        showToast("Sajnos ez a termék jelenleg minden méretben elfogyott.");
    }
}

/**
 * Kedvencek (Kívánságlista) ki-be kapcsolása.
 */
function toggleWishlist(event, productId) {
    event.stopPropagation(); // Ne nyissa meg a termékoldalt a kártyára kattintás miatt

    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const index = wishlist.indexOf(productId);

    const btn = event.currentTarget;

    if (index === -1) {
        wishlist.push(productId);
        btn.classList.add('active');
        btn.innerHTML = '❤️';
        showToast("Hozzáadva a kívánságlistához!");
    } else {
        wishlist.splice(index, 1);
        btn.classList.remove('active');
        btn.innerHTML = '🤍';
        showToast("Eltávolítva a kívánságlistáról.");
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Kezdő számláló frissítése
updateCartCount();

/**
 * Üzenet megjelenítése (Toast)
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    // Egyedi szín hiba esetén
    if (type === 'error') {
        toast.style.borderLeft = "4px solid #e74c3c";
    }

    container.appendChild(toast);

    // Eltávolítás 3 másodperc után, finom elsötétedéssel
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.5s ease-in-out';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

