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
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkReadIcon,
  School as CourseIcon,
  Quiz as QuizIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id?: number;
  related_type?: string;
  action_url?: string;
  expires_at?: string;
  created_at: string;
  is_expired?: boolean;
}

interface CourseInvitation {
  id: number;
  course_id: number;
  course_name?: string;
  teacher_name?: string;
  status: string;
  invited_at: string;
  expires_at?: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<CourseInvitation | null>(null);
  const [responding, setResponding] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('tucan_token');
      const userData = localStorage.getItem('tucan_user');
      
      if (!token || !userData) {
        navigate('/login');
        return;
      }

      const user = JSON.parse(userData);
      
      const response = await fetch(`http://localhost:5000/api/notifications/users/${user.id}/notifications`, {
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
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('tucan_token');
      
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read first
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.type === 'quiz_published' && notification.action_url) {
      // Navigate to the course quizzes page
      navigate(notification.action_url);
      return;
    }

    if (notification.type === 'course_invitation' && notification.related_id) {
      try {
        const token = localStorage.getItem('tucan_token');
        
        const response = await fetch(`http://localhost:5000/api/invitations/${notification.related_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const invitationData = await response.json();
          
          // Get course details
          const courseResponse = await fetch(`http://localhost:5000/api/courses/${invitationData.course_id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (courseResponse.ok) {
            const courseData = await courseResponse.json();
            setSelectedInvitation({
              ...invitationData,
              course_name: courseData.name,
              teacher_name: courseData.teacher_name,
            });
          }
        }
      } catch (err) {
        setError('Failed to load invitation details');
      }
    }
    
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  const respondToInvitation = async (accept: boolean) => {
    if (!selectedInvitation) return;
    
    try {
      setResponding(true);
      const token = localStorage.getItem('tucan_token');
      const endpoint = accept ? 'accept' : 'reject';
      
      const response = await fetch(`http://localhost:5000/api/invitations/${selectedInvitation.id}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        
        // Refresh notifications
        fetchNotifications();
        setSelectedInvitation(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to respond to invitation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to respond to invitation');
    } finally {
      setResponding(false);
    }
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'course_invitation':
        return <CourseIcon color="primary" />;
      case 'quiz_published':
        return <QuizIcon color="secondary" />;
      default:
        return <NotificationsIcon color="primary" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'course_invitation':
        return 'primary';
      case 'quiz_published':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ width: '100%' }}>
          <LinearProgress />
        </Box>
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading notifications...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <NotificationsIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Notifications
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Stay updated with course invitations and important announcements
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No notifications
            </Typography>
            <Typography color="text.secondary">
              You're all caught up! New notifications will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifications.map((notification) => (
            <Card 
              key={notification.id}
              sx={{ 
                opacity: notification.is_read ? 0.7 : 1,
                border: notification.is_read ? 'none' : '2px solid',
                borderColor: notification.is_read ? 'transparent' : 'primary.main',
                cursor: notification.type === 'course_invitation' ? 'pointer' : 'default',
                '&:hover': {
                  boxShadow: notification.type === 'course_invitation' ? 4 : 1,
                }
              }}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom>
                        {notification.title}
                        {!notification.is_read && (
                          <Badge color="primary" variant="dot" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip
                          label={notification.type.replace('_', ' ')}
                          color={getNotificationColor(notification.type) as any}
                          size="small"
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
                          <TimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                          <Typography variant="caption">
                            {formatDate(notification.created_at)}
                          </Typography>
                        </Box>
                        {notification.expires_at && (
                          <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                            <Typography variant="caption">
                              Expires: {formatDate(notification.expires_at)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  {!notification.is_read && (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      size="small"
                      title="Mark as read"
                    >
                      <MarkReadIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
              
              {/* Add action buttons for quiz notifications */}
              {notification.type === 'quiz_published' && (
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    startIcon={<QuizIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (notification.action_url) {
                        navigate(notification.action_url);
                      }
                    }}
                  >
                    View Quiz
                  </Button>
                  {!notification.is_read && (
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      Mark as Read
                    </Button>
                  )}
                </CardActions>
              )}
            </Card>
          ))}
        </Box>
      )}

      {/* Invitation Response Dialog */}
      <Dialog 
        open={!!selectedInvitation} 
        onClose={() => setSelectedInvitation(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CourseIcon sx={{ mr: 2 }} />
            Course Invitation
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInvitation && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInvitation.course_name}
              </Typography>
              {selectedInvitation.teacher_name && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    Taught by: {selectedInvitation.teacher_name}
                  </Typography>
                </Box>
              )}
              <Typography variant="body1" sx={{ mb: 2 }}>
                You have been invited to join this private course. 
                Would you like to accept or decline this invitation?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invited: {formatDate(selectedInvitation.invited_at)}
              </Typography>
              {selectedInvitation.expires_at && (
                <Typography variant="body2" color="warning.main">
                  Expires: {formatDate(selectedInvitation.expires_at)}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setSelectedInvitation(null)}
            disabled={responding}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => respondToInvitation(false)}
            color="error"
            variant="outlined"
            startIcon={<RejectIcon />}
            disabled={responding}
          >
            Decline
          </Button>
          <Button 
            onClick={() => respondToInvitation(true)}
            color="primary"
            variant="contained"
            startIcon={<AcceptIcon />}
            disabled={responding}
          >
            Accept
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default NotificationsPage;
