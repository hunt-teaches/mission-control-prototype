const { useState, useEffect } = React;

const StandardsGrid = ({ studentId }) => {
  const [skills, setSkills] = useState([]);
  const [mastery, setMastery] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch skills from Supabase
      const { data: skillsData, error: skillsError } = await supabaseClient
        .from('skills')
        .select('*');
      
      if (skillsError) throw skillsError;

      // 2. Fetch mastery progress
      const { data: masteryData } = await supabaseClient
        .from('student_mastery')
        .select('skill_id, status')
        .eq('student_id', studentId);

      const masteryMap = {};
      masteryData?.forEach(m => {
        masteryMap[m.skill_id] = m.status;
      });

      setSkills(skillsData || []);
      setMastery(masteryMap);
    } catch (err) {
      console.error("Error loading grid:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{color: 'white', padding: '20px'}}>Loading 665 skills...</div>;

  return (
    <div className="grid-outer">
      {/* If skills are empty, show a warning */}
      {skills.length === 0 && (
        <div style={{color: '#f59e0b', padding: '20px', border: '1px solid #f59e0b', borderRadius: '8px'}}>
          ⚠️ No skills found in database. Check your 'skills' table in Supabase!
        </div>
      )}

      <div className="grid-ready">
        <div className="grid">
          {Array.from({ length: 34 * 20 }).map((_, i) => {
            // Note: In your CSV/Prototype, row 33 is the BOTTOM (Kindergarten)
            // and row 0 is the TOP (8th Grade).
            const r = Math.floor(i / 20);
            const c = i % 20;
            
            // This line is the "Fix": It checks for 'row' or 'grid_row' 
            // and 'col' or 'grid_col' to be safe.
            const skill = skills.find(s => 
              (s.row === r || s.grid_row === r) && 
              (s.col === c || s.grid_col === c)
            );

            const status = skill ? (mastery[skill.id] || 'locked') : 'empty';

            return (
              <div 
                key={i}
                className={`cell ${status}`}
                onClick={() => skill && setSelectedSkill(skill)}
                style={{
                  // Add temporary borders if the grid is invisible
                  border: skill ? '' : '1px solid rgba(255,255,255,0.02)' 
                }}
              />
            );
          })}
        </div>
      </div>

      {selectedSkill && (
        <div className="overlay visible" onClick={() => setSelectedSkill(null)}>
          <div className="preview-card" onClick={e => e.stopPropagation()}>
            <div className="card-tier-badge">
              <span>{selectedSkill.tier || selectedSkill.Tier}</span>
              <span>{selectedSkill.domain || selectedSkill.Domain}</span>
            </div>
            <div className="card-title">{selectedSkill.skill_name || selectedSkill.Skill_Name}</div>
            <div className="card-goal">{selectedSkill.the_goal || selectedSkill.The_Goal}</div>
            <div className="card-actions">
              <button className="card-btn-primary" onClick={() => setSelectedSkill(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};