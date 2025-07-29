// src/pages/HomePage.tsx
import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Bienvenido a la página de inicio 🏋️‍♂️
      </Typography>
      <Typography variant="body1" gutterBottom>
        Aquí puedes ver tu rutina personalizada y explorar productos.
      </Typography>
      <Button
        variant="contained"
        sx={{ backgroundColor: "#DC143CF1", mt: 2 }}
        onClick={handleLogout}
      >
        Cerrar sesión
      </Button>
    </Container>
  );
};

export default HomePage;