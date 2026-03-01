const { useState } = React;

const App = () => {
  const [mode, setMode] = useState("teacher"); 
  const [currentView, setCurrentView] = useState("dashboard");
  const [activeUnitId, setActiveUnitId] = useState(null);

  return (
    <>
      {mode === "teacher" && (
        <div style={{
          padding: "10px",
          background: "#111827",
          color: "white"
        }}>
          <button
            onClick={() => setMode("student")}
            style={{ marginRight: "10px" }}
          >
            Switch to Student View
          </button>

          <button
            onClick={() => setCurrentView("teacherDashboard")}
          >
            Teacher Dashboard
          </button>
        </div>
      )}

      {mode === "student" && (
        <div style={{
          padding: "10px",
          background: "#0d0f14",
          color: "white"
        }}>
          Student View
        </div>
      )}

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
        />
      )}

      {currentView === "screener" && (
        <ScreenerApp
          studentId="User123"
          unitId={activeUnitId}
          onFinish={() => setCurrentView("dashboard")}
        />
      )}

      {currentView === "teacherDashboard" && mode === "teacher" && (
        <TeacherDashboard
          onBack={() => setCurrentView("dashboard")}
        />
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);