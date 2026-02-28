const { useState } = React;

const Dashboard = ({ onLaunchScreener }) => {
  const [view, setView] = useState("facts");

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, padding: "30px" }}>
        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
        >
          <option value="facts">Math Facts</option>
          <option value="standards">K-8 Standards</option>
          <option value="ratio6">Grade 6 Ratios</option>
        </select>

        <div style={{ marginTop: "20px" }}>
          {view === "facts" && <MathFactsGrid />}
          {view === "standards" && (
            <StandardsGrid
              studentId="User123"
              tableName="skills"
              totalCols={20}
            />
          )}
          {view === "ratio6" && (
            <StandardsGrid
              studentId="User123"
              tableName="ratio_skills6"
              totalCols={15}
            />
          )}
        </div>
      </div>

      <div style={{ width: "300px", padding: "40px" }}>
        <h3>Mission Control Apps</h3>

        <button
          onClick={onLaunchScreener}
          style={{ marginTop: "20px", padding: "15px" }}
        >
          🚀 Adaptive Screener
        </button>
      </div>
    </div>
  );
};

const MathFactsGrid = () => {
  const facts = Array.from({ length: 144 }, (_, i) => i + 1);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)" }}>
      {facts.map((val) => (
        <div key={val}>{val}</div>
      ))}
    </div>
  );
};