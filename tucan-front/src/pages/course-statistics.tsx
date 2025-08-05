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
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const generatePDF = () => {
    if (!statistics) return;

    const doc = new jsPDF();
    let currentY = 20;
    
    // Header
    doc.setFontSize(20);
    doc.text('Course Statistics Report', 20, currentY);
    currentY += 15;
    
    doc.setFontSize(12);
    doc.text(`Course: ${statistics.course_name}`, 20, currentY);
    currentY += 10;
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, currentY);
    currentY += 20;
    
    // Overall Statistics
    doc.setFontSize(14);
    doc.text('Overall Performance', 20, currentY);
    currentY += 10;
    
    const overviewData = [
      ['Total Students', statistics.total_students.toString()],
      ['Total Quizzes', statistics.total_quizzes.toString()],
      ['Total Submissions', statistics.total_submissions.toString()],
      ['Class Average', `${statistics.overall_statistics.class_average.toFixed(1)}%`],
      ['Highest Score', `${statistics.overall_statistics.highest_score.toFixed(1)}%`],
      ['Lowest Score', `${statistics.overall_statistics.lowest_score.toFixed(1)}%`],
      ['Excellent Students', `${statistics.overall_statistics.total_excellent} (${statistics.overall_statistics.excellent_percentage.toFixed(1)}%)`],
      ['Good Students', `${statistics.overall_statistics.total_good} (${statistics.overall_statistics.good_percentage.toFixed(1)}%)`],
      ['Passing Students', `${statistics.overall_statistics.total_passing} (${statistics.overall_statistics.passing_percentage.toFixed(1)}%)`],
      ['Failing Students', `${statistics.overall_statistics.total_failing} (${statistics.overall_statistics.failing_percentage.toFixed(1)}%)`]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Value']],
      body: overviewData,
      theme: 'striped',
      headStyles: { fillColor: [48, 99, 142] },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 70 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 20;

    // Student Rankings by Grades
    if (statistics.student_rankings.by_grades && statistics.student_rankings.by_grades.length > 0) {
      doc.setFontSize(14);
      doc.text('Student Rankings by Grades', 20, currentY);
      currentY += 10;
      
      const rankingsData = statistics.student_rankings.by_grades.map(student => [
        student.rank.toString(),
        student.student_name,
        `${student.accumulated_percentage.toFixed(1)}%`,
        `${student.accumulated_score}/${student.total_possible}`,
        student.graded_submissions.toString()
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Rank', 'Student Name', 'Average %', 'Score', 'Graded']],
        body: rankingsData,
        theme: 'striped',
        headStyles: { fillColor: [48, 99, 142] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 60 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // Students with No Submissions
    if (statistics.student_rankings.no_submissions && statistics.student_rankings.no_submissions.length > 0) {
      doc.setFontSize(14);
      doc.text('Students with No Submissions', 20, currentY);
      currentY += 10;
      
      const noSubmissionsData = statistics.student_rankings.no_submissions.map(student => [
        student.student_name,
        student.student_email
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Student Name', 'Email']],
        body: noSubmissionsData,
        theme: 'striped',
        headStyles: { fillColor: [234, 92, 0] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 100 }
        }
      });
    }

    doc.save(`course-statistics-${statistics.course_name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`);
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
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Box sx={{ width: '100%' }}>
            <LinearProgress />
          </Box>
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center', fontFamily: 'Rammetto One, sans-serif' }}>
            Cargando estadísticas del curso...
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
              Estadísticas del Curso
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
          <Alert severity="warning">No se encontraron datos de estadísticas</Alert>
        </Container>
      </Box>
    );
  }

  // Get student rankings from the backend response
  const studentsBySubmissions = statistics.student_rankings?.by_submissions || [];
  const studentsByGrades = statistics.student_rankings?.by_grades || [];

  return (
    <Layout title="Estadísticas del Curso">
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={handleBackNavigation} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              Estadísticas del Curso: {statistics.course_name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              Análisis detallado de rendimiento y progreso estudiantil
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
          <IconButton onClick={handleHomeNavigation} sx={{ ml: 2 }}>
            <HomeIcon />
          </IconButton>
        </Box>

        {/* Student Grades Ranking */}
        <Grid container justifyContent="center">
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                  <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ranking de Calificaciones del Curso
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Estudiantes clasificados por calificación acumulada del curso (mejor a peor)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
                  {studentsByGrades.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Aún no hay estudiantes calificados
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
                                {student.graded_submissions} entregas calificadas
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
    </Layout>
  );
};

export default CourseStatistics;
