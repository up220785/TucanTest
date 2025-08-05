import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Alert,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "../styles/profile.css";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  last_login: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("tucan_token");
    const userData = localStorage.getItem("tucan_user");

    if (!token || !userData) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        name: parsedUser.name,
        email: parsedUser.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setLoading(false);
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!user) return;

    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    if (!formData.email.trim()) {
      setError("El email es obligatorio.");
      return;
    }

    // If changing password, validate
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setError("Debes ingresar tu contraseña actual para cambiarla.");
        return;
      }

      if (formData.newPassword.length < 8) {
        setError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
      }

      if (!/[A-Za-z]/.test(formData.newPassword)) {
        setError("La nueva contraseña debe contener al menos una letra.");
        return;
      }

      if (!/\d/.test(formData.newPassword)) {
        setError("La nueva contraseña debe contener al menos un número.");
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    try {
      const token = localStorage.getItem("tucan_token");
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local storage with new user data
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem("tucan_user", JSON.stringify(updatedUser));

        setSuccess("Perfil actualizado exitosamente.");
        setIsEditing(false);
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(data.message || data.error || "Error al actualizar el perfil.");
      }
    } catch (error) {
      setError("Error de conexión con el servidor.");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "No disponible";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "No disponible";
    }
  };

  const getRoleLabel = (role: string) => {
    return role === "teacher" ? "Docente" : "Estudiante";
  };

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
  };

  const getRoleColor = (role: string) => {
    return role === "teacher" ? "primary" : "secondary";
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Cargando perfil...</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Error al cargar el perfil.</Typography>
      </Container>
    );
  }

  return (
    <Layout title="Mi Perfil">
      <Container maxWidth="md" sx={{ mt: 2, mb: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackNavigation}
              sx={{ 
                borderColor: "#30638E", 
                color: "#30638E",
                fontFamily: 'Rammetto One, sans-serif'
              }}
            >
              Atrás
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleHomeNavigation}
              sx={{ 
                borderColor: "#30638E", 
                color: "#30638E",
                fontFamily: 'Rammetto One, sans-serif'
              }}
            >
              Inicio
            </Button>
        </Box>
        <Typography variant="h4" component="h1">
          Mi Perfil
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 3, maxHeight: "calc(100vh - 120px)", overflow: "auto" }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Información Personal
          </Typography>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold", minWidth: "80px" }}>
              Rol:
            </Typography>
            <Chip 
              label={getRoleLabel(user.role)} 
              color={getRoleColor(user.role)} 
              variant="outlined" 
            />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Nombre Completo"
            fullWidth
            margin="dense"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            disabled={!isEditing}
            sx={{ backgroundColor: isEditing ? "#fff" : "#f5f5f5", mb: 1 }}
          />

          <TextField
            label="Correo Electrónico"
            type="email"
            fullWidth
            margin="dense"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            disabled={!isEditing}
            sx={{ backgroundColor: isEditing ? "#fff" : "#f5f5f5", mb: 1 }}
          />

          {isEditing && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: "#f8f9fa", borderRadius: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: "bold" }}>
                Cambiar Contraseña (Opcional)
              </Typography>
              
              <TextField
                label="Contraseña Actual"
                type="password"
                fullWidth
                margin="dense"
                size="small"
                value={formData.currentPassword}
                onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                helperText="Solo si deseas cambiar tu contraseña"
                sx={{ mb: 1 }}
              />

              <TextField
                label="Nueva Contraseña"
                type="password"
                fullWidth
                margin="dense"
                size="small"
                value={formData.newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                helperText="Mín. 8 caracteres, letra + número"
                sx={{ mb: 1 }}
              />

              <TextField
                label="Confirmar Nueva Contraseña"
                type="password"
                fullWidth
                margin="dense"
                size="small"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              />
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Información de la Cuenta
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            <strong>Fecha de registro:</strong> {formatDate(user.created_at)}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            <strong>Último acceso:</strong> {formatDate(user.last_login)}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", pt: 1 }}>
          {!isEditing ? (
            <Button
              variant="contained"
              onClick={handleEdit}
              sx={{
                backgroundColor: "#ffcf49",
                color: "#000",
                "&:hover": { backgroundColor: "#e6b844" },
              }}
            >
              Editar Perfil
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                onClick={handleCancel}
                sx={{ borderColor: "#666", color: "#666" }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  backgroundColor: "#30638E",
                  "&:hover": { backgroundColor: "#2a5a85" },
                }}
              >
                Guardar Cambios
              </Button>
            </>
          )}
        </Box>
      </Paper>
      </Container>
    </Layout>
  );
};

export default Profile;
