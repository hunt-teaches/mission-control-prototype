const { useState } = React;

const App = () => {
  const [currentView, setCurrentView] = useState("dashboard");
  const [activeUnitId, setActiveUnitId] = useState(null);

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          onLaunchGlobalScreener={() => {
            setActiveUnitId(null);
            setCurrentView("screener");
          }}
          onLaunchUnitScreener={(unitId) => {
            setActiveUnitId(unitId);
            setCurrentView("screener");
          }}
          onLaunchUnitBuilder={() => setCurrentView("unitBuilder")}
        />
      )}

      {currentView === "screener" && (
        <ScreenerApp
          studentId="User123"
          unitId={activeUnitId}
          onFinish={() => setCurrentView("dashboard")}
        />
      )}

      {currentView === "unitBuilder" && (
        <UnitBuilder
          teacherId="Teacher1"
          onBack={() => setCurrentView("dashboard")}
        />
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);