import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import "../styles/homepage.css";

const HomePage: React.FC = () => {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("tucan_user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.role) {
          setRole(user.role === "student" ? "student" : "teacher");
          setUserName(user.name || "Usuario");
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear user session data
    localStorage.removeItem("tucan_token");
    localStorage.removeItem("tucan_user");
    
    // Redirect to login page
    navigate("/login", { 
      state: { 
        message: "Sesión cerrada exitosamente." 
      } 
    });
  };

  return (
    <Box className={`homepage ${role}`}>
      <aside className="sidebar">
        <Typography className="sidebar-title">Mi Perfil</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
          {userName}
        </Typography>
        
        <Typography 
          className="sidebar-item" 
          onClick={() => navigate("/profile")}
          sx={{ 
            cursor: "pointer", 
            "&:hover": { 
              backgroundColor: "#f0f0f0", 
              borderRadius: "4px",
              padding: "4px 8px",
              margin: "0 -8px"
            } 
          }}
        >
          Ver Mi Perfil
        </Typography>
        <Typography className="sidebar-item">Formularios Guardados</Typography>
        <Typography className="sidebar-item">Aulas Guardadas</Typography>
        
        <Box sx={{ mt: "auto", pt: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={handleLogout}
            sx={{
              borderColor: "#d32f2f",
              color: "#d32f2f",
              "&:hover": { 
                backgroundColor: "#d32f2f", 
                color: "#fff" 
              },
              fontWeight: "bold",
            }}
          >
            Cerrar Sesión
          </Button>
        </Box>
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

        <Box
          className="form-grid"
          display="flex"
          flexWrap="wrap"
          gap={2}
          justifyContent="flex-start"
        >
          <Box className="form-card" flex="1 1 300px">
            <Typography className="form-name">Nombre del formulario</Typography>
            <Typography className="form-grade">
              {role === "teacher"
                ? "Calificación General 10/10"
                : "Calificación 10/10"}
            </Typography>
            <Typography className="form-status">No Contestado - Pendiente</Typography>
          </Box>

          <Box className="form-card" flex="1 1 300px">
            <Typography className="form-name">Nombre del formulario</Typography>
            <Typography className="form-grade">No Calificado - Pendiente</Typography>
            <Typography className="form-status">En revisión</Typography>
          </Box>
        </Box>
      </main>
    </Box>
  );
};

export default HomePage;