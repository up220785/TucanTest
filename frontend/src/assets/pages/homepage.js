import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { useRouter } from "next/router";

const HomePage = () => {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/login"); // Redirige al login tras cerrar sesión
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: "center", mt: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
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