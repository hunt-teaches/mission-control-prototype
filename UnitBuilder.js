const { useState, useEffect } = React;

const UnitBuilder = ({ teacherId, onBack }) => {
  const [skills, setSkills] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitName, setUnitName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState(new Set());
  const [filterTier, setFilterTier] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [previewSkills, setPreviewSkills] = useState([]);

  useEffect(() => {
    loadSkills();
    loadUnits();
  }, []);

  const loadSkills = async () => {
    const { data } = await supabaseClient
      .from("skills")
      .select("*");
    setSkills(data || []);
  };

  const loadUnits = async () => {
    const { data } = await supabaseClient
      .from("units")
      .select("*")
      .eq("teacher_id", teacherId);
    setUnits(data || []);
  };

  // -----------------------------------------
  // Recursive prerequisite closure
  // -----------------------------------------
  const buildSkillMap = () => {
    const map = {};
    skills.forEach(skill => {
      map[skill.ID] = {
        prereqs: skill.Prerequisites
          ? skill.Prerequisites.split(";").map(s => s.trim()).filter(Boolean)
          : [],
        tier: skill.Tier
      };
    });
    return map;
  };

  const computeClosure = () => {
    const map = buildSkillMap();
    const visited = new Set();

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      map[id]?.prereqs.forEach(p => visit(p));
    };

    selectedGoals.forEach(goal => visit(goal));

    return skills.filter(skill => visited.has(skill.ID));
  };

  useEffect(() => {
    if (selectedGoals.size === 0) {
      setPreviewSkills([]);
    } else {
      setPreviewSkills(computeClosure());
    }
  }, [selectedGoals, skills]);

  const toggleGoal = (skillId) => {
    const newSet = new Set(selectedGoals);
    if (newSet.has(skillId)) {
      newSet.delete(skillId);
    } else {
      newSet.add(skillId);
    }
    setSelectedGoals(newSet);
  };

  const saveUnit = async () => {
    if (!unitName || selectedGoals.size === 0) return;

    const { data } = await supabaseClient
      .from("units")
      .insert({
        name: unitName,
        teacher_id: teacherId
      })
      .select()
      .single();

    const unitId = data.id;

    const goalsToInsert = Array.from(selectedGoals).map(skillId => ({
      unit_id: unitId,
      skill_id: skillId
    }));

    await supabaseClient.from("unit_goals").insert(goalsToInsert);

    alert("Unit saved.");
    setUnitName("");
    setSelectedGoals(new Set());
    setPreviewSkills([]);
    loadUnits();
  };

  const filteredSkills = skills.filter(skill => {
    return (
      (filterTier === "" || skill.Tier === filterTier) &&
      (filterDomain === "" || skill.Domain === filterDomain)
    );
  });

  const tiers = [...new Set(skills.map(s => s.Tier))];
  const domains = [...new Set(skills.map(s => s.Domain))];

  return (
    <div style={{ padding: "30px" }}>
      <button onClick={onBack}>← Back</button>

      <h2>Create Unit</h2>

      <input
        type="text"
        placeholder="Unit Name"
        value={unitName}
        onChange={e => setUnitName(e.target.value)}
        style={{ padding: "8px", marginBottom: "15px", width: "300px" }}
      />

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="">All Tiers</option>
          {tiers.map(t => <option key={t}>{t}</option>)}
        </select>

        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
          <option value="">All Domains</option>
          {domains.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ddd", padding: "10px" }}>
        {filteredSkills.map(skill => (
          <div key={skill.ID}>
            <input
              type="checkbox"
              checked={selectedGoals.has(skill.ID)}
              onChange={() => toggleGoal(skill.ID)}
            />
            {skill["Skill Name"]}
          </div>
        ))}
      </div>

      <button onClick={saveUnit} style={{ marginTop: "10px" }}>
        Save Unit
      </button>

      <h3 style={{ marginTop: "30px" }}>
        Preview ({previewSkills.length} skills)
      </h3>

      <StandardsGrid
        studentId="User123"
        tableName="skills"
        totalCols={15}
        customSkills={previewSkills}
      />

      <h3 style={{ marginTop: "30px" }}>Existing Units</h3>
      {units.map(unit => (
        <div key={unit.id}>{unit.name}</div>
      ))}
    </div>
  );
};