import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  LinearProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Publish as PublishIcon,
  UnpublishedOutlined as UnpublishedIcon,
  BarChart as BarChartIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';

interface Course {
  id: number;
  name: string;
  description: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  due_date?: string | null;
  is_published: boolean;
  created_at: string;
  total_points: number;
  question_count: number;
  is_past_due: boolean;
}

const CourseQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchQuizzes();
      
      // Get user role from localStorage
      const userData = localStorage.getItem('tucan_user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const courseData = await response.json();
        setCourse(courseData);
      } else {
        setError('Failed to load course details');
      }
    } catch (err) {
      setError('Failed to load course details');
    }
  };

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      // For teachers, show all quizzes (published and unpublished)
      // For students, show only published quizzes
      const publishedOnlyParam = userRole === 'student' ? 'true' : 'false';
      
      const response = await fetch(`http://localhost:5000/api/quizzes/courses/${courseId}/quizzes?published_only=${publishedOnlyParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch quizzes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => {
    setAnchorEl(event.currentTarget);
    setSelectedQuiz(quiz);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedQuiz(null);
  };

  const handleCreateQuiz = () => {
    navigate(`/courses/${courseId}/create-quiz`);
  };

  const handleViewQuiz = (quizId: number) => {
    if (userRole === 'teacher') {
      navigate(`/quiz/${quizId}/submissions`);
    } else {
      navigate(`/quiz/${quizId}/take`);
    }
    handleMenuClose();
  };

  const handleStatsView = (quizId: number) => {
    navigate(`/quiz/${quizId}/statistics`);
    handleMenuClose();
  };

  const handleEditQuiz = (quizId: number) => {
    navigate(`/quizzes/${quizId}/edit`);
    handleMenuClose();
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este quiz? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
        handleMenuClose();
      } else {
        throw new Error('Failed to delete quiz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete quiz');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
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

  const formatDueDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Sin fecha límite';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            Cargando quizzes...
          </Typography>
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
          <Alert severity="error">Curso no encontrado</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Layout title="Gestionar Quizzes">
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={handleBackNavigation} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
            <QuizIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Gestionar Quizzes del Curso
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
            {course.name}
          </Typography>
        </Box>
        <IconButton onClick={handleHomeNavigation} sx={{ ml: 2 }}>
          <HomeIcon />
        </IconButton>
      </Box>

      {userRole === 'teacher' && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateQuiz}
          sx={{ 
            mb: 2,
            backgroundColor: '#EA5C00',
            '&:hover': {
              backgroundColor: '#c44e00',
            },
            fontFamily: 'Rammetto One, sans-serif',
          }}
        >
          Crear Nuevo Quiz
        </Button>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <QuizIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              No hay quizzes disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {userRole === 'teacher' 
                ? '¡Crea tu primer quiz para comenzar!'
                : 'Aún no se han publicado quizzes para este curso.'
              }
            </Typography>
            {userRole === 'teacher' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateQuiz}
                sx={{
                  backgroundColor: '#EA5C00',
                  '&:hover': {
                    backgroundColor: '#c44e00',
                  },
                  fontFamily: 'Rammetto One, sans-serif',
                }}
              >
                Crear Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box 
          sx={{ 
            maxHeight: '70vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}
        >
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                md: 'repeat(2, 1fr)', 
                lg: 'repeat(3, 1fr)' 
              },
              gap: 3 
            }}
          >
            {quizzes.map((quiz) => (
            <Box key={quiz.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 3,
                  }
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ flex: 1, mr: 1 }}>
                      {quiz.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={quiz.is_published ? <PublishIcon /> : <UnpublishedIcon />}
                        label={quiz.is_published ? 'Publicado' : 'Borrador'}
                        size="small"
                        color={quiz.is_published ? 'success' : 'default'}
                        variant={quiz.is_published ? 'filled' : 'outlined'}
                      />
                      {userRole === 'teacher' && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, quiz)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>

                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {quiz.description}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignmentIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {quiz.question_count} {quiz.question_count === 1 ? 'pregunta' : 'preguntas'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QuizIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {quiz.total_points} {quiz.total_points === 1 ? 'punto' : 'puntos'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Vencimiento: {formatDueDate(quiz.due_date)}
                      </Typography>
                      {quiz.is_past_due && (
                        <Chip label="Vencido" size="small" color="error" />
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Creado: {formatDate(quiz.created_at)}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewQuiz(quiz.id)}
                    disabled={!quiz.is_published && userRole === 'student'}
                    sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                  >
                    {userRole === 'teacher' ? 'Ver Entregas' : 'Tomar Quiz'}
                  </Button>
                  {userRole === 'teacher' && (
                    <Button
                      size="small"
                      startIcon={<BarChartIcon />}
                      onClick={() => handleStatsView(quiz.id)}
                      sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                    >
                      Estadísticas
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Box>
          ))}
          </Box>
        </Box>
      )}

      {/* Quiz Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedQuiz && handleViewQuiz(selectedQuiz.id)}>
          <VisibilityIcon sx={{ mr: 1 }} />
          Ver Entregas
        </MenuItem>
        <MenuItem onClick={() => selectedQuiz && handleStatsView(selectedQuiz.id)}>
          <BarChartIcon sx={{ mr: 1 }} />
          Estadísticas
        </MenuItem>
        <MenuItem onClick={() => selectedQuiz && handleEditQuiz(selectedQuiz.id)}>
          <EditIcon sx={{ mr: 1 }} />
          Editar Quiz
        </MenuItem>
        <MenuItem 
          onClick={() => selectedQuiz && handleDeleteQuiz(selectedQuiz.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Eliminar Quiz
        </MenuItem>
      </Menu>
      </Container>
    </Layout>
  );
};

export default CourseQuizzes;
