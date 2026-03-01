const { useState, useEffect } = React;

const UnitBuilder = ({ teacherId, onBack }) => {
  const [skills, setSkills] = useState([]);
  const [units, setUnits] = useState([]);

  const [unitName, setUnitName] = useState("");
  const [selectedGoals, setSelectedGoals] = useState(new Set());
  const [previewSkills, setPreviewSkills] = useState([]);

  const [filterTier, setFilterTier] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [editingUnitId, setEditingUnitId] = useState(null);
  const [collapsedTiers, setCollapsedTiers] = useState(new Set());

  const [skillToRemove, setSkillToRemove] = useState(null);

  useEffect(() => {
    loadSkills();
    loadUnits();
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

  const confirmRemove = () => {
    if (!skillToRemove) return;

    const newSet = new Set(selectedGoals);
    newSet.delete(skillToRemove.ID);
    setSelectedGoals(newSet);
    setSkillToRemove(null);
  };

  const cancelRemove = () => {
    setSkillToRemove(null);
  };

  const filteredSkills = skills.filter(skill =>
    (filterTier === "" || skill.Tier === filterTier) &&
    (filterDomain === "" || skill.Domain === filterDomain) &&
    skill["Skill Name"].toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allTiers = [...new Set(skills.map(s => s.Tier))];
  const domains = [...new Set(skills.map(s => s.Domain))];

  const tiers = [...new Set(previewSkills.map(s => s.Tier))]
    .sort((a, b) => parseInt(b.replace("T", "")) - parseInt(a.replace("T", "")));

  return (
    <div style={{ padding: "30px" }}>
      <button onClick={onBack}>← Back</button>

      <h2>Create / Edit Unit</h2>

      <input
        type="text"
        placeholder="Unit Name"
        value={unitName}
        onChange={e => setUnitName(e.target.value)}
        style={{ padding: "8px", marginBottom: "15px", width: "300px" }}
      />

      {/* SEARCH + FILTERS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Search skills..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ padding: "6px", width: "200px" }}
        />

        <select value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="">All Tiers</option>
          {allTiers.map(t => <option key={t}>{t}</option>)}
        </select>

        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
          <option value="">All Domains</option>
          {domains.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* CHECKBOX LIST */}
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
            const skillsInTier = previewSkills.filter(s => s.Tier === tier);
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
                  {isCollapsed ? "▶" : "▼"} Tier {tier.replace("T", "")} ({skillsInTier.length} skills)
                </h4>

                {!isCollapsed &&
                  skillsInTier.map(skill => (
                    <div
                      key={skill.ID}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
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
                          title="Remove skill"
                          onClick={() => setSkillToRemove(skill)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "red",
                            fontWeight: "bold",
                            fontSize: "16px",
                            cursor: "pointer"
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {skillToRemove && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            width: "400px"
          }}>
            <p>
              Are you sure you want to remove: <strong>{skillToRemove["Skill Name"]}</strong>?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={cancelRemove}>Cancel</button>
              <button
                onClick={confirmRemove}
                style={{ backgroundColor: "red", color: "white" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};