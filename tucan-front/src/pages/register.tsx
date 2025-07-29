// src/pages/Register.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box
} from "@mui/material";
import "../styles/register.css";

const Register = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [rol, setRol] = useState("Alumno");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmar) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    navigate("/login");
  };

  return (
    <Container>
      <Box className="auth-box">
        <Typography className="rainbow-title">
          Registrarte
        </Typography>
        <form onSubmit={handleRegister}>
          <Stack spacing={2}>
            <TextField
              label="Nombre Completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              fullWidth
            />
            <TextField
              label="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
            />
            <TextField
              label="Confirmar Contraseña"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              fullWidth
            />
            <Typography variant="body2">
              ¿Eres Alumno o Docente?
            </Typography>
            <RadioGroup
              row
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              sx={{ justifyContent: "center", gap: 2 }}
            >
              <FormControlLabel value="Alumno" control={<Radio />} label="Alumno" />
              <FormControlLabel value="Docente" control={<Radio />} label="Docente" />
            </RadioGroup>
            <Button type="submit" variant="contained" className="orange-btn">
              REGISTRARTE
            </Button>
            <Button
              variant="outlined"
              className="white-outline-btn"
              onClick={() => navigate("/login")}
            >
              VOLVER AL LOGIN
            </Button>
          </Stack>
        </form>
      </Box>
    </Container>
  );
};

export default Register;