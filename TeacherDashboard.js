const { useState, useEffect } = React;

const TeacherDashboard = ({ onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const [filterTier, setFilterTier] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterSkill, setFilterSkill] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log("=== LOADING DATA ===");

    const { data: skillsData, error: skillsError } =
      await supabaseClient
        .from("skills")
        .select("*")
        .range(0, 10000);

    const { data: questionData, error: questionError } =
      await supabaseClient
        .from("questions")
        .select("*")
        .range(0, 10000);

    if (skillsError) console.log("Skills error:", skillsError);
    if (questionError) console.log("Questions error:", questionError);

    console.log("Skills returned:", skillsData?.length);
    console.log("Questions returned:", questionData?.length);

    // Build quick skill lookup
    const skillMap = {};
    skillsData.forEach(s => {
      skillMap[s.ID] = s;
    });

    // Count questions by tier
    const tierCounts = {};
    questionData.forEach(q => {
      const skill = skillMap[q.skill_id];
      if (skill) {
        tierCounts[skill.Tier] =
          (tierCounts[skill.Tier] || 0) + 1;
      } else {
        console.log("Unmatched skill_id:", q.skill_id);
      }
    });

    console.log("Question count by Tier:", tierCounts);

    // Specifically log T3+
    const highTierQuestions = questionData.filter(q => {
      const skill = skillMap[q.skill_id];
      if (!skill) return false;
      const tierNumber = parseInt(skill.Tier.replace("T", ""));
      return tierNumber >= 3;
    });

    console.log("T3+ questions found:", highTierQuestions.length);

    setSkills(skillsData || []);
    setQuestions(questionData || []);
  };

  const getSkillMeta = (skillId) => {
    return skills.find(s => s.ID === skillId);
  };

  const sortedQuestions = [...questions].sort((a, b) => {
    const skillA = getSkillMeta(a.skill_id);
    const skillB = getSkillMeta(b.skill_id);

    if (!skillA || !skillB) return 0;

    const tierA = parseInt(skillA.Tier.replace("T", ""));
    const tierB = parseInt(skillB.Tier.replace("T", ""));

    if (tierA !== tierB) return tierA - tierB;

    return a.question_id.localeCompare(b.question_id);
  });

  const filteredQuestions = sortedQuestions.filter(q => {
    const skill = getSkillMeta(q.skill_id);
    if (!skill) return false;

    return (
      (filterTier === "" || skill.Tier === filterTier) &&
      (filterDomain === "" || skill.Domain === filterDomain) &&
      (filterSkill === "" || skill.ID === filterSkill)
    );
  });

  console.log("Filtered questions currently visible:", filteredQuestions.length);

  const tiers = [...new Set(skills.map(s => s.Tier))].sort();
  const domains = [...new Set(skills.map(s => s.Domain))];

  const skillOptions = skills.filter(s =>
    (filterTier === "" || s.Tier === filterTier) &&
    (filterDomain === "" || s.Domain === filterDomain)
  );

  return (
    <div style={{ padding: "30px" }}>
      <button onClick={onBack}>← Back to Student View</button>

      <h2>Question Bank (DEBUG MODE)</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="">All Tiers</option>
          {tiers.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
          <option value="">All Domains</option>
          {domains.map(d => <option key={d}>{d}</option>)}
        </select>

        <select value={filterSkill} onChange={e => setFilterSkill(e.target.value)}>
          <option value="">All Skills</option>
          {skillOptions.map(s => (
            <option key={s.ID} value={s.ID}>
              {s["Skill Name"]}
            </option>
          ))}
        </select>
      </div>

      <div style={{
        maxHeight: "500px",
        overflowY: "auto",
        border: "1px solid #ccc",
        padding: "10px"
      }}>
        {filteredQuestions.map(q => {
          const skill = getSkillMeta(q.skill_id);
          return (
            <div
              key={q.question_id}
              onClick={() => setSelectedQuestion(q)}
              style={{
                padding: "6px",
                cursor: "pointer",
                borderBottom: "1px solid #eee"
              }}
            >
              {skill?.Tier} — {q.question_id}
            </div>
          );
        })}
      </div>
    </div>
  );
};