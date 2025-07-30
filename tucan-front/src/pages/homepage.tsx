import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
} from "@mui/material";
import "../styles/homepage.css";

const HomePage: React.FC = () => {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("tucan_user"); // corregido
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.role) {
          setRole(user.role === "student" ? "student" : "teacher");
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
    }
  }, []);

  return (
    <Box className={`homepage ${role}`}>
      <aside className="sidebar">
        <Typography className="sidebar-title">Mi Perfil</Typography>
        <Typography className="sidebar-item">Formularios Guardados</Typography>
        <Typography className="sidebar-item">Aulas Guardadas</Typography>
      </aside>

      <main className="content">
        <Typography className="welcome">
          Bienvenido {role === "teacher" ? "Docente" : "Estudiante"}
        </Typography>

        {role === "teacher" && (
          <Box className="teacher-actions">
            <Button className="create-form-button">Crear Formulario</Button>
          </Box>
        )}

        <Grid container spacing={2} className="form-grid">
          <Grid item xs={12} sm={6} md={4} component="div">
            <Box className="form-card">
              <Typography className="form-name">Nombre del formulario</Typography>
              <Typography className="form-grade">
                {role === "teacher" ? "Calificación General 10/10" : "Calificación 10/10"}
              </Typography>
              <Typography className="form-status">No Contestado - Pendiente</Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4} component="div">
            <Box className="form-card">
              <Typography className="form-name">Nombre del formulario</Typography>
              <Typography className="form-grade">
                No Calificado - Pendiente
              </Typography>
              <Typography className="form-status">En revisión</Typography>
            </Box>
          </Grid>
        </Grid>
      </main>
    </Box>
  );
};

export default HomePage;