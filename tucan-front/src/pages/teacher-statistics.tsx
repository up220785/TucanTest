import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface TeacherStatistics {
  teacher_id: number;
  teacher_name: string;
  teacher_email: string;
  overall_statistics: {
    total_courses: number;
    published_courses: number;
    total_students: number;
    total_quizzes: number;
    published_quizzes: number;
    total_submissions: number;
    graded_submissions: number;
    pending_grading: number;
  };
  course_statistics: {
    course_id: number;
    course_name: string;
    is_published: boolean;
    total_students: number;
    total_quizzes: number;
    published_quizzes: number;
    total_submissions: number;
    average_course_score: number;
    created_at: string;
  }[];
  recent_activity: {
    student_name: string;
    quiz_title: string;
    course_name: string;
    submitted_at: string;
    is_graded: boolean;
    score: number | null;
  }[];
}

const TeacherStatistics: React.FC = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<TeacherStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeacherStatistics();
  }, []);

  const fetchTeacherStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tucan_token');
      const userData = localStorage.getItem('tucan_user');

      if (!token || !userData) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== 'teacher') {
        navigate('/homepage');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/teachers/${user.id}/statistics`, {
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
        throw new Error('Failed to fetch teacher statistics');
      }

      const data = await response.json();
      setStatistics(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching teacher statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
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

  const getPublishStatusColor = (isPublished: boolean) => {
    return isPublished ? 'success' : 'default';
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
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
            Loading your teaching statistics...
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
            <IconButton onClick={() => navigate('/my-courses')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Teacher Statistics
            </Typography>
          </Box>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  if (!statistics) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Alert severity="warning">No statistics data found</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/my-courses')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Teaching Overview: {statistics.teacher_name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Comprehensive statistics across all your courses
            </Typography>
          </Box>
        </Box>

        {/* Overall Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Courses
                    </Typography>
                    <Typography variant="h4">
                      {statistics.overall_statistics.total_courses}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {statistics.overall_statistics.published_courses} published
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
                  <PeopleIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Students
                    </Typography>
                    <Typography variant="h4">
                      {statistics.overall_statistics.total_students}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Across all courses
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
                  <QuizIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Total Quizzes
                    </Typography>
                    <Typography variant="h4">
                      {statistics.overall_statistics.total_quizzes}
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {statistics.overall_statistics.published_quizzes} published
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
                  <AssignmentIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Submissions
                    </Typography>
                    <Typography variant="h4">
                      {statistics.overall_statistics.total_submissions}
                    </Typography>
                    <Typography variant="caption" color="warning.main">
                      {statistics.overall_statistics.pending_grading} pending
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Course Performance */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AnalyticsIcon color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6">
                    Course Performance Overview
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {statistics.course_statistics.map((course) => (
                    <Card key={course.course_id} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" sx={{ mr: 2 }}>
                                {course.course_name}
                              </Typography>
                              <Chip
                                label={course.is_published ? 'Published' : 'Draft'}
                                color={getPublishStatusColor(course.is_published)}
                                size="small"
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              <Typography variant="body2" color="text.secondary">
                                Students: {course.total_students}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Quizzes: {course.published_quizzes}/{course.total_quizzes}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Submissions: {course.total_submissions}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Avg Score: {course.average_course_score.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                              Created: {formatDate(course.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 2 }} />
                  <Typography variant="h6">
                    Recent Activity
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {statistics.recent_activity.slice(0, 10).map((activity, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 2, fontSize: '0.8rem' }}>
                          {activity.student_name.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {activity.student_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {activity.quiz_title} • {activity.course_name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Chip
                              label={activity.is_graded ? `${activity.score?.toFixed(1)}%` : 'Pending'}
                              color={activity.is_graded ? 'success' : 'warning'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(activity.submitted_at)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      {index < statistics.recent_activity.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TeacherStatistics;
