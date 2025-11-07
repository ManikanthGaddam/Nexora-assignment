# VibeCommerce – Full Stack E-Com Cart (Assignment)

A simple full-stack e-commerce mock cart application built for the Nexora/Vibe Commerce assignment.

✅ React (Frontend)  
✅ Node.js + Express (Backend)  
✅ SQLite (Local DB)  
✅ REST APIs for Products, Cart & Checkout  

---

## ✅ Features

| Feature | Description |
|---------|-------------|
| Products Page | Shows list of items with Add to Cart |
| Cart Page | View items, quantities, totals, remove/update |
| Checkout | Enter name/email → generates receipt |
| Receipts | Stores checkout history in DB |
| Database | SQLite file auto-created on backend start |

---

## ✅ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite (`vibecommerce.db`) |

---

## ✅ How to Run the Project

### ✅ 1. Clone Repository
```sh
git clone https://github.com/ManikanthGaddam/Nexora-assignment.git
cd Nexora-assignment

✅ 2. Backend Setup
cd backend
npm install
npm run dev


✅ Runs on: http://localhost:4000

✅ DB file auto-created: backend/vibecommerce.db

✅ 3. Frontend Setup
cd ../frontend
npm install
npm run dev


✅ Runs on: http://localhost:5173

✅ REST API Endpoints
Method	Endpoint	Purpose
GET	/api/products	Get all products
GET	/api/cart	Get cart items + total
POST	/api/cart	Add { productId, qty }
PUT	/api/cart/:id	Update quantity
DELETE	/api/cart/:id	Remove item
POST	/api/checkout	Save receipt + clear cart
GET	/api/receipts	View checkout history


✅ Author - Manikanth Gaddam