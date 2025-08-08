import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Grid,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Grade as GradeIcon,
  CalendarToday as CalendarIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { buildApiUrl } from '../config/api';

interface Course {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  is_published: boolean;
  max_capacity?: number;
  enrolled_count: number;
  quiz_count: number;
  created_at: string;
  teacher_name: string;
}

interface Student {
  id: number;
  course_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  status: string;
  enrolled_at: string;
  grade: number | null;
}

const CourseStudents: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseAndStudents();
    }
  }, [courseId]);

  const fetchCourseAndStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tucan_token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Check if user is a teacher
      const userData = localStorage.getItem('tucan_user');
      if (!userData) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== 'teacher') {
        navigate('/homepage');
        return;
      }

      // Fetch course details and students in parallel
      const [courseResponse, studentsResponse] = await Promise.all([
        fetch(buildApiUrl(`/api/courses/${courseId}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(buildApiUrl(`/api/courses/${courseId}/students`), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (courseResponse.status === 401 || studentsResponse.status === 401) {
        localStorage.removeItem('tucan_token');
        localStorage.removeItem('tucan_user');
        navigate('/login');
        return;
      }

      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course details');
      }

      if (!studentsResponse.ok) {
        throw new Error('Failed to fetch students');
      }

      const courseData = await courseResponse.json();
      const studentsData = await studentsResponse.json();
      
      setCourse(courseData);
      setStudents(studentsData); // studentsData is now a direct array of Student objects
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course students');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
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

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'default';
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'error';
  };

  const getGradeLabel = (grade: number | null) => {
    if (grade === null) return 'Sin calificaciones';
    return `${grade.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
      }}>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Box sx={{ width: '100%', mt: 4 }}>
            <LinearProgress />
          </Box>
          <Typography variant="h6" sx={{ mt: 2, textAlign: 'center', fontFamily: 'Rammetto One, sans-serif' }}>
            Loading course students...
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
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackNavigation}
              sx={{ 
                fontFamily: 'Rammetto One, sans-serif',
                color: '#30638E',
                borderColor: '#30638E',
                '&:hover': {
                  backgroundColor: '#30638E',
                  color: 'white',
                },
              }}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleHomeNavigation}
              sx={{ 
                fontFamily: 'Rammetto One, sans-serif',
                color: '#30638E',
                borderColor: '#30638E',
                '&:hover': {
                  backgroundColor: '#30638E',
                  color: 'white',
                },
              }}
            >
              Home
            </Button>
          </Box>
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
          <Alert severity="error">Course data not found</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Layout title="Estudiantes del Curso">
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={handleBackNavigation} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              <PeopleIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Estudiantes del Curso
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              {course.name}
            </Typography>
          </Box>
          <IconButton onClick={handleHomeNavigation} sx={{ ml: 0 }}>
            <HomeIcon />
          </IconButton>
        </Box>

        {/* Course Overview */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      Total Estudiantes
                    </Typography>
                    <Typography variant="h4" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {students.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GradeIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="text.secondary" variant="body2" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      Capacidad de Inscripción
                    </Typography>
                    <Typography variant="h4" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {course.max_capacity ? `${students.length}/${course.max_capacity}` : 'Ilimitada'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ mr: 2 }}>
                    {course.is_public ? <PeopleIcon color="primary" sx={{ fontSize: 40 }} /> : <PersonIcon color="secondary" sx={{ fontSize: 40 }} />}
                  </Box>
                  <Box>
                    <Typography color="text.secondary" variant="body2" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      Tipo de Curso
                    </Typography>
                    <Typography variant="h6" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {course.is_public ? 'Público' : 'Privado'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      {course.is_public ? 'Inscripción directa' : 'Requiere invitación'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      {/* Students Table */}
      {students.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              No hay estudiantes inscritos aún
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontFamily: 'Rammetto One, sans-serif' }}>
              {course.is_public 
                ? 'Los estudiantes pueden inscribirse directamente desde el catálogo de cursos'
                : 'Usa la función "Invitar Estudiantes" para agregar estudiantes a este curso privado'
              }
            </Typography>
            {!course.is_public && (
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={() => navigate(`/my-courses`)}
                sx={{
                  backgroundColor: '#EA5C00',
                  '&:hover': {
                    backgroundColor: '#c44e00',
                  },
                  fontFamily: 'Rammetto One, sans-serif',
                }}
              >
                Ir a Mis Cursos para Invitar Estudiantes
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              Estudiantes Inscritos ({students.length})
            </Typography>
            
            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{ 
                maxHeight: '70vh',
                overflowY: 'auto',
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
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
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontFamily: 'Rammetto One, sans-serif' }}>Estudiante</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontFamily: 'Rammetto One, sans-serif' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontFamily: 'Rammetto One, sans-serif' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontFamily: 'Rammetto One, sans-serif' }}>Fecha de Inscripción</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontFamily: 'Rammetto One, sans-serif' }}>Calificación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            {student.student_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {student.student_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <EmailIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {student.student_email}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={student.status}
                          color={student.status === 'accepted' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                          <Tooltip title={formatDateTime(student.enrolled_at)}>
                            <Typography variant="body2">
                              {formatDate(student.enrolled_at)}
                            </Typography>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={getGradeLabel(student.grade)}
                          color={getGradeColor(student.grade)}
                          size="small"
                          icon={<GradeIcon />}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Container>
    </Layout>
  );
};

export default CourseStudents;
