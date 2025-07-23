import React, { useState } from "react";
import { useRouter } from "next/router";
import { Container, TextField, Button, Typography, Box } from "@mui/material";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();

    // Simulación de credenciales sin almacenamiento de cookies
    if (email === "admin@example.com" && password === "1234") {
      router.push("/homepage"); // Redirige al usuario a la página de inicio
    } else {
      setError("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Iniciar sesión
        </Typography>
        {error && <Typography variant="body1" color="error">{error}</Typography>}
        <form onSubmit={handleLogin}>
          <TextField
            label="Correo Electrónico"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ backgroundColor: "#F5F5F5", borderRadius: 1 }}
          />
          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ backgroundColor: "#F5F5F5", borderRadius: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#DC143CF1",
              color: "#FFF",
              "&:hover": { backgroundColor: "#DC143C" },
              mt: 2,
              py: 1.5,
            }}
          >
            Iniciar sesión
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login;