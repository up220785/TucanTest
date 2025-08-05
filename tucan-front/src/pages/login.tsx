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
import "../styles/login.css";
import TucanLogo from "../assets/logo2.png";

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

  return (
    <Box className="background">


      {/* Nuevo diseño horizontal */}
      <Box className="main-layout-container">
        {/* Izquierda: logo + título */}
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

          {/* Fallback si falla la imagen */}
          <Box
            className="text-logo-fallback"
            sx={{
              width: '80px',
              height: '80px',
              backgroundColor: '#EA5C00',
              borderRadius: '50%',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: "'Rammetto One', sans-serif",
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
              margin: '0 auto 20px auto',
              position: 'relative',
              zIndex: 15,
              filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))',
            }}
          >
            TUCAN
          </Box>
        </Box>

        {/* Derecha: formulario */}
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
            Iniciar sesión
          </Typography>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Typography variant="body1" color="error" className="login-text">
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
              className="login-input"
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              className="login-button"
              sx={{
                mt: 2,
                py: 1.5,
              }}
            >
              Iniciar sesión
            </Button>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleRegister}
              className="login-button"
              sx={{
                borderColor: "#30638E !important",
                color: "#30638E !important",
                backgroundColor: "transparent !important",
                "&:hover": {
                  backgroundColor: "#30638E !important",
                  color: "#FFF !important"
                },
                mt: 2,
                py: 1.5,
              }}
            >
              Registrarte
            </Button>
          </form>
        </Container>
      </Box>
    </Box>
  );
};

export default Login;