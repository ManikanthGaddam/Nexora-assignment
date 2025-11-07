import React, { useEffect, useState } from "react";

export default function Products() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4000/api/products")
      .then(res => res.json())
      .then(data => setItems(data));
  }, []);

  function addToCart(productId) {
    fetch("http://localhost:4000/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, qty: 1 })
    })
      .then(res => res.json())
      .then(() => alert("Added to cart!"));
  }

  return (
    <div className="grid">
      {items.map(p => (
        <div className="card" key={p.id}>
          <h3>{p.name}</h3>
          <p>₹{p.price}</p>
          <button onClick={() => addToCart(p.id)}>Add to Cart</button>
        </div>
      ))}
    </div>
  );
}
