const { useState } = React;

const App = () => {
  const [mode, setMode] = useState("teacher");
  const [currentView, setCurrentView] = useState("dashboard");
  const [activeUnitId, setActiveUnitId] = useState(null);

  return (
    <>
      {/* Top Navigation Bar */}
      <div style={{
        padding: "10px",
        background: "#111827",
        color: "white",
        display: "flex",
        justifyContent: "space-between"
      }}>
        <div>
          {mode === "teacher" && (
            <button onClick={() => setMode("student")}>
              Switch to Student View
            </button>
          )}

          {mode === "student" && (
            <button onClick={() => setMode("teacher")}>
              Switch to Teacher View
            </button>
          )}
        </div>

        <div>
          {mode === "teacher" && (
            <>
              <button
                style={{ marginRight: "10px" }}
                onClick={() => setCurrentView("teacherDashboard")}
              >
                Question Bank
              </button>

              <button
                onClick={() => setCurrentView("unitBuilder")}
              >
                Unit Builder
              </button>
            </>
          )}
        </div>
      </div>

      {/* Student Dashboard */}
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

      {/* Screener */}
      {currentView === "screener" && (
        <ScreenerApp
          studentId="User123"
          unitId={activeUnitId}
          onFinish={() => setCurrentView("dashboard")}
        />
      )}

      {/* Teacher Question Bank */}
      {currentView === "teacherDashboard" && mode === "teacher" && (
        <TeacherDashboard
          onBack={() => setCurrentView("dashboard")}
        />
      )}

      {/* Unit Builder */}
      {currentView === "unitBuilder" && mode === "teacher" && (
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