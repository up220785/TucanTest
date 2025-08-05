import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  School as SchoolIcon,
  Quiz as QuizIcon,
  Assessment as AssessmentIcon,
  MenuBook as MenuBookIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
  Explore as ExploreIcon,
  Group as GroupIcon,
  Create as CreateIcon,
  BarChart as BarChartIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import '../styles/search-bar.css';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: 'navigation' | 'course' | 'quiz' | 'feature';
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  keywords: string[];
  userRole: string[];
}

interface SearchBarProps {
  userRole: 'student' | 'teacher' | null;
  userId?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ userRole, userId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Define all searchable items based on user role
  const getSearchableItems = (): SearchItem[] => {
    const commonItems: SearchItem[] = [
      {
        id: 'profile',
        title: 'Mi Perfil',
        description: 'Ver y editar información personal',
        category: 'navigation',
        icon: <AccountCircleIcon />,
        path: '/profile',
        keywords: ['perfil', 'profile', 'información', 'personal', 'datos'],
        userRole: ['student', 'teacher'],
      },
      {
        id: 'notifications',
        title: 'Notificaciones',
        description: 'Ver notificaciones y mensajes',
        category: 'navigation',
        icon: <NotificationsIcon />,
        path: '/notifications',
        keywords: ['notificaciones', 'notifications', 'mensajes', 'alerts'],
        userRole: ['student', 'teacher'],
      },
      {
        id: 'logout',
        title: 'Cerrar Sesión',
        description: 'Salir de la aplicación',
        category: 'navigation',
        icon: <ExitToAppIcon />,
        action: () => {
          localStorage.removeItem("tucan_token");
          localStorage.removeItem("tucan_user");
          navigate("/login", { state: { message: "Sesión cerrada exitosamente." } });
        },
        keywords: ['cerrar', 'logout', 'salir', 'exit', 'sesión'],
        userRole: ['student', 'teacher'],
      },
    ];

    const teacherItems: SearchItem[] = [
      {
        id: 'my-courses',
        title: 'Mis Cursos',
        description: 'Gestionar cursos creados',
        category: 'navigation',
        icon: <SchoolIcon />,
        path: '/my-courses',
        keywords: ['mis cursos', 'courses', 'gestionar', 'crear curso', 'teacher courses'],
        userRole: ['teacher'],
      },
      {
        id: 'teacher-statistics',
        title: 'Estadísticas del Profesor',
        description: 'Ver estadísticas generales de enseñanza',
        category: 'feature',
        icon: <BarChartIcon />,
        path: '/teacher/statistics',
        keywords: ['estadísticas', 'statistics', 'métricas', 'profesor', 'teacher', 'analytics'],
        userRole: ['teacher'],
      },
      {
        id: 'create-course',
        title: 'Crear Curso',
        description: 'Crear un nuevo curso',
        category: 'feature',
        icon: <CreateIcon />,
        path: '/my-courses',
        keywords: ['crear curso', 'create course', 'nuevo curso', 'new course'],
        userRole: ['teacher'],
      },
    ];

    const studentItems: SearchItem[] = [
      {
        id: 'explore-courses',
        title: 'Explorar Cursos',
        description: 'Buscar y unirse a cursos disponibles',
        category: 'navigation',
        icon: <ExploreIcon />,
        path: '/explore-courses',
        keywords: ['explorar', 'explore', 'buscar cursos', 'search courses', 'join courses'],
        userRole: ['student'],
      },
    ];

    let items = [...commonItems];
    
    if (userRole === 'teacher') {
      items = [...items, ...teacherItems];
    } else if (userRole === 'student') {
      items = [...items, ...studentItems];
    }

    return items;
  };

  // Fetch user's courses and quizzes for dynamic search
  useEffect(() => {
    if (userRole && userId) {
      fetchUserData();
    }
  }, [userRole, userId]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("tucan_token");
      if (!token) return;

      if (userRole === 'teacher') {
        // Fetch teacher's courses
        const coursesResponse = await fetch(`http://localhost:5000/api/course-users/teachers/${userId}/courses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData);
        }
      } else if (userRole === 'student') {
        // Fetch student's enrolled courses
        const coursesResponse = await fetch(`http://localhost:5000/api/course-users/students/${userId}/courses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          setCourses(coursesData);
        }
      }
    } catch (error) {
      console.error('Error fetching user data for search:', error);
    }
  };

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const searchableItems = getSearchableItems();
    const searchLower = query.toLowerCase();

    // Search static items
    const staticResults = searchableItems.filter(item =>
      userRole && item.userRole.includes(userRole) &&
      (item.title.toLowerCase().includes(searchLower) ||
       item.description.toLowerCase().includes(searchLower) ||
       item.keywords.some(keyword => keyword.toLowerCase().includes(searchLower)))
    );

    // Search dynamic courses
    const courseResults: SearchItem[] = courses
      .filter(course => 
        course.name.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      )
      .map(course => ({
        id: `course-${course.id}`,
        title: course.name,
        description: course.description || 'Curso disponible',
        category: 'course' as const,
        icon: <SchoolIcon />,
        path: userRole === 'teacher' ? `/courses/${course.id}/view` : `/courses/${course.id}/view`,
        keywords: [course.name, course.description || ''],
        userRole: ['student', 'teacher'],
      }));

    const allResults = [...staticResults, ...courseResults];
    setSearchResults(allResults.slice(0, 8)); // Limit to 8 results
  };

  // Handle item selection
  const handleItemSelect = (item: SearchItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'navigation': return 'Navegación';
      case 'course': return 'Curso';
      case 'quiz': return 'Quiz';
      case 'feature': return 'Función';
      default: return '';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation': return '#30638E';
      case 'course': return '#EA5C00';
      case 'quiz': return '#FFCF49';
      case 'feature': return '#F49524';
      default: return '#30638E';
    }
  };

  if (!userRole) {
    return null;
  }

  return (
    <Box ref={searchRef} className="search-bar-container" sx={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <TextField
        className="search-input"
        size="small"
        placeholder="Buscar funciones, cursos..."
        value={searchQuery}
        onChange={(e) => {
          handleSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsOpen(false);
                }}
                sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
              >
                <CloseIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ width: '100%' }}
      />

      {isOpen && searchResults.length > 0 && (
        <Paper className="search-results-paper">
          <List dense>
            {searchResults.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem
                  component="div"
                  className="search-result-item"
                  onClick={() => handleItemSelect(item)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography className="search-result-title" variant="body2">
                          {item.title}
                        </Typography>
                        <Chip
                          label={getCategoryLabel(item.category)}
                          size="small"
                          className="search-category-chip"
                          sx={{
                            backgroundColor: getCategoryColor(item.category),
                            color: 'white',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography className="search-result-description" variant="caption">
                        {item.description}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < searchResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {isOpen && searchQuery && searchResults.length === 0 && (
        <Paper className="search-results-paper">
          <Typography className="search-no-results" variant="body2">
            No se encontraron resultados para "{searchQuery}"
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SearchBar;
