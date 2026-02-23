const { useState, useEffect } = React;

const StandardsGrid = ({ studentId }) => {
  const [skills, setSkills] = useState([]);
  const [mastery, setMastery] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch skills (now includes row + col)
      const { data: skillsData, error: skillsError } = await supabaseClient
        .from('skills')
        .select('*');

      if (skillsError) throw skillsError;
      if (!skillsData || skillsData.length === 0) {
        setError("Skills table is empty.");
        return;
      }

      // Fetch mastery
      const { data: masteryData } = await supabaseClient
        .from('student_mastery')
        .select('skill_id, status')
        .eq('student_id', studentId);

      const masteryMap = {};
      masteryData?.forEach(m => {
        masteryMap[m.skill_id] = m.status;
      });

      setSkills(skillsData);
      setMastery(masteryMap);

    } catch (err) {
      console.error("Database Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div style={{ color: 'white', padding: '20px' }}>Loading grid...</div>;

  if (error)
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        Error: {error}
      </div>
    );

  // ----------------------------
  // BUILD EMPTY 34 x 20 GRID
  // ----------------------------
  const TOTAL_ROWS = 34;
  const TOTAL_COLS = 20;

  const grid = Array.from({ length: TOTAL_ROWS }, () =>
    Array(TOTAL_COLS).fill(null)
  );

  // PLACE EACH SKILL USING row + col
  skills.forEach(skill => {
    if (
      skill.row !== null &&
      skill.col !== null &&
      skill.row >= 0 &&
      skill.row < TOTAL_ROWS &&
      skill.col >= 0 &&
      skill.col < TOTAL_COLS
    ) {
      grid[skill.row][skill.col] = skill;
    }
  });

  return (
    <div style={{ background: '#0d0f14', padding: '10px', borderRadius: '8px' }}>
      
      <div
        className="grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(20, 1fr)',
          gridTemplateRows: 'repeat(34, 1fr)',
          gap: '4px',
          aspectRatio: '20/34'
        }}
      >
        {grid.flat().map((skill, index) => {
          const skillId = skill?.id || skill?.ID;
          let status = 'empty';

if (skill) {
  const tierString = skill.tier || skill.Tier || "T0";
  const tierNumber = parseInt(tierString.replace("T", ""));

  if (tierNumber <= 3) {
    status = Math.random() < 0.9 ? 'mastered' : 'locked';
  } 
  else if (tierNumber === 4 || tierNumber === 5) {
    const r = Math.random();
    if (r < 0.6) status = 'mastered';
    else if (r < 0.85) status = 'frontier_active';
    else status = 'frontier_new';
  } 
  else if (tierNumber === 6) {
    status = Math.random() < 0.2 ? 'frontier_new' : 'locked';
  } 
  else {
    status = 'locked';
  }
}

          return (
            <div
  key={index}
  className={`cell ${status}`}
  onClick={() => skill && setSelectedSkill(skill)}
  style={{
    cursor: skill ? 'pointer' : 'default'
  }}
              title={
                skill
                  ? skill['Skill Name'] || skill.skill_name
                  : ''
              }
            />
          );
        })}
      </div>

      {/* Modal */}
      {selectedSkill && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedSkill(null)}
        >
          <div
            style={{
              background: '#161920',
              padding: '30px',
              borderRadius: '15px',
              maxWidth: '400px',
              border: '1px solid #252830',
              color: 'white'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '12px', color: '#7c3aed', textTransform: 'uppercase' }}>
              {selectedSkill.tier || selectedSkill.Tier} • {selectedSkill.domain || selectedSkill.Domain}
            </div>

            <h2 style={{ margin: '10px 0' }}>
              {selectedSkill['Skill Name'] || selectedSkill.skill_name}
            </h2>

            <p style={{ color: '#aaa', lineHeight: '1.6' }}>
              {selectedSkill['The Goal'] || selectedSkill.the_goal}
            </p>

            <button
              onClick={() => setSelectedSkill(null)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                background: '#7c3aed',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};