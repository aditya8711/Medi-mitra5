import React, { useEffect, useState } from "react";

// Dummy data for demonstration; replace with API call for real data
const dummyStock = [
  { name: "Paracetamol", quantity: 20 },
  { name: "Amoxicillin", quantity: 0 },
  { name: "Ibuprofen", quantity: 5 },
];

export default function LiveMedicineStock() {
  const [stock, setStock] = useState([]);

  useEffect(() => {
    // Replace with API call to fetch live stock
    setStock(dummyStock);
  }, []);

  return (
    <div className="simple-card" style={{ maxWidth: 600, margin: '0 auto', marginTop: 32 }}>
      <h3 style={{ color: '#00ffd0', marginBottom: 16 }}>Live Medicine Stock</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#10181f', borderRadius: 8, overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#0a233a' }}>
            <th style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', fontWeight: 'bold' }}>Medicine Name</th>
            <th style={{ border: '1px solid #00ffd0', padding: '10px', color: '#00ffd0', fontWeight: 'bold' }}>Availability</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((med, idx) => (
            <tr key={idx} style={{ background: med.quantity === 0 ? '#2a2a2a' : idx % 2 === 0 ? '#18232e' : 'transparent' }}>
              <td style={{ border: '1px solid #00ffd0', padding: '10px', color: '#fff' }}>{med.name}</td>
              <td style={{ border: '1px solid #00ffd0', padding: '10px', color: med.quantity === 0 ? 'red' : 'limegreen', fontWeight: 'bold' }}>
                {med.quantity > 0 ? `${med.quantity} available` : 'Out of stock'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
