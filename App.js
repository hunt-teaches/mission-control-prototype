const { useState } = React;

const App = () => {
  const [currentView, setCurrentView] = useState("dashboard");

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          onLaunchScreener={() => setCurrentView("screener")}
        />
      )}

      {currentView === "screener" && (
        <ScreenerApp
          studentId="User123"
          onFinish={() => setCurrentView("dashboard")}
        />
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);