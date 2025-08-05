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
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      backgroundColor,
      pb: 4,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
      <Header title={title} showSearchBar={showSearchBar} />
      <Box sx={{ 
        pt: 2,
        height: 'calc(100vh - 64px)', // Subtract header height
        overflow: 'auto'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
