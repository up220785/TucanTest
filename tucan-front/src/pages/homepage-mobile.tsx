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
  Container,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  School as SchoolIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config/api";
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

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        console.error('Failed to fetch courses');
        setError('Error al cargar los cursos');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Error al cargar los cursos');
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

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        console.error('Failed to fetch courses');
        setError('Error al cargar los cursos matriculados');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Error al cargar los cursos matriculados');
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
      console.error('Failed to fetch unread notifications count:', err);
    }
  };

  if (!role) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

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
          
          {role === 'teacher' && (
            <Box sx={{ 
              mb: { xs: 2, sm: 3 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 2 }
            }}>
              <Button
                variant="contained"
                onClick={() => navigate("/my-courses")}
                startIcon={<SchoolIcon />}
                className="responsive-button"
                sx={{
                  backgroundColor: '#EA5C00',
                  '&:hover': { backgroundColor: '#d54800' },
                  fontFamily: 'Rammetto One, sans-serif',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Gestionar Mis Cursos
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/teacher/statistics")}
                startIcon={<AssessmentIcon />}
                className="responsive-button"
                sx={{
                  borderColor: '#EA5C00',
                  color: '#EA5C00',
                  '&:hover': { 
                    backgroundColor: 'rgba(234, 92, 0, 0.1)',
                    borderColor: '#EA5C00' 
                  },
                  fontFamily: 'Rammetto One, sans-serif',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Ver Estadísticas
              </Button>
            </Box>
          )}

          {role === 'student' && (
            <Button
              variant="contained"
              onClick={() => navigate("/explore-courses")}
              startIcon={<SearchIcon />}
              className="responsive-button"
              sx={{
                backgroundColor: '#30638E',
                '&:hover': { backgroundColor: '#245277' },
                fontFamily: 'Rammetto One, sans-serif',
                mb: { xs: 2, sm: 3 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Explorar Cursos
            </Button>
          )}
        </Box>

        {/* Courses Section */}
        {loading && (
          <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontFamily: 'Rammetto One, sans-serif' }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Box>
            {role === 'teacher' && (
              <Typography 
                variant="h5" 
                className="responsive-subtitle"
                sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontFamily: 'Rammetto One, sans-serif',
                  color: '#EA5C00' 
                }}
              >
                Mis Cursos Publicados ({courses.length})
              </Typography>
            )}

            {role === 'student' && (
              <Typography 
                variant="h5" 
                className="responsive-subtitle"
                sx={{ 
                  mb: { xs: 2, sm: 3 }, 
                  fontFamily: 'Rammetto One, sans-serif',
                  color: '#30638E' 
                }}
              >
                Mis Cursos Matriculados ({courses.length})
              </Typography>
            )}

            {courses.length === 0 ? (
              <Card className="responsive-card" sx={{ textAlign: 'center', py: 4 }}>
                <CardContent>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      fontFamily: 'Rammetto One, sans-serif',
                      color: 'text.secondary' 
                    }}
                  >
                    {role === 'teacher' 
                      ? '¡Aún no tienes cursos publicados!' 
                      : '¡Aún no estás matriculado en ningún curso!'
                    }
                  </Typography>
                  <Typography 
                    className="responsive-body-text"
                    sx={{ 
                      mb: 3, 
                      fontFamily: 'Rammetto One, sans-serif',
                      color: 'text.secondary' 
                    }}
                  >
                    {role === 'teacher' 
                      ? 'Crea tu primer curso y comienza a enseñar.' 
                      : 'Explora nuestros cursos disponibles y comienza a aprender.'
                    }
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate(role === 'teacher' ? "/my-courses" : "/explore-courses")}
                    className="responsive-button"
                    sx={{
                      backgroundColor: role === 'teacher' ? '#EA5C00' : '#30638E',
                      '&:hover': { 
                        backgroundColor: role === 'teacher' ? '#d54800' : '#245277' 
                      },
                      fontFamily: 'Rammetto One, sans-serif'
                    }}
                  >
                    {role === 'teacher' ? 'Crear Curso' : 'Explorar Cursos'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 3 }} className="responsive-grid">
                {courses.map((course) => (
                  <Grid item xs={12} sm={6} md={4} key={course.id}>
                    <Card 
                      className="responsive-card"
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }
                      }}
                      onClick={() => navigate(`/courses/${course.id}/view`)}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="h6" 
                          className="responsive-subtitle"
                          sx={{ 
                            mb: 1, 
                            fontFamily: 'Rammetto One, sans-serif',
                            color: role === 'teacher' ? '#EA5C00' : '#30638E',
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                          }}
                        >
                          {course.name}
                        </Typography>
                        
                        <Typography 
                          className="responsive-body-text"
                          sx={{ 
                            mb: 2, 
                            fontFamily: 'Rammetto One, sans-serif',
                            color: 'text.secondary',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {course.description}
                        </Typography>

                        {role === 'student' && course.teacher_name && (
                          <Typography 
                            variant="body2" 
                            className="responsive-body-text"
                            sx={{ 
                              mb: 1,
                              fontFamily: 'Rammetto One, sans-serif',
                              color: 'text.secondary'
                            }}
                          >
                            Profesor: {course.teacher_name}
                          </Typography>
                        )}

                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1, 
                          mb: 2, 
                          flexWrap: 'wrap' 
                        }}>
                          {role === 'student' && (
                            <Chip 
                              label="Matriculado" 
                              color="success" 
                              size="small"
                              sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                            />
                          )}
                          <Chip 
                            label={course.is_public ? 'Público' : 'Privado'} 
                            color={course.is_public ? 'primary' : 'secondary'} 
                            size="small"
                            sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                          />
                          {role === 'teacher' && (
                            <Chip 
                              label={course.is_published ? 'Publicado' : 'Borrador'} 
                              color={course.is_published ? 'success' : 'warning'} 
                              size="small"
                              sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                            />
                          )}
                        </Box>

                        <Typography 
                          className="responsive-body-text"
                          sx={{
                            fontFamily: 'Rammetto One, sans-serif',
                            color: 'text.secondary',
                            fontSize: '0.875rem'
                          }}
                        >
                          {course.enrolled_count} estudiante{course.enrolled_count !== 1 ? 's' : ''}
                        </Typography>
                        <Typography 
                          className="responsive-body-text"
                          sx={{
                            fontFamily: 'Rammetto One, sans-serif',
                            color: 'text.secondary',
                            fontSize: '0.875rem'
                          }}
                        >
                          {course.quiz_count} quiz{course.quiz_count !== 1 ? 'zes' : ''}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {courses.length > 0 && (
              <Box sx={{ textAlign: 'center', mt: { xs: 3, sm: 4 } }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate(role === 'teacher' ? "/my-courses" : "/explore-courses")}
                  className="responsive-button"
                  sx={{ 
                    fontFamily: 'Rammetto One, sans-serif',
                    borderColor: role === 'teacher' ? '#EA5C00' : '#30638E',
                    color: role === 'teacher' ? '#EA5C00' : '#30638E',
                    '&:hover': {
                      backgroundColor: role === 'teacher' ? 'rgba(234, 92, 0, 0.1)' : 'rgba(48, 99, 142, 0.1)',
                      borderColor: role === 'teacher' ? '#EA5C00' : '#30638E'
                    }
                  }}
                >
                  {role === 'teacher' ? 'Ver todos mis cursos' : 'Explorar más cursos'}
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
