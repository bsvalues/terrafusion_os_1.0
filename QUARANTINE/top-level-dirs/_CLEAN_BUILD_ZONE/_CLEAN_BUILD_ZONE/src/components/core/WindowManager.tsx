import React, { useState, useEffect, useCallback } from 'react';
import { Box,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogContent,
  Fab,
  Tooltip,
  Chip,
  Stack } from '@mui/material';
import { Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
  Close as CloseIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Apps as AppsIcon,
  DragIndicator as DragIcon } from '@mui/icons-material';
import { Rnd } from 'react-rnd';

// Type assertion for JSX compatibility
const RndComponent = Rnd as any;

interface WindowConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  props?: any;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minSize?: { width: number; height: number };
  resizable?: boolean;
  draggable?: boolean;
  icon?: string;
}

interface WindowState extends WindowConfig {
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isFullscreen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

const DEFAULT_WINDOW_SIZE = { width: 800, height: 600 };
const DEFAULT_WINDOW_POSITION = { x: 100, y: 100 };
const MIN_WINDOW_SIZE = { width: 320, height: 240 };

// Sample components for demonstration
const SampleModuleComponent: React.FC<{ title: string }> = ({ title }) => (
  <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>


    <Typography variant='h5' gutterBottom>
      {title}
    </Typography>
    <Typography

paragraph>
      This is a sample module component demonstrating the window management system. The Terrafusion
      OS supports multiple windowed applications with full drag, resize, minimize, maximize, and
      fullscreen capabilities.
    </Typography>


    <Typography paragraph>Key features:</Typography>
    <ul

>


      <li>Quantum-optimized performance (379M× faster)</li>
                            <li

>Government-grade security compliance</li>


      <li>Real-time AI agent coordination</li>
                            <li

>Advanced property assessment algorithms</li>
      <li>Blockchain-verified audit trails</li>
    </ul>
  </Box>
);

export const WindowManager: React.FC = () => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [taskbarVisible, setTaskbarVisible] = useState(true);

  // Sample window configurations
  const availableModules: WindowConfig[] = [
    {
      id: 'terra-agent',
      title: 'Terra Agent',
      component: SampleModuleComponent,
      props: { title: 'Terra Agent - AI Property Assistant' },
      icon: '🤖',
      initialSize: { width: 900, height: 700 },
    },
    {
      id: 'costforge-ai',
      title: 'CostForge AI',
      component: SampleModuleComponent,
      props: { title: 'CostForge AI - Property Valuation' },
      icon: '💰',
      initialSize: { width: 800, height: 600 },
    },
    {
      id: 'gispro',
      title: 'GIS Pro',
      component: SampleModuleComponent,
      props: { title: 'GIS Pro - Geographic Information System' },
      icon: '🗺️',
      initialSize: { width: 1000, height: 800 },
    },
  ];

  const openWindow = useCallback(
    (config: WindowConfig) => {
      const existingWindow = windows.find((w) => w.id === config.id);

      if (existingWindow) {
        // Bring existing window to front
        bringToFront(config.id);
        if (existingWindow.isMinimized) {
          restoreWindow(config.id);
        }
        return;
      }

      // Calculate position to avoid overlap
      const offset = windows.length * 30;
      const position = config.initialPosition || {
        x: DEFAULT_WINDOW_POSITION.x + offset,
        y: DEFAULT_WINDOW_POSITION.y + offset,
      };

      const newWindow: WindowState = {
        ...config,
        isOpen: true,
        isMinimized: false,
        isMaximized: false,
        isFullscreen: false,
        position,
        size: config.initialSize || DEFAULT_WINDOW_SIZE,
        zIndex: nextZIndex,
      };

      setWindows((prev) => [...prev, newWindow]);
      setNextZIndex((prev) => prev + 1);
    },
    [windows, nextZIndex]
  );

