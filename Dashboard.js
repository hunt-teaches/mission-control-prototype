const { useState } = React;

const Dashboard = () => {
  const [view, setView] = useState('facts');

  return (
    <div style={containerStyle}>
      
      {/* LEFT SIDE */}
      <div style={leftPanelStyle}>
        
        {/* DROPDOWN SELECTOR */}
        <div style={{ marginBottom: '20px' }}>
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontWeight: '600'
            }}
          >
            <option value="facts">Math Facts</option>
            <option value="standards">K-8 Standards</option>
            <option value="ratio6">Grade 6 Ratios</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {view === 'facts' && <MathFactsGrid />}

          {view === 'standards' && (
            <StandardsGrid
              studentId="User123"
              tableName="skills"
              totalCols={20}
            />
          )}

          {view === 'ratio6' && (
            <StandardsGrid
              studentId="User123"
              tableName="ratio_skills6"
              totalCols={15}
            />
          )}
        </div>

        <div style={summaryStyle}>
          <div style={statStyle}><strong>0/144</strong><br/>Facts Mastered</div>
          <div style={statStyle}><strong>1 Day</strong><br/>Streak</div>
          <div style={statStyle}><strong>7 x 8</strong><br/>Most Improved</div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={rightPanelStyle}>
        <h2 style={{ marginBottom: '30px', color: '#333' }}>Mission Control Apps</h2>
        
        <div style={appIconStyle}>
          <div style={iconBoxStyle}>🧮</div>
          <h3>Math Mastery</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>Multiplication Practice</p>
        </div>

        <div style={appIconStyle}>
          <div style={iconBoxStyle}>📝</div>
          <h3>My Quiz App</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>Solo Quiz Mode</p>
        </div>
      </div>
    </div>
  );
};

/* Math Facts Grid */
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

/* STYLES */
const containerStyle = {
  display: 'flex',
  height: '100vh',
  fontFamily: "'DM Sans', sans-serif",
  backgroundColor: '#f4f7f6'
};

const leftPanelStyle = {
  flex: 1.2,
  display: 'flex',
  flexDirection: 'column',
  padding: '30px',
  backgroundColor: '#fff',
  borderRight: '1px solid #e0e0e0'
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

const appIconStyle = {
  width: '280px',
  padding: '25px',
  backgroundColor: '#fff',
  borderRadius: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  border: '1px solid #eee',
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