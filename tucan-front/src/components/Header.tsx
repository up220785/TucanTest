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
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountCircle as AccountCircleIcon,
  School as SchoolIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Assessment as AssessmentIcon,
  ExitToApp as ExitToAppIcon,
  Home as HomeIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { buildApiUrl } from '../config/api';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

      const response = await fetch(buildApiUrl(`/api/notifications/users/${userId}/notifications`), {
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

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    setMobileMenuOpen(false);
    navigate("/profile");
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    setMobileMenuOpen(false);
    handleLogout();
  };

  const getHeaderColor = () => {
    return role === 'teacher' ? '#EA5C00' : '#30638E';
  };

  const isCurrentPage = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = {
    teacher: [
      { label: 'Mis Cursos', icon: SchoolIcon, path: '/my-courses' },
      { label: 'Estadísticas', icon: AssessmentIcon, path: '/teacher/statistics' },
    ],
    student: [
      { label: 'Explorar Cursos', icon: SearchIcon, path: '/explore-courses' },
    ],
  };

  if (!role) {
    return null; // Don't show header if user is not logged in
  }

  return (
    <>
      <AppBar position="sticky" sx={{ 
        backgroundColor: getHeaderColor(), 
        zIndex: 1100,
        fontFamily: 'Rammetto One, sans-serif'
      }}>
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleMobileMenuToggle}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Home/Title button */}
          <IconButton
            color="inherit"
            onClick={() => navigate("/homepage")}
            sx={{ mr: { xs: 1, sm: 2 } }}
          >
            <HomeIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold', 
            mr: { xs: 1, sm: 3 },
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontFamily: 'Rammetto One, sans-serif'
          }}>
            {isMobile ? 'TT' : title}
          </Typography>
          
          {/* Search Bar - Hidden on mobile, shown in drawer */}
          {showSearchBar && !isMobile && (
            <Box sx={{ flexGrow: 1, maxWidth: 400, mr: 2 }}>
              <SearchBar userRole={role} userId={userId} />
            </Box>
          )}
          
          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {navigationItems[role].map((item) => (
                <Button 
                  key={item.path}
                  color="inherit" 
                  startIcon={<item.icon />}
                  onClick={() => navigate(item.path)}
                  sx={{ 
                    textTransform: 'none',
                    fontFamily: 'Rammetto One, sans-serif',
                    backgroundColor: isCurrentPage(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={() => navigate("/notifications")}
            sx={{ 
              ml: { xs: 1, sm: 2 },
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

          {/* Profile Menu */}
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ 
              ml: { xs: 1, sm: 2 },
              backgroundColor: isCurrentPage('/profile') ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={handleMobileMenuToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: 250,
            backgroundColor: getHeaderColor(),
            color: 'white',
          },
        }}
      >
        <Box sx={{ pt: 2, pb: 2 }}>
          <Typography variant="h6" sx={{ 
            px: 2, 
            mb: 2, 
            fontFamily: 'Rammetto One, sans-serif',
            color: 'white'
          }}>
            TucanTest
          </Typography>
          
          {/* Search Bar in mobile drawer */}
          {showSearchBar && (
            <Box sx={{ px: 2, mb: 2 }}>
              <SearchBar userRole={role} userId={userId} />
            </Box>
          )}

          <List>
            {navigationItems[role].map((item) => (
              <ListItem 
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                sx={{ 
                  cursor: 'pointer',
                  backgroundColor: isCurrentPage(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'white' }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  sx={{ 
                    '& .MuiTypography-root': {
                      fontFamily: 'Rammetto One, sans-serif'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

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
    </>
  );
};

export default Header;
