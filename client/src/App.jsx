import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.status))
      .catch(() => setBackendStatus("Backend not connected"));
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>PoseVision 🚀</h1>

      <p style={styles.subtitle}>
        Real-time posture & pose detection web app
      </p>

      <div style={styles.card}>
        <p>
          <strong>Backend Status:</strong> {backendStatus}
        </p>
      </div>

      <p style={styles.footer}>
        Day 1: React frontend + Express backend setup
      </p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f4f4f5",
    fontFamily: "sans-serif",
  },
  title: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
  },
  subtitle: {
    fontSize: "1.2rem",
    marginBottom: "2rem",
    color: "#555",
  },
  card: {
    padding: "1.2rem 2rem",
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    marginBottom: "2rem",
  },
  footer: {
    fontSize: "0.9rem",
    color: "#777",
  },
};

export default App;