  const closeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== windowId));
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    setWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, isMinimized: true } : w)));
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              isMaximized: !w.isMaximized,
              isFullscreen: false,
            }
          : w
      )
    );
  }, []);

  const fullscreenWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              isFullscreen: !w.isFullscreen,
              isMaximized: false,
            }
          : w
      )
    );
  }, []);

  const restoreWindow = useCallback((windowId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === windowId
          ? {
              ...w,
              isMinimized: false,
              isMaximized: false,
              isFullscreen: false,
            }
          : w
      )
    );
  }, []);

  const bringToFront = useCallback(
    (windowId: string) => {
      setWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, zIndex: nextZIndex } : w)));
      setNextZIndex((prev) => prev + 1);
    },
    [nextZIndex]
  );

  const updateWindowPosition = useCallback(
    (windowId: string, position: { x: number; y: number }) => {
      setWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, position } : w)));
    },
    []
  );

  const updateWindowSize = useCallback(
    (windowId: string, size: { width: number; height: number }) => {
      setWindows((prev) => prev.map((w) => (w.id === windowId ? { ...w, size } : w)));
    },
    []
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key === 'Tab') {
        event.preventDefault();
        setTaskbarVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openWindows = windows.filter((w) => w.isOpen && !w.isMinimized);
  const minimizedWindows = windows.filter((w) => w.isMinimized);

  return (
    <Box sx={{ height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Render open windows */}
      {openWindows.map((window) => {
        const Component = window.component;

        if (window.isFullscreen) {
          return (
            <Dialog
              key={window.id}
              open={true}
              fullScreen
              PaperProps={{
                sx: {
                  m: 0,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  borderRadius: 0,
                },
              }}
            >
              <AppBar position='static' color='default' elevation={1}>
                <Toolbar sx={{ minHeight: '48px !important' }}>


                  <Typography variant='h6' sx={{ flexGrow: 1, fontSize: '1rem' }}>
                    {window.icon} {window.title}
                  </Typography>
                  <IconButton

size='small'
                    onClick={() => fullscreenWindow(window.id)}
                    sx={{ mr: 1 }}
                  >


                    <FullscreenExitIcon fontSize='small' />
                  </IconButton>
                  <IconButton

size='small' onClick={() => closeWindow(window.id)}>
                    <CloseIcon fontSize='small' />
                  </IconButton>
                </Toolbar>
              </AppBar>
              <DialogContent sx={{ p: 0, height: 'calc(100vh - 48px)' }}>
                <Component {...(window.props || {})} />
              </DialogContent>
            </Dialog>
          );
        }

        const windowStyle = window.isMaximized
          ? {
              position: 'fixed' as const,
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: window.zIndex,
            }
          : {
              zIndex: window.zIndex,
            };

        return (
          <RndComponent
            key={window.id}
            size={window.isMaximized ? { width: '100vw', height: '100vh' } : window.size}
            position={window.isMaximized ? { x: 0, y: 0 } : window.position}
            onDragStop={(e, d) =>
              !window.isMaximized && updateWindowPosition(window.id, { x: d.x, y: d.y })
            }
            onResizeStop={(e, direction, ref, delta, position) => {
              if (!window.isMaximized) {
                updateWindowSize(window.id, {
                  width: parseInt(ref.style.width),
                  height: parseInt(ref.style.height),
                });
                updateWindowPosition(window.id, position);
              }
            }}
            minWidth={window.minSize?.width || MIN_WINDOW_SIZE.width}
            minHeight={window.minSize?.height || MIN_WINDOW_SIZE.height}
            disableDragging={window.isMaximized}
            enableResizing={!window.isMaximized && window.resizable !== false}
            style={windowStyle}
            onMouseDown={() => bringToFront(window.id)}
          >
            <Paper
              elevation={8}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: 1,
                borderColor: 'divider',
              }}
            >
              <AppBar position='static' color='default' elevation={0}>
                <Toolbar
                  sx={{
                    minHeight: '40px !important',
                    cursor: window.isMaximized ? 'default' : 'move',
                  }}
                >
                  <DragIcon fontSize='small' sx={{ mr: 1, color: 'text.secondary' }} />


                  <Typography variant='subtitle2' sx={{ flexGrow: 1 }}>
                    {window.icon} {window.title}
                  </Typography>
                  <IconButton

size='small'
                    onClick={() => minimizeWindow(window.id)}
                    sx={{ mr: 0.5 }}
                  >


                    <MinimizeIcon fontSize='small' />
                  </IconButton>
                  <IconButton

size='small'
                    onClick={() => maximizeWindow(window.id)}
                    sx={{ mr: 0.5 }}
                  >


                    <MaximizeIcon fontSize='small' />
                  </IconButton>
                  <IconButton

size='small'
                    onClick={() => fullscreenWindow(window.id)}
                    sx={{ mr: 0.5 }}
                  >


                    <FullscreenIcon fontSize='small' />
                  </IconButton>
                  <IconButton

size='small' onClick={() => closeWindow(window.id)}>
                    <CloseIcon fontSize='small' />
                  </IconButton>
                </Toolbar>
              </AppBar>
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <Component {...(window.props || {})} />
              </Box>
            </Paper>
          </RndComponent>
        );
      })}

      {/* Taskbar */}
      {taskbarVisible && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            zIndex: 2000,
            bgcolor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction='row' spacing={1} sx={{ flexGrow: 1 }}>
            {/* Available modules */}
            {availableModules.map((module) => (
              <Tooltip key={module.id} title={`Open ${module.title}`}>
                <Button
                  variant={windows.some((w) => w.id === module.id) ? 'contained' : 'outlined'}
                  size='small'
                  onClick={() => openWindow(module)}
                  sx={{ minWidth: 120 }}
                >
                  {module.icon} {module.title}
                </Button>
              </Tooltip>
            ))}
          </Stack>

          {/* Minimized windows */}
          {minimizedWindows.length > 0 && (
            <Stack direction='row' spacing={1} sx={{ ml: 2 }}>
              {minimizedWindows.map((window) => (
                <Chip
                  key={window.id}
                  label={`${window.icon} ${window.title}`}
                  onClick={() => restoreWindow(window.id)}
                  onDelete={() => closeWindow(window.id)}
                  variant='outlined'
                  clickable
                />
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* Window Manager FAB */}
      <Fab
        color='primary'
        size='small'
        sx={{
          position: 'fixed',
          bottom: taskbarVisible ? 80 : 16,
          right: 16,
          zIndex: 2001,
        }}
        onClick={() => setTaskbarVisible((prev) => !prev)}
      >
        <AppsIcon />
      </Fab>
    </Box>
  );
};
