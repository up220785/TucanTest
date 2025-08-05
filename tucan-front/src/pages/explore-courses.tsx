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
  TextField,
  InputAdornment,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  People as PeopleIcon,
  Quiz as QuizIcon,
  School as SchoolIcon,
  PersonAdd as EnrollIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  AccountCircle as TeacherIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import '../styles/explore-courses.css';

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
  teacher_name?: string;
  teacher_id?: number;
  is_enrolled?: boolean;
  enrollment_status?: string;
  can_enroll?: boolean;
}

const ExploreCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPublicCourses();
  }, []);

  useEffect(() => {
    // Filter courses based on search term
    if (searchTerm.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

  const fetchPublicCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tucan_token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Check if user is a student
      const userData = localStorage.getItem('tucan_user');
      if (!userData) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userData);
      if (user.role !== 'student') {
        navigate('/homepage');
        return;
      }

      // Fetch all public published courses
      const response = await fetch('http://localhost:5000/api/courses/available', {
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
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      
      // The API already returns only published and public courses
      setCourses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = async (courseId: number) => {
    try {
      setEnrollingCourseId(courseId);
      const token = localStorage.getItem('tucan_token');
      const userData = localStorage.getItem('tucan_user');
      
      if (!userData) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userData);
      
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll in course');
      }

      // Update the course data to reflect enrollment
      setCourses(prev => 
        prev.map(course => 
          course.id === courseId 
            ? { 
                ...course, 
                enrolled_count: course.enrolled_count + 1,
                is_enrolled: true,
                can_enroll: false
              }
            : course
        )
      );

      // Show success message
      alert('Successfully enrolled in the course!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in course');
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAvailableSpots = (course: Course) => {
    if (!course.max_capacity) return null;
    return course.max_capacity - course.enrolled_count;
  };

  const isCourseFull = (course: Course) => {
    if (!course.max_capacity) return false;
    return course.enrolled_count >= course.max_capacity;
  };

  const handleBackNavigation = () => {
    navigate(-1);
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading available courses...
        </Typography>
      </Container>
    );
  }

  return (
    <Layout title="Explorar Cursos">
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBackNavigation}
              size="medium"
              sx={{ fontFamily: 'Rammetto One, sans-serif' }}
            >
              Atrás
            </Button>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                Explorar Cursos
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleHomeNavigation}
              size="medium"
            >
              Home
            </Button>
          </Box>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Discover and enroll in public courses offered by our teachers
          </Typography>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search courses by name, description, or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 600 }}
            className="search-input"
          />
        </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

        {/* Statistics Cards */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Card className="stats-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <SchoolIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography color="text.secondary" gutterBottom variant="h6">
                    Available Courses
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {filteredCourses.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                    {searchTerm ? 'matching your search' : 'ready to explore'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {searchTerm ? 'No courses found' : 'No courses available'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Check back later for new courses'}
            </Typography>
            {searchTerm && (
              <Button
                variant="outlined"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(300px, 1fr))',
              md: 'repeat(auto-fill, minmax(320px, 1fr))'
            }, 
            gap: 3,
            mb: 4
          }}
          className="courses-grid"
        >
          {filteredCourses.map((course) => (
            <Card 
              key={course.id}
              className="course-card course-discovery-card"
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                }
              }}
            >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom noWrap>
                    {course.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: '3em', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {course.description || 'No description available'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label="Published"
                      color="success"
                      size="small"
                      icon={<VisibilityIcon />}
                    />
                    <Chip
                      label="Public"
                      color="primary"
                      size="small"
                      icon={<PublicIcon />}
                    />
                  </Box>

                  {/* Teacher Information */}
                  {course.teacher_name && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                        <TeacherIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {course.teacher_name}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Course Stats */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Students: {course.enrolled_count}
                      {course.max_capacity && ` / ${course.max_capacity}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quizzes: {course.quiz_count}
                    </Typography>
                  </Box>

                  {/* Capacity Warning */}
                  {course.max_capacity && getAvailableSpots(course)! <= 5 && getAvailableSpots(course)! > 0 && (
                    <Alert severity="warning" sx={{ mt: 2, py: 0 }}>
                      <Typography variant="caption">
                        Only {getAvailableSpots(course)} spots left!
                      </Typography>
                    </Alert>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Created: {formatDate(course.created_at)}
                  </Typography>
                </CardContent>

                <CardActions sx={{ pt: 0 }}>
                  <Button
                    fullWidth
                    variant={course.is_enrolled ? "outlined" : "contained"}
                    startIcon={<EnrollIcon />}
                    onClick={() => handleEnrollCourse(course.id)}
                    disabled={course.is_enrolled || !course.can_enroll || enrollingCourseId === course.id}
                    color={course.is_enrolled ? 'success' : isCourseFull(course) ? 'inherit' : 'primary'}
                  >
                    {enrollingCourseId === course.id 
                      ? 'Enrolling...' 
                      : course.is_enrolled
                        ? 'Already Enrolled'
                        : isCourseFull(course) 
                          ? 'Course Full' 
                          : 'Enroll Now'}
                  </Button>
                </CardActions>
              </Card>
        ))}
      </Box>
    )}
    </Container>
    </Layout>
  );
};export default ExploreCourses;
