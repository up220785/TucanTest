import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Timer as TimerIcon,
  Assignment as AssignmentIcon,
  Check as CheckIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface Question {
  id: number;
  text: string;
  question_type: 'multiple_choice' | 'text';
  points: number;
  order: number;
  options: Option[];
}

interface Option {
  id: number;
  text: string;
  order: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  due_date?: string | null;
  total_points: number;
  question_count: number;
  is_past_due: boolean;
  course_name: string;
  course_id: number;
  questions: Question[];
}

interface Answer {
  question_id: number;
  selected_option_id?: number;
  text_answer?: string;
}

const TakeQuiz: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const quizData = await response.json();
        setQuiz(quizData);
        
        // Initialize answers array
        const initialAnswers: Answer[] = quizData.questions.map((q: Question) => ({
          question_id: q.id,
          selected_option_id: undefined,
          text_answer: '',
        }));
        setAnswers(initialAnswers);
        
        setError(null);
      } else {
        throw new Error('Failed to load quiz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (questionId: number, optionId?: number, textAnswer?: string) => {
    setAnswers(prev => prev.map(answer => 
      answer.question_id === questionId 
        ? { 
            ...answer, 
            selected_option_id: optionId,
            text_answer: textAnswer 
          }
        : answer
    ));
  };

  const getAnswer = (questionId: number): Answer | undefined => {
    return answers.find(answer => answer.question_id === questionId);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const token = localStorage.getItem('tucan_token');
      
      // Prepare submission data
      const submissionData = {
        quiz_id: parseInt(quizId || '0'),
        answers: answers.map(answer => ({
          question_id: answer.question_id,
          ...(answer.selected_option_id && { selected_option_id: answer.selected_option_id }),
          ...(answer.text_answer && { text_answer: answer.text_answer }),
        }))
      };

      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        // Mark quiz-related notifications as read
        await markQuizNotificationsAsRead();
        
        alert('Quiz submitted successfully!');
        // Navigate back to the course view page
        if (quiz?.course_id) {
          navigate(`/courses/${quiz.course_id}/view`);
        } else {
          navigate('/homepage'); // Fallback to homepage if course_id is not available
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quiz');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
      setSubmitDialogOpen(false);
    }
  };

  const markQuizNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      // Call backend endpoint to mark quiz notifications as read
      await fetch(`http://localhost:5000/api/quizzes/${quizId}/mark-notifications-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      // Don't fail the submission if notification marking fails
      console.warn('Failed to mark quiz notifications as read:', err);
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackNavigation = () => {
    if (quiz?.course_id) {
      navigate(`/courses/${quiz.course_id}/view`);
    } else {
      navigate(-1);
    }
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
  };

  const getAnsweredCount = () => {
    return answers.filter(answer => 
      answer.selected_option_id !== undefined || 
      (answer.text_answer && answer.text_answer.trim() !== '')
    ).length;
  };

  const isAllAnswered = () => {
    return getAnsweredCount() === quiz?.questions.length;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading quiz...
        </Typography>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">Quiz not found</Alert>
      </Container>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBackNavigation}
            >
              Back
            </Button>
            <Button
              startIcon={<HomeIcon />}
              onClick={handleHomeNavigation}
            >
              Home
            </Button>
          </Box>
          <Box>
            <Typography variant="h4" component="h1">
              <QuizIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              {quiz.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {quiz.course_name}
            </Typography>
          </Box>
        </Box>

        {/* Quiz Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {quiz.description}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                icon={<AssignmentIcon />}
                label={`${quiz.question_count} questions`}
                variant="outlined"
              />
              <Chip
                icon={<QuizIcon />}
                label={`${quiz.total_points} points total`}
                variant="outlined"
              />
              <Chip
                icon={<TimerIcon />}
                label={formatDueDate(quiz.due_date || null)}
                color={quiz.is_past_due ? 'error' : 'default'}
                variant="outlined"
              />
              <Chip
                label={`${getAnsweredCount()}/${quiz.question_count} answered`}
                color={isAllAnswered() ? 'success' : 'default'}
              />
            </Box>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Question Navigation */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {quiz.questions.map((question, index) => {
          const answer = getAnswer(question.id);
          const isAnswered = answer?.selected_option_id !== undefined || 
                           (answer?.text_answer && answer.text_answer.trim() !== '');
          
          return (
            <Button
              key={question.id}
              variant={index === currentQuestionIndex ? 'contained' : 'outlined'}
              color={isAnswered ? 'success' : 'primary'}
              size="small"
              onClick={() => setCurrentQuestionIndex(index)}
              sx={{ minWidth: 40 }}
            >
              {index + 1}
              {isAnswered && <CheckIcon sx={{ ml: 0.5, fontSize: 16 }} />}
            </Button>
          );
        })}
      </Box>

      {/* Current Question */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
              <Chip 
                label={`${currentQuestion.points} ${currentQuestion.points === 1 ? 'point' : 'points'}`}
                size="small"
                sx={{ ml: 2 }}
              />
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {currentQuestion.text}
            </Typography>
          </Box>

          {currentQuestion.question_type === 'multiple_choice' ? (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Select your answer:</FormLabel>
              <RadioGroup
                value={getAnswer(currentQuestion.id)?.selected_option_id || ''}
                onChange={(e) => updateAnswer(currentQuestion.id, parseInt(e.target.value))}
              >
                {currentQuestion.options.map((option) => (
                  <FormControlLabel
                    key={option.id}
                    value={option.id}
                    control={<Radio />}
                    label={option.text}
                    sx={{ mb: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Provide your answer in the text area below:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={getAnswer(currentQuestion.id)?.text_answer || ''}
                onChange={(e) => updateAnswer(currentQuestion.id, undefined, e.target.value)}
                placeholder="Type your answer here..."
                variant="outlined"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Navigation and Submit */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Button
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          >
            Previous
          </Button>
          <Button
            disabled={currentQuestionIndex === quiz.questions.length - 1}
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            sx={{ ml: 1 }}
          >
            Next
          </Button>
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => setSubmitDialogOpen(true)}
          disabled={submitting}
          startIcon={<CheckIcon />}
        >
          Submit Quiz
        </Button>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
        <DialogTitle>Submit Quiz?</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to submit your quiz? You cannot change your answers after submission.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Progress: {getAnsweredCount()} of {quiz.question_count} questions answered
            {!isAllAnswered() && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You have not answered all questions. Unanswered questions will receive 0 points.
              </Alert>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TakeQuiz;
