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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Quiz as QuizIcon,
  Person as PersonIcon,
  Grade as GradeIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

interface Quiz {
  id: number;
  title: string;
  description: string;
  course_name: string;
  total_points: number;
  question_count: number;
}

interface Student {
  id: number;
  name: string;
  email: string;
}

interface Question {
  id: number;
  text: string;
  question_type: 'multiple_choice' | 'text';
  points: number;
  order: number;
  options?: Option[];
}

interface Option {
  id: number;
  text: string;
  is_correct: boolean;
  order: number;
}

interface Answer {
  id: number;
  question_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text';
  question_points: number;
  selected_option_id?: number;
  selected_option_text?: string;
  text_answer?: string;
  score: number;
  is_correct?: boolean;
  grading_comment?: string;
  graded_by?: number;
  graded_at?: string;
}

interface Submission {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  started_at: string;
  completed_at?: string;
  is_completed: boolean;
  total_score: number;
  max_possible_score: number;
  percentage: number;
  attempt_number: number;
  answers: Answer[];
}

const QuizSubmissions: React.FC = () => {
  const navigate = useNavigate();
  const { quizId } = useParams<{ quizId: string }>();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [gradingAnswerId, setGradingAnswerId] = useState<number | null>(null);
  const [gradingScore, setGradingScore] = useState<string>('');
  const [gradingComment, setGradingComment] = useState<string>('');
  const [isGrading, setIsGrading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get user role from localStorage
    const user = JSON.parse(localStorage.getItem('tucan_user') || '{}');
    if (user && user.role) {
      setUserRole(user.role);
    }
    
    if (quizId) {
      fetchQuizDetails();
      fetchSubmissions();
    }
  }, [quizId]);

  const fetchQuizDetails = async () => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const quizData = await response.json();
        setQuiz(quizData);
      } else {
        throw new Error('Failed to fetch quiz details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz details');
    }
  };

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      console.log(`Fetching submissions for quiz ${quizId}`);
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}/submissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Submissions data received:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        setSubmissions(data || []);
        setError(null);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error('Failed to fetch submissions');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = async (submission: Submission) => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      // Fetch detailed submission data with answers
      const response = await fetch(`http://localhost:5000/api/quizzes/submissions/${submission.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const detailedSubmission = await response.json();
        setSelectedSubmission(detailedSubmission);
        setDetailDialogOpen(true);
      } else {
        throw new Error('Failed to fetch submission details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submission details');
    }
  };

  const handleGradeAnswer = async (answerId: number, score: number, comment: string) => {
    try {
      setIsGrading(true);
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/quizzes/answers/${answerId}/grade`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: score,
          feedback: comment
        })
      });

      if (response.ok) {
        // Refresh the submission details to show updated scores
        if (selectedSubmission) {
          await handleViewSubmission(selectedSubmission);
        }
        // Refresh the submissions list to show updated totals
        await fetchSubmissions();
        
        // Reset grading state
        setGradingAnswerId(null);
        setGradingScore('');
        setGradingComment('');
        setError(null);
      } else {
        throw new Error('Failed to grade answer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to grade answer');
    } finally {
      setIsGrading(false);
    }
  };

  const startGrading = (answerId: number, currentScore: number, currentComment: string) => {
    setGradingAnswerId(answerId);
    setGradingScore(currentScore?.toString() || '');
    setGradingComment(currentComment || '');
  };

  const cancelGrading = () => {
    setGradingAnswerId(null);
    setGradingScore('');
    setGradingComment('');
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const calculateStats = () => {
    if (submissions.length === 0) return { average: 0, highest: 0, lowest: 0, completion: 0 };
    
    const completedSubmissions = submissions.filter(s => s.is_completed);
    const scores = completedSubmissions.map(s => s.percentage);
    
    return {
      average: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      highest: scores.length > 0 ? Math.max(...scores) : 0,
      lowest: scores.length > 0 ? Math.min(...scores) : 0,
      completion: Math.round((completedSubmissions.length / submissions.length) * 100)
    };
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
          Loading quiz submissions...
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

  const stats = calculateStats();

  return (
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
              <QuizIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Quiz Submissions
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {quiz.title} - {quiz.course_name}
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

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quiz Statistics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quiz Statistics
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {submissions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Submissions
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.completion}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {stats.average}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Score
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {stats.highest}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Highest Score
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No submissions yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Students haven't submitted any answers for this quiz yet.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box
          sx={{
            maxHeight: '60vh',
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
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Score</TableCell>
                <TableCell align="center">Percentage</TableCell>
                <TableCell align="center">Submitted At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      {submission.student_name}
                    </Box>
                  </TableCell>
                  <TableCell>{submission.student_email}</TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={submission.is_completed ? <CheckCircleIcon /> : <CancelIcon />}
                      label={submission.is_completed ? 'Completed' : 'In Progress'}
                      color={submission.is_completed ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {submission.is_completed ? `${submission.total_score}/${submission.max_possible_score}` : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {submission.is_completed ? (
                      <Chip
                        label={`${Math.round(submission.percentage)}%`}
                        color={getScoreColor(submission.percentage)}
                        size="small"
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {submission.completed_at ? formatDate(submission.completed_at) : 
                     `Started: ${formatDate(submission.started_at)}`}
                  </TableCell>
                  <TableCell align="center">
                    {userRole === 'teacher' ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<GradeIcon />}
                        onClick={() => handleViewSubmission(submission)}
                        disabled={!submission.is_completed}
                        sx={{ fontSize: '0.75rem', px: 1 }}
                      >
                        Regrade
                      </Button>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleViewSubmission(submission)}
                        disabled={!submission.is_completed}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
      )}

      {/* Submission Detail Dialog */}
      <Dialog 
        open={detailDialogOpen} 
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GradeIcon />
            Submission Details - {selectedSubmission?.student_name}
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            maxHeight: '70vh',
            overflowY: 'auto',
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
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}
        >
          {selectedSubmission && (
            <Box>
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Score: {selectedSubmission.total_score}/{selectedSubmission.max_possible_score} 
                  ({Math.round(selectedSubmission.percentage)}%)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Submitted: {selectedSubmission.completed_at ? formatDate(selectedSubmission.completed_at) : 'Not completed'}
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>
                Answers:
              </Typography>

              {selectedSubmission.answers.map((answer, index) => (
                <Accordion key={answer.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1">
                        Question {index + 1}
                      </Typography>
                      <Chip
                        label={`${answer.score}/${answer.question_points} pts`}
                        size="small"
                        color={answer.score === answer.question_points ? 'success' : 'error'}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                        {answer.question_text}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Student's Answer:
                      </Typography>
                      
                      {answer.question_type === 'multiple_choice' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {answer.is_correct ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <CancelIcon color="error" fontSize="small" />
                          )}
                          <Typography variant="body1">
                            {answer.selected_option_text || 'No answer selected'}
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography variant="body1" sx={{ 
                            p: 2, 
                            bgcolor: 'grey.50', 
                            borderRadius: 1,
                            fontStyle: answer.text_answer ? 'normal' : 'italic',
                            mb: 2
                          }}>
                            {answer.text_answer || 'No answer provided'}
                          </Typography>
                          
                          {/* Grading interface for text questions */}
                          {gradingAnswerId === answer.id ? (
                            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Grade this answer:
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                <TextField
                                  label="Score"
                                  type="number"
                                  value={gradingScore}
                                  onChange={(e) => setGradingScore(e.target.value)}
                                  inputProps={{ 
                                    min: 0, 
                                    max: answer.question_points,
                                    step: 0.1 
                                  }}
                                  size="small"
                                  sx={{ width: 120 }}
                                  helperText={`Max: ${answer.question_points}`}
                                />
                                <TextField
                                  label="Feedback (optional)"
                                  value={gradingComment}
                                  onChange={(e) => setGradingComment(e.target.value)}
                                  size="small"
                                  multiline
                                  rows={2}
                                  sx={{ flex: 1 }}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  disabled={isGrading || !gradingScore}
                                  onClick={() => handleGradeAnswer(
                                    answer.id, 
                                    parseFloat(gradingScore), 
                                    gradingComment
                                  )}
                                >
                                  {isGrading ? 'Saving...' : 'Save Grade'}
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={cancelGrading}
                                  disabled={isGrading}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                {answer.grading_comment && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    Feedback: {answer.grading_comment}
                                  </Typography>
                                )}
                                {answer.graded_at && (
                                  <Typography variant="caption" color="text.secondary">
                                    Graded: {formatDate(answer.graded_at)}
                                  </Typography>
                                )}
                              </Box>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => startGrading(answer.id, answer.score, answer.grading_comment || '')}
                              >
                                {answer.score !== null ? 'Regrade' : 'Grade'}
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default QuizSubmissions;
