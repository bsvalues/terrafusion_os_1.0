import React, { createContext, useContext, useState } from "react";
import { Snackbar, Alert, AlertTitle, Typography, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Create context for the toast
const ToastContext = createContext({
  showToast: () => {},
  hideToast: () => {},
});

// Hook to use toast functionality
export const useToast = () => useContext(ToastContext);

/**
 * Toast provider component that wraps the application
 * to provide toast notification functionality
 */
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info", // 'success', 'info', 'warning', 'error'
    title: null,
    duration: 5000,
  });

  // Show toast with given parameters
  const showToast = (message, options = {}) => {
    setToast({
      open: true,
      message,
      severity: options.severity || "info",
      title: options.title || null,
      duration: options.duration || 5000,
    });
  };

  // Hide the toast
  const hideToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={toast.duration}
        onClose={hideToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ maxWidth: 400 }}
      >
        <Alert
          onClose={hideToast}
          severity={toast.severity}
          elevation={3}
          variant="filled"
          sx={{ width: "100%" }}
          action={
            <IconButton size="small" aria-label="close" color="inherit" onClick={hideToast}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {toast.title && <AlertTitle sx={{ fontWeight: 600 }}>{toast.title}</AlertTitle>}
          <Typography variant="body2">{toast.message}</Typography>
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export default useToast;
