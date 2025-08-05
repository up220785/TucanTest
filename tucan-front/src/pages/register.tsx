import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";
import TucanLogo from "../assets/logo2.png";

const Register: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword || !role) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!/[A-Za-z]/.test(password)) {
      setError("La contraseña debe contener al menos una letra.");
      return;
    }

    if (!/\d/.test(password)) {
      setError("La contraseña debe contener al menos un número.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            role: role === "Alumno" ? "student" : "teacher",
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        navigate("/login", {
          state: {
            message:
              "¡Registro exitoso! Por favor, inicia sesión con tus credenciales.",
            email: email.trim().toLowerCase(),
          },
        });
      } else {
        setError(data.message || data.error || "Error en el registro.");
      }
    } catch {
      setError("No se pudo conectar al servidor.");
    }
  };

  useEffect(() => {
    const boxes = document.querySelectorAll(".box");

    const handleMouseMove = (event: MouseEvent) => {
      boxes.forEach((box) => {
        const rect = box.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(event.clientX - (rect.left + rect.width / 2), 2) +
            Math.pow(event.clientY - (rect.top + rect.height / 2), 2)
        );
        let intensity = Math.max(0, 1 - distance / 100);
        let color =
          intensity > 0.7
            ? "#30638E"
            : `rgba(48, 99, 142, ${intensity.toFixed(2)})`;

        (box as HTMLElement).style.backgroundColor = color;
        (box as HTMLElement).style.opacity = "1";

        setTimeout(() => {
          (box as HTMLElement).style.backgroundColor = "transparent";
        }, 600);
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () =>
      document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    document.body.classList.add("register");
    return () => document.body.classList.remove("register");
  }, []);

  return (
    <Box className="background">
      <Grid container className="grid-background">
        {[...Array(600)].map((_, index) => (
          <Box key={index} className="box" />
        ))}
      </Grid>

      <Box className="main-layout-container">
        <Box className="left-title-logo">


          <img
            src={TucanLogo}
            alt="TucanTest Logo"
            className="page-logo pulse-logo"
            onError={(e) => {
              console.log("Image failed to load:", e);
              e.currentTarget.style.display = "none";
            }}
          />

          <Box
            className="text-logo-fallback"
            sx={{
              width: "80px",
              height: "80px",
              backgroundColor: "#EA5C00",
              borderRadius: "50%",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontFamily: "'Rammetto One', sans-serif",
              fontSize: "12px",
              fontWeight: "bold",
              textAlign: "center",
              margin: "0 auto 20px auto",
              position: "relative",
              zIndex: 15,
              filter:
                "drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))",
            }}
          >
            TUCAN
          </Box>
        </Box>

        <Container maxWidth="sm" className="form-container">
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            className="rainbow-text"
            sx={{
              fontFamily: "'Rammetto One', sans-serif !important",
              color: "black !important",
            }}
          >
            Registrarte
          </Typography>

          {error && (
            <Typography
              variant="body1"
              color="error"
              className="register-text"
            >
              {error}
            </Typography>
          )}

          <form onSubmit={handleRegister}>
            <TextField
              label="Nombre Completo"
              type="text"
              fullWidth
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="register-input"
            />
            <TextField
              label="Correo Electrónico"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="register-input"
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="register-input"
            />
            <TextField
              label="Confirmar Contraseña"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="register-input"
            />

            <Typography
              variant="h6"
              sx={{ mt: 2 }}
              className="register-text"
            >
              ¿Eres Alumno o Docente?
            </Typography>
            <RadioGroup
              row
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="register-radio"
            >
              <FormControlLabel
                value="Alumno"
                control={<Radio />}
                label="Alumno"
              />
              <FormControlLabel
                value="Docente"
                control={<Radio />}
                label="Docente"
              />
            </RadioGroup>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="register-button"
              sx={{
                mt: 2,
                py: 1.5,
              }}
            >
              Registrarte
            </Button>

            <Button
  variant="outlined"
  fullWidth
  className="register-button"
  onClick={() => navigate("/login")}
  sx={{
    borderColor: "#30638E !important",
    color: "#30638E !important",
    backgroundColor: "transparent !important",
    mt: 2,
    py: 1.5,
  }}
>
  Volver al Login
</Button>
          </form>
        </Container>
      </Box>
    </Box>
  );
};

export default Register;