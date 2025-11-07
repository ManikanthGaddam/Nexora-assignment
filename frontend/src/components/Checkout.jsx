import React, { useState } from "react";

export default function Checkout() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [receipt, setReceipt] = useState(null);

  function submitCheckout() {
    fetch("http://localhost:4000/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: name, customerEmail: email })
    })
      .then(res => res.json())
      .then(data => {
        if (data.receipt) setReceipt(data.receipt);
        else alert(data.error || "Checkout failed");
      });
  }

  return (
    <div>
      <h2>Checkout</h2>

      <input
        type="text"
        placeholder="Full Name"
        onChange={e => setName(e.target.value)}
      /><br/>

      <input
        type="email"
        placeholder="Email"
        onChange={e => setEmail(e.target.value)}
      /><br/>

      <button onClick={submitCheckout}>Submit</button>

      {receipt && (
        <div className="modal">
          <h3>Receipt ✅</h3>
          <p>{receipt.customerName}</p>
          <p>{receipt.customerEmail}</p>
          <p>Total: ₹{receipt.total}</p>
        </div>
      )}
    </div>
  );
}
