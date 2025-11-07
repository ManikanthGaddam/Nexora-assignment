import React, { useEffect, useState } from "react";
import Products from "./components/Products";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import "./App.css";

function App() {
  const [view, setView] = useState("products"); // products | cart | checkout

  return (
    <div className="app">
      <header>
        <h1>Vibe Commerce 🛍️</h1>
        <nav>
          <button onClick={() => setView("products")}>Products</button>
          <button onClick={() => setView("cart")}>Cart</button>
          <button onClick={() => setView("checkout")}>Checkout</button>
        </nav>
      </header>

      {view === "products" && <Products />}
      {view === "cart" && <Cart />}
      {view === "checkout" && <Checkout />}
    </div>
  );
}

export default App;
