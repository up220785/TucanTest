import React from 'react';
import { Box } from '@mui/material';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showSearchBar?: boolean;
  backgroundColor?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = "TucanTest", 
  showSearchBar = true,
  backgroundColor = '#f5f5f5'
}) => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor,
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      // Mobile-friendly scrolling setup
      WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      '&::-webkit-scrollbar': {
        width: { xs: '2px', sm: '6px' }, // Very thin scrollbar on mobile
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#c1c1c1',
        borderRadius: '3px',
        '&:hover': {
          backgroundColor: '#a8a8a8',
        },
      },
    }}>
      <Header title={title} showSearchBar={showSearchBar} />
      <Box sx={{ 
        flex: 1,
        pt: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 2 },
        pb: { xs: 2, sm: 4 },
        overflowY: 'auto',
        overflowX: 'hidden',
        // Mobile scrolling optimizations
        WebkitOverflowScrolling: 'touch',
        scrollBehavior: 'smooth',
        // Ensure proper touch scrolling
        touchAction: 'pan-y',
        // Height calculation for mobile viewport
        minHeight: { 
          xs: 'calc(100vh - 56px)', // Mobile header height
          sm: 'calc(100vh - 64px)'  // Desktop header height
        },
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
