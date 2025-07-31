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
  Grid,
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
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

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
      navigate(`/quizzes/${quizId}/view`);
    } else {
      navigate(`/quizzes/${quizId}/take`);
    }
    handleMenuClose();
  };

  const handleEditQuiz = (quizId: number) => {
    navigate(`/quizzes/${quizId}/edit`);
    handleMenuClose();
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading quizzes...
        </Typography>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Course not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={() => navigate('/my-courses')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1">
              <QuizIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Course Quizzes
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {course.name}
            </Typography>
          </Box>
        </Box>

        {userRole === 'teacher' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateQuiz}
            sx={{ mb: 2 }}
          >
            Create New Quiz
          </Button>
        )}
      </Box>

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
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No quizzes available
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {userRole === 'teacher' 
                ? 'Create your first quiz to get started!'
                : 'No quizzes have been published for this course yet.'
              }
            </Typography>
            {userRole === 'teacher' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateQuiz}
              >
                Create Quiz
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} md={6} lg={4} key={quiz.id}>
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
                        label={quiz.is_published ? 'Published' : 'Draft'}
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
                        {quiz.question_count} {quiz.question_count === 1 ? 'question' : 'questions'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QuizIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {quiz.total_points} {quiz.total_points === 1 ? 'point' : 'points'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        Due: {formatDueDate(quiz.due_date)}
                      </Typography>
                      {quiz.is_past_due && (
                        <Chip label="Past Due" size="small" color="error" />
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Created: {formatDate(quiz.created_at)}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => handleViewQuiz(quiz.id)}
                    disabled={!quiz.is_published && userRole === 'student'}
                  >
                    {userRole === 'teacher' ? 'View' : 'Take Quiz'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Quiz Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedQuiz && handleViewQuiz(selectedQuiz.id)}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Quiz
        </MenuItem>
        <MenuItem onClick={() => selectedQuiz && handleEditQuiz(selectedQuiz.id)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Quiz
        </MenuItem>
        <MenuItem 
          onClick={() => selectedQuiz && handleDeleteQuiz(selectedQuiz.id)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Quiz
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default CourseQuizzes;
