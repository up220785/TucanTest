import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Divider,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Quiz as QuizIcon,
  Save as SaveIcon,
  Publish as PublishIcon,
  Preview as PreviewIcon,
  DragIndicator as DragIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface Course {
  id: number;
  name: string;
  description: string;
}

interface Option {
  id?: number;
  text: string;
  is_correct: boolean;
  order: number;
}

interface Question {
  id?: number;
  text: string;
  question_type: 'multiple_choice' | 'text';
  points: number;
  order: number;
  options: Option[];
}

interface Quiz {
  id?: number;
  title: string;
  description: string;
  course_id: number;
  due_date?: string | null;
  is_published: boolean;
  questions: Question[];
}

const CreateQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    course_id: parseInt(courseId || '0'),
    due_date: null,
    is_published: false,
    questions: []
  });

  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const courseData = await response.json();
        setCourse(courseData);
      } else {
        setError('Failed to load course details');
      }
    } catch (err) {
      setError('Failed to load course details');
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      text: '',
      question_type: 'multiple_choice',
      points: 1,
      order: quiz.questions.length + 1,
      options: [
        { text: '', is_correct: true, order: 1 },
        { text: '', is_correct: false, order: 2 },
        { text: '', is_correct: false, order: 3 },
        { text: '', is_correct: false, order: 4 },
      ]
    };

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));

    setExpandedQuestion(quiz.questions.length);
  };

  const removeQuestion = (questionIndex: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== questionIndex)
        .map((q, index) => ({ ...q, order: index + 1 }))
    }));

    if (expandedQuestion === questionIndex) {
      setExpandedQuestion(null);
    }
  };

  const updateQuestion = (questionIndex: number, field: keyof Question, value: any) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, index) => 
        index === questionIndex 
          ? { 
              ...q, 
              [field]: value,
              ...(field === 'question_type' && value === 'text' ? { options: [] } : {})
            }
          : q
      )
    }));
  };

  const addOption = (questionIndex: number) => {
    const question = quiz.questions[questionIndex];
    const newOption: Option = {
      text: '',
      is_correct: false,
      order: question.options.length + 1
    };

    updateQuestion(questionIndex, 'options', [...question.options, newOption]);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = quiz.questions[questionIndex];
    const updatedOptions = question.options.filter((_, index) => index !== optionIndex)
      .map((opt, index) => ({ ...opt, order: index + 1 }));
    
    updateQuestion(questionIndex, 'options', updatedOptions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof Option, value: any) => {
    const question = quiz.questions[questionIndex];
    const updatedOptions = question.options.map((opt, index) => 
      index === optionIndex 
        ? { ...opt, [field]: value }
        : field === 'is_correct' && value === true 
          ? { ...opt, is_correct: false } // Only one correct answer
          : opt
    );
    
    updateQuestion(questionIndex, 'options', updatedOptions);
  };

  const validateQuiz = (): string[] => {
    const errors: string[] = [];
    
    if (!quiz.title.trim()) {
      errors.push('Quiz title is required');
    }
    
    if (!quiz.description.trim()) {
      errors.push('Quiz description is required');
    }
    
    if (quiz.questions.length === 0) {
      errors.push('At least one question is required');
    }
    
    quiz.questions.forEach((question, qIndex) => {
      if (!question.text.trim()) {
        errors.push(`Question ${qIndex + 1}: Question text is required`);
      }
      
      if (question.points <= 0) {
        errors.push(`Question ${qIndex + 1}: Points must be greater than 0`);
      }
      
      if (question.question_type === 'multiple_choice') {
        if (question.options.length < 2) {
          errors.push(`Question ${qIndex + 1}: At least 2 options are required for multiple choice`);
        }
        
        const correctOptions = question.options.filter(opt => opt.is_correct);
        if (correctOptions.length !== 1) {
          errors.push(`Question ${qIndex + 1}: Exactly one correct option is required`);
        }
        
        question.options.forEach((option, oIndex) => {
          if (!option.text.trim()) {
            errors.push(`Question ${qIndex + 1}, Option ${oIndex + 1}: Option text is required`);
          }
        });
      }
    });
    
    return errors;
  };

  const saveQuiz = async (shouldPublish: boolean = false) => {
    const errors = validateQuiz();
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('tucan_token');
      
      const quizData = {
        ...quiz,
        is_published: shouldPublish,
        due_date: quiz.due_date || null,
        questions: quiz.questions.map(q => ({
          ...q,
          options: q.question_type === 'multiple_choice' ? q.options : []
        }))
      };

      const response = await fetch(`http://localhost:5000/api/quizzes/courses/${courseId}/quizzes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizData),
      });

      if (response.ok) {
        const result = await response.json();
        setSaveSuccess(true);
        
        if (shouldPublish) {
          alert('Quiz created and published successfully!');
        } else {
          alert('Quiz saved as draft successfully!');
        }
        
        // Navigate back to course quizzes page
        navigate(`/courses/${courseId}/quizzes`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save quiz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPoints = () => {
    return quiz.questions.reduce((total, question) => total + question.points, 0);
  };

  const handleBackNavigation = () => {
    if (courseId) {
      navigate(`/courses/${courseId}/quizzes`);
    } else {
      navigate(-1);
    }
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
  };

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6">Loading course...</Typography>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      maxHeight: '100vh', 
      overflow: 'auto',
      pb: 4
    }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                <QuizIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
                Create Quiz
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Course: {course.name}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>
          </Alert>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Quiz saved successfully!
          </Alert>
        )}

        {/* Quiz Basic Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quiz Information
            </Typography>
            
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Quiz Title"
                value={quiz.title}
                onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                fullWidth
                required
                placeholder="e.g., Python Basics Quiz"
              />
              
              <TextField
                label="Description"
                value={quiz.description}
                onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                required
                placeholder="Brief description of what this quiz covers..."
              />
              
              <TextField
                label="Due Date and Time (Optional)"
                type="datetime-local"
                value={quiz.due_date || ''}
                onChange={(e) => setQuiz(prev => ({ ...prev, due_date: e.target.value }))}
                fullWidth
                helperText="Leave empty for no due date"
                InputLabelProps={{
                  shrink: true,
                }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Questions: {quiz.questions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Points: {getTotalPoints()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Questions */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Questions ({quiz.questions.length})
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addQuestion}
                variant="outlined"
              >
                Add Question
              </Button>
            </Box>

            {quiz.questions.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <QuizIcon sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="body1">
                  No questions added yet. Click "Add Question" to get started.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {quiz.questions.map((question, questionIndex) => (
                  <Card key={questionIndex} variant="outlined" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Accordion
                          expanded={expandedQuestion === questionIndex}
                          onChange={() => setExpandedQuestion(
                            expandedQuestion === questionIndex ? null : questionIndex
                          )}
                          elevation={0}
                          sx={{ 
                            '&:before': { display: 'none' },
                            boxShadow: 'none'
                          }}
                        >
                          <AccordionSummary 
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ 
                              px: 2, 
                              py: 1,
                              '& .MuiAccordionSummary-content': { 
                                alignItems: 'center',
                                margin: '12px 0'
                              } 
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1">
                                  Question {questionIndex + 1}
                                  {question.text && `: ${question.text.substring(0, 50)}${question.text.length > 50 ? '...' : ''}`}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Chip 
                                    label={question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Text Answer'} 
                                    size="small" 
                                    color="primary"
                                  />
                                  <Chip 
                                    label={`${question.points} ${question.points === 1 ? 'point' : 'points'}`} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </AccordionSummary>
                          
                          <AccordionDetails sx={{ px: 2, pb: 2 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {/* Question Text */}
                              <TextField
                                label="Question Text"
                                value={question.text}
                                onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                                fullWidth
                                multiline
                                rows={2}
                                required
                                placeholder="Enter your question here..."
                              />
                              
                              {/* Question Type and Points */}
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <FormControl component="fieldset">
                                  <FormLabel component="legend">Question Type</FormLabel>
                                  <RadioGroup
                                    row
                                    value={question.question_type}
                                    onChange={(e) => updateQuestion(questionIndex, 'question_type', e.target.value as 'multiple_choice' | 'text')}
                                  >
                                    <FormControlLabel 
                                      value="multiple_choice" 
                                      control={<Radio />} 
                                      label="Multiple Choice" 
                                    />
                                    <FormControlLabel 
                                      value="text" 
                                      control={<Radio />} 
                                      label="Text Answer" 
                                    />
                                  </RadioGroup>
                                </FormControl>
                                
                                <TextField
                                  label="Points"
                                  type="number"
                                  value={question.points}
                                  onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value) || 1)}
                                  inputProps={{ min: 1 }}
                                  sx={{ width: 120 }}
                                />
                              </Box>
                              
                              {/* Multiple Choice Options */}
                              {question.question_type === 'multiple_choice' && (
                                <Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2">
                                      Answer Options (select the correct one)
                                    </Typography>
                                    <Button
                                      size="small"
                                      startIcon={<AddIcon />}
                                      onClick={() => addOption(questionIndex)}
                                      variant="outlined"
                                    >
                                      Add Option
                                    </Button>
                                  </Box>
                                  
                                  {question.options.map((option, optionIndex) => (
                                    <Box key={optionIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <Radio
                                        checked={option.is_correct}
                                        onChange={(e) => updateOption(questionIndex, optionIndex, 'is_correct', e.target.checked)}
                                        size="small"
                                      />
                                      <TextField
                                        label={`Option ${optionIndex + 1}`}
                                        value={option.text}
                                        onChange={(e) => updateOption(questionIndex, optionIndex, 'text', e.target.value)}
                                        fullWidth
                                        size="small"
                                        placeholder="Enter option text..."
                                      />
                                      {question.options.length > 2 && (
                                        <IconButton
                                          onClick={() => removeOption(questionIndex, optionIndex)}
                                          color="error"
                                          size="small"
                                        >
                                          <DeleteIcon />
                                        </IconButton>
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              )}
                              
                              {/* Text Answer Info */}
                              {question.question_type === 'text' && (
                                <Alert severity="info">
                                  Text questions require manual grading by the teacher.
                                </Alert>
                              )}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      </Box>
                      
                      {/* Delete Button - Outside of Accordion */}
                      <Box sx={{ p: 1, display: 'flex', alignItems: 'flex-start' }}>
                        <IconButton
                          onClick={() => removeQuestion(questionIndex)}
                          color="error"
                          size="small"
                          sx={{ mt: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={() => navigate(`/courses/${courseId}/quizzes`)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={() => setPreviewDialogOpen(true)}
            startIcon={<PreviewIcon />}
            variant="outlined"
            disabled={quiz.questions.length === 0 || loading}
          >
            Preview
          </Button>
          <Button
            onClick={() => saveQuiz(false)}
            startIcon={<SaveIcon />}
            variant="outlined"
            disabled={loading}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => saveQuiz(true)}
            startIcon={<PublishIcon />}
            variant="contained"
            disabled={loading}
          >
            Save & Publish
          </Button>
        </Box>

        {/* Preview Dialog */}
        <Dialog 
          open={previewDialogOpen} 
          onClose={() => setPreviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Quiz Preview</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>{quiz.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {quiz.description}
            </Typography>
            
            {quiz.questions.map((question, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {index + 1}. {question.text} ({question.points} {question.points === 1 ? 'point' : 'points'})
                </Typography>
                
                {question.question_type === 'multiple_choice' ? (
                  <Box sx={{ ml: 2 }}>
                    {question.options.map((option, optIndex) => (
                      <Box key={optIndex} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2">
                          {String.fromCharCode(65 + optIndex)}. {option.text}
                          {option.is_correct && <Chip label="Correct" size="small" color="success" sx={{ ml: 1 }} />}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      [Text answer - manual grading required]
                    </Typography>
                  </Box>
                )}
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default CreateQuiz;
