import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Container, Typography, Box, Alert } from "@mui/material";
import axios from "axios";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, { username, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 12, p: 4, boxShadow: 3, borderRadius: 2, bgcolor: "background.paper" }}>
        <Typography variant="h5" align="center" gutterBottom>
          AWS Lambda Manager Login
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Login
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default LoginPage;