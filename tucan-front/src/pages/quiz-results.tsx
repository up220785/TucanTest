import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Help } from '@mui/icons-material';

interface Question {
  id: number;
  text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
}

interface SubmissionAnswer {
  question_id: number;
  selected_answer: string;
  is_correct: boolean;
}

interface QuizSubmission {
  id: number;
  quiz_id: number;
  student_id: number;
  score: number;
  submitted_at: string;
  graded_at: string;
  answers: SubmissionAnswer[];
}

interface QuizResultsData {
  quiz: {
    id: number;
    title: string;
    description: string;
    total_points: number;
    course_id: number;
    course_name: string;
  };
  submission: QuizSubmission;
  questions: Question[];
}

const QuizResults: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [resultsData, setResultsData] = useState<QuizResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizResults = async () => {
      try {
        const token = localStorage.getItem('tucan_token');
        if (!token) {
          setError('Authentication required');
          return;
        }

        const response = await fetch(`http://localhost:5000/api/quiz/${quizId}/results`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        setResultsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quiz results');
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuizResults();
    }
  }, [quizId]);

  const handleBackToCourse = () => {
    if (resultsData?.quiz.course_id) {
      navigate(`/courses/${resultsData.quiz.course_id}/view`);
    } else {
      navigate('/homepage');
    }
  };

  const getScoreColor = (score: number, totalPoints: number) => {
    const percentage = (score / totalPoints) * 100;
    if (percentage >= 90) return 'success';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/homepage')}
          sx={{ mt: 2 }}
        >
          Back to Homepage
        </Button>
      </Container>
    );
  }

  if (!resultsData) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">No quiz results found</Alert>
      </Container>
    );
  }

  const { quiz, submission, questions } = resultsData;
  const scorePercentage = Math.round((submission.score / quiz.total_points) * 100);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor: '#f5f5f5',
      pb: 4
    }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4, minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleBackToCourse}
            sx={{ mb: 2 }}
          >
            Back to Course
          </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Quiz Results: {quiz.title}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Course: {quiz.course_name}
        </Typography>
      </Box>

      {/* Score Summary */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 1 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Your Score</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h3" component="span">
                  {submission.score}
                </Typography>
                <Typography variant="h5" component="span" color="text.secondary">
                  / {quiz.total_points}
                </Typography>
                <Chip
                  label={`${scorePercentage}%`}
                  color={getScoreColor(submission.score, quiz.total_points)}
                  size="medium"
                  sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                />
              </Box>
            </Stack>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                <strong>Submitted:</strong> {formatDate(submission.submitted_at)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Graded:</strong> {formatDate(submission.graded_at)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Questions Correct:</strong> {submission.answers.filter(a => a.is_correct).length} / {questions.length}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Question Details */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2 }}>
        Question Review ({questions.length} questions)
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
        maxHeight: { xs: 'none', md: '60vh' },
        overflowY: { xs: 'visible', md: 'auto' },
        pr: { xs: 0, md: 1 },
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: '#a8a8a8',
          },
        },
      }}>
        {questions.map((question, index) => {
          const userAnswer = submission.answers.find(a => a.question_id === question.id);
          const isCorrect = userAnswer?.is_correct || false;
          
          return (
            <Card key={question.id} sx={{ 
              mb: 2, 
              border: isCorrect ? '2px solid #4caf50' : '2px solid #f44336',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4
              }
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
                    <Typography variant="h6" component="span">
                      Q{index + 1}
                    </Typography>
                    {isCorrect ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Cancel color="error" />
                    )}
                  </Box>
                  <Chip
                    label={isCorrect ? 'Correct' : 'Incorrect'}
                    color={isCorrect ? 'success' : 'error'}
                    size="small"
                  />
                </Box>

                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium', lineHeight: 1.6 }}>
                  {question.text}
                </Typography>

                {question.question_type === 'multiple_choice' && (
                <Box sx={{ ml: { xs: 0, md: 2 } }}>
                  {question.options.map((option, optionIndex) => {
                    const isUserAnswer = userAnswer?.selected_answer === option;
                    const isCorrectAnswer = question.correct_answer === option;
                    
                    let backgroundColor = 'transparent';
                    let border = '1px solid #e0e0e0';
                    let color = 'inherit';
                    
                    if (isCorrectAnswer) {
                      backgroundColor = '#e8f5e8';
                      border = '2px solid #4caf50';
                      color = '#2e7d32';
                    } else if (isUserAnswer && !isCorrect) {
                      backgroundColor = '#ffebee';
                      border = '2px solid #f44336';
                      color = '#c62828';
                    }

                    return (
                      <Box
                        key={optionIndex}
                        sx={{
                          p: { xs: 1, md: 1.5 },
                          mb: 1,
                          borderRadius: 1,
                          backgroundColor,
                          border,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          flexWrap: 'wrap'
                        }}
                      >
                        <Typography variant="body2" sx={{ 
                          color, 
                          fontWeight: isUserAnswer || isCorrectAnswer ? 'bold' : 'normal',
                          flex: 1,
                          minWidth: 0,
                          wordBreak: 'break-word'
                        }}>
                          {String.fromCharCode(65 + optionIndex)}. {option}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          {isUserAnswer && (
                            <Chip label="Your Answer" size="small" variant="outlined" />
                          )}
                          {isCorrectAnswer && (
                            <Chip label="Correct Answer" size="small" color="success" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {question.question_type === 'true_false' && (
                <Box sx={{ ml: { xs: 0, md: 2 } }}>
                  {['True', 'False'].map((option) => {
                    const isUserAnswer = userAnswer?.selected_answer === option;
                    const isCorrectAnswer = question.correct_answer === option;
                    
                    let backgroundColor = 'transparent';
                    let border = '1px solid #e0e0e0';
                    let color = 'inherit';
                    
                    if (isCorrectAnswer) {
                      backgroundColor = '#e8f5e8';
                      border = '2px solid #4caf50';
                      color = '#2e7d32';
                    } else if (isUserAnswer && !isCorrect) {
                      backgroundColor = '#ffebee';
                      border = '2px solid #f44336';
                      color = '#c62828';
                    }

                    return (
                      <Box
                        key={option}
                        sx={{
                          p: { xs: 1, md: 1.5 },
                          mb: 1,
                          borderRadius: 1,
                          backgroundColor,
                          border,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          flexWrap: 'wrap'
                        }}
                      >
                        <Typography variant="body2" sx={{ 
                          color, 
                          fontWeight: isUserAnswer || isCorrectAnswer ? 'bold' : 'normal',
                          flex: 1,
                          minWidth: 0,
                          wordBreak: 'break-word'
                        }}>
                          {option}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          {isUserAnswer && (
                            <Chip label="Your Answer" size="small" variant="outlined" />
                          )}
                          {isCorrectAnswer && (
                            <Chip label="Correct Answer" size="small" color="success" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
      </Box>

      {/* Footer Actions */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleBackToCourse}
          startIcon={<ArrowBack />}
        >
          Return to Course
        </Button>
      </Box>
      </Container>
    </Box>
  );
};

export default QuizResults;
