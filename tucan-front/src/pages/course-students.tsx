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
        fetch(`http://localhost:5000/api/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`http://localhost:5000/api/courses/${courseId}/students`, {
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
    if (grade === null) return 'No grades';
    return `${grade.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading course students...
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
        <Alert severity="error">Course data not found</Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        overflowY: 'auto',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
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
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#a8a8a8',
        },
      }}
    >
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton 
            onClick={handleBackNavigation}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1">
              <PeopleIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Course Students
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {course.name}
            </Typography>
          </Box>
          <IconButton 
            onClick={handleHomeNavigation}
            sx={{ ml: 1 }}
          >
            <HomeIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Course Overview */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">
                    {students.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GradeIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Enrollment Capacity
                  </Typography>
                  <Typography variant="h4">
                    {course.max_capacity ? `${students.length}/${course.max_capacity}` : 'Unlimited'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  label={course.is_public ? 'Public Course' : 'Private Course'}
                  color={course.is_public ? 'primary' : 'secondary'}
                  icon={course.is_public ? <PeopleIcon /> : <PersonIcon />}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {course.is_public ? 'Students can enroll directly' : 'Invitation required'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Students Table */}
      {students.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No students enrolled yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {course.is_public 
                ? 'Students can enroll directly from the course catalog'
                : 'Use the "Invite Students" feature to add students to this private course'
              }
            </Typography>
            {!course.is_public && (
              <Button
                variant="contained"
                startIcon={<EmailIcon />}
                onClick={() => navigate(`/my-courses`)}
              >
                Go to My Courses to Invite Students
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Enrolled Students ({students.length})
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Enrolled Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
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
    </Box>
  );
};

export default CourseStudents;
