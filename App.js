const { useState } = React;

const App = () => {
  // This state will track if we are on the Dashboard or in an App
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div>
      {/* For now, we just show the Dashboard we built earlier */}
      {currentView === 'dashboard' && <Dashboard />}
    </div>
  );
};

// This tells React to put everything into that "root" div in our HTML
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);