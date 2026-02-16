import React, { useState } from 'react';

const Dashboard = () => {
  // Generate 144 facts (1x1 to 12x12)
  const facts = Array.from({ length: 144 }, (_, i) => ({
    id: i,
    val: i + 1,
    status: 'gray', // gray, blue, yellow, green
  }));

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* LEFT HALF: Mastery Grid */}
      <div style={{ flex: 1, padding: '20px', borderRight: '2px solid #eee', backgroundColor: '#f9f9f9' }}>
        <h2>Mastery Grid</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '4px' }}>
          {facts.map((f) => (
            <div 
              key={f.id} 
              style={{ 
                aspectRatio: '1/1', 
                backgroundColor: '#ddd', // Placeholder for gray
                borderRadius: '4px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
              {f.val}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '20px' }}>
          <button>Math Facts</button>
          <button disabled style={{ marginLeft: '10px' }}>K-8 Standards (Soon)</button>
        </div>
      </div>

      {/* RIGHT HALF: App Icons */}
      <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <h2>Mission Control Apps</h2>
        <div style={appIconStyle}>
          <div style={iconBox}>🧮</div>
          <p>Math Mastery</p>
        </div>
        <div style={appIconStyle}>
          <div style={iconBox}>📝</div>
          <p>My Quiz App</p>
        </div>
      </div>
    </div>
  );
};

const appIconStyle = {
  cursor: 'pointer',
  textAlign: 'center',
  padding: '20px',
  border: '1px solid #ccc',
  borderRadius: '12px',
  width: '200px',
  transition: 'transform 0.2s'
};

const iconBox = {
  fontSize: '48px',
  marginBottom: '10px'
};

export default Dashboard;