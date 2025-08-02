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
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

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
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
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

  console.log('ViewCourse render - loading:', loading, 'error:', error, 'course:', course);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading course details...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/homepage')}
        >
          Back to Homepage
        </Button>
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
    <Box sx={{ 
      minHeight: '100vh', 
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor: '#f5f5f5',
      pb: 4
    }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4, minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/homepage')}
            sx={{ mb: 2 }}
          >
            Back to Homepage
          </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          {course.name}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip 
            label={course.is_published ? 'Published' : 'Draft'} 
            color={course.is_published ? 'success' : 'warning'} 
          />
          <Chip 
            label={course.is_public ? 'Public' : 'Private'} 
            color={course.is_public ? 'primary' : 'secondary'} 
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Course Information */}
        <Grid size={{ xs: 12, md: userRole === 'teacher' ? 8 : 12 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Course Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body1" paragraph>
                <strong>Description:</strong>
              </Typography>
              <Typography variant="body2" paragraph sx={{ pl: 2 }}>
                {course.description || 'No description provided'}
              </Typography>
              
              {course.email && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Contact Email:</strong> {course.email}
                </Typography>
              )}
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Created:</strong> {formatDate(course.created_at)}
              </Typography>
              
              <Typography variant="body2">
                <strong>Capacity:</strong> {course.max_capacity ? `${course.enrolled_count}/${course.max_capacity} students` : 'Unlimited'}
              </Typography>
            </CardContent>
          </Card>

          {/* Published Quizzes */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <QuizIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {userRole === 'teacher' ? 'All Quizzes' : 'Available Quizzes'} ({(course.quizzes || []).filter(quiz => userRole === 'teacher' || quiz.is_published).length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ 
                maxHeight: '300px', 
                overflowY: 'scroll',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: '#fafafa',
                padding: '8px',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#a8a8a8',
                  },
                },
              }}>
                {(!course.quizzes || course.quizzes.filter(quiz => userRole === 'teacher' || quiz.is_published).length === 0) ? (
                  <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {userRole === 'teacher' ? 'No Quizzes Created' : 'No Published Quizzes'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {userRole === 'teacher' 
                        ? 'Create and publish quizzes to see them here'
                        : 'Check back later for new quizzes'
                      }
                    </Typography>
                    {userRole === 'teacher' && (
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/courses/${courseId}/quizzes`)}
                      >
                        Manage Quizzes
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
                                    label={quiz.is_published ? 'Published' : 'Draft'} 
                                    color={quiz.is_published ? 'success' : 'warning'} 
                                    size="small"
                                  />
                                  {userRole === 'student' && quiz.submission && (
                                    <Chip 
                                      label={quiz.submission.is_graded ? 'Graded' : 'Submitted'} 
                                      color={quiz.submission.is_graded ? 'primary' : 'info'} 
                                      size="small"
                                      clickable={quiz.submission.is_graded}
                                      onClick={(e) => {
                                        if (quiz.submission?.is_graded) {
                                          e.stopPropagation();
                                          navigate(`/quiz/${quiz.id}/results`);
                                        }
                                      }}
                                      sx={{
                                        cursor: quiz.submission.is_graded ? 'pointer' : 'default',
                                        '&:hover': quiz.submission.is_graded ? {
                                          backgroundColor: 'primary.dark',
                                          color: 'white'
                                        } : {}
                                      }}
                                    />
                                  )}
                                  {userRole === 'student' && !quiz.submission && quiz.is_published && (
                                    <Chip 
                                      label="Not Attempted" 
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
                                    sx={{ ml: 1 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/quiz/${quiz.id}/take`);
                                    }}
                                  >
                                    Take Quiz
                                  </Button>
                                )}
                              </Box>
                            }
                            secondary={
                              <span>
                                <Typography variant="body2" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                  {quiz.description || 'No description'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                  {quiz.total_points} points
                                  {quiz.due_date && ` • Due: ${formatDateTime(quiz.due_date)}`}
                                  {userRole === 'student' && quiz.submission && quiz.submission.is_graded && (
                                    ` • Grade: ${quiz.submission.grade || 0}/${quiz.total_points}`
                                  )}
                                  {userRole === 'student' && quiz.submission && quiz.submission.submitted_at && (
                                    ` • Submitted: ${formatDateTime(quiz.submission.submitted_at)}`
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

        {/* Quick Actions Sidebar - Only for Teachers */}
        {userRole === 'teacher' && (
          <Grid size={{ xs: 12, md: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate(`/courses/${courseId}/students`)}
                  >
                    View Students
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<QuizIcon />}
                    onClick={() => navigate(`/courses/${courseId}/quizzes`)}
                  >
                    Manage Quizzes
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<BarChartIcon />}
                    disabled
                    sx={{ 
                      color: 'text.secondary',
                      borderColor: 'action.disabled',
                      '&.Mui-disabled': {
                        borderColor: 'action.disabled',
                        color: 'text.disabled'
                      }
                    }}
                  >
                    Course Statistics (Coming Soon)
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Course Stats */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Course Overview
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Students:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {course.enrolled_count}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Quizzes:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(course.quizzes || []).length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Published Quizzes:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(course.quizzes || []).filter(quiz => quiz.is_published).length}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Total Points:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(course.quizzes || []).reduce((sum, quiz) => sum + (quiz.total_points || 0), 0)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Status:</Typography>
                  <Chip 
                    label={course.is_full ? 'Full' : 'Open'} 
                    color={course.is_full ? 'error' : 'success'} 
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
      </Container>
    </Box>
  );
};

export default ViewCourse;
