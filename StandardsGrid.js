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

  useEffect(() => {
    fetchData();
  }, [studentId, tableName]);

  const fetchData = async () => {
    setLoading(true);

    const { data: skillsData, error: skillsError } =
      await supabaseClient.from(tableName).select("*");

    if (skillsError) {
      console.error(skillsError);
      return;
    }

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

  // ---------------------------------------------------
  // Use customSkills if provided (for Unit Builder preview)
  // ---------------------------------------------------

  const baseSkills = customSkills || skills;

  if (!baseSkills || baseSkills.length === 0) {
    return <div style={{ padding: "20px" }}>No skills selected.</div>;
  }

  // ---------------------------------------------------
  // 1. Sort internally by tier (hidden structure)
  // ---------------------------------------------------

  const sortedSkills = [...baseSkills].sort((a, b) => {
    const tierA = parseInt(a.Tier.replace("T", ""));
    const tierB = parseInt(b.Tier.replace("T", ""));
    return tierA - tierB;
  });

  // ---------------------------------------------------
  // 2. Pack into full rows (no mid-grid gaps)
  // ---------------------------------------------------

  const totalSkills = sortedSkills.length;
  const fullRows = Math.floor(totalSkills / totalCols);
  const remainder = totalSkills % totalCols;
  const totalRows = remainder === 0 ? fullRows : fullRows + 1;

  const grid = [];
  let skillIndex = 0;

  for (let row = 0; row < totalRows; row++) {
    const rowArray = [];

    if (row === totalRows - 1 && remainder !== 0) {
      // Top row — center remaining skills
      const emptyLeft = Math.floor((totalCols - remainder) / 2);
      const emptyRight = totalCols - remainder - emptyLeft;

      for (let i = 0; i < emptyLeft; i++) {
        rowArray.push(null);
      }

      for (let i = 0; i < remainder; i++) {
        rowArray.push(sortedSkills[skillIndex++] || null);
      }

      for (let i = 0; i < emptyRight; i++) {
        rowArray.push(null);
      }
    } else {
      // Full row
      for (let col = 0; col < totalCols; col++) {
        rowArray.push(sortedSkills[skillIndex++] || null);
      }
    }

    grid.push(rowArray);
  }

  // Reverse so visually bottom row contains lowest tier
  grid.reverse();

  return (
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
          if (!skill) {
            return <div key={index} />;
          }

          const status = mastery[skill.ID] || "locked";

          return (
            <div
              key={index}
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
                cursor: "default"
              }}
              title={skill["Skill Name"]}
            />
          );
        })}
      </div>
    </div>
  );
};