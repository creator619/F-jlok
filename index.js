// ==========================================
// KATEGÓRIÁK LISTÁJÁNAK MEGJELENÍTÉSE
function renderCategoryList(categories) {
    const listContainer = document.getElementById('categories-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.setAttribute('data-category', cat.id);
        li.textContent = cat.name;
        li.className = 'category-item';
        // kattintásra szűrés
        li.addEventListener('click', () => {
            const menu = document.getElementById('main-menu');
            if (menu) {
                document.querySelectorAll('.menu li').forEach(l => l.classList.remove('active'));
                const target = menu.querySelector(`li[data-category='${cat.id}']`);
                if (target) target.classList.add('active');
                applyFilters();
            }
        });
        listContainer.appendChild(li);
    });
}

// KATEGÓRIÁK BETÖLTÉSE ÉS MENÜ GENERÁLÁSA
// SZŰRÉS, KERESÉS ÉS RENDEZÉS
// ==========================================

/**
 * A termékek szűrése keresőszó, kategória és ár alapján, majd rendezésük.
 */
function applyFilters() {
    const source = window.allProducts || (typeof productsData !== 'undefined' ? productsData : []);
    if (!source || source.length === 0) return;

    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const activeCategory = document.querySelector('.menu li.active')?.getAttribute('data-category');
    const sortBy = document.getElementById('sort-select')?.value || 'default';
    const maxPrice = parseInt(document.getElementById('price-filter')?.value) || 100000;

    let filtered = source.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) || (p.description && p.description.toLowerCase().includes(searchTerm));
        const matchesCategory = !activeCategory || p.category_id == activeCategory;
        const matchesPrice = p.price <= maxPrice;
        return matchesSearch && matchesCategory && matchesPrice;
    });

    // Rendezési feltételek alkalmazása
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));

    renderProducts(filtered);
    // Render categories list (if container exists)
    if (typeof renderCategoryList === 'function') renderCategoryList(categories || []);
}



// Inicializálás betöltéskor
document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sort-select');
    const priceFilter = document.getElementById('price-filter');
    const priceDisplay = document.getElementById('price-display');
    const searchInput = document.getElementById('search-input');

    // Eseménykezelők a szűrőkhöz
    if (sortSelect) sortSelect.addEventListener('change', applyFilters);
    if (priceFilter) {
        priceFilter.addEventListener('input', (e) => {
            const val = e.target.value;
            if (priceDisplay) priceDisplay.textContent = parseInt(val).toLocaleString() + ' Ft';
            applyFilters();
        });
    }
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    // Kezdő adatok betöltése
    fetchProducts().then(() => {
        // Kategóriák betöltése és menü frissítése
        fetchCategories().then(categories => {
            const menu = document.getElementById('main-menu');
            if (menu) {
                // Eredeti menüelemek (kosár, felhasználó) megtartása
                const cartItem = menu.querySelector('.cart-menu');
                const userNav = document.getElementById('user-nav');
                // Menü törlése
                menu.innerHTML = '';
                // Kategória elemek hozzáadása
                categories.forEach(cat => {
                    const li = document.createElement('li');
                    li.setAttribute('data-category', cat.id);
                    li.textContent = cat.name;
                    menu.appendChild(li);
                });
                // Kosár ikon visszahelyezése
                if (cartItem) menu.appendChild(cartItem);
                // Felhasználó navigáció visszahelyezése
                if (userNav) document.querySelector('nav.menu').appendChild(userNav);
                // Aktív kategória beállítása URL paraméter alapján
                const urlParams = new URLSearchParams(window.location.search);
                const catParam = urlParams.get('category');
                if (catParam) {
                    const activeLi = menu.querySelector(`li[data-category="${catParam}"]`);
                    if (activeLi) activeLi.classList.add('active');
                }
                // Render categories list on page (if container exists)
                renderCategoryList(categories);
                applyFilters();
            }
        }).catch(err => {
            console.error('Kategóriák betöltése sikertelen:', err);
            applyFilters(); // fallback to existing filter
        });
    });
        // Ellenőrizzük, hogy kategória szűréssel érkeztünk-e az oldalra
        const urlParams = new URLSearchParams(window.location.search);
        const catParam = urlParams.get('category');
        if (catParam) {
            const menuItem = document.querySelector(`.menu li[data-category="${catParam}"]`);
            if (menuItem) {
                document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active"));
                menuItem.classList.add("active");
                applyFilters();
            }
        }
    });
});
