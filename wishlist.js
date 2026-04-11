// ==========================================
// KÍVÁNSÁGLISTA (WISHLIST)
// ==========================================

/**
 * Termék hozzáadása vagy eltávolítása a kedvencek közül.
 */
function toggleWishlist(event, productId) {
    event.stopPropagation(); // Ne nyissa meg a termék oldalt kattintáskor
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const index = wishlist.indexOf(productId);

    if (index > -1) {
        wishlist.splice(index, 1);
        showToast('Eltávolítva a kívánságlistáról.');
    } else {
        wishlist.push(productId);
        showToast('Hozzáadva a kívánságlistához!');
    }

    localStorage.setItem('wishlist', JSON.stringify(wishlist));

    // Ha a kívánságlista oldalon vagyunk, azonnal újrarajzoljuk a listát
    if (window.location.pathname.includes('/wishlist')) {
        renderWishlist();
    } else {
        // Különben csak frissítjük az ikonokat
        applyFilters();
    }
}

/**
 * A kedvencnek jelölt termékek kilistázása a wishlist.html-en.
 * Várunk, amíg a window.allProducts feltöltődik a common.js-ből.
 */
function renderWishlist() {
    const container = document.getElementById("wishlist-list");
    if (!container) return;

    if (typeof window.allProducts === 'undefined' || window.allProducts.length === 0) {
        // Ha még nem töltődtek be a termékek, próbáljuk újra 100ms múlva
        setTimeout(renderWishlist, 100);
        return;
    }

    let wishlistIds = JSON.parse(localStorage.getItem('wishlist')) || [];
    
    // Robusztus szűrés: szöveggé alakítjuk az ID-kat az összehasonlításhoz (type mismatch elkerülése)
    const wishlistedProducts = window.allProducts.filter(p => 
        wishlistIds.some(id => String(id) === String(p.id))
    );

    console.log("Kedvencek ID-k:", wishlistIds);
    console.log("Megjelenítendő termékek:", wishlistedProducts);

    if (wishlistedProducts.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px;">A kívánságlistád jelenleg üres. Jelölj meg pár terméket a szívecske ikonnal!</p>`;
    } else {
        renderProducts(wishlistedProducts, "wishlist-list");
    }
}

// Oldal betöltésekor indítjuk a renderelést
if (window.location.pathname.includes('/wishlist')) {
    document.addEventListener('DOMContentLoaded', renderWishlist);
}

