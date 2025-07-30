import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Alert,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for registration/logout success message and pre-fill email
  useEffect(() => {
    if (location.state) {
      const { message, email: registeredEmail } = location.state as any;
      if (message) {
        setSuccessMessage(message);
      }
      if (registeredEmail) {
        setEmail(registeredEmail);
      }
    }
  }, [location.state]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Debes completar ambos campos.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("tucan_token", data.token);
        localStorage.setItem("tucan_user", JSON.stringify(data.user)); // opcional

        navigate("/homepage");
      } else {
        setError(data.message || data.error || "Usuario o contraseña incorrectos.");
      }
    } catch {
      setError("Error al conectarse con el servidor.");
    }
  };

  const handleRegister = () => {
    navigate("/register");
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
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
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
          Iniciar sesión
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        )}

        <form onSubmit={handleLogin}>
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

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#ffcf49",
              color: "#fff",
              "&:hover": { backgroundColor: "#e6b844" },
              mt: 2,
              py: 1.5,
              fontWeight: "bold",
            }}
          >
            Iniciar sesión
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={handleRegister}
            sx={{
              borderColor: "#30638E",
              color: "#30638E",
              "&:hover": { backgroundColor: "#30638E", color: "#FFF" },
              mt: 2,
              py: 1.5,
              fontWeight: "bold",
            }}
          >
            Registrarte
          </Button>
        </form>
      </Container>
    </Box>
  );
};

export default Login;