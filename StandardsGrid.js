const { useState, useEffect } = React;

const StandardsGrid = ({ 
  studentId, 
  tableName = 'skills', 
  totalCols = 20 
}) => {
  const [skills, setSkills] = useState([]);
  const [mastery, setMastery] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    fetchData();
  }, [studentId, tableName]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: skillsData, error: skillsError } = await supabaseClient
        .from(tableName)
        .select('*');

      if (skillsError) throw skillsError;
      if (!skillsData || skillsData.length === 0) {
        setError("Skills table is empty.");
        return;
      }

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
    return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;

  // Dynamically determine grid height
  const maxRow = Math.max(...skills.map(s => s.row || 0));
  const TOTAL_ROWS = maxRow + 1;

  const grid = Array.from({ length: TOTAL_ROWS }, () =>
    Array(totalCols).fill(null)
  );

  skills.forEach(skill => {
    if (
      skill.row !== null &&
      skill.col !== null &&
      skill.row >= 0 &&
      skill.col >= 0 &&
      skill.col < totalCols
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
          gridTemplateColumns: `repeat(${totalCols}, 1fr)`,
          gridTemplateRows: `repeat(${TOTAL_ROWS}, 1fr)`,
          gap: '4px'
        }}
      >
        {grid.flat().map((skill, index) => {
          const skillId = skill?.id || skill?.ID;
          const status = skillId ? (mastery[skillId] || 'locked') : 'empty';

          return (
            <div
              key={index}
              className={`cell ${status}`}
              onClick={() => skill && setSelectedSkill(skill)}
              style={{
                borderRadius: '2px',
                cursor: skill ? 'pointer' : 'default',
                backgroundColor: !skill
                  ? 'transparent'
                  : status === 'locked'
                  ? '#1e2129'
                  : undefined,
                border:
                  skill && status === 'locked'
                    ? '1px solid #2a2f3a'
                    : 'none',
                transition: 'all 0.2s'
              }}
              title={skill ? skill["Skill Name"] : ''}
            />
          );
        })}
      </div>

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
              {selectedSkill.Tier} • {selectedSkill.Domain}
            </div>

            <h2 style={{ margin: '10px 0' }}>
              {selectedSkill["Skill Name"]}
            </h2>

            <p style={{ color: '#aaa', lineHeight: '1.6' }}>
              {selectedSkill["The Goal"]}
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