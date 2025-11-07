import React, { useEffect, useState } from "react";

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });

  function loadCart() {
    fetch("http://localhost:4000/api/cart")
      .then(res => res.json())
      .then(data => setCart(data));
  }

  function removeItem(id) {
    fetch(`http://localhost:4000/api/cart/${id}`, { method: "DELETE" })
      .then(() => loadCart());
  }

  useEffect(() => {
    loadCart();
  }, []);

  return (
    <div>
      <h2>Your Cart</h2>
      {cart.items.map(i => (
        <div key={i.id} className="cart-row">
          <span>{i.name}</span>
          <span>Qty: {i.qty}</span>
          <span>₹{i.subtotal}</span>
          <button onClick={() => removeItem(i.id)}>Remove</button>
        </div>
      ))}
      <h3>Total: ₹{cart.total}</h3>
    </div>
  );
}
