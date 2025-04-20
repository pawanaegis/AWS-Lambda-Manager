import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
const API_URL = process.env.REACT_APP_API_URL;

function LogsPage() {
  const { functionName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextToken, setNextToken] = useState(null);
  const [account, setAccount] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const acc = params.get("account") || "test";
    setAccount(acc);
    fetchLogs(null, acc);
    // eslint-disable-next-line
  }, [functionName, location.search]);

  const fetchLogs = async (tokenArg = null, acc = account) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/lambda/functions/${encodeURIComponent(functionName)}/logs`,
        {
          startDate: null,
          endDate: null,
          keyword: "",
          nextToken: tokenArg,
          account: acc
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setLogs(res.data.events || []);
      setNextToken(res.data.nextToken || null);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        handleTokenExpiry();
      } else {
        setError(err.response?.data?.message || "Failed to fetch logs");
      }
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (nextToken) fetchLogs(nextToken);
  };

  function handleTokenExpiry() {
    setModalMessage("Session expired. Redirecting to login...");
    setShowModal(true);
    setTimeout(() => {
      setShowModal(false);
      navigate("/login");
    }, 5000);
  }

  return (
    <div>
      <h2>Logs for {functionName} ({account})</h2>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <p>{modalMessage}</p>
          </div>
        </div>
      )}
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {logs.map((log, idx) => (
          <li key={idx}>{log.message}</li>
        ))}
      </ul>
      {nextToken && <button onClick={handleNext}>Next</button>}
    </div>
  );
}

export default LogsPage;