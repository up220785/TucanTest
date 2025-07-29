// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Stack,
  Box
} from "@mui/material";
import "../styles/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "admin@example.com" && password === "1234") {
      navigate("/homepage");
    } else {
      setError("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <Container>
      <Box className="auth-box">
        <Typography className="rainbow-title">
          Iniciar sesión
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <form onSubmit={handleLogin}>
          <Stack spacing={2}>
            <TextField
              label="Correo Electrónico"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="contained" className="orange-btn">
              INICIAR SESIÓN
            </Button>
            <Button
              variant="outlined"
              className="white-outline-btn"
              onClick={() => navigate("/register")}
            >
              REGISTRARTE
            </Button>
          </Stack>
        </form>
      </Box>
    </Container>
  );
};

export default Login;