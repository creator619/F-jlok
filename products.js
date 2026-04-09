const express = require("express");
const router = express.Router();
const db = require("../db/database");

// Összes termék lekérése
router.get("/", (req, res) => {
    db.all(`
        SELECT p.*, ps.size, ps.stock as size_stock 
        FROM products p
        LEFT JOIN product_stock ps ON p.id = ps.product_id
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const productsMap = {};
        rows.forEach(row => {
            if (!productsMap[row.id]) {
                productsMap[row.id] = {
                    id: row.id,
                    name: row.name,
                    price: row.price,
                    image: row.image,
                    category_id: row.category_id,
                    description: row.description,
                    sizes: row.sizes,
                    stock: 0,
                    size_stocks: {}
                };
            }
            if (row.size) {
                productsMap[row.id].size_stocks[row.size] = row.size_stock;
                productsMap[row.id].stock += row.size_stock;
            }
        });
        
        res.json(Object.values(productsMap));
    });
});

// Egy termék lekérése ID alapján
router.get("/:id", (req, res) => {
    const id = req.params.id;
    db.all(`
        SELECT p.*, ps.size, ps.stock as size_stock 
        FROM products p
        LEFT JOIN product_stock ps ON p.id = ps.product_id
        WHERE p.id = ?
    `, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (rows.length === 0) {
            res.status(404).json({ message: "Termék nem található" });
            return;
        }
        
        const product = {
            id: rows[0].id,
            name: rows[0].name,
            price: rows[0].price,
            image: rows[0].image,
            category_id: rows[0].category_id,
            description: rows[0].description,
            sizes: rows[0].sizes,
            stock: 0,
            size_stocks: {}
        };
        
        rows.forEach(row => {
            if (row.size) {
                product.size_stocks[row.size] = row.size_stock;
                product.stock += row.size_stock;
            }
        });
        
        res.json(product);
    });
});

module.exports = router;
