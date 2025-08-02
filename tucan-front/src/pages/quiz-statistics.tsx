import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Avatar,
  Stack,
  Divider,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Quiz as QuizIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface QuizStatistics {
  quiz_id: number;
  quiz_title: string;
  quiz_description: string;
  total_points: number;
  course_name: string;
  course_id: number;
  due_date: string | null;
  max_possible_score: number;
  total_enrolled: number;
  total_submissions: number;
  graded_submissions: number;
  completion_rate: number;
  overall_statistics: {
    average_score: number;
    average_percentage: number;
    highest_score: number;
    lowest_score: number;
    highest_percentage: number;
    lowest_percentage: number;
    median_percentage: number;
    total_excellent: number;
    total_good: number;
    total_passing: number;
    total_failing: number;
    excellent_percentage: number;
    good_percentage: number;
    passing_percentage: number;
    failing_percentage: number;
  };
  grade_thresholds: {
    excellent: number;
    good: number;
    passing: number;
  };
  score_distribution: { [key: string]: number };
  student_rankings: {
    student_id: number;
    student_name: string;
    student_email: string;
    score: number;
    max_score: number;
    percentage: number;
    submitted_at: string | null;
    rank: number;
  }[];
  missing_submissions: {
    student_id: number;
    student_name: string;
    student_email: string;
  }[];
}

const QuizStatistics: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  
  const [statistics, setStatistics] = useState<QuizStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('QuizStatistics component mounted, quizId:', quizId);

  useEffect(() => {
    if (quizId) {
      console.log('Fetching quiz statistics for quizId:', quizId);
      fetchQuizStatistics();
    } else {
      console.error('No quizId provided');
      setError('No quiz ID provided');
      setLoading(false);
    }
  }, [quizId]);

  const fetchQuizStatistics = async () => {
    try {
      console.log('Starting fetchQuizStatistics for quizId:', quizId);
      setLoading(true);
      const token = localStorage.getItem('tucan_token');
      
      if (!token) {
        console.log('No token found, redirecting to login');
        navigate('/login');
        return;
      }

      const url = `http://localhost:5000/api/quizzes/${quizId}/statistics`;
      console.log('Making request to:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        console.log('Unauthorized, clearing tokens and redirecting to login');
        localStorage.removeItem('tucan_token');
        localStorage.removeItem('tucan_user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        throw new Error('Failed to fetch quiz statistics');
      }

      const data = await response.json();
      console.log('Quiz statistics data received:', data);
      setStatistics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching quiz statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (percentage: number | null) => {
    if (percentage === null) return 'default';
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading quiz statistics...
          </Typography>
        </Container>
      </Box>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  if (!statistics) {
    console.log('Rendering no data state');
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Alert severity="warning">No quiz statistics found</Alert>
        </Container>
      </Box>
    );
  }

  console.log('Rendering main component with statistics:', statistics);

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
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/courses/${statistics.course_id}/view`)}
            sx={{ mb: 2 }}
          >
            Back to Course
          </Button>
          
          <Typography variant="h4" component="h1" gutterBottom>
            Quiz Statistics: {statistics.quiz_title}
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {statistics.course_name} • {statistics.max_possible_score} points total
          </Typography>
          
          {statistics.quiz_description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {statistics.quiz_description}
            </Typography>
          )}
          
          {statistics.due_date && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Due: {formatDateTime(statistics.due_date)}
            </Typography>
          )}
        </Box>

        {/* Statistics Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Submissions
                    </Typography>
                    <Typography variant="h4">
                      {statistics.total_submissions}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {statistics.graded_submissions} graded
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Average Score
                    </Typography>
                    <Typography variant="h4">
                      {statistics.overall_statistics.average_percentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      of {statistics.max_possible_score} points
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrophyIcon color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Highest Score
                    </Typography>
                    <Typography variant="h4">
                      {statistics.overall_statistics.highest_percentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      Best performance
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon color="info" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Pass Rate
                    </Typography>
                    <Typography variant="h4">
                      {statistics.overall_statistics.passing_percentage.toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ≥{statistics.grade_thresholds.passing}% score
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Grade Distribution and Student Rankings */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Grade Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={2}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Excellent (≥{statistics.grade_thresholds.excellent}%)</Typography>
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        {statistics.overall_statistics.total_excellent}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={statistics.graded_submissions > 0 ? (statistics.overall_statistics.total_excellent / statistics.graded_submissions) * 100 : 0}
                      color="success"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Good ({statistics.grade_thresholds.good}-{statistics.grade_thresholds.excellent - 1}%)</Typography>
                      <Typography variant="body2" fontWeight="bold" color="info.main">
                        {statistics.overall_statistics.total_good}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={statistics.graded_submissions > 0 ? (statistics.overall_statistics.total_good / statistics.graded_submissions) * 100 : 0}
                      color="info"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Passing ({statistics.grade_thresholds.passing}-{statistics.grade_thresholds.good - 1}%)</Typography>
                      <Typography variant="body2" fontWeight="bold" color="warning.main">
                        {statistics.overall_statistics.total_passing}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={statistics.graded_submissions > 0 ? (statistics.overall_statistics.total_passing / statistics.graded_submissions) * 100 : 0}
                      color="warning"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Failing (&lt;{statistics.grade_thresholds.passing}%)</Typography>
                      <Typography variant="body2" fontWeight="bold" color="error.main">
                        {statistics.overall_statistics.total_failing}
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={statistics.graded_submissions > 0 ? (statistics.overall_statistics.total_failing / statistics.graded_submissions) * 100 : 0}
                      color="error"
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Student Performance Rankings
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  All students ranked by quiz performance
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                  {statistics.student_rankings.length === 0 && statistics.missing_submissions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No student submissions yet
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {/* Render students with submissions */}
                      {statistics.student_rankings.map((student, index) => (
                        <Paper 
                          key={student.student_id} 
                          sx={{ 
                            p: 2, 
                            backgroundColor: student.rank <= 3 ? 
                              `${getScoreColor(student.percentage)}.50` : 'background.default',
                            border: student.rank === 1 ? '2px solid gold' : 
                                   student.rank === 2 ? '2px solid silver' : 
                                   student.rank === 3 ? '2px solid #cd7f32' : 'none'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h6" sx={{ minWidth: '30px' }}>
                                #{student.rank}
                              </Typography>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                {getInitials(student.student_name)}
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {student.student_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {student.student_email}
                                </Typography>
                                {student.submitted_at && (
                                  <Typography variant="caption" color="text.secondary">
                                    Submitted: {formatDateTime(student.submitted_at)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h6" color={getScoreColor(student.percentage)}>
                                {student.percentage.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {student.score}/{student.max_score} points
                              </Typography>
                              <Chip 
                                label="Graded" 
                                size="small" 
                                color="success" 
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                      
                      {/* Render students who didn't submit */}
                      {statistics.missing_submissions.map((student) => (
                        <Paper 
                          key={student.student_id} 
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'grey.100',
                            opacity: 0.7
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h6" sx={{ minWidth: '30px' }}>
                                --
                              </Typography>
                              <Avatar sx={{ bgcolor: 'grey.400' }}>
                                {getInitials(student.student_name)}
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight="medium">
                                  {student.student_name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {student.student_email}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" color="text.secondary">
                                Not Submitted
                              </Typography>
                              <Chip 
                                label="Missing" 
                                size="small" 
                                color="error" 
                                sx={{ mt: 1 }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default QuizStatistics;
