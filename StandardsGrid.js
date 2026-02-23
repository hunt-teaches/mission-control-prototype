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
      // Fetch skills and sort them by Tier (T0 to T8)
      const { data, error } = await supabaseClient
        .from('skills')
        .select('*');
      
      if (error) throw error;

      // Sort skills so T0 is first, then T1...
      const sortedSkills = (data || []).sort((a, b) => {
        return a.tier.localeCompare(b.tier, undefined, { numeric: true, sensitivity: 'base' });
      });

      // Fetch progress
      const { data: masteryData } = await supabaseClient
        .from('student_mastery')
        .select('skill_id, status')
        .eq('student_id', studentId);

      const masteryMap = {};
      masteryData?.forEach(m => { masteryMap[m.skill_id] = m.status; });

      setSkills(sortedSkills);
      setMastery(masteryMap);
    } catch (err) {
      console.error("Grid Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{color: 'white', padding: '20px'}}>Mapping curriculum...</div>;

  return (
    <div className="grid-outer">
      <div className="grid-ready">
        <div className="grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(20, 1fr)', 
          gap: '4px', 
          background: '#0d0f14', 
          padding: '10px' 
        }}>
          {Array.from({ length: 34 * 20 }).map((_, i) => {
            // Logic to fill from BOTTOM-LEFT to TOP-RIGHT
            // Row 33 is bottom, Row 0 is top
            const visualRow = Math.floor(i / 20); 
            const col = i % 20;
            const rowFromBottom = 33 - visualRow;
            
            // Calculate which skill index belongs in this specific square
            const skillIndex = (rowFromBottom * 20) + col;
            const skill = skills[skillIndex];

            const status = skill ? (mastery[skill.id] || 'locked') : 'empty';

            return (
              <div 
                key={i}
                className={`cell ${status}`}
                onClick={() => skill && setSelectedSkill(skill)}
                title={skill ? `[${skill.tier}] ${skill.skill_name}` : ''}
                style={{
                  aspectRatio: '1/1',
                  borderRadius: '2px',
                  cursor: skill ? 'pointer' : 'default',
                  backgroundColor: !skill ? 'transparent' : undefined,
                  border: skill && status === 'locked' ? '1px solid #2a2f3a' : 'none'
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
              <span style={{background: '#7c3aed', padding: '2px 8px', borderRadius: '4px', marginRight: '8px'}}>
                {selectedSkill.tier}
              </span>
              <span style={{color: '#999'}}>{selectedSkill.domain}</span>
            </div>
            <h2 className="card-title" style={{margin: '15px 0'}}>{selectedSkill.skill_name}</h2>
            <p className="card-goal" style={{color: '#ccc', lineHeight: '1.5'}}>{selectedSkill.the_goal}</p>
            <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
              <button className="card-btn-primary" style={{flex: 1}} onClick={() => setSelectedSkill(null)}>Practice</button>
              <button className="card-btn-secondary" onClick={() => setSelectedSkill(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};