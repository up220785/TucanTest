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

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackNavigation}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleHomeNavigation}
          >
            Home
          </Button>
        </Box>
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
      height: '100vh',
      overflow: 'auto',
      backgroundColor: '#f5f5f5',
      '&::-webkit-scrollbar': {
        width: '12px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: '#f1f1f1',
        borderRadius: '6px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#c1c1c1',
        borderRadius: '6px',
        '&:hover': {
          backgroundColor: '#a8a8a8',
        },
      },
    }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackNavigation}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleHomeNavigation}
            >
              Home
            </Button>
          </Box>
        
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

      <Grid container spacing={3} sx={{ mt: 0 }}>
        {/* Course Information */}
        <Grid size={{ xs: 12, md: 8 }}>
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

          {/* Student Progress Card - Only for Students */}
          {userRole === 'student' && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  My Progress
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
                          <Typography variant="body1" fontWeight="medium">
                            Overall Course Score
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
                            / {totalPossible} points
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Across {publishedQuizzes.length} published quiz{publishedQuizzes.length !== 1 ? 'es' : ''}
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
                            Graded Quizzes
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
                            Pending Grading
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" color="warning.main">
                              {publishedQuizzes.filter(quiz => quiz.submission && !quiz.submission.is_graded).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              quiz{publishedQuizzes.filter(quiz => quiz.submission && !quiz.submission.is_graded).length !== 1 ? 'es' : ''}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Not Attempted
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h6" color="error.main">
                              {publishedQuizzes.filter(quiz => !quiz.submission).length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              quiz{publishedQuizzes.filter(quiz => !quiz.submission).length !== 1 ? 'es' : ''}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {publishedQuizzes.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            No published quizzes yet
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 1, p: 1.5, backgroundColor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.875rem' }}>
                            {overallPercentage >= 90 ? "🎉 Excellent work! Keep it up!" :
                             overallPercentage >= 80 ? "👍 Great job! You're doing well!" :
                             overallPercentage >= 70 ? "📈 Good progress! Keep studying!" :
                             overallPercentage >= 60 ? "💪 You're on track! Don't give up!" :
                             gradedSubmissions.length === 0 ? "🚀 Ready to start your quiz journey?" :
                             "📚 Keep working hard - you've got this!"}
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
              <Typography variant="h6" gutterBottom>
                <QuizIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {userRole === 'teacher' ? 'All Quizzes' : 'Available Quizzes'} ({(course.quizzes || []).filter(quiz => userRole === 'teacher' || quiz.is_published).length})
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
                                      label={
                                        quiz.submission.is_graded ? 'Graded' : 
                                        quiz.submission.is_pending_manual_grade ? 'Pending Grade' : 'Submitted'
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
                                {userRole === 'teacher' && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="info"
                                    startIcon={<BarChartIcon />}
                                    sx={{ ml: 1 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/quiz/${quiz.id}/statistics`);
                                    }}
                                  >
                                    Statistics
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
                                    ` • Score: ${quiz.submission.total_score || 0}/${quiz.total_points} (${Math.round(((quiz.submission.total_score || 0) / quiz.total_points) * 100)}%)`
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

        {/* Sidebar - Different content for Teachers vs Students */}
        <Grid size={{ xs: 12, md: 4 }}>
          {userRole === 'teacher' ? (
            <>
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
                      onClick={() => navigate(`/courses/${courseId}/statistics`)}
                    >
                      Course Statistics
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
            </>
          ) : (
            /* Student Sidebar */
            <>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Stats
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {(() => {
                    const publishedQuizzes = (course.quizzes || []).filter(quiz => quiz.is_published);
                    const gradedSubmissions = publishedQuizzes.filter(quiz => quiz.submission?.is_graded);
                    
                    if (gradedSubmissions.length === 0) {
                      return (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Complete some quizzes to see your stats here!
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
                            Best Performance
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
                            Average Score
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" color="primary">
                            {averageScore.toFixed(1)}%
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Quizzes Completed
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
                  <Typography variant="h6" gutterBottom>
                    Course Info
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
                      <Typography variant="body2" color="text.secondary">Students:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {course.enrolled_count}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total Quizzes:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {(course.quizzes || []).filter(quiz => quiz.is_published).length}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Total Points:</Typography>
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
    </Box>
  );
};

export default ViewCourse;
