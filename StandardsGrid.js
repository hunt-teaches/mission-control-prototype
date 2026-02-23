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
    setLoading(true);
    
    // 1. Pull the curriculum from your 'skills' table
    const { data: skillsData } = await supabaseClient
      .from('skills')
      .select('*');

    // 2. Pull this student's progress from 'student_mastery'
    const { data: masteryData } = await supabaseClient
      .from('student_mastery')
      .select('skill_id, status')
      .eq('student_id', studentId);

    // Turn mastery array into a quick-lookup object: { "DATA.01": "mastered" }
    const masteryMap = {};
    masteryData?.forEach(m => {
      masteryMap[m.skill_id] = m.status;
    });

    setSkills(skillsData || []);
    setMastery(masteryMap);
    setLoading(false);
  };

  if (loading) return <div className="loading">Loading your skill map...</div>;

  return (
    <div className="grid-outer">
      <div className="grid-ready">
        <div className="grid">
          {/* We create a 20x34 grid (680 total slots) */}
          {Array.from({ length: 34 * 20 }).map((_, i) => {
            const row = Math.floor(i / 20);
            const col = i % 20;
            
            // Find if there is a skill at this coordinate
            const skill = skills.find(s => s.row === row && s.col === col);
            const status = skill ? (mastery[skill.id] || 'locked') : 'empty';

            return (
              <div 
                key={i}
                className={`cell ${status}`}
                onClick={() => skill && setSelectedSkill(skill)}
                title={skill ? skill.skill_name : ''}
              />
            );
          })}
        </div>
      </div>

      {/* The Detail Card (Overlay) */}
      {selectedSkill && (
        <div className="overlay visible" onClick={() => setSelectedSkill(null)}>
          <div className="preview-card" onClick={e => e.stopPropagation()}>
            <div className="card-tier-badge">
              <span>{selectedSkill.tier}</span>
              <span>{selectedSkill.domain}</span>
            </div>
            <div className="card-title">{selectedSkill.skill_name}</div>
            <div className="card-goal">{selectedSkill.the_goal}</div>
            <div className="card-actions">
              <button className="card-btn-primary" onClick={() => alert('Starting Lesson...')}>
                Practice This Skill →
              </button>
              <button className="card-btn-secondary" onClick={() => setSelectedSkill(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};