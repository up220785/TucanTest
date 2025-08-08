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
  Button,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Quiz as QuizIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Home as HomeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { buildApiUrl } from '../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

      const response = await fetch(buildApiUrl(`/api/teachers/${user.id}/statistics`), {
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

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
  };

  const generatePDF = () => {
    if (!statistics) return;

    const doc = new jsPDF();
    let currentY = 20;
    
    // Header
    doc.setFontSize(20);
    doc.text('Teacher Statistics Report', 20, currentY);
    currentY += 15;
    
    doc.setFontSize(12);
    doc.text(`Teacher: ${statistics.teacher_name}`, 20, currentY);
    currentY += 10;
    doc.text(`Email: ${statistics.teacher_email}`, 20, currentY);
    currentY += 10;
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, currentY);
    currentY += 20;
    
    // Overall Statistics
    doc.setFontSize(14);
    doc.text('Overall Statistics', 20, currentY);
    currentY += 10;
    
    const overviewData = [
      ['Total Courses', statistics.overall_statistics.total_courses.toString()],
      ['Published Courses', statistics.overall_statistics.published_courses.toString()],
      ['Total Students', statistics.overall_statistics.total_students.toString()],
      ['Total Quizzes', statistics.overall_statistics.total_quizzes.toString()],
      ['Published Quizzes', statistics.overall_statistics.published_quizzes.toString()],
      ['Total Submissions', statistics.overall_statistics.total_submissions.toString()],
      ['Graded Submissions', statistics.overall_statistics.graded_submissions.toString()],
      ['Pending Grading', statistics.overall_statistics.pending_grading.toString()]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Value']],
      body: overviewData,
      theme: 'striped',
      headStyles: { fillColor: [48, 99, 142] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Course Statistics
    if (statistics.course_statistics && statistics.course_statistics.length > 0) {
      doc.setFontSize(14);
      doc.text('Course Statistics', 20, currentY);
      currentY += 10;
      
      const courseData = statistics.course_statistics.map(course => [
        course.course_name,
        course.is_published ? 'Published' : 'Draft',
        course.total_students.toString(),
        course.total_quizzes.toString(),
        course.published_quizzes.toString(),
        course.total_submissions.toString(),
        'N/A', // graded_submissions not available in interface
        `${course.average_course_score ? course.average_course_score.toFixed(1) : 'N/A'}%`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Course', 'Status', 'Students', 'Quizzes', 'Published', 'Submissions', 'Graded', 'Avg Grade']],
        body: courseData,
        theme: 'striped',
        headStyles: { fillColor: [48, 99, 142] },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // Recent Activity (limit to top 10 for PDF)
    if (statistics.recent_activity && statistics.recent_activity.length > 0) {
      doc.setFontSize(14);
      doc.text('Recent Activity (Top 10)', 20, currentY);
      currentY += 10;
      
      const activityData = statistics.recent_activity.slice(0, 10).map(activity => [
        'Submission', // activity_type not available in interface
        `${activity.student_name} submitted ${activity.quiz_title}`,
        activity.course_name || 'N/A',
        activity.student_name || 'N/A',
        new Date(activity.submitted_at).toLocaleDateString(),
        new Date(activity.submitted_at).toLocaleTimeString()
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Type', 'Description', 'Course', 'Student', 'Date', 'Time']],
        body: activityData,
        theme: 'striped',
        headStyles: { fillColor: [48, 99, 142] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 }
        }
      });
    }

    doc.save(`teacher-statistics-${statistics.teacher_name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
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
            <IconButton onClick={handleBackNavigation} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
              Teacher Statistics
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
    <Layout title="Estadísticas del Profesor">
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={handleBackNavigation} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              Resumen de Enseñanza: {statistics.teacher_name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              Estadísticas completas de todos tus cursos
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={generatePDF}
            sx={{
              backgroundColor: '#EA5C00',
              '&:hover': {
                backgroundColor: '#c44e00',
              },
              fontFamily: 'Rammetto One, sans-serif',
              mr: 2,
            }}
          >
            Descargar PDF
          </Button>
          <IconButton onClick={handleHomeNavigation} sx={{ ml: 0 }}>
            <HomeIcon />
          </IconButton>
        </Box>

        {/* Overall Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      Cursos Totales
                    </Typography>
                    <Typography variant="h4" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {statistics.overall_statistics.total_courses}
                    </Typography>
                    <Typography variant="caption" color="success.main" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {statistics.overall_statistics.published_courses} publicados
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
                    <Typography color="text.secondary" variant="body2" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      Estudiantes Totales
                    </Typography>
                    <Typography variant="h4" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {statistics.overall_statistics.total_students}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      En todos los cursos
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
                    <Typography color="text.secondary" variant="body2" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      Quizzes Totales
                    </Typography>
                    <Typography variant="h4" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {statistics.overall_statistics.total_quizzes}
                    </Typography>
                    <Typography variant="caption" color="success.main" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {statistics.overall_statistics.published_quizzes} publicados
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
                    <Typography color="text.secondary" variant="body2" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      Entregas
                    </Typography>
                    <Typography variant="h4" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {statistics.overall_statistics.total_submissions}
                    </Typography>
                    <Typography variant="caption" color="warning.main" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {statistics.overall_statistics.pending_grading} pendientes
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
                  <Typography variant="h6" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                    Resumen de Rendimiento de Cursos
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {statistics.course_statistics.map((course) => (
                    <Card key={course.course_id} variant="outlined">
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" sx={{ 
                                mr: 2,
                                fontFamily: 'Rammetto One, sans-serif'
                              }}>
                                {course.course_name}
                              </Typography>
                              <Chip
                                label={course.is_published ? 'Publicado' : 'Borrador'}
                                color={getPublishStatusColor(course.is_published)}
                                size="small"
                                sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                              />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                                Estudiantes: {course.total_students}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                                Quizzes: {course.published_quizzes}/{course.total_quizzes}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                                Entregas: {course.total_submissions}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                                Puntaje Promedio: {course.average_course_score.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                              Creado: {formatDate(course.created_at)}
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
    </Layout>
  );
};

export default TeacherStatistics;
