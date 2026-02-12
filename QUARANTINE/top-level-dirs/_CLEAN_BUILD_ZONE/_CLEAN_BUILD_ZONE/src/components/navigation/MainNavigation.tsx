import React from 'react';
import { AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem } from '@mui/material';
import { Home,
  Dashboard,
  Description,
  Settings,
  AccountCircle,
  MenuBook } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MainNavigation: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <AppBar position='static' sx={{ bgcolor: 'primary.main' }}>
      <Toolbar>
        <IconButton
          edge='start'
          color='inherit'
          aria-label='home'
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >


          <Home />
        </IconButton>

        <Typography

variant='h6' component='div' sx={{ flexGrow: 1 }}>
          Terrafusion OS 1.0
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>


          <Button color='inherit' startIcon={<Dashboard />} onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>

          <Button

color='inherit' startIcon={<MenuBook />} onClick={() => navigate('/docs')}>
            API Docs
          </Button>


          <Button
            color='inherit'
            startIcon={<Description />}
            onClick={() => navigate('/harris-pacs')}
          >
            Harris PACS
          </Button>

          <IconButton

size='large'
            aria-label='account of current user'
            aria-controls='menu-appbar'
            aria-haspopup='true'
            onClick={handleMenu}
            color='inherit'
          >


            <AccountCircle />
          </IconButton>

          <Menu

id='menu-appbar'
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >


            <MenuItem onClick={() => handleNavigation('/profile')}>Profile</MenuItem>
            <MenuItem

onClick={() => handleNavigation('/settings')}>Settings</MenuItem>
            <MenuItem onClick={() => handleNavigation('/logout')}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default MainNavigation;
