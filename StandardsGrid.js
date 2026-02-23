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
      
      // 1. Try to fetch from 'skills' table
      const { data: skillsData, error: skillsError } = await supabaseClient
        .from('skills')
        .select('*');
      
      if (skillsError) throw skillsError;
      if (!skillsData || skillsData.length === 0) {
        setError("Connected to Supabase, but the 'skills' table is empty.");
        return;
      }

      // 2. Fetch student progress
      const { data: masteryData } = await supabaseClient
        .from('student_mastery')
        .select('skill_id, status')
        .eq('student_id', studentId);

      const masteryMap = {};
      masteryData?.forEach(m => {
        masteryMap[m.skill_id] = m.status;
      });

      // 3. Sort skills by Tier (T0, T1, etc.)
      const sorted = [...skillsData].sort((a, b) => {
        const tierA = (a.tier || a.Tier || "").toString();
        const tierB = (b.tier || b.Tier || "").toString();
        return tierA.localeCompare(tierB, undefined, { numeric: true });
      });

      setSkills(sorted);
      setMastery(masteryMap);
    } catch (err) {
      console.error("Database Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{color: 'white', padding: '20px'}}>Connecting to database...</div>;
  
  if (error) return (
    <div style={{color: '#ff4444', padding: '20px', background: '#222', borderRadius: '8px', margin: '20px'}}>
      <strong>Database Error:</strong> {error}
      <br/><br/>
      <small>Check if your table is named "skills" and has data.</small>
    </div>
  );

  return (
    <div className="grid-outer" style={{ background: '#0d0f14', padding: '10px', borderRadius: '8px' }}>
      
      {/* Debug Info: Useful for the prototype */}
      <div style={{ color: '#666', fontSize: '10px', marginBottom: '10px' }}>
        Found {skills.length} skills in database.
      </div>

      <div className="grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(20, 1fr)', 
        gap: '4px'
      }}>
        {Array.from({ length: 34 * 20 }).map((_, i) => {
          // Calculate grid position (Fill from bottom row up)
          const visualRow = Math.floor(i / 20); 
          const col = colIndex = i % 20;
          const rowFromBottom = 33 - visualRow;
          const skillIndex = (rowFromBottom * 20) + col;
          
          const skill = skills[skillIndex];
          
          // Get Data (Handles CSV naming variations)
          const skillId = skill?.id || skill?.ID;
          const status = skillId ? (mastery[skillId] || 'locked') : 'empty';

          return (
            <div 
              key={i}
              className={`cell ${status}`}
              onClick={() => skill && setSelectedSkill(skill)}
              style={{
                aspectRatio: '1/1',
                borderRadius: '2px',
                cursor: skill ? 'pointer' : 'default',
                backgroundColor: !skill ? 'transparent' : (status === 'locked' ? '#1e2129' : undefined),
                border: skill && status === 'locked' ? '1px solid #2a2f3a' : 'none',
                transition: 'all 0.2s'
              }}
              title={skill ? (skill['Skill Name'] || skill.skill_name) : ''}
            />
          );
        })}
      </div>

      {/* Modal for Skill Details */}
      {selectedSkill && (
        <div className="overlay visible" 
             style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
             onClick={() => setSelectedSkill(null)}>
          <div className="preview-card" 
               style={{ background: '#161920', padding: '30px', borderRadius: '15px', maxWidth: '400px', border: '1px solid #252830', color: 'white' }}
               onClick={e => e.stopPropagation()}>
            <div style={{ color: '#7c3aed', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase' }}>
              {selectedSkill.tier || selectedSkill.Tier} • {selectedSkill.domain || selectedSkill.Domain}
            </div>
            <h2 style={{ margin: '10px 0' }}>{selectedSkill['Skill Name'] || selectedSkill.skill_name}</h2>
            <p style={{ color: '#aaa', lineHeight: '1.6' }}>{selectedSkill['The Goal'] || selectedSkill.the_goal}</p>
            <button 
              onClick={() => setSelectedSkill(null)}
              style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#7c3aed', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};