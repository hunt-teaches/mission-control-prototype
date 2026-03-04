const { useState, useEffect } = React;

const StandardsGrid = ({
  studentId,
  tableName = "skills",
  totalCols = 15,
  customSkills = null
}) => {
  const [skills, setSkills] = useState([]);
  const [mastery, setMastery] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedSkill, setSelectedSkill] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    fetchData();
  }, [studentId, tableName]);

  const fetchData = async () => {
    setLoading(true);

    const { data: skillsData } =
      await supabaseClient.from(tableName).select("*");

    const { data: masteryData } =
      await supabaseClient
        .from("student_mastery")
        .select("skill_id, status")
        .eq("student_id", studentId);

    const masteryMap = {};
    masteryData?.forEach(m => {
      masteryMap[m.skill_id] = m.status;
    });

    setSkills(skillsData || []);
    setMastery(masteryMap);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: "30px" }}>Loading...</div>;

  const baseSkills = customSkills || skills;

  if (!baseSkills || baseSkills.length === 0)
    return <div style={{ padding: "20px" }}>No skills selected.</div>;

  const sortedSkills = [...baseSkills].sort((a, b) =>
    parseInt(a.Tier.replace("T", "")) -
    parseInt(b.Tier.replace("T", ""))
  );

  const totalSkills = sortedSkills.length;
  const rows = Math.ceil(totalSkills / totalCols);

  const grid = [];
  let skillIndex = 0;

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < totalCols; c++) {
      row.push(sortedSkills[skillIndex++] || null);
    }
    grid.push(row);
  }

  grid.reverse();

  return (
    <>
      <div style={{
        background: "#0d0f14",
        padding: "20px",
        borderRadius: "12px"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
          gap: "6px"
        }}>
          {grid.flat().map((skill, index) => {
            if (!skill) return <div key={index} />;

            const status = mastery[skill.ID] || "locked";

            return (
              <div
                key={index}
                onClick={() => {
                  setSelectedSkill(skill);
                  setActiveTab(null);
                }}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: "6px",
                  backgroundColor:
                    status === "mastered" ? "#22c55e" : "#1e2129",
                  border:
                    status === "mastered"
                      ? "none"
                      : "1px solid #2a2f3a",
                  cursor: "pointer"
                }}
                title={skill["Skill Name"]}
              />
            );
          })}
        </div>
      </div>

      {selectedSkill && (
        <SkillModal
          skill={selectedSkill}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setSelectedSkill(null)}
        />
      )}
    </>
  );
};

/* ============================= */
/*           MODAL               */
/* ============================= */

const SkillModal = ({
  skill,
  activeTab,
  setActiveTab,
  onClose
}) => {
  const [tutorial, setTutorial] = useState(null);
  const [loadingTutorial, setLoadingTutorial] = useState(false);

  useEffect(() => {
    if (activeTab === "read") fetchTutorial();
  }, [activeTab]);

  const fetchTutorial = async () => {
    setLoadingTutorial(true);

    const { data } = await supabaseClient
      .from("written_tutorials")
      .select("content")
      .eq("skill_id", skill.ID)
      .single();

    if (data?.content) {
      try {
        setTutorial(JSON.parse(data.content));
      } catch {
        setTutorial({ raw: data.content });
      }
    } else {
      setTutorial(null);
    }

    setLoadingTutorial(false);
  };

  const renderTutorial = () => {
    if (!tutorial) return <p>No tutorial found.</p>;

    if (tutorial.raw) {
      return <div>{tutorial.raw}</div>;
    }

    return (
      <div style={{ lineHeight: "1.6" }}>
        {/* Explanation */}
        {tutorial.explanation && (
          <>
            <h3>Explanation</h3>
            <p>{tutorial.explanation}</p>
          </>
        )}

        {/* Worked Example */}
        {tutorial.worked_example && (
          <>
            <h3 style={{ marginTop: "30px" }}>
              Worked Example
            </h3>

            <p>
              <strong>Problem:</strong>{" "}
              {tutorial.worked_example.problem}
            </p>

            <ol style={{ marginTop: "15px" }}>
              {tutorial.worked_example.steps?.map(
                (step, index) => (
                  <li key={index} style={{ marginBottom: "10px" }}>
                    {step}
                  </li>
                )
              )}
            </ol>
          </>
        )}

        {/* Tip */}
        {tutorial.tip && (
          <>
            <h3 style={{ marginTop: "30px" }}>Tip</h3>
            <div style={{
              background: "#f3f4f6",
              padding: "15px",
              borderRadius: "8px"
            }}>
              {tutorial.tip}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        width: "85%",
        height: "80%",
        background: "white",
        display: "flex",
        borderRadius: "12px",
        overflow: "hidden"
      }}>
        {/* LEFT SIDE */}
        <div style={{
          width: "40%",
          padding: "40px",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            <h2>{skill.ID}</h2>
            <h3>{skill["Skill Name"]}</h3>
            <p style={{ marginTop: "20px" }}>
              {skill["The Goal"]}
            </p>
          </div>

          <div>
            <div style={{ display: "flex", gap: "15px" }}>
              <ActionButton
                label="Read"
                onClick={() => setActiveTab("read")}
              />
              <ActionButton label="Watch" />
              <ActionButton label="Practice" />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div style={{
          flex: 1,
          padding: "40px",
          position: "relative",
          overflowY: "auto"
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              border: "none",
              background: "none",
              cursor: "pointer"
            }}
          >
            ✕
          </button>

          {!activeTab && (
            <p>Select an option to begin.</p>
          )}

          {activeTab === "read" && (
            <>
              <h2>Written Lesson</h2>
              {loadingTutorial ? (
                <p>Loading tutorial...</p>
              ) : (
                renderTutorial()
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "15px 25px",
      borderRadius: "12px",
      border: "1px solid #ccc",
      background: "#f3f4f6",
      cursor: "pointer",
      fontSize: "16px"
    }}
  >
    {label}
  </button>
);