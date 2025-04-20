import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [account, setAccount] = useState("test");
  const navigate = useNavigate();
  const handleTokenExpiry = () => {
    localStorage.removeItem("token");
    navigate("/login");
  }
  useEffect(() => {
    const fetchFunctions = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/api/lambda/functions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { account }
        });
        setFunctions(res.data.functions);
      } catch (err) {
        if (err.response && err.response.status === 401) {
          handleTokenExpiry();
        }
        setError(err.response?.data?.message || "Failed to fetch Lambda functions");
      }
      setLoading(false);
    };
    fetchFunctions();
  }, [account]);

  const handleEnv = (fn) => {
    navigate(`/lambda/${encodeURIComponent(fn.FunctionName)}/env?account=${account}`);
  };
  const handleLogs = (fn) => {
    navigate(`/lambda/${encodeURIComponent(fn.FunctionName)}/logs?account=${account}`);
  };

  return (
    <Container sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom align="center">
        AWS Lambda Functions
      </Typography>
      <FormControl style={{display:'flex', flexDirection:'row', justifyContent:"space-between"}} sx={{ minWidth: 180, mb: 3 }}>
        <InputLabel id="account-select-label">AWS Account</InputLabel>
        <Select
          labelId="account-select-label"
          value={account}
          label="AWS Account"
          onChange={e => {setAccount(e.target.value), localStorage.setItem("account", e.target.value)}}
        >
          <MenuItem value="test">test</MenuItem>
          <MenuItem value="prod">prod</MenuItem>
          <MenuItem value="ba">ba</MenuItem>
        </Select>
         {/* Add logout button */}
      <Button variant="contained" color="error" onClick={handleTokenExpiry} sx={{ mb: 3 }}>
        Logout
      </Button>
      </FormControl>
      {loading ? (
        <CircularProgress sx={{ display: "block", mx: "auto", mt: 8 }} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {functions.map(fn => (
            <Grid item xs={12} md={6} lg={4} key={fn.FunctionName}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{fn.FunctionName}</Typography>
                  <Typography variant="body2">Runtime: {fn.Runtime}</Typography>
                  <Typography variant="body2">Last Modified: {fn.LastModified}</Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" variant="contained" onClick={() => handleEnv(fn)}>
                    View & Edit Env Config
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => handleLogs(fn)}>
                    View CloudWatch Logs
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Dashboard;