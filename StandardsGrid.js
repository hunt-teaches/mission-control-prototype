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

  if (loading) {
    return <div style={{ padding: "30px" }}>Loading...</div>;
  }

  const baseSkills = customSkills || skills;

  if (!baseSkills || baseSkills.length === 0) {
    return <div style={{ padding: "20px" }}>No skills selected.</div>;
  }

  const sortedSkills = [...baseSkills].sort((a, b) => {
    const tierA = parseInt(a.Tier.replace("T", ""));
    const tierB = parseInt(b.Tier.replace("T", ""));
    return tierA - tierB;
  });

  const totalSkills = sortedSkills.length;
  const fullRows = Math.floor(totalSkills / totalCols);
  const remainder = totalSkills % totalCols;
  const totalRows = remainder === 0 ? fullRows : fullRows + 1;

  const grid = [];
  let skillIndex = 0;

  for (let row = 0; row < totalRows; row++) {
    const rowArray = [];

    for (let col = 0; col < totalCols; col++) {
      rowArray.push(sortedSkills[skillIndex++] || null);
    }

    grid.push(rowArray);
  }

  grid.reverse();

  return (
    <>
      {/* GRID */}
      <div
        style={{
          background: "#0d0f14",
          padding: "20px",
          borderRadius: "12px"
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
            gap: "6px"
          }}
        >
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
                    status === "mastered"
                      ? "#22c55e"
                      : "#1e2129",
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

      {/* MODAL */}
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
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
      }}
    >
      <div
        style={{
          width: "85%",
          height: "80%",
          background: "white",
          display: "flex",
          borderRadius: "12px",
          overflow: "hidden"
        }}
      >
        {/* LEFT SIDE */}
        <div
          style={{
            width: "40%",
            padding: "40px",
            borderRight: "1px solid #ddd",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <h2>{skill.ID}</h2>
            <h3>{skill["Skill Name"]}</h3>
            <p style={{ marginTop: "20px" }}>
              {skill["The Goal"]}
            </p>
          </div>

          <div>
            <p style={{ marginBottom: "20px" }}>
              Choose an option...
            </p>

            <div style={{ display: "flex", gap: "15px" }}>
              <ActionButton
                label="Read"
                onClick={() => setActiveTab("read")}
              />
              <ActionButton
                label="Watch"
                onClick={() => setActiveTab("watch")}
              />
              <ActionButton
                label="Practice"
                onClick={() => setActiveTab("practice")}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div
          style={{
            flex: 1,
            padding: "40px",
            position: "relative"
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              fontSize: "18px",
              border: "none",
              background: "none",
              cursor: "pointer"
            }}
          >
            ✕
          </button>

          {!activeTab && (
            <div>
              <h2>Skill Overview</h2>
              <p>
                (Default image or concept prompt could go here)
              </p>
            </div>
          )}

          {activeTab === "read" && (
            <div>
              <h2>Written Lesson</h2>
              <p>Lesson content goes here.</p>
            </div>
          )}

          {activeTab === "watch" && (
            <div>
              <h2>Video Lesson</h2>
              <p>Embedded video goes here.</p>
            </div>
          )}

          {activeTab === "practice" && (
            <div>
              <h2>Practice Problems</h2>
              <p>Practice engine goes here.</p>
            </div>
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