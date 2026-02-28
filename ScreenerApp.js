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

  // Track mastery locally before writing to DB
  const masteredSkills = new Set();
  const notMasteredSkills = new Set();

  useEffect(() => {
    loadNextQuestion(3);
  }, []);

  // -----------------------------
  // Fetch skills for a given tier
  // -----------------------------
  const getSkillsForTier = async (tierNumber) => {
    const tierLabel = `T${tierNumber}`;

    const { data, error } = await supabaseClient
      .from("skills")
      .select("*")
      .eq("Tier", tierLabel);

    if (error) throw error;
    return data;
  };

  // -----------------------------
  // Fetch difficulty 3 questions
  // -----------------------------
  const getQuestionForSkill = async (skillId) => {
    const { data, error } = await supabaseClient
      .from("questions")
      .select("*")
      .eq("skill_id", skillId)
      .eq("difficulty", 3);

    if (error) throw error;
    return data;
  };

  // -----------------------------
  // Recursive prerequisite closure
  // -----------------------------
  const markFullPrerequisiteTree = async (skillId, visited = new Set()) => {
    if (visited.has(skillId)) return;
    visited.add(skillId);

    masteredSkills.add(skillId);

    const { data, error } = await supabaseClient
      .from("skills")
      .select("Prerequisites")
      .eq("ID", skillId)
      .single();

    if (error || !data || !data.Prerequisites) return;

    const prereqs = data.Prerequisites.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (let prereq of prereqs) {
      await markFullPrerequisiteTree(prereq, visited);
    }
  };

  // -----------------------------
  // Load next question
  // -----------------------------
  const loadNextQuestion = async (tierNumber) => {
    setLoading(true);

    try {
      const skills = await getSkillsForTier(tierNumber);

      if (!skills || skills.length === 0) {
        setLoading(false);
        return;
      }

      const randomSkill =
        skills[Math.floor(Math.random() * skills.length)];

      const questions = await getQuestionForSkill(randomSkill.ID);

      const unusedQuestions = questions.filter(
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
    } catch (err) {
      console.error(err);
    }

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
      await markFullPrerequisiteTree(skillId);
      setCurrentTier((prev) => Math.min(prev + 1, 6));
    } else {
      notMasteredSkills.add(skillId);
      setCurrentTier((prev) => Math.max(prev - 1, 0));
    }

    await supabaseClient.from("screener_attempts").insert({
      student_id: studentId,
      question_id: currentQuestion.question_id,
      skill_id: skillId,
      correct: isCorrect,
    });

    setTimeout(async () => {
      if (questionNumber >= TOTAL_QUESTIONS) {
        await finalizeMastery();
        onFinish();
        return;
      }

      setQuestionNumber((prev) => prev + 1);

      const nextTier = isCorrect
        ? Math.min(currentTier + 1, 6)
        : Math.max(currentTier - 1, 0);

      loadNextQuestion(nextTier);
    }, 800);
  };

  // -----------------------------
  // Finalize mastery write
  // -----------------------------
  const finalizeMastery = async () => {
    const updates = [];

    masteredSkills.forEach((skillId) => {
      updates.push({
        student_id: studentId,
        skill_id: skillId,
        status: "mastered",
      });
    });

    notMasteredSkills.forEach((skillId) => {
      if (!masteredSkills.has(skillId)) {
        updates.push({
          student_id: studentId,
          skill_id: skillId,
          status: "locked",
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
        prompt.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => handleSubmit(choice.id)}
            style={{
              display: "block",
              margin: "10px 0",
              padding: "10px",
              width: "100%",
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
              width: "100%",
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
                : "red",
          }}
        >
          {feedback === "correct" ? "✓" : "✗"}
        </div>
      )}
    </div>
  );
};