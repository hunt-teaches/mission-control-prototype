const { useState, useEffect } = React;

const Dashboard = ({
  onLaunchGlobalScreener,
  onLaunchUnitScreener
}) => {
  const studentId = "User123";
  const teacherId = "Teacher1";

  const [availableGrids, setAvailableGrids] = useState([]);
  const [selectedGrid, setSelectedGrid] = useState(null);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    loadSkills();
    loadGrids();
  }, []);

  const loadSkills = async () => {
    const { data } = await supabaseClient.from("skills").select("*");
    setSkills(data || []);
  };

  const loadGrids = async () => {
    const grids = [];

    const { data: settings } = await supabaseClient
      .from("teacher_settings")
      .select("*")
      .eq("teacher_id", teacherId)
      .single();

    if (settings?.show_global_grid) {
      grids.push({
        type: "global",
        name: "Global Grid",
        is_default: settings.global_is_default
      });
    }

    const { data: units } = await supabaseClient
      .from("units")
      .select("*")
      .eq("visible_to_students", true);

    units?.forEach(unit => {
      grids.push({
        type: "unit",
        id: unit.id,
        name: unit.name,
        is_default: unit.is_default
      });
    });

    setAvailableGrids(grids);

    const defaultGrid =
      grids.find(g => g.is_default) || grids[0];

    setSelectedGrid(defaultGrid);
  };

  const launchScreener = () => {
    if (!selectedGrid) return;

    if (selectedGrid.type === "unit") {
      onLaunchUnitScreener(selectedGrid.id);
    } else {
      onLaunchGlobalScreener();
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        height: "100vh",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          display: "flex",
          height: "100%",
          gap: "30px"
        }}
      >
        {/* ================= LEFT PANEL ================= */}
        <div
          style={{
            flex: 1.4,
            border: "2px solid #ccc",
            padding: "20px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Grid Selector */}
          {availableGrids.length > 0 && (
            <select
              value={selectedGrid?.name}
              onChange={(e) => {
                const grid = availableGrids.find(
                  g => g.name === e.target.value
                );
                setSelectedGrid(grid);
              }}
              style={{
                padding: "10px",
                fontSize: "16px",
                marginBottom: "20px",
                width: "250px"
              }}
            >
              {availableGrids.map(g => (
                <option key={g.name}>{g.name}</option>
              ))}
            </select>
          )}

          {/* Mastery Grid */}
          <div style={{ flex: 1 }}>
            <StandardsGrid
              studentId={studentId}
              customSkills={skills}
              totalCols={15}
            />
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <h1 style={{ marginBottom: "30px" }}>
            Choice Board
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "25px"
            }}
          >
            {/* Screener Tile */}
            <ChoiceTile
              title="Screener"
              onClick={launchScreener}
            />

            {/* Placeholder Tiles */}
            <ChoiceTile title="Other App Coming Soon" />
            <ChoiceTile title="Other App Coming Soon" />
            <ChoiceTile title="Other App Coming Soon" />
            <ChoiceTile title="Other App Coming Soon" />
            <ChoiceTile title="Other App Coming Soon" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= TILE COMPONENT ================= */

const ChoiceTile = ({ title, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#b8c6d4",
        borderRadius: "20px",
        padding: "40px 20px",
        textAlign: "center",
        fontSize: "20px",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        transition: "0.2s",
      }}
      onMouseEnter={e => {
        if (onClick) e.currentTarget.style.transform = "scale(1.03)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {title}
    </div>
  );
};