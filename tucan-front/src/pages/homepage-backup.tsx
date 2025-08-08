import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Badge,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Container,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  AccountCircle as AccountCircleIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  MenuBook as MenuBookIcon,
  Assessment as AssessmentIcon,
  ExitToApp as ExitToAppIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config/api";
import SearchBar from "../components/SearchBar";
import Layout from "../components/Layout";
import "../styles/homepage.css";
import "../styles/mobile-responsive.css";

interface Course {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  is_published: boolean;
  max_capacity?: number;
  enrolled_count: number;
  quiz_count: number;
  created_at: string;
  teacher_name?: string;
  enrollment_date?: string;
}

const HomePage: React.FC = () => {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const userData = localStorage.getItem("tucan_user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.role) {
          setRole(user.role === "student" ? "student" : "teacher");
          setUserName(user.name || "Usuario");
          setUserId(user.id);
          
          // Fetch unread notifications count for all users
          fetchUnreadNotifications(user.id);
          
          // Fetch published courses if user is a teacher
          if (user.role === "teacher") {
            fetchPublishedCourses(user.id);
          } else if (user.role === "student") {
            fetchEnrolledCourses(user.id);
          }
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
    }
  }, []);

  const fetchPublishedCourses = async (teacherId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("tucan_token");
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(buildApiUrl(`/api/course-users/teachers/${teacherId}/courses`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('tucan_token');
        localStorage.removeItem('tucan_user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      
      // Filter to show only published courses
      const publishedCourses = data.filter((course: Course) => course.is_published);
      setCourses(publishedCourses.slice(0, 4)); // Show max 4 courses on homepage
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async (studentId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("tucan_token");
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(buildApiUrl(`/api/course-users/students/${studentId}/courses`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('tucan_token');
        localStorage.removeItem('tucan_user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch enrolled courses');
      }

      const data = await response.json();
      
      // Show max 4 enrolled courses on homepage
      setCourses(data.slice(0, 4));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotifications = async (userId: number) => {
    try {
      const token = localStorage.getItem("tucan_token");
      
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl(`/api/notifications/users/${userId}/notifications`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.notifications?.filter((notification: any) => !notification.is_read).length || 0;
        setUnreadNotifications(unreadCount);
      }
    } catch (err) {
      // Silently handle errors for notifications count
      console.error('Failed to fetch unread notifications count:', err);
    }
  };

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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    handleLogout();
  };

  return (
    <Layout title="TucanTest" showSearchBar={true}>
      <Container maxWidth="lg" className="responsive-container">
        {/* Welcome Section */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h4" 
            className="responsive-title welcome"
            sx={{ 
              color: role === 'teacher' ? '#EA5C00' : '#30638E',
              fontFamily: 'Rammetto One, sans-serif',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}
          >
            ¡Hola, {userName}!
          </Typography>
      <AppBar position="sticky" sx={{ 
        backgroundColor: role === 'teacher' ? '#EA5C00' : '#30638E', 
        zIndex: 1100 
      }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold', 
            mr: 3,
            fontFamily: 'Rammetto One, sans-serif'
          }}>
            TucanTest
          </Typography>
          
          {/* Search Bar */}
          <Box sx={{ flexGrow: 1, maxWidth: 400, mr: 2 }}>
            <SearchBar userRole={role} userId={userId} />
          </Box>
          
          {/* Navigation Options based on role */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {role === "teacher" && (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate("/my-courses")}
                  sx={{ 
                    textTransform: 'none',
                    fontFamily: 'Rammetto One, sans-serif'
                  }}
                >
                  Mis Cursos
                </Button>
                <Button 
                  color="inherit" 
                  startIcon={<AssessmentIcon />}
                  onClick={() => navigate("/teacher/statistics")}
                  sx={{ 
                    textTransform: 'none',
                    fontFamily: 'Rammetto One, sans-serif'
                  }}
                >
                  Estadísticas
                </Button>
                <IconButton
                  color="inherit"
                  onClick={() => navigate("/notifications")}
                  sx={{ ml: 1 }}
                >
                  <Badge 
                    badgeContent={unreadNotifications > 0 ? unreadNotifications : undefined} 
                    color="error"
                    showZero={false}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </>
            )}

            {role === "student" && (
              <>
                <Button 
                  color="inherit" 
                  startIcon={<SearchIcon />}
                  onClick={() => navigate("/explore-courses")}
                  sx={{ 
                    textTransform: 'none',
                    fontFamily: 'Rammetto One, sans-serif'
                  }}
                >
                  Explorar Cursos
                </Button>
                <IconButton
                  color="inherit"
                  onClick={() => navigate("/notifications")}
                  sx={{ ml: 1 }}
                >
                  <Badge 
                    badgeContent={unreadNotifications > 0 ? unreadNotifications : undefined} 
                    color="error"
                    showZero={false}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </>
            )}

            {/* Profile Menu */}
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ ml: 2 }}
            >
              <AccountCircleIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={handleProfileClick} sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
          <AccountCircleIcon sx={{ mr: 1 }} />
          Ver mi Perfil
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogoutClick} sx={{ 
          color: 'error.main',
          fontFamily: 'Rammetto One, sans-serif'
        }}>
          <ExitToAppIcon sx={{ mr: 1 }} />
          Cerrar Sesión
        </MenuItem>
      </Menu>

      <Box className={`homepage ${role}`}>
        <main className="content" style={{ width: '100%', padding: '40px' }}>
          <Typography className="welcome" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
            Bienvenido {role === "teacher" ? "Docente" : "Estudiante"}, {userName}
          </Typography>

        {role === "teacher" && (
          <Box className="teacher-actions">
            <Button 
              className="create-form-button"
              onClick={() => navigate("/my-courses")}
              sx={{ fontFamily: 'Rammetto One, sans-serif' }}
            >
              Gestionar Cursos
            </Button>
          </Box>
        )}

        {role === "student" && (
          <Box className="teacher-actions">
            <Button 
              className="create-form-button"
              onClick={() => navigate("/explore-courses")}
              sx={{ fontFamily: 'Rammetto One, sans-serif' }}
            >
              Explorar Cursos
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ 
            mb: 3,
            fontFamily: 'Rammetto One, sans-serif',
            '& .MuiAlert-message': {
              fontFamily: 'Rammetto One, sans-serif'
            }
          }}>
            {error}
          </Alert>
        )}

        {role === "teacher" && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 600,
              fontFamily: 'Rammetto One, sans-serif'
            }}>
              Mis Cursos Publicados
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : courses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body1" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                  No tienes cursos publicados aún
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ 
                    mt: 2,
                    fontFamily: 'Rammetto One, sans-serif'
                  }}
                  onClick={() => navigate("/my-courses")}
                >
                  Crear tu primer curso
                </Button>
              </Box>
            ) : (
              <Box
                className="form-grid"
                display="flex"
                flexWrap="wrap"
                gap={2}
                justifyContent="flex-start"
              >
                {courses.map((course) => (
                  <Card 
                    key={course.id} 
                    sx={{ 
                      flex: "1 1 300px", 
                      maxWidth: 400,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3,
                      }
                    }}
                    onClick={() => navigate(`/courses/${course.id}/view`)}
                  >
                    <CardContent>
                      <Typography variant="h6" className="form-name" sx={{ 
                        mb: 1,
                        fontFamily: 'Rammetto One, sans-serif'
                      }}>
                        {course.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 2,
                        fontFamily: 'Rammetto One, sans-serif'
                      }}>
                        {course.description || 'Sin descripción'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip 
                          label="Publicado" 
                          color="success" 
                          size="small"
                          sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                        />
                        <Chip 
                          label={course.is_public ? 'Público' : 'Privado'} 
                          color={course.is_public ? 'primary' : 'secondary'} 
                          size="small"
                          sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                        />
                      </Box>
                      <Typography className="form-grade" variant="body2" sx={{
                        fontFamily: 'Rammetto One, sans-serif'
                      }}>
                        {course.enrolled_count} estudiante{course.enrolled_count !== 1 ? 's' : ''} matriculado{course.enrolled_count !== 1 ? 's' : ''}
                        {course.max_capacity && ` / ${course.max_capacity}`}
                      </Typography>
                      <Typography className="form-status" variant="body2" sx={{
                        fontFamily: 'Rammetto One, sans-serif'
                      }}>
                        {course.quiz_count} quiz{course.quiz_count !== 1 ? 'zes' : ''} disponible{course.quiz_count !== 1 ? 's' : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {courses.length > 0 && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate("/my-courses")}
                  sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                >
                  Ver todos mis cursos
                </Button>
              </Box>
            )}
          </Box>
        )}

        {role === "student" && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ 
              mb: 2, 
              fontWeight: 600,
              fontFamily: 'Rammetto One, sans-serif'
            }}>
              Mis Cursos Matriculados
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : courses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body1" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                  No estás matriculado en ningún curso aún
                </Typography>
                <Button 
                  variant="outlined" 
                  sx={{ 
                    mt: 2,
                    fontFamily: 'Rammetto One, sans-serif'
                  }}
                  onClick={() => navigate("/explore-courses")}
                >
                  Explorar cursos disponibles
                </Button>
              </Box>
            ) : (
              <Box
                className="form-grid"
                display="flex"
                flexWrap="wrap"
                gap={2}
                justifyContent="flex-start"
              >
                {courses.map((course) => (
                  <Card 
                    key={course.id} 
                    sx={{ 
                      flex: "1 1 300px", 
                      maxWidth: 400,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 3,
                      }
                    }}
                    onClick={() => navigate(`/courses/${course.id}/view`)}
                  >
                    <CardContent>
                      <Typography variant="h6" className="form-name" sx={{ 
                        mb: 1,
                        fontFamily: 'Rammetto One, sans-serif'
                      }}>
                        {course.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ 
                        mb: 2,
                        fontFamily: 'Rammetto One, sans-serif'
                      }}>
                        {course.description || 'Sin descripción'}
                      </Typography>
                      {course.teacher_name && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          mb: 1,
                          fontFamily: 'Rammetto One, sans-serif'
                        }}>
                          Profesor: {course.teacher_name}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip 
                          label="Matriculado" 
                          color="success" 
                          size="small"
                          sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                        />
                        <Chip 
                          label={course.is_public ? 'Público' : 'Privado'} 
                          color={course.is_public ? 'primary' : 'secondary'} 
                          size="small"
                          sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                        />
                      </Box>
                      <Typography className="form-grade" variant="body2" sx={{
                        fontFamily: 'Rammetto One, sans-serif'
                      }}>
                        {course.enrolled_count} estudiante{course.enrolled_count !== 1 ? 's' : ''} matriculado{course.enrolled_count !== 1 ? 's' : ''}
                      </Typography>
                      <Typography className="form-status" variant="body2" sx={{
                        fontFamily: 'Rammetto One, sans-serif'
                      }}>
                        {course.quiz_count} quiz{course.quiz_count !== 1 ? 'zes' : ''} disponible{course.quiz_count !== 1 ? 's' : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}

            {courses.length > 0 && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate("/explore-courses")}
                  sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                >
                  Explorar más cursos
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Layout>
  );
};

export default HomePage;