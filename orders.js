const express = require("express");
const router = express.Router();
const db = require("../db/database");
const authMiddleware = require("../Middleware/authMiddleware");

router.post("/", (req, res) => {
    console.log("Rendelés érkezett:", req.body);
    const { user_email, items, total_price } = req.body;

    if (!user_email || !items || items.length === 0) {
        console.log("Hiányzó adatok!", { user_email, items_length: items ? items.length : "undefined" });
        return res.status(400).json({ message: "Hiányzó adatok: email vagy kosár tartalom." });
    }

    // 1. Rendelés beszúrása
    const stmt = db.prepare("INSERT INTO orders (user_email, total_price) VALUES (?, ?)");
    stmt.run(user_email, total_price, function (err) {
        if (err) {
            return res.status(500).json({ message: "Hiba a rendelés mentésekor.", error: err.message });
        }

        const orderId = this.lastID; // Az új rendelés ID-ja

        // 2. Tételek beszúrása
        const itemStmt = db.prepare("INSERT INTO order_items (order_id, product_name, price, quantity) VALUES (?, ?, ?, ?)");
        const stockUpdateStmt = db.prepare("UPDATE product_stock SET stock = stock - ? WHERE product_id = ? AND size = ?");

        db.serialize(() => {
            db.exec("BEGIN TRANSACTION");

            items.forEach(item => {
                const qty = item.quantity || 1;
                itemStmt.run(orderId, item.name, item.price, qty);
                stockUpdateStmt.run(qty, item.id, item.size);
            });

            db.exec("COMMIT", (commitErr) => {
                if (commitErr) {
                    return res.status(500).json({ message: "Hiba a rendelés véglegesítésekor." });
                }

                res.status(201).json({ message: "Rendelés sikeresen leadva!", orderId: orderId });
            });
        });

        stmt.finalize();
        itemStmt.finalize();
        stockUpdateStmt.finalize();
    });
});

router.get("/my", authMiddleware, (req, res) => {
    const userEmail = req.user.email;

    db.all("SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC", [userEmail], (err, orders) => {
        if (err) {
            return res.status(500).json({ message: "Hiba a rendelések lekérésekor." });
        }

        if (orders.length === 0) {
            return res.json([]);
        }

        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map(() => "?").join(",");

        db.all(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`, orderIds, (itemErr, items) => {
            if (itemErr) {
                return res.status(500).json({ message: "Hiba a tételek lekérésekor." });
            }

            orders.forEach(order => {
                order.order_items = items.filter(item => item.order_id === order.id);
            });

            res.json(orders);
        });
    });
});

module.exports = router;
