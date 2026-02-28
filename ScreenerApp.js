const { useState, useEffect } = React;

const ScreenerApp = ({ studentId, onFinish }) => {
  const TOTAL_QUESTIONS = 30;

  const [currentTier, setCurrentTier] = useState(3);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState(new Set());
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  // In-memory skill graph
  const [skillMap, setSkillMap] = useState({});
  const masteredSkills = new Set();
  const notMasteredSkills = new Set();

  useEffect(() => {
    initializeScreener();
  }, []);

  // -----------------------------
  // INITIALIZE: load all skills once
  // -----------------------------
  const initializeScreener = async () => {
    setLoading(true);

    const { data, error } = await supabaseClient
      .from("skills")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    // Build skill map in memory
    const map = {};

    data.forEach(skill => {
      map[skill.ID] = {
        prereqs: skill.Prerequisites
          ? skill.Prerequisites.split(";")
              .map(s => s.trim())
              .filter(Boolean)
          : [],
        tier: skill.Tier
      };
    });

    setSkillMap(map);

    await loadNextQuestion(3, map);

    setLoading(false);
  };

  // -----------------------------
  // Recursive prerequisite closure (client-side)
  // -----------------------------
  const markFullTree = (skillId, visited = new Set()) => {
    if (visited.has(skillId)) return;
    visited.add(skillId);

    masteredSkills.add(skillId);

    const prereqs = skillMap[skillId]?.prereqs || [];

    prereqs.forEach(prereq => {
      markFullTree(prereq, visited);
    });
  };

  // -----------------------------
  // Get skills for tier (from memory)
  // -----------------------------
  const getSkillsForTier = (tierNumber) => {
    const tierLabel = `T${tierNumber}`;

    return Object.entries(skillMap)
      .filter(([_, value]) => value.tier === tierLabel)
      .map(([id]) => id);
  };

  // -----------------------------
  // Load next question
  // -----------------------------
  const loadNextQuestion = async (tierNumber, map = skillMap) => {
    setLoading(true);

    const skillsInTier = Object.entries(map)
      .filter(([_, value]) => value.tier === `T${tierNumber}`)
      .map(([id]) => id);

    if (skillsInTier.length === 0) {
      setLoading(false);
      return;
    }

    const randomSkill =
      skillsInTier[Math.floor(Math.random() * skillsInTier.length)];

    const { data, error } = await supabaseClient
      .from("questions")
      .select("*")
      .eq("skill_id", randomSkill)
      .eq("difficulty", 3);

    if (error || !data || data.length === 0) {
      setLoading(false);
      return;
    }

    const unusedQuestions = data.filter(
      (q) => !usedQuestions.has(q.question_id)
    );

    if (unusedQuestions.length === 0) {
      setLoading(false);
      return;
    }

    const nextQuestion =
      unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];

    setCurrentQuestion(nextQuestion);
    setUsedQuestions(
      new Set([...usedQuestions, nextQuestion.question_id])
    );
    setInputValue("");
    setFeedback(null);

    setLoading(false);
  };

  // -----------------------------
  // Submit handler
  // -----------------------------
  const handleSubmit = async (answer) => {
    if (!currentQuestion) return;

    const correctAnswer = JSON.parse(
      currentQuestion.answer_template
    );

    let isCorrect = false;

    if (currentQuestion.question_type === "numeric") {
      isCorrect = Number(answer) === Number(correctAnswer.value);
    } else {
      isCorrect =
        answer === correctAnswer.correct_choice_id;
    }

    setFeedback(isCorrect ? "correct" : "wrong");

    const skillId = currentQuestion.skill_id;

    if (isCorrect) {
      markFullTree(skillId);
      setCurrentTier(prev => Math.min(prev + 1, 6));
    } else {
      notMasteredSkills.add(skillId);
      setCurrentTier(prev => Math.max(prev - 1, 0));
    }

    // Still log attempt immediately
    await supabaseClient.from("screener_attempts").insert({
      student_id: studentId,
      question_id: currentQuestion.question_id,
      skill_id: skillId,
      correct: isCorrect
    });

    setTimeout(async () => {
      if (questionNumber >= TOTAL_QUESTIONS) {
        await finalizeMastery();
        onFinish();
        return;
      }

      setQuestionNumber(prev => prev + 1);

      const nextTier = isCorrect
        ? Math.min(currentTier + 1, 6)
        : Math.max(currentTier - 1, 0);

      loadNextQuestion(nextTier);
    }, 300);
  };

  // -----------------------------
  // Final mastery write (single DB call)
  // -----------------------------
  const finalizeMastery = async () => {
    const updates = [];

    masteredSkills.forEach(skillId => {
      updates.push({
        student_id: studentId,
        skill_id: skillId,
        status: "mastered"
      });
    });

    notMasteredSkills.forEach(skillId => {
      if (!masteredSkills.has(skillId)) {
        updates.push({
          student_id: studentId,
          skill_id: skillId,
          status: "locked"
        });
      }
    });

    if (updates.length > 0) {
      await supabaseClient
        .from("student_mastery")
        .upsert(updates);
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (loading || !currentQuestion)
    return <div style={{ padding: "40px" }}>Loading...</div>;

  const prompt = JSON.parse(currentQuestion.prompt_template);

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "auto" }}>
      <h3>
        Question {questionNumber} of {TOTAL_QUESTIONS}
      </h3>

      <div style={{ margin: "30px 0", fontSize: "20px" }}>
        {prompt.stem}
      </div>

      {prompt.type === "multiple_choice" &&
        prompt.choices.map(choice => (
          <button
            key={choice.id}
            onClick={() => handleSubmit(choice.id)}
            style={{
              display: "block",
              margin: "10px 0",
              padding: "10px",
              width: "100%"
            }}
          >
            {choice.text}
          </button>
        ))}

      {prompt.type === "numeric" && (
        <>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ padding: "10px", width: "100%" }}
          />
          <button
            onClick={() => handleSubmit(inputValue)}
            style={{
              marginTop: "10px",
              padding: "10px",
              width: "100%"
            }}
          >
            Submit
          </button>
        </>
      )}

      {feedback && (
        <div
          style={{
            marginTop: "20px",
            fontSize: "24px",
            color:
              feedback === "correct"
                ? "green"
                : "red"
          }}
        >
          {feedback === "correct" ? "✓" : "✗"}
        </div>
      )}
    </div>
  );
};