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
  const [masteryMap, setMasteryMap] = useState({});

  useEffect(() => {
    loadSkills();
    loadMastery();
    loadGrids();
  }, []);

  const loadSkills = async () => {
    const { data } = await supabaseClient.from("skills").select("*");
    setSkills(data || []);
  };

  const loadMastery = async () => {
    const { data } = await supabaseClient
      .from("student_mastery")
      .select("skill_id, status")
      .eq("student_id", studentId);

    const map = {};
    data?.forEach(row => {
      map[row.skill_id] = row.status;
    });

    setMasteryMap(map);
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

  return (
    <div style={{ padding: "30px" }}>
      {availableGrids.length > 0 && (
        <select
          value={selectedGrid?.name}
          onChange={(e) => {
            const grid = availableGrids.find(
              g => g.name === e.target.value
            );
            setSelectedGrid(grid);
          }}
        >
          {availableGrids.map(g => (
            <option key={g.name}>{g.name}</option>
          ))}
        </select>
      )}

      <div style={{ marginTop: "20px" }}>
        {selectedGrid?.type === "unit" && (
          <button
            onClick={() => onLaunchUnitScreener(selectedGrid.id)}
            style={{ marginBottom: "15px", padding: "10px 15px" }}
          >
            🚀 Start Unit Screener
          </button>
        )}

        {selectedGrid?.type === "global" && (
          <button
            onClick={onLaunchGlobalScreener}
            style={{ marginBottom: "15px", padding: "10px 15px" }}
          >
            🚀 Start Global Screener
          </button>
        )}

        <StandardsGrid
          studentId={studentId}
          customSkills={skills}
          totalCols={15}
        />
      </div>
    </div>
  );
};