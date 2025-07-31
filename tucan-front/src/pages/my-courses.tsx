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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Fab,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  People as PeopleIcon,
  Quiz as QuizIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  School as SchoolIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import InviteStudentsDialog from '../components/InviteStudentsDialog';
import '../styles/my-courses.css';

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
}

interface CreateCourseData {
  name: string;
  description: string;
  is_public: boolean;
  max_capacity: string;
}

const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const [createCourseData, setCreateCourseData] = useState<CreateCourseData>({
    name: '',
    description: '',
    is_public: true,
    max_capacity: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
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

      // Use the dedicated teacher courses endpoint
      const response = await fetch(`http://localhost:5000/api/course-users/teachers/${user.id}/courses`, {
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
      
      // Show all courses created by this teacher
      setCourses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      const coursePayload = {
        name: createCourseData.name,
        description: createCourseData.description,
        is_public: createCourseData.is_public,
        ...(createCourseData.max_capacity && { 
          max_capacity: parseInt(createCourseData.max_capacity) 
        }),
      };

      const response = await fetch('http://localhost:5000/api/courses/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coursePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create course');
      }

      const newCourse = await response.json();
      setCourses(prev => [newCourse, ...prev]);
      setCreateDialogOpen(false);
      setCreateCourseData({
        name: '',
        description: '',
        is_public: true,
        max_capacity: '',
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, course: Course) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  const handleInviteStudents = () => {
    setInviteDialogOpen(true);
    handleMenuClose();
  };

  const handleTogglePublished = async (course: Course) => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_published: !course.is_published,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      setCourses(prev => 
        prev.map(c => 
          c.id === course.id ? { ...c, is_published: !c.is_published } : c
        )
      );
      handleMenuClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!window.confirm(`Are you sure you want to delete "${course.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/courses/${course.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete course');
      }

      setCourses(prev => prev.filter(c => c.id !== course.id));
      handleMenuClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading your courses...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Courses
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage all your courses, track enrollment, and monitor performance
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          size="large"
        >
          Create Course
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Courses
                  </Typography>
                  <Typography variant="h4">
                    {courses.length}
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
                <PeopleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h4">
                    {courses.reduce((sum, course) => sum + course.enrolled_count, 0)}
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
                <QuizIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Quizzes
                  </Typography>
                  <Typography variant="h4">
                    {courses.reduce((sum, course) => sum + course.quiz_count, 0)}
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
                <VisibilityIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Published
                  </Typography>
                  <Typography variant="h4">
                    {courses.filter(course => course.is_published).length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No courses yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create your first course to start teaching and managing students
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Your First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {courses.map((course) => (
            <Box key={course.id} sx={{ flex: '1 1 350px', minWidth: '350px', maxWidth: '400px' }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" noWrap sx={{ flexGrow: 1, mr: 1 }}>
                      {course.name}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, course)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: '2.5em' }}
                  >
                    {course.description || 'No description provided'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label={course.is_published ? 'Published' : 'Draft'}
                      color={course.is_published ? 'success' : 'default'}
                      size="small"
                      icon={course.is_published ? <VisibilityIcon /> : <VisibilityOffIcon />}
                    />
                    <Chip
                      label={course.is_public ? 'Public' : 'Private'}
                      color={course.is_public ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Students: {course.enrolled_count}
                      {course.max_capacity && ` / ${course.max_capacity}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quizzes: {course.quiz_count}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Created: {formatDate(course.created_at)}
                  </Typography>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PeopleIcon />}
                    onClick={() => navigate(`/courses/${course.id}/students`)}
                  >
                    Students
                  </Button>
                  <Button
                    size="small"
                    startIcon={<QuizIcon />}
                    onClick={() => navigate(`/courses/${course.id}/quizzes`)}
                  >
                    Quizzes
                  </Button>
                  <Button
                    size="small"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => navigate(`/courses/${course.id}/statistics`)}
                  >
                    Stats
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Course Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => navigate(`/courses/${selectedCourse?.id}/edit`)}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Course
        </MenuItem>
        <MenuItem onClick={() => selectedCourse && handleTogglePublished(selectedCourse)}>
          {selectedCourse?.is_published ? <VisibilityOffIcon sx={{ mr: 1 }} /> : <VisibilityIcon sx={{ mr: 1 }} />}
          {selectedCourse?.is_published ? 'Unpublish' : 'Publish'}
        </MenuItem>
        {selectedCourse && !selectedCourse.is_public && (
          <MenuItem onClick={handleInviteStudents}>
            <EmailIcon sx={{ mr: 1 }} />
            Invite Students
          </MenuItem>
        )}
        <Divider />
        <MenuItem 
          onClick={() => selectedCourse && handleDeleteCourse(selectedCourse)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Course
        </MenuItem>
      </Menu>

      {/* Create Course Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Course</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Course Name"
            fullWidth
            variant="outlined"
            value={createCourseData.name}
            onChange={(e) => setCreateCourseData(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={createCourseData.description}
            onChange={(e) => setCreateCourseData(prev => ({ ...prev, description: e.target.value }))}
            sx={{ mb: 2 }}
          />

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Course Visibility</FormLabel>
            <RadioGroup
              value={createCourseData.is_public}
              onChange={(e) => setCreateCourseData(prev => ({ ...prev, is_public: e.target.value === 'true' }))}
            >
              <FormControlLabel value={true} control={<Radio />} label="Public - Anyone can enroll" />
              <FormControlLabel value={false} control={<Radio />} label="Private - Invitation only" />
            </RadioGroup>
          </FormControl>

          <TextField
            margin="dense"
            label="Maximum Capacity (optional)"
            type="number"
            fullWidth
            variant="outlined"
            value={createCourseData.max_capacity}
            onChange={(e) => setCreateCourseData(prev => ({ ...prev, max_capacity: e.target.value }))}
            helperText="Leave empty for unlimited enrollment"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCourse}
            disabled={!createCourseData.name.trim()}
            variant="contained"
          >
            Create Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Students Dialog */}
      {selectedCourse && (
        <InviteStudentsDialog
          open={inviteDialogOpen}
          onClose={() => setInviteDialogOpen(false)}
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          onInvitesSent={() => {
            // Refresh courses to update any counts if needed
            fetchCourses();
          }}
        />
      )}
    </Container>
  );
};

export default MyCourses;
