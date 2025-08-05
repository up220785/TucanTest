import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Send as SendIcon,
} from '@mui/icons-material';

interface InviteStudentsDialogProps {
  open: boolean;
  onClose: () => void;
  courseId: number;
  courseName: string;
  onInvitesSent?: () => void;
}

interface InvitationResult {
  email: string;
  success: boolean;
  message: string;
}

const InviteStudentsDialog: React.FC<InviteStudentsDialogProps> = ({
  open,
  onClose,
  courseId,
  courseName,
  onInvitesSent,
}) => {
  const [emails, setEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expirationDays, setExpirationDays] = useState(7);

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendInvitations = async () => {
    // Validate emails
    const validEmails = emails.filter(email => email.trim() !== '');
    const invalidEmails = validEmails.filter(email => !validateEmail(email));
    
    if (validEmails.length === 0) {
      setError('Please enter at least one email address');
      return;
    }
    
    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const token = localStorage.getItem('tucan_token');
      const results: InvitationResult[] = [];
      
      // Send invitations one by one
      for (const email of validEmails) {
        try {
          const response = await fetch(`http://localhost:5000/api/courses/${courseId}/invite`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              student_email: email.trim(),
              expires_in_days: expirationDays,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            results.push({ email, success: true, message: result.message || 'Invitation sent successfully' });
          } else {
            const errorData = await response.json();
            console.error(`Failed to invite ${email}:`, errorData);
            results.push({ email, success: false, message: errorData.error || errorData.message || 'Failed to send invitation' });
          }
        } catch (err) {
          results.push({ email, success: false, message: 'Network error' });
        }
      }

      // Process results
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        setSuccess(`Successfully sent ${successful.length} invitation(s)`);
        
        if (onInvitesSent) {
          onInvitesSent();
        }

        // If all invitations were successful, close the dialog after a short delay
        if (failed.length === 0) {
          setTimeout(() => {
            handleClose();
          }, 1500); // Show success message for 1.5 seconds before closing
        }
      }

      if (failed.length > 0) {
        const failedMessages = failed.map(f => `${f.email}: ${f.message}`).join('\\n');
        setError(`Failed to send ${failed.length} invitation(s):\\n${failedMessages}`);
      }

      // Clear successful emails (only if there were failures to allow retry)
      if (successful.length > 0 && failed.length > 0) {
        const remainingEmails = emails.filter((email, index) => {
          return !successful.some(s => s.email === email.trim());
        });
        setEmails(remainingEmails.length > 0 ? remainingEmails : ['']);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmails(['']);
      setError(null);
      setSuccess(null);
      setExpirationDays(7);
      onClose();
    }
  };

  const canSendInvitations = emails.some(email => email.trim() !== '') && !loading;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EmailIcon sx={{ mr: 2 }} />
          Invite Students to Course
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Send invitations to students to join the private course "<strong>{courseName}</strong>".
        </Typography>

        {/* Expiration Settings */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Invitation expires in (days)"
            type="number"
            value={expirationDays}
            onChange={(e) => setExpirationDays(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: 30 }}
            size="small"
            sx={{ width: 200 }}
            helperText="Invitations will expire after this many days"
          />
        </Box>

        {/* Email Fields */}
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Student Email Addresses:
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {emails.map((email, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                label={`Email ${index + 1}`}
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
                error={email.trim() !== '' && !validateEmail(email)}
                helperText={email.trim() !== '' && !validateEmail(email) ? 'Invalid email format' : ''}
                fullWidth
                size="small"
                placeholder="student@example.com"
              />
              {emails.length > 1 && (
                <IconButton
                  onClick={() => removeEmailField(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>

        <Button
          startIcon={<AddIcon />}
          onClick={addEmailField}
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
        >
          Add Another Email
        </Button>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
              {error}
            </pre>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}

        {/* Info */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> Students will receive a notification about the course invitation. 
            They can accept or decline the invitation from their notifications page.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={sendInvitations}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          disabled={!canSendInvitations}
        >
          {loading ? 'Sending...' : 'Send Invitations'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteStudentsDialog;
