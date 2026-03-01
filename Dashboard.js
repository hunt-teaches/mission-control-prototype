const { useState, useEffect } = React;

const Dashboard = ({ onLaunchScreener, onLaunchUnitBuilder }) => {
  const studentId = "User123";

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
    const { data } = await supabaseClient
      .from("units")
      .select("*")
      .eq("visible_to_students", true);

    const grids = [];

    grids.push({
      type: "global",
      name: "Global Grid"
    });

    data?.forEach(unit => {
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

  const buildSkillMap = () => {
    const map = {};
    skills.forEach(skill => {
      map[skill.ID] = {
        prereqs: skill.Prerequisites
          ? skill.Prerequisites.split(";").map(s => s.trim()).filter(Boolean)
          : []
      };
    });
    return map;
  };

  const computeCoreSet = async (unitId) => {
    const { data } = await supabaseClient
      .from("unit_goals")
      .select("*")
      .eq("unit_id", unitId);

    const goalIds = data.map(g => g.skill_id);

    const map = buildSkillMap();
    const visited = new Set();

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      map[id]?.prereqs.forEach(p => visit(p));
    };

    goalIds.forEach(goal => visit(goal));

    return skills.filter(skill => visited.has(skill.ID));
  };

  const computeExtensionSet = (coreSet) => {
    const coreIds = new Set(coreSet.map(s => s.ID));
    const extension = [];

    skills.forEach(skill => {
      if (coreIds.has(skill.ID)) return;

      const prereqs = skill.Prerequisites
        ? skill.Prerequisites.split(";").map(s => s.trim())
        : [];

      if (prereqs.some(p => coreIds.has(p))) {
        extension.push(skill);
      }
    });

    return extension;
  };

  const [coreSkills, setCoreSkills] = useState([]);
  const [extensionSkills, setExtensionSkills] = useState([]);

  useEffect(() => {
    if (!selectedGrid) return;

    if (selectedGrid.type === "global") {
      setCoreSkills(skills);
      setExtensionSkills([]);
    }

    if (selectedGrid.type === "unit") {
      computeCoreSet(selectedGrid.id).then(core => {
        setCoreSkills(core);
        setExtensionSkills(computeExtensionSet(core));
      });
    }
  }, [selectedGrid, skills]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, padding: "30px" }}>
        <select
          value={selectedGrid?.name}
          onChange={(e) => {
            const grid = availableGrids.find(g => g.name === e.target.value);
            setSelectedGrid(grid);
          }}
        >
          {availableGrids.map(g => (
            <option key={g.name}>{g.name}</option>
          ))}
        </select>

        <div style={{ marginTop: "20px" }}>
          {extensionSkills.length > 0 && (
            <>
              <h4>Extension Zone</h4>
              <StandardsGrid
                studentId={studentId}
                customSkills={extensionSkills}
                totalCols={15}
              />
            </>
          )}

          <h4>Core Skills</h4>
          <StandardsGrid
            studentId={studentId}
            customSkills={coreSkills}
            totalCols={15}
          />
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

        <button
          onClick={onLaunchUnitBuilder}
          style={{ marginTop: "10px", padding: "15px" }}
        >
          🧩 Unit Builder
        </button>
      </div>
    </div>
  );
};