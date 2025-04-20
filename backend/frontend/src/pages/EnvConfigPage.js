import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, CircularProgress, Alert, Box } from "@mui/material";
import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;

const EnvConfigPage = () => {
  const { functionName } = useParams();
  const [envVars, setEnvVars] = useState({});
  const accountType = localStorage.getItem("accountType");
  const [editKey, setEditKey] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const handleTokenExpiry = () => {
    localStorage.removeItem("token");
    navigate("/login");
  }
  useEffect(() => {
    console.log("Function Name: ", functionName);
    const fetchEnv = async () => {
      const account = localStorage.getItem("account");
      console.log("Account: ", account);
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/lambda/functions/${encodeURIComponent(functionName)}/env`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { account }
        });
        setEnvVars(res.data.environment);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          handleTokenExpiry();
        } else {
          setError(err.response?.data?.message || "Failed to fetch environment variables");
        }
      }
      setLoading(false);
    };
    fetchEnv();
  }, [functionName]);

  const handleEdit = (key) => {
    setEditKey(key);
    setEditValue(envVars[key]);
    setSuccess("");
    setError("");
  };

  const handleSave = async (key) => {
    setSaving(true);
    setError("");
    setSuccess("");
    const account = localStorage.getItem("account");
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_URL}/api/lambda/functions/${encodeURIComponent(functionName)}/env`, { key, value: editValue }, {
        headers: { Authorization: `Bearer ${token}` },
        params: { account }
      });
      setEnvVars(prev => ({ ...prev, [key]: editValue }));
      setEditKey(null);
      setSuccess("Environment variable updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update environment variable");
    }
    setSaving(false);
  };

  return (
    <Container sx={{ mt: 6 }}>
      <Box style={{display:'flex', justifyContent:"space-between"}}>
      <Button variant="outlined" sx={{ mb: 2 }} onClick={() => navigate(-1)}>
        Back
      </Button>
        {/* Add logout button */}
        <Button variant="contained" color="error" onClick={handleTokenExpiry} sx={{ mb: 3 }}>
        Logout
      </Button>
      </Box>
      <Typography variant="h5" gutterBottom>
        Environment Variables for {functionName}
      </Typography>
      {accountType && <div style={{marginBottom:8}}>Account Type: <b>{accountType}</b></div>}
      {loading ? (
        <CircularProgress sx={{ mt: 8 }} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(envVars).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell>{key}</TableCell>
                    <TableCell>
                      {editKey === key ? (
                        <TextField
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          size="small"
                          fullWidth
                        />
                      ) : (
                        value
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {editKey === key ? (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleSave(key)}
                          disabled={saving}
                        >
                          Save
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleEdit(key)}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
};

export default EnvConfigPage;