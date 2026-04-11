// ==========================================
// CATEGORY SERVICE - fetch categories from backend
// ==========================================

/**
 * Lekéri a kategóriákat a backendről.
 * Visszaadja a kategóriák tömbjét [{id, name}, ...].
 */
async function fetchCategories() {
    try {
        // Az apiFetch automatikusan hozzáadja a token-t, ha van.
        const data = await apiFetch('/categories');
        return data;
    } catch (err) {
        console.error('Kategóriák lekérése sikertelen:', err);
        return [];
    }
}

// Globálisan elérhetővé tesszük, hogy az index.js használhassa.
window.fetchCategories = fetchCategories;
