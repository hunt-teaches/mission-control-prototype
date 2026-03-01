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
    const { data: skillsData } =
      await supabaseClient.from("skills").select("*");

    const { data: questionData } =
      await supabaseClient.from("questions").select("*");

    setSkills(skillsData || []);
    setQuestions(questionData || []);
  };

  const getSkillMeta = (skillId) => {
    return skills.find(s => s.ID === skillId);
  };

  const filteredQuestions = questions.filter(q => {
    const skill = getSkillMeta(q.skill_id);
    if (!skill) return false;

    return (
      (filterTier === "" || skill.Tier === filterTier) &&
      (filterDomain === "" || skill.Domain === filterDomain) &&
      (filterSkill === "" || skill.ID === filterSkill)
    );
  });

  const tiers = [...new Set(skills.map(s => s.Tier))];
  const domains = [...new Set(skills.map(s => s.Domain))];

  const skillOptions = skills.filter(s =>
    (filterTier === "" || s.Tier === filterTier) &&
    (filterDomain === "" || s.Domain === filterDomain)
  );

  return (
    <div style={{ padding: "30px" }}>
      <button onClick={onBack}>← Back to Student View</button>

      <h2>Question Bank</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)}>
          <option value="">All Tiers</option>
          {tiers.map(t => <option key={t}>{t}</option>)}
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

      <div style={{ display: "flex" }}>
        <div style={{
          width: "300px",
          borderRight: "1px solid #ddd",
          paddingRight: "10px",
          maxHeight: "500px",
          overflowY: "auto"
        }}>
          {filteredQuestions.map(q => (
            <div
              key={q.question_id}
              onClick={() => setSelectedQuestion(q)}
              style={{
                padding: "8px",
                cursor: "pointer",
                borderBottom: "1px solid #eee"
              }}
            >
              {q.question_id}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, padding: "20px" }}>
          {selectedQuestion && (
            <>
              <QuestionPreview question={selectedQuestion} />

              <TeacherMeta
                skill={getSkillMeta(selectedQuestion.skill_id)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionPreview = ({ question }) => {
  const prompt = JSON.parse(question.prompt_template);

  return (
    <div>
      <h3>Student View</h3>

      <div style={{ margin: "20px 0" }}>
        {prompt.stem}
      </div>

      {prompt.type === "multiple_choice" &&
        prompt.choices.map(choice => (
          <div
            key={choice.id}
            style={{
              padding: "8px",
              border: "1px solid #ddd",
              marginBottom: "5px"
            }}
          >
            {choice.text}
          </div>
        ))}

      {prompt.type === "numeric" && (
        <input
          type="number"
          disabled
          placeholder="Student types answer here"
        />
      )}
    </div>
  );
};

const TeacherMeta = ({ skill }) => {
  if (!skill) return null;

  return (
    <div style={{
      marginTop: "30px",
      padding: "15px",
      background: "#f3f4f6",
      borderRadius: "6px"
    }}>
      <h4>Teacher Metadata</h4>
      <div><strong>Tier:</strong> {skill.Tier}</div>
      <div><strong>Skill ID:</strong> {skill.ID}</div>
      <div><strong>Skill Name:</strong> {skill["Skill Name"]}</div>
      <div><strong>Skill Goal:</strong> {skill["Skill Goal"]}</div>
    </div>
  );
};