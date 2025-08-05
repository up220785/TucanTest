import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  ExitToApp as ExitToAppIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';

interface HeaderProps {
  title?: string;
  showSearchBar?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title = "TucanTest", showSearchBar = true }) => {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<number | undefined>(undefined);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem("tucan_user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user.role) {
          setRole(user.role === "student" ? "student" : "teacher");
          setUserName(user.name || "Usuario");
          setUserId(user.id);
          
          // Fetch unread notifications count for all users
          fetchUnreadNotifications(user.id);
        } else {
          setRole(null);
        }
      } catch {
        setRole(null);
      }
    }
  }, []);

  const fetchUnreadNotifications = async (userId: number) => {
    try {
      const token = localStorage.getItem("tucan_token");
      
      if (!token) {
        return;
      }

      const response = await fetch(`http://localhost:5000/api/notifications/users/${userId}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.notifications?.filter((notification: any) => !notification.is_read).length || 0;
        setUnreadNotifications(unreadCount);
      }
    } catch (err) {
      // Silently handle errors for notifications count
      console.error('Failed to fetch unread notifications count:', err);
    }
  };

  const handleLogout = () => {
    // Clear user session data
    localStorage.removeItem("tucan_token");
    localStorage.removeItem("tucan_user");
    
    // Redirect to login page
    navigate("/login", { 
      state: { 
        message: "Sesión cerrada exitosamente." 
      } 
    });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate("/profile");
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    handleLogout();
  };

  const getHeaderColor = () => {
    return role === 'teacher' ? '#EA5C00' : '#30638E';
  };

  const isCurrentPage = (path: string) => {
    return location.pathname === path;
  };

  if (!role) {
    return null; // Don't show header if user is not logged in
  }

  return (
    <AppBar position="sticky" sx={{ 
      backgroundColor: getHeaderColor(), 
      zIndex: 1100,
      fontFamily: 'Rammetto One, sans-serif'
    }}>
      <Toolbar>
        {/* Home/Title button */}
        <IconButton
          color="inherit"
          onClick={() => navigate("/homepage")}
          sx={{ mr: 2 }}
        >
          <HomeIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" sx={{ 
          fontWeight: 'bold', 
          mr: 3,
          fontFamily: 'Rammetto One, sans-serif'
        }}>
          {title}
        </Typography>
        
        {/* Search Bar */}
        {showSearchBar && (
          <Box sx={{ flexGrow: 1, maxWidth: 400, mr: 2 }}>
            <SearchBar userRole={role} userId={userId} />
          </Box>
        )}
        
        {/* Spacer when no search bar */}
        {!showSearchBar && <Box sx={{ flexGrow: 1 }} />}
        
        {/* Navigation Options based on role */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {role === "teacher" && (
            <>
              <Button 
                color="inherit" 
                startIcon={<SchoolIcon />}
                onClick={() => navigate("/my-courses")}
                sx={{ 
                  textTransform: 'none',
                  fontFamily: 'Rammetto One, sans-serif',
                  backgroundColor: isCurrentPage('/my-courses') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
              >
                Mis Cursos
              </Button>
              <Button 
                color="inherit" 
                startIcon={<AssessmentIcon />}
                onClick={() => navigate("/teacher/statistics")}
                sx={{ 
                  textTransform: 'none',
                  fontFamily: 'Rammetto One, sans-serif',
                  backgroundColor: isCurrentPage('/teacher/statistics') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
              >
                Estadísticas
              </Button>
              <IconButton
                color="inherit"
                onClick={() => navigate("/notifications")}
                sx={{ 
                  ml: 1,
                  backgroundColor: isCurrentPage('/notifications') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
              >
                <Badge 
                  badgeContent={unreadNotifications > 0 ? unreadNotifications : undefined} 
                  color="error"
                  showZero={false}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </>
          )}

          {role === "student" && (
            <>
              <Button 
                color="inherit" 
                startIcon={<SearchIcon />}
                onClick={() => navigate("/explore-courses")}
                sx={{ 
                  textTransform: 'none',
                  fontFamily: 'Rammetto One, sans-serif',
                  backgroundColor: isCurrentPage('/explore-courses') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
              >
                Explorar Cursos
              </Button>
              <IconButton
                color="inherit"
                onClick={() => navigate("/notifications")}
                sx={{ 
                  ml: 1,
                  backgroundColor: isCurrentPage('/notifications') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
              >
                <Badge 
                  badgeContent={unreadNotifications > 0 ? unreadNotifications : undefined} 
                  color="error"
                  showZero={false}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </>
          )}

          {/* Profile Menu */}
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ 
              ml: 2,
              backgroundColor: isCurrentPage('/profile') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            <AccountCircleIcon />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={handleProfileClick} sx={{ fontFamily: 'Rammetto One, sans-serif' }}>
          <AccountCircleIcon sx={{ mr: 1 }} />
          Ver mi Perfil
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogoutClick} sx={{ 
          color: 'error.main',
          fontFamily: 'Rammetto One, sans-serif'
        }}>
          <ExitToAppIcon sx={{ mr: 1 }} />
          Cerrar Sesión
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header;
