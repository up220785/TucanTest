import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Button,
  Grid,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Quiz as QuizIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { buildApiUrl } from '../config/api';

interface Course {
  id: number;
  name: string;
  email?: string;
  description: string;
  is_public: boolean;
  max_capacity?: number;
  teacher_id: number;
  teacher_name: string;
  created_at: string;
  is_published: boolean;
  enrolled_count: number;
  is_full: boolean;
  quizzes?: Quiz[];
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  due_date?: string;
  is_published: boolean;
  total_points: number;
  submission?: {
    id: number;
    submitted_at: string;
    is_graded: boolean;
    is_pending_manual_grade?: boolean;
    grade?: number;
    total_score?: number;
  };
}

const ViewCourse: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    console.log('ViewCourse component mounted, courseId:', courseId);
    
    // Get user role first
    const userData = localStorage.getItem('tucan_user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
    }
    
    if (courseId) {
      fetchCourseDetails();
    } else {
      console.log('No courseId provided');
      setError('No course ID provided');
      setLoading(false);
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tucan_token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      // Check if user is a teacher
      const userData = localStorage.getItem('tucan_user');
      if (!userData) {
        console.log('No user data found, redirecting to login');
        navigate('/login');
        return;
      }

      const user = JSON.parse(userData);
      console.log('User data:', user);
      
      // Allow both teachers and students to view course details
      if (user.role !== 'teacher' && user.role !== 'student') {
        console.log('User is neither teacher nor student, redirecting to homepage');
        navigate('/homepage');
        return;
      }

      console.log('Fetching course details for courseId:', courseId);
      const response = await fetch(buildApiUrl(`/api/courses/${courseId}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        console.log('Unauthorized, clearing tokens and redirecting');
        localStorage.removeItem('tucan_token');
        localStorage.removeItem('tucan_user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch course details: ${response.status}`);
      }

      const courseData = await response.json();
      console.log('Course data received:', courseData);
      setCourse(courseData);
      setError(null);
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
  };

  console.log('ViewCourse render - loading:', loading, 'error:', error, 'course:', course);

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center', fontFamily: 'Rammetto One, sans-serif' }}>
            Cargando detalles del curso...
          </Typography>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={handleBackNavigation} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontFamily: 'Rammetto One, sans-serif' }}>
              Ver Curso
            </Typography>
            <IconButton onClick={handleHomeNavigation} sx={{ ml: 2 }}>
              <HomeIcon />
            </IconButton>
          </Box>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  if (!course) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Alert severity="warning">Curso no encontrado</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Layout title="Ver Curso">
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={handleBackNavigation} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              {course.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label={course.is_published ? 'Publicado' : 'Borrador'} 
                color={course.is_published ? 'success' : 'warning'} 
              />
              <Chip 
                label={course.is_public ? 'Público' : 'Privado'} 
                color={course.is_public ? 'primary' : 'secondary'} 
              />
            </Box>
          </Box>
          <IconButton onClick={handleHomeNavigation} sx={{ ml: 2 }}>
            <HomeIcon />
          </IconButton>
        </Box>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        {/* Course Information */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Información del Curso
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body1" paragraph sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                <strong>Descripción:</strong>
              </Typography>
              <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                {course.description || 'Sin descripción proporcionada'}
              </Typography>
              
              {course.email && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email de Contacto:</strong> {course.email}
                </Typography>
              )}
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Creado:</strong> {formatDate(course.created_at)}
              </Typography>
              
              <Typography variant="body2">
                <strong>Capacidad:</strong> {course.max_capacity ? `${course.enrolled_count}/${course.max_capacity} estudiantes` : 'Ilimitado'}
              </Typography>
            </CardContent>
          </Card>

          {/* Student Progress Card - Only for Students */}
          {userRole === 'student' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                  <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Mi Progreso
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {(() => {
                  const publishedQuizzes = (course.quizzes || []).filter(quiz => quiz.is_published);
                  const gradedSubmissions = publishedQuizzes.filter(quiz => quiz.submission?.is_graded);
                  
                  const totalEarned = gradedSubmissions.reduce((sum, quiz) => 
                    sum + (quiz.submission?.total_score || 0), 0
                  );
                  const totalPossible = publishedQuizzes.reduce((sum, quiz) => 
                    sum + quiz.total_points, 0
                  );
                  const gradedTotal = gradedSubmissions.reduce((sum, quiz) => 
                    sum + quiz.total_points, 0
                  );
                  
                  const overallPercentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
                  const gradedPercentage = gradedTotal > 0 ? (totalEarned / gradedTotal) * 100 : 0;
                  
                  const getScoreColor = (percentage: number) => {
                    if (percentage >= 90) return 'success';
                    if (percentage >= 80) return 'info';
                    if (percentage >= 70) return 'warning';
                    return 'error';
                  };

                  return (
                    <Box>
                      {/* Overall Score */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body1" fontWeight="medium" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                            Puntuación General del Curso
                          </Typography>
                          <Chip
                            label={`${overallPercentage.toFixed(1)}%`}
                            color={getScoreColor(overallPercentage)}
                            size="medium"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography variant="h4" component="span" color="primary">
                            {totalEarned}
                          </Typography>
                          <Typography variant="h6" component="span" color="text.secondary">
                            / {totalPossible} puntos
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          En {publishedQuizzes.length} quiz{publishedQuizzes.length !== 1 ? 'zes' : ''} publicado{publishedQuizzes.length !== 1 ? 's' : ''}
                        </Typography>
                        
                        {/* Progress Bar */}
                        <LinearProgress
                          variant="determinate"
                          value={overallPercentage}
                          color={getScoreColor(overallPercentage)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>

                      {/* Graded vs Pending */}
                      <Divider sx={{ mb: 2 }} />
                      
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Quizzes Calificados
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" color="primary">
                              {gradedSubmissions.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              / {publishedQuizzes.length}
                            </Typography>
                            {gradedSubmissions.length > 0 && (
                              <Chip
                                label={`${gradedPercentage.toFixed(1)}%`}
                                color={getScoreColor(gradedPercentage)}
                                size="small"
                              />
                            )}
                          </Box>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Pendientes de Calificación
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" color="warning.main">
                              {publishedQuizzes.filter(quiz => quiz.submission && !quiz.submission.is_graded).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              quiz{publishedQuizzes.filter(quiz => quiz.submission && !quiz.submission.is_graded).length !== 1 ? 'zes' : ''}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Sin Intentar
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" color="error.main">
                              {publishedQuizzes.filter(quiz => !quiz.submission).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              quiz{publishedQuizzes.filter(quiz => !quiz.submission).length !== 1 ? 'zes' : ''}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {publishedQuizzes.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Aún no hay quizzes publicados
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 1, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
                            {overallPercentage >= 90 ? "🎉 ¡Excelente trabajo! ¡Sigue así!" :
                             overallPercentage >= 80 ? "👍 ¡Buen trabajo! ¡Lo estás haciendo bien!" :
                             overallPercentage >= 70 ? "📈 ¡Buen progreso! ¡Sigue estudiando!" :
                             overallPercentage >= 60 ? "💪 ¡Vas por buen camino! ¡No te rindas!" :
                             gradedSubmissions.length === 0 ? "🚀 ¿Listo para comenzar tu aventura de quizzes?" :
                             "📚 ¡Sigue trabajando duro - lo tienes!"}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Published Quizzes */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                <QuizIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {userRole === 'teacher' ? 'Todos los Quizzes' : 'Quizzes Disponibles'} ({(course.quizzes || []).filter(quiz => userRole === 'teacher' || quiz.is_published).length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: '#fafafa',
                padding: '8px',
              }}>
                {(!course.quizzes || course.quizzes.filter(quiz => userRole === 'teacher' || quiz.is_published).length === 0) ? (
                  <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {userRole === 'teacher' ? 'Sin Quizzes Creados' : 'Sin Quizzes Publicados'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {userRole === 'teacher' 
                        ? 'Crea y publica quizzes para verlos aquí'
                        : 'Revisa más tarde para nuevos quizzes'
                      }
                    </Typography>
                    {userRole === 'teacher' && (
                      <Button 
                        variant="outlined" 
                        sx={{ 
                          mt: 2,
                          fontFamily: 'Rammetto One, sans-serif',
                        }}
                        onClick={() => navigate(`/courses/${courseId}/quizzes`)}
                      >
                        Gestionar Quizzes
                      </Button>
                    )}
                  </Paper>
                ) : (
                  <List sx={{ py: 0 }}>
                    {(course.quizzes || [])
                      .filter(quiz => userRole === 'teacher' || quiz.is_published)
                      .map((quiz, index) => (
                      <React.Fragment key={quiz.id}>
                        <ListItem 
                          sx={{ 
                            pl: 0,
                            '&:hover': { 
                              backgroundColor: 'action.hover',
                              borderRadius: 1,
                              cursor: userRole === 'teacher' ? 'pointer' : 'default'
                            }
                          }}
                          onClick={() => userRole === 'teacher' && navigate(`/courses/${courseId}/quizzes/${quiz.id}`)}
                        >
                          <ListItemIcon>
                            {userRole === 'student' ? (
                              quiz.submission ? (
                                quiz.submission.is_graded ? (
                                  <CheckCircleIcon color="primary" />
                                ) : (
                                  <CheckCircleIcon color="info" />
                                )
                              ) : quiz.is_published ? (
                                <CheckCircleIcon color="error" />
                              ) : (
                                <CheckCircleIcon color="disabled" />
                              )
                            ) : (
                              quiz.is_published ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <CheckCircleIcon color="disabled" />
                              )
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {quiz.title}
                                  <Chip 
                                    label={quiz.is_published ? 'Publicado' : 'Borrador'} 
                                    color={quiz.is_published ? 'success' : 'warning'} 
                                    size="small"
                                  />
                                  {userRole === 'student' && quiz.submission && (
                                    <Chip 
                                      label={
                                        quiz.submission.is_graded ? 'Calificado' : 
                                        quiz.submission.is_pending_manual_grade ? 'Pendiente de Calificación' : 'Enviado'
                                      } 
                                      color={
                                        quiz.submission.is_graded ? 'primary' : 
                                        quiz.submission.is_pending_manual_grade ? 'warning' : 'info'
                                      } 
                                      size="small"
                                      clickable={true}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/quiz/${quiz.id}/results`);
                                      }}
                                      sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: quiz.submission.is_graded ? 'primary.dark' : 
                                            quiz.submission.is_pending_manual_grade ? 'warning.dark' : 'info.dark',
                                          color: 'white'
                                        }
                                      }}
                                    />
                                  )}
                                  {userRole === 'student' && !quiz.submission && quiz.is_published && (
                                    <Chip 
                                      label="Sin Intentar" 
                                      color="error" 
                                      size="small"
                                    />
                                  )}
                                </Box>
                                {userRole === 'student' && !quiz.submission && quiz.is_published && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    sx={{ 
                                      ml: 1,
                                      fontFamily: 'Rammetto One, sans-serif',
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/quiz/${quiz.id}/take`);
                                    }}
                                  >
                                    Tomar Quiz
                                  </Button>
                                )}
                                {userRole === 'teacher' && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="info"
                                    startIcon={<BarChartIcon />}
                                    sx={{ 
                                      ml: 1,
                                      fontFamily: 'Rammetto One, sans-serif',
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/quiz/${quiz.id}/statistics`);
                                    }}
                                  >
                                    Estadísticas
                                  </Button>
                                )}
                              </Box>
                            }
                            secondary={
                              <span>
                                <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                  {quiz.description || 'Sin descripción'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                  {quiz.total_points} puntos
                                  {quiz.due_date && ` • Vence: ${formatDateTime(quiz.due_date)}`}
                                  {userRole === 'student' && quiz.submission && quiz.submission.is_graded && (
                                    ` • Puntuación: ${quiz.submission.total_score || 0}/${quiz.total_points} (${Math.round(((quiz.submission.total_score || 0) / quiz.total_points) * 100)}%)`
                                  )}
                                  {userRole === 'student' && quiz.submission && quiz.submission.submitted_at && (
                                    ` • Enviado: ${formatDateTime(quiz.submission.submitted_at)}`
                                  )}
                                </Typography>
                              </span>
                            }
                          />
                        </ListItem>
                        {index < (course.quizzes || []).filter(quiz => userRole === 'teacher' || quiz.is_published).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar - Different content for Teachers vs Students */}
        <Grid size={{ xs: 12, md: 4 }}>
          {userRole === 'teacher' ? (
            <>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                    Acciones Rápidas
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PeopleIcon />}
                      onClick={() => navigate(`/courses/${courseId}/students`)}
                      sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                    >
                      Ver Estudiantes
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<QuizIcon />}
                      onClick={() => navigate(`/courses/${courseId}/quizzes`)}
                      sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                    >
                      Gestionar Quizzes
                    </Button>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<BarChartIcon />}
                      onClick={() => navigate(`/courses/${courseId}/statistics`)}
                      sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                    >
                      Estadísticas del Curso
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Course Stats */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                    Resumen del Curso
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total de Estudiantes:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {course.enrolled_count}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total de Quizzes:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {(course.quizzes || []).length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Quizzes Publicados:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {(course.quizzes || []).filter(quiz => quiz.is_published).length}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Total de Puntos:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {(course.quizzes || []).reduce((sum, quiz) => sum + (quiz.total_points || 0), 0)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Estado:</Typography>
                    <Chip 
                      label={course.is_full ? 'Lleno' : 'Abierto'} 
                      color={course.is_full ? 'error' : 'success'} 
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Student Sidebar */
            <>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                    Estadísticas Rápidas
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {(() => {
                    const publishedQuizzes = (course.quizzes || []).filter(quiz => quiz.is_published);
                    const gradedSubmissions = publishedQuizzes.filter(quiz => quiz.submission?.is_graded);
                    
                    if (gradedSubmissions.length === 0) {
                      return (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            ¡Completa algunos quizzes para ver tus estadísticas aquí!
                          </Typography>
                        </Box>
                      );
                    }
                    
                    const scores = gradedSubmissions.map(quiz => ({
                      title: quiz.title,
                      percentage: ((quiz.submission?.total_score || 0) / quiz.total_points) * 100
                    }));
                    
                    const bestQuiz = scores.reduce((best, current) => 
                      current.percentage > best.percentage ? current : best
                    );
                    
                    const averageScore = scores.reduce((sum, quiz) => sum + quiz.percentage, 0) / scores.length;
                    
                    return (
                      <Stack spacing={1.5}>
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Mejor Rendimiento
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" fontWeight="bold" color="success.main">
                              {bestQuiz.percentage.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap',
                              maxWidth: '120px'
                            }}>
                              {bestQuiz.title}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Puntuación Promedio
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color="primary">
                            {averageScore.toFixed(1)}%
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Quizzes Completados
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {gradedSubmissions.length} / {publishedQuizzes.length}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })()}
                </CardContent>
              </Card>
              
              {/* Course Info for Students */}
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                    Información del Curso
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Instructor:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {course.teacher_name}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Estudiantes:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {course.enrolled_count}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total de Quizzes:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(course.quizzes || []).filter(quiz => quiz.is_published).length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total de Puntos:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(course.quizzes || []).filter(quiz => quiz.is_published).reduce((sum, quiz) => sum + quiz.total_points, 0)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
        </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};export default ViewCourse;
