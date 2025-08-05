import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Switch,
  FormGroup,
  Divider,
  LinearProgress,
  Paper,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  School as SchoolIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  People as PeopleIcon,
  Quiz as QuizIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/edit-course.css';

interface Course {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  is_published: boolean;
  max_capacity?: number;
  enrolled_count: number;
  quiz_count?: number; // Make optional since single course API might not include this
  created_at: string;
  updated_at: string;
  teacher_id: number;
  teacher_name: string;
}

interface EditCourseData {
  name: string;
  description: string;
  is_public: boolean;
  is_published: boolean;
  max_capacity: string;
}

const EditCourse: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editData, setEditData] = useState<EditCourseData>({
    name: '',
    description: '',
    is_public: true,
    is_published: false,
    max_capacity: '',
  });

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
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

      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
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
        throw new Error('Failed to fetch course details');
      }

      const courseData = await response.json();
      
      // Verify that the current user is the teacher of this course
      if (courseData.teacher_id !== user.id) {
        setError('You are not authorized to edit this course');
        return;
      }

      setCourse(courseData);
      
      // Initialize form data
      setEditData({
        name: courseData.name || '',
        description: courseData.description || '',
        is_public: courseData.is_public,
        is_published: courseData.is_published,
        max_capacity: courseData.max_capacity ? courseData.max_capacity.toString() : '',
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('tucan_token');
      
      // Validate required fields
      if (!editData.name.trim()) {
        setError('Course name is required');
        return;
      }

      if (!editData.description.trim()) {
        setError('Course description is required');
        return;
      }

      const updatePayload = {
        name: editData.name.trim(),
        description: editData.description.trim(),
        is_public: editData.is_public,
        is_published: editData.is_published,
        ...(editData.max_capacity && editData.max_capacity.trim() && { 
          max_capacity: parseInt(editData.max_capacity.trim()) 
        }),
      };

      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update course');
      }

      const updatedCourse = await response.json();
      setCourse(updatedCourse);
      setSuccess('Course updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!course) return false;
    
    return (
      editData.name !== course.name ||
      editData.description !== course.description ||
      editData.is_public !== course.is_public ||
      editData.is_published !== course.is_published ||
      editData.max_capacity !== (course.max_capacity ? course.max_capacity.toString() : '')
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleBackNavigation = () => {
    navigate('/my-courses');
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
          Loading course details...
        </Typography>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Course not found or you don't have permission to edit it.
        </Alert>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
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

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2, height: '100vh', overflow: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
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
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Edit Course
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Modify course settings and publish when ready
          </Typography>
        </Box>
      </Box>

      {/* Error/Success Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* Course Statistics Panel */}
        <Box sx={{ flex: '1 1 280px', minWidth: '280px', maxWidth: '350px' }}>
          <Paper sx={{ p: 2, mb: 2, position: 'sticky', top: 0 }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
              Course Overview
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <SchoolIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                Course ID: {course.id}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <PeopleIcon color="success" sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                Students: {course.enrolled_count}
                {course.max_capacity && ` / ${course.max_capacity}`}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <QuizIcon color="warning" sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                Quizzes: {course.quiz_count || 0}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
              <Chip
                label={course.is_published ? 'Published' : 'Draft'}
                color={course.is_published ? 'success' : 'default'}
                size="small"
                icon={course.is_published ? <VisibilityIcon /> : <VisibilityOffIcon />}
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip
                label={course.is_public ? 'Public' : 'Private'}
                color={course.is_public ? 'primary' : 'secondary'}
                size="small"
                sx={{ fontSize: '0.75rem' }}
              />
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mb: 0.5 }}>
              Created: {formatDate(course.created_at)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Updated: {formatDate(course.updated_at)}
            </Typography>
          </Paper>
        </Box>

        {/* Edit Form */}
        <Box sx={{ flex: '2 1 450px', minWidth: '450px' }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
                Course Details
              </Typography>

              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {/* Course Name */}
                <TextField
                  label="Course Name"
                  fullWidth
                  required
                  variant="outlined"
                  size="small"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  helperText="Enter a clear, descriptive name for your course"
                />

                {/* Course Description */}
                <TextField
                  label="Course Description"
                  fullWidth
                  required
                  multiline
                  rows={3}
                  variant="outlined"
                  size="small"
                  value={editData.description}
                  onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                  helperText="Provide a detailed description of what students will learn"
                />

                {/* Visibility Settings */}
                <Box>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                      Course Visibility
                    </FormLabel>
                    <RadioGroup
                      value={editData.is_public}
                      onChange={(e) => setEditData(prev => ({ ...prev, is_public: e.target.value === 'true' }))}
                    >
                      <FormControlLabel 
                        value={true} 
                        control={<Radio size="small" />} 
                        label="Public - Anyone can enroll"
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                      />
                      <FormControlLabel 
                        value={false} 
                        control={<Radio size="small" />} 
                        label="Private - Invitation only"
                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>

                {/* Max Capacity */}
                <TextField
                  label="Maximum Capacity"
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={editData.max_capacity}
                  onChange={(e) => setEditData(prev => ({ ...prev, max_capacity: e.target.value }))}
                  helperText="Leave empty for unlimited enrollment"
                />

                {/* Publishing Settings */}
                <Box>
                  <FormLabel component="legend" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                    Publishing Status
                  </FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editData.is_published}
                          onChange={(e) => setEditData(prev => ({ ...prev, is_published: e.target.checked }))}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {editData.is_published ? 'Published' : 'Draft'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {editData.is_published 
                              ? 'Course is visible to students and they can enroll'
                              : 'Course is hidden from students until published'
                            }
                          </Typography>
                        </Box>
                      }
                    />
                  </FormGroup>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, pt: 1.5, borderTop: '1px solid #e0e0e0', mt: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || !hasChanges()}
                    size="medium"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/my-courses')}
                    disabled={saving}
                    size="medium"
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default EditCourse;
