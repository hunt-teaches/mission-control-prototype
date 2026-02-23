const { useState } = React;

const Dashboard = (props) => {
  // This state tracks which grid to show on the left side
  const [view, setView] = useState('facts'); 

  return (
    <div style={containerStyle}>
      
      {/* LEFT HALF: The Mastery Section */}
      <div style={leftPanelStyle}>
        
        {/* The Toggle Switch */}
        <div style={toggleContainerStyle}>
          <button 
            style={view === 'facts' ? activeButtonStyle : buttonStyle} 
            onClick={() => setView('facts')}
          >
            Math Facts
          </button>
          <button 
            style={view === 'standards' ? activeButtonStyle : buttonStyle} 
            onClick={() => setView('standards')}
          >
            K-8 Standards
          </button>
        </div>

        {/* The Content: Either the 12x12 Grid OR the 665 Skills Map */}
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '20px' }}>
          {view === 'facts' ? (
            <MathFactsGrid />
          ) : (
            <StandardsGrid studentId="User123" />
          )}
        </div>

        {/* Progress Summary (from Section 4.3 of your PRD) */}
        <div style={summaryStyle}>
          <div style={statStyle}><strong>0/144</strong><br/>Facts Mastered</div>
          <div style={statStyle}><strong>1 Day</strong><br/>Streak</div>
          <div style={statStyle}><strong>7 x 8</strong><br/>Most Improved</div>
        </div>
      </div>

      {/* RIGHT HALF: App Icons */}
      <div style={rightPanelStyle}>
        <h2 style={{ marginBottom: '30px', color: '#333' }}>Mission Control Apps</h2>
        
        <div style={appIconStyle} onClick={props.onLaunchMath}>
          <div style={iconBoxStyle}>🧮</div>
          <h3>Math Mastery</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>Multiplication Practice</p>
        </div>

        <div style={appIconStyle} onClick={() => alert('Quiz App coming soon!')}>
          <div style={iconBoxStyle}>📝</div>
          <h3>My Quiz App</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>Solo Quiz Mode</p>
        </div>
      </div>

    </div>
  );
};

// --- SUB-COMPONENT: The 12x12 Math Facts Grid ---
const MathFactsGrid = () => {
  const facts = Array.from({ length: 144 }, (_, i) => i + 1);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px' }}>
      {facts.map((val) => (
        <div key={val} style={factSquareStyle}>{val}</div>
      ))}
    </div>
  );
};

// --- STYLES (The CSS) ---
const containerStyle = {
  display: 'flex',
  height: '100vh',
  fontFamily: "'DM Sans', sans-serif",
  backgroundColor: '#f4f7f6'
};

const leftPanelStyle = {
  flex: 1.2, // Left side is slightly wider
  display: 'flex',
  flexDirection: 'column',
  padding: '30px',
  backgroundColor: '#fff',
  borderRight: '1px solid #e0e0e0',
  boxShadow: '4px 0 10px rgba(0,0,0,0.02)'
};

const rightPanelStyle = {
  flex: 0.8,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px',
  gap: '20px'
};

const toggleContainerStyle = {
  display: 'flex',
  backgroundColor: '#f0f0f0',
  padding: '5px',
  borderRadius: '10px',
  width: 'fit-content'
};

const buttonStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  backgroundColor: 'transparent',
  fontWeight: '600',
  color: '#666'
};

const activeButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#fff',
  color: '#000',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
};

const appIconStyle = {
  width: '280px',
  padding: '25px',
  backgroundColor: '#fff',
  borderRadius: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  border: '1px solid #eee',
  transition: 'transform 0.2s, box-shadow 0.2s',
  boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
};

const iconBoxStyle = {
  fontSize: '50px',
  marginBottom: '10px'
};

const factSquareStyle = {
  aspectRatio: '1/1',
  backgroundColor: '#f9f9f9',
  border: '1px solid #eee',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  color: '#999'
};

const summaryStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #eee'
};

const statStyle = {
  textAlign: 'center',
  fontSize: '13px',
  color: '#444'
};