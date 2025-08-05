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
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface CourseStatistics {
  course_id: number;
  course_name: string;
  total_students: number;
  total_quizzes: number;
  total_submissions: number;
  overall_statistics: {
    class_average: number;
    student_class_average: number;
    highest_score: number;
    lowest_score: number;
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
  quiz_statistics: any[];
  student_rankings: {
    by_submissions: {
      student_id: number;
      student_name: string;
      student_email: string;
      submission_count: number;
      graded_submissions: number;
      rank: number;
    }[];
    by_grades: {
      student_id: number;
      student_name: string;
      student_email: string;
      accumulated_score: number;
      total_possible: number;
      accumulated_percentage: number;
      graded_submissions: number;
      rank: number;
    }[];
    no_submissions: {
      student_id: number;
      student_name: string;
      student_email: string;
    }[];
  };
}

const CourseStatistics: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [statistics, setStatistics] = useState<CourseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseStatistics();
    }
  }, [courseId]);

  const fetchCourseStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tucan_token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/statistics`, {
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
        throw new Error(`Failed to fetch course statistics: ${response.status}`);
      }

      const data = await response.json();
      setStatistics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching course statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course statistics');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Box sx={{ 
        height: '100vh',
        overflow: 'auto',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading course statistics...
          </Typography>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        height: '100vh',
        overflow: 'auto',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
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
      </Box>
    );
  }

  if (!statistics) {
    return (
      <Box sx={{ 
        height: '100vh',
        overflow: 'auto',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Alert severity="warning">No statistics data found</Alert>
        </Container>
      </Box>
    );
  }

  // Get student rankings from the backend response
  const studentsBySubmissions = statistics.student_rankings?.by_submissions || [];
  const studentsByGrades = statistics.student_rankings?.by_grades || [];

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
            Course Statistics: {statistics.course_name}
          </Typography>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Detailed performance analytics and student progress overview
          </Typography>
        </Box>

        {/* Student Grades Ranking */}
        <Grid container justifyContent="center">
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Course Grades Ranking
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Students ranked by accumulated course grade (best to worst)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                  {studentsByGrades.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No graded students yet
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {studentsByGrades.map((student, index) => (
                        <Paper 
                          key={student.student_id} 
                          sx={{ 
                            p: 2, 
                            backgroundColor: index < 3 ? `${getScoreColor(student.accumulated_percentage)}.50` : 'background.default',
                            border: index === 0 ? '2px solid gold' : 
                                   index === 1 ? '2px solid silver' : 
                                   index === 2 ? '2px solid #cd7f32' : 'none'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="h6" sx={{ minWidth: '30px' }}>
                                #{index + 1}
                              </Typography>
                              <Avatar sx={{ bgcolor: getScoreColor(student.accumulated_percentage) + '.main' }}>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                <Typography variant="h6" color="primary">
                                  {student.accumulated_score}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  / {student.total_possible}
                                </Typography>
                              </Box>
                              <Chip 
                                label={`${student.accumulated_percentage.toFixed(1)}%`}
                                color={getScoreColor(student.accumulated_percentage)}
                                sx={{ fontWeight: 'bold', mt: 1 }}
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {student.graded_submissions} graded submissions
                              </Typography>
                              
                              {/* Progress bar */}
                              <Box sx={{ mt: 1, width: '100px' }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={student.accumulated_percentage}
                                  color={getScoreColor(student.accumulated_percentage)}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: 'grey.200',
                                  }}
                                />
                              </Box>
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

export default CourseStatistics;
