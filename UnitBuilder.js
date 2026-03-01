const { useState, useEffect } = React;

const UnitBuilder = ({ teacherId, onBack }) => {
  const [skills, setSkills] = useState([]);
  const [units, setUnits] = useState([]);

  const [unitName, setUnitName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState(new Set());
  const [previewSkills, setPreviewSkills] = useState([]);

  const [filterTier, setFilterTier] = useState("");
  const [filterDomain, setFilterDomain] = useState("");

  const [editingUnitId, setEditingUnitId] = useState(null);

  const [collapsedTiers, setCollapsedTiers] = useState(new Set());

  const [showGlobal, setShowGlobal] = useState(true);
  const [globalIsDefault, setGlobalIsDefault] = useState(false);

  useEffect(() => {
    loadSkills();
    loadUnits();
    loadGlobalSettings();
  }, []);

  const loadSkills = async () => {
    const { data } = await supabaseClient.from("skills").select("*");
    setSkills(data || []);
  };

  const loadUnits = async () => {
    const { data } = await supabaseClient
      .from("units")
      .select("*")
      .eq("teacher_id", teacherId);

    setUnits(data || []);
  };

  const loadGlobalSettings = async () => {
    const { data } = await supabaseClient
      .from("teacher_settings")
      .select("*")
      .eq("teacher_id", teacherId)
      .single();

    if (data) {
      setShowGlobal(data.show_global_grid);
      setGlobalIsDefault(data.global_is_default);
    }
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

  const computeClosure = (goalSet) => {
    const map = buildSkillMap();
    const visited = new Set();

    const visit = (id) => {
      if (visited.has(id)) return;
      visited.add(id);
      map[id]?.prereqs.forEach(p => visit(p));
    };

    goalSet.forEach(goal => visit(goal));
    return skills.filter(skill => visited.has(skill.ID));
  };

  useEffect(() => {
    if (selectedGoals.size === 0) {
      setPreviewSkills([]);
      setCollapsedTiers(new Set());
    } else {
      const closure = computeClosure(selectedGoals);
      setPreviewSkills(closure);

      // Determine default expanded tiers (top 2 highest)
      const tierList = [...new Set(closure.map(s => s.Tier))]
        .sort((a, b) => parseInt(b.replace("T", "")) - parseInt(a.replace("T", "")));

      const collapsed = new Set(tierList.slice(2));
      setCollapsedTiers(collapsed);
    }
  }, [selectedGoals, skills]);

  const toggleGoal = (skillId) => {
    const newSet = new Set(selectedGoals);
    newSet.has(skillId) ? newSet.delete(skillId) : newSet.add(skillId);
    setSelectedGoals(newSet);
  };

  const removeGoal = (skillId) => {
    const newSet = new Set(selectedGoals);
    newSet.delete(skillId);
    setSelectedGoals(newSet);
  };

  const startEditUnit = async (unit) => {
    setEditingUnitId(unit.id);
    setUnitName(unit.name);

    const { data } = await supabaseClient
      .from("unit_goals")
      .select("skill_id")
      .eq("unit_id", unit.id);

    setSelectedGoals(new Set(data.map(d => d.skill_id)));
  };

  const saveUnit = async () => {
    if (!unitName || selectedGoals.size === 0) return;

    let unitId = editingUnitId;

    if (editingUnitId) {
      await supabaseClient
        .from("units")
        .update({ name: unitName })
        .eq("id", editingUnitId);

      await supabaseClient
        .from("unit_goals")
        .delete()
        .eq("unit_id", editingUnitId);
    } else {
      const { data } = await supabaseClient
        .from("units")
        .insert({
          name: unitName,
          teacher_id: teacherId,
          visible_to_students: true,
          is_default: false
        })
        .select()
        .single();

      unitId = data.id;
    }

    const goalsToInsert = Array.from(selectedGoals).map(skillId => ({
      unit_id: unitId,
      skill_id: skillId
    }));

    await supabaseClient.from("unit_goals").insert(goalsToInsert);

    alert(editingUnitId ? "Unit updated." : "Unit saved.");

    setEditingUnitId(null);
    setUnitName("");
    setSelectedGoals(new Set());
    setPreviewSkills([]);
    loadUnits();
  };

  const toggleVisibility = async (unit) => {
    await supabaseClient
      .from("units")
      .update({ visible_to_students: !unit.visible_to_students })
      .eq("id", unit.id);

    loadUnits();
  };

  const setDefaultUnit = async (unitId) => {
    await supabaseClient
      .from("units")
      .update({ is_default: false })
      .eq("teacher_id", teacherId);

    await supabaseClient
      .from("units")
      .update({ is_default: true })
      .eq("id", unitId);

    await supabaseClient
      .from("teacher_settings")
      .upsert({
        teacher_id: teacherId,
        show_global_grid: showGlobal,
        global_is_default: false
      });

    loadUnits();
    setGlobalIsDefault(false);
  };

  const toggleGlobalVisibility = async () => {
    await supabaseClient
      .from("teacher_settings")
      .upsert({
        teacher_id: teacherId,
        show_global_grid: !showGlobal,
        global_is_default: globalIsDefault
      });

    setShowGlobal(!showGlobal);
  };

  const setGlobalDefault = async () => {
    await supabaseClient
      .from("units")
      .update({ is_default: false })
      .eq("teacher_id", teacherId);

    await supabaseClient
      .from("teacher_settings")
      .upsert({
        teacher_id: teacherId,
        show_global_grid: showGlobal,
        global_is_default: true
      });

    setGlobalIsDefault(true);
    loadUnits();
  };

  const tiers = [...new Set(previewSkills.map(s => s.Tier))]
    .sort((a, b) => parseInt(b.replace("T", "")) - parseInt(a.replace("T", "")));

  return (
    <div style={{ padding: "30px" }}>
      <button onClick={onBack}>← Back</button>

      <h2>{editingUnitId ? "Edit Unit" : "Create Unit"}</h2>

      <input
        type="text"
        placeholder="Unit Name"
        value={unitName}
        onChange={e => setUnitName(e.target.value)}
        style={{ padding: "8px", marginBottom: "15px", width: "300px" }}
      />

      <button onClick={saveUnit}>
        {editingUnitId ? "Update Unit" : "Save Unit"}
      </button>

      <h3 style={{ marginTop: "30px" }}>Preview ({previewSkills.length} skills)</h3>

      <div style={{ display: "flex", gap: "30px", marginTop: "20px" }}>
        <div style={{ flex: 1 }}>
          <StandardsGrid
            studentId="User123"
            customSkills={previewSkills}
            totalCols={15}
          />
        </div>

        <div style={{ flex: 1, maxHeight: "600px", overflowY: "auto" }}>
          {tiers.map(tier => {
            const skillsInTier = previewSkills
              .filter(s => s.Tier === tier)
              .sort((a, b) => {
                const aGoal = selectedGoals.has(a.ID) ? 0 : 1;
                const bGoal = selectedGoals.has(b.ID) ? 0 : 1;
                if (aGoal !== bGoal) return aGoal - bGoal;
                return a["Skill Name"].localeCompare(b["Skill Name"]);
              });

            const totalCount = skillsInTier.length;
            const isCollapsed = collapsedTiers.has(tier);

            return (
              <div key={tier} style={{ marginBottom: "20px" }}>
                <h4
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    const newSet = new Set(collapsedTiers);
                    newSet.has(tier) ? newSet.delete(tier) : newSet.add(tier);
                    setCollapsedTiers(newSet);
                  }}
                >
                  {isCollapsed ? "▶" : "▼"} Tier {tier.replace("T", "")} ({totalCount} skills)
                </h4>

                {!isCollapsed &&
                  skillsInTier.map(skill => (
                    <div
                      key={skill.ID}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px"
                      }}
                    >
                      <div>
                        {selectedGoals.has(skill.ID) && "🎯 "}
                        <span style={{
                          fontWeight: selectedGoals.has(skill.ID) ? "bold" : "normal"
                        }}>
                          {skill["Skill Name"]}
                        </span>
                      </div>

                      {selectedGoals.has(skill.ID) && (
                        <button
                          onClick={() => removeGoal(skill.ID)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "red",
                            cursor: "pointer"
                          }}
                        >
                          remove
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      <h3 style={{ marginTop: "40px" }}>Existing Units</h3>

      {units.map(unit => (
        <div key={unit.id} style={{ marginBottom: "10px" }}>
          <strong>{unit.name}</strong>
          <div>
            <button onClick={() => startEditUnit(unit)}>Edit</button>
            <button onClick={() => toggleVisibility(unit)} style={{ marginLeft: "10px" }}>
              {unit.visible_to_students ? "Hide" : "Show"}
            </button>
            <button onClick={() => setDefaultUnit(unit.id)} style={{ marginLeft: "10px" }}>
              {unit.is_default ? "Default" : "Set Default"}
            </button>
          </div>
        </div>
      ))}

      <h3 style={{ marginTop: "40px" }}>Global Grid</h3>

      <button onClick={toggleGlobalVisibility}>
        {showGlobal ? "Hide Global Grid" : "Show Global Grid"}
      </button>

      <button onClick={setGlobalDefault} style={{ marginLeft: "10px" }}>
        {globalIsDefault ? "Default" : "Set As Default"}
      </button>
    </div>
  );
};