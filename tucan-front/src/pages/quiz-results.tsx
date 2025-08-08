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
  Stack,
  IconButton
} from '@mui/material';
import {
  ArrowBack, 
  CheckCircle, 
  Cancel, 
  Help, 
  Home as HomeIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { buildApiUrl } from '../config/api';

interface Question {
  id: number;
  text: string;
  question_type: string;
  points: number;
  options: string[];
  correct_answer: string;
}

interface SubmissionAnswer {
  question_id: number;
  selected_answer: string;
  is_correct: boolean;
  score: number;
}

interface QuizSubmission {
  id: number;
  quiz_id: number;
  student_id: number;
  score: number;
  auto_graded_score: number;
  manual_graded_score: number | null;
  is_graded: boolean;
  is_pending_manual_grade: boolean;
  submitted_at: string;
  graded_at: string;
  answers: SubmissionAnswer[];
}

interface GradingStatus {
  has_text_questions: boolean;
  is_fully_graded: boolean;
  requires_manual_grading: boolean;
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
  grading_status: GradingStatus;
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

        const response = await fetch(buildApiUrl(`/api/quiz/${quizId}/results`), {
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

  const handleBackNavigation = () => {
    // Use browser history to go back to the previous page
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to course if available
      if (resultsData?.quiz.course_id) {
        navigate(`/courses/${resultsData.quiz.course_id}/view`);
      } else {
        navigate('/homepage');
      }
    }
  };

  const handleHomeNavigation = () => {
    navigate('/homepage');
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
      <Layout title="Resultados del Quiz">
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Resultados del Quiz">
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={handleBackNavigation}
              sx={{ fontFamily: 'Rammetto One, sans-serif' }}
            >
              Volver
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleHomeNavigation}
              sx={{ fontFamily: 'Rammetto One, sans-serif' }}
            >
              Inicio
            </Button>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (!resultsData) {
    return (
      <Layout title="Resultados del Quiz">
        <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
          <Alert severity="warning">No se encontraron resultados para este quiz.</Alert>
        </Container>
      </Layout>
    );
  }

  const { quiz, submission, questions, grading_status } = resultsData;
  
  // Calculate appropriate score and percentage based on grading status
  const displayScore = submission.is_graded ? submission.score : submission.auto_graded_score || 0;
  const maxPossibleScore = submission.is_graded ? quiz.total_points : 
    (quiz.total_points - questions.filter(q => q.question_type === 'text').length * 5); // Assuming 5 points per text question
  const scorePercentage = maxPossibleScore > 0 ? Math.round((displayScore / maxPossibleScore) * 100) : 0;

  return (
    <Layout title="Resultados del Quiz">
      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={handleBackNavigation} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              Resultados del Quiz: {quiz.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              Curso: {quiz.course_name}
            </Typography>
          </Box>
          <IconButton onClick={handleHomeNavigation} sx={{ ml: 2 }}>
            <HomeIcon />
          </IconButton>
        </Box>

      {/* Score Summary */}
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, mb: 3, bgcolor: 'background.paper' }}>
        {grading_status.requires_manual_grading && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
              Este quiz contiene preguntas de texto que requieren calificación manual. Tu puntuación final está pendiente de revisión del profesor.
            </Typography>
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                {grading_status.requires_manual_grading ? 'Puntuación Parcial (Auto-Calificada)' : 'Tu Puntuación'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="h3" component="span" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                  {displayScore}
                </Typography>
                <Typography variant="h5" component="span" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                  / {grading_status.requires_manual_grading ? maxPossibleScore : quiz.total_points}
                </Typography>
                {grading_status.requires_manual_grading ? (
                  <Chip
                    label="Calificación Pendiente"
                    color="warning"
                    size="medium"
                    sx={{ fontSize: '1rem', fontWeight: 'bold', fontFamily: 'Rammetto One, sans-serif' }}
                  />
                ) : (
                  <Chip
                    label={`${scorePercentage}%`}
                    color={getScoreColor(displayScore, quiz.total_points)}
                    size="medium"
                    sx={{ fontSize: '1rem', fontWeight: 'bold', fontFamily: 'Rammetto One, sans-serif' }}
                  />
                )}
              </Box>
            </Stack>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                <strong>Entregado:</strong> {formatDate(submission.submitted_at)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                <strong>Calificado:</strong> {submission.is_graded ? formatDate(submission.graded_at) : 'Pendiente'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                <strong>Preguntas Correctas:</strong> {submission.answers.filter(a => a.is_correct).length} / {questions.filter(q => q.question_type !== 'text').length}
                {grading_status.has_text_questions && ' (excluyendo preguntas de texto)'}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Paper>

      {/* Question Details */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 2, fontFamily: 'Rammetto One, sans-serif' }}>
        Revisión de Preguntas ({questions.length} preguntas)
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
      }}>
        {questions.map((question, index) => {
          const userAnswer = submission.answers.find(a => a.question_id === question.id);
          const isCorrect = userAnswer?.is_correct || false;
          
          // Use the actual score from the API instead of calculating based on isCorrect
          const pointsEarned = userAnswer?.score || 0;
          
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
                    <Typography variant="h6" component="span" sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
                      P{index + 1}
                    </Typography>
                    {isCorrect ? (
                      <CheckCircle color="success" />
                    ) : (
                      <Cancel color="error" />
                    )}
                  </Box>
                  <Chip
                    label={isCorrect ? 'Correcta' : 'Incorrecta'}
                    color={isCorrect ? 'success' : 'error'}
                    size="small"
                    sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                  />
                  <Chip
                    label={`${pointsEarned}/${question.points} puntos`}
                    color={pointsEarned === question.points ? 'success' : pointsEarned > 0 ? 'warning' : 'error'}
                    variant="outlined"
                    size="small"
                    sx={{ fontFamily: 'Rammetto One, sans-serif' }}
                  />
                </Box>

                <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium', lineHeight: 1.6, fontFamily: 'Rammetto One, sans-serif' }}>
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
                            <Chip label="Tu Respuesta" size="small" variant="outlined" sx={{ fontFamily: 'Rammetto One, sans-serif' }} />
                          )}
                          {isCorrectAnswer && (
                            <Chip label="Respuesta Correcta" size="small" color="success" variant="outlined" sx={{ fontFamily: 'Rammetto One, sans-serif' }} />
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
                            <Chip label="Tu Respuesta" size="small" variant="outlined" sx={{ fontFamily: 'Rammetto One, sans-serif' }} />
                          )}
                          {isCorrectAnswer && (
                            <Chip label="Respuesta Correcta" size="small" color="success" variant="outlined" sx={{ fontFamily: 'Rammetto One, sans-serif' }} />
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
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleBackNavigation}
          startIcon={<ArrowBack />}
          sx={{ fontFamily: 'Rammetto One, sans-serif' }}
        >
          Volver
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={handleHomeNavigation}
          startIcon={<HomeIcon />}
          sx={{ fontFamily: 'Rammetto One, sans-serif' }}
        >
          Inicio
        </Button>
      </Box>
      </Container>
    </Layout>
  );
};

export default QuizResults;
