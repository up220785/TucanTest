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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

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

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
          role: role === "Alumno" ? "student" : "teacher",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("tucan_token", data.token);
        localStorage.setItem("tucan_user", JSON.stringify(data.user));
        navigate("/homepage");
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
    return () => document.removeEventListener("mousemove", handleMouseMove);
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

      <Container maxWidth="sm" className="form-container">
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          className="rainbow-text"
        >
          Registrarte
        </Typography>

        {error && (
          <Typography variant="body1" color="error">
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
            sx={{ backgroundColor: "#fff", borderRadius: 1 }}
          />
          <TextField
            label="Correo Electrónico"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ backgroundColor: "#fff", borderRadius: 1 }}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ backgroundColor: "#fff", borderRadius: 1 }}
          />
          <TextField
            label="Confirmar Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ backgroundColor: "#fff", borderRadius: 1 }}
          />

          <Typography variant="h6" sx={{ mt: 2 }}>
            ¿Eres Alumno o Docente?
          </Typography>
          <RadioGroup
            row
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <FormControlLabel value="Alumno" control={<Radio />} label="Alumno" />
            <FormControlLabel value="Docente" control={<Radio />} label="Docente" />
          </RadioGroup>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#ffcf49",
              color: "#000",
              "&:hover": { backgroundColor: "#e6b844" },
              mt: 2,
              py: 1.5,
              fontWeight: "bold",
            }}
          >
            Registrarte
          </Button>

          <Button
            variant="outlined"
            fullWidth
            sx={{
              borderColor: "#30638E",
              color: "#30638E",
              "&:hover": { backgroundColor: "#30638E", color: "#FFF" },
              mt: 2,
              py: 1.5,
              fontWeight: "bold",
            }}
            onClick={() => navigate("/login")}
          >
            Volver al Login
          </Button>
        </form>
      </Container>
    </Box>
  );
};

export default Register;