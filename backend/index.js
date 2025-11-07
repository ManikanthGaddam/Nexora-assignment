const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const DB_FILE = path.join(__dirname, "vibecommerce.db");

async function initDb() {
  const db = await open({ filename: DB_FILE, driver: sqlite3.Database });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      description TEXT,
      image TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      productId TEXT,
      qty INTEGER,
      createdAt TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      customerName TEXT,
      customerEmail TEXT,
      total REAL,
      createdAt TEXT,
      items TEXT
    );
  `);

  // Seed products if empty
  const row = await db.get("SELECT COUNT(1) as cnt FROM products");
  if (row.cnt === 0) {
    const seed = [
      { id: "p1", name: "Vibe T-Shirt", price: 399, description: "Comfy cotton tee", image: "" },
      { id: "p2", name: "Vibe Hoodie", price: 1299, description: "Warm hoodie", image: "" },
      { id: "p3", name: "Vibe Sneakers", price: 2499, description: "Casual sneakers", image: "" },
      { id: "p4", name: "Vibe Cap", price: 299, description: "Stylish cap", image: "" },
      { id: "p5", name: "Vibe Backpack", price: 1599, description: "Daily backpack", image: "" }
    ];
    const insert = await db.prepare("INSERT INTO products (id,name,price,description,image) VALUES (?,?,?,?,?)");
    try {
      for (const p of seed) {
        await insert.run(p.id, p.name, p.price, p.description, p.image);
      }
    } finally {
      await insert.finalize();
    }
    console.log("Seeded products");
  }

  return db;
}

async function main() {
  const db = await initDb();
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // GET /api/products
  app.get("/api/products", async (req, res) => {
    try {
      const products = await db.all("SELECT * FROM products");
      res.json(products);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // GET /api/cart -> returns items + total
  app.get("/api/cart", async (req, res) => {
    try {
      const items = await db.all(`
        SELECT c.id, c.productId, c.qty, p.name, p.price
        FROM cart_items c
        LEFT JOIN products p ON p.id = c.productId
      `);

      let total = 0;
      const cartItems = items.map(i => {
        const subtotal = (i.price || 0) * i.qty;
        total += subtotal;
        return { id: i.id, productId: i.productId, name: i.name, price: i.price, qty: i.qty, subtotal };
      });

      res.json({ items: cartItems, total });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  // POST /api/cart -> { productId, qty }
  app.post("/api/cart", async (req, res) => {
    try {
      const { productId, qty } = req.body;
      if (!productId || !qty || qty <= 0) {
        return res.status(400).json({ error: "productId and positive qty required" });
      }

      // If same product exists, increase qty
      const existing = await db.get("SELECT * FROM cart_items WHERE productId = ?", productId);
      if (existing) {
        await db.run("UPDATE cart_items SET qty = qty + ? WHERE productId = ?", qty, productId);
        const updated = await db.get("SELECT * FROM cart_items WHERE productId = ?", productId);
        res.json({ message: "Updated quantity", item: updated });
      } else {
        const id = uuidv4();
        const createdAt = new Date().toISOString();
        await db.run(
          "INSERT INTO cart_items (id, productId, qty, createdAt) VALUES (?,?,?,?)",
          id,
          productId,
          qty,
          createdAt
        );
        const inserted = await db.get("SELECT * FROM cart_items WHERE id = ?", id);
        res.json({ message: "Added to cart", item: inserted });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  // DELETE /api/cart/:id -> remove item (by cart item id)
  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const item = await db.get("SELECT * FROM cart_items WHERE id = ?", id);
      if (!item) return res.status(404).json({ error: "Cart item not found" });
      await db.run("DELETE FROM cart_items WHERE id = ?", id);
      res.json({ message: "Removed from cart", id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to remove item" });
    }
  });

  // PUT /api/cart/:id -> update qty (body: {qty})
  app.put("/api/cart/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { qty } = req.body;
      if (!qty || qty < 1) return res.status(400).json({ error: "qty must be >= 1" });
      const item = await db.get("SELECT * FROM cart_items WHERE id = ?", id);
      if (!item) return res.status(404).json({ error: "Cart item not found" });
      await db.run("UPDATE cart_items SET qty = ? WHERE id = ?", qty, id);
      const updated = await db.get("SELECT * FROM cart_items WHERE id = ?", id);
      res.json({ message: "Updated qty", item: updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update qty" });
    }
  });

  // POST /api/checkout -> { customerName, customerEmail }
  // uses current cart, calculates total, creates receipt, clears cart
  app.post("/api/checkout", async (req, res) => {
    try {
      const { customerName, customerEmail } = req.body;
      if (!customerName || !customerEmail) {
        return res.status(400).json({ error: "customerName and customerEmail required" });
      }

      const items = await db.all(`
        SELECT c.id, c.productId, c.qty, p.name, p.price
        FROM cart_items c
        LEFT JOIN products p ON p.id = c.productId
      `);

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      let total = 0;
      const receiptItems = items.map(i => {
        const subtotal = (i.price || 0) * i.qty;
        total += subtotal;
        return { name: i.name, price: i.price, qty: i.qty, subtotal };
      });

      const id = uuidv4();
      const createdAt = new Date().toISOString();
      await db.run(
        "INSERT INTO receipts (id, customerName, customerEmail, total, createdAt, items) VALUES (?,?,?,?,?,?)",
        id,
        customerName,
        customerEmail,
        total,
        createdAt,
        JSON.stringify(receiptItems)
      );

      // Clear cart
      await db.run("DELETE FROM cart_items");

      const receipt = { id, customerName, customerEmail, total, createdAt, items: receiptItems };
      res.json({ message: "Checkout success", receipt });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Checkout failed" });
    }
  });

  // Optional: GET /api/receipts
  app.get("/api/receipts", async (req, res) => {
    try {
      const rows = await db.all("SELECT * FROM receipts ORDER BY createdAt DESC");
      const receipts = rows.map(r => ({
        id: r.id,
        customerName: r.customerName,
        customerEmail: r.customerEmail,
        total: r.total,
        createdAt: r.createdAt,
        items: JSON.parse(r.items)
      }));
      res.json(receipts);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch receipts" });
    }
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
}

main().catch(err => {
  console.error("Failed to start server", err);
});
