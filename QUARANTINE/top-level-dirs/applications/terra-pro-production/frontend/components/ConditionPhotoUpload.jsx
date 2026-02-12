import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  Alert,
  Button,
  Grid,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  TextField,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";

const ConditionPhotoUpload = ({ onScore }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/")) {
        processFile(droppedFile);
      } else {
        setError("Please upload an image file (JPEG, PNG, etc.)");
      }
    }
  };

  // Process the selected file
  const processFile = (file) => {
    setFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // Upload and analyze the photo
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append("photo", file);

    try {
      // Create a mock progress update
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 200);

      // Make the API call
      const response = await axios.post("/api/upload_photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Process the response
      if (response.data) {
        setAnalysis(response.data);
        // Notify parent component of the score
        if (onScore && typeof onScore === "function") {
          onScore(response.data.condition_score);
        }
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError(err.response?.data?.detail || "Failed to upload and analyze the photo");
    } finally {
      setIsUploading(false);
    }
  };

  // Reset the component
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setAnalysis(null);
    setError(null);
    setUploadProgress(0);
  };

  // Get condition color based on score
  const getConditionColor = (score) => {
    if (score >= 4.5) return "#4caf50"; // Excellent - green
    if (score >= 3.5) return "#8bc34a"; // Good - light green
    if (score >= 2.5) return "#ffeb3b"; // Average - yellow
    if (score >= 1.5) return "#ff9800"; // Fair - orange
    return "#f44336"; // Poor - red
  };

  // Get condition label based on score
  const getConditionLabel = (score) => {
    if (score >= 4.5) return "Excellent";
    if (score >= 3.5) return "Good";
    if (score >= 2.5) return "Average";
    if (score >= 1.5) return "Fair";
    return "Poor";
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Upload a property photo for AI condition analysis
      </Typography>

      {/* Drag & Drop Area */}
      {!file && (
        <Box
          sx={{
            border: "2px dashed",
            borderColor: isDragging ? "primary.main" : "grey.300",
            borderRadius: 1,
            p: 3,
            textAlign: "center",
            bgcolor: isDragging ? "rgba(25, 118, 210, 0.04)" : "transparent",
            transition: "all 0.2s",
            cursor: "pointer",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "rgba(25, 118, 210, 0.04)",
            },
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            style={{ display: "none" }}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
          <Typography variant="h6" component="div" gutterBottom>
            Drag & drop a property photo here
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to browse
          </Typography>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            size="small"
            sx={{ mt: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            Select Photo
          </Button>
        </Box>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Preview and Analysis */}
      {file && (
        <Card variant="outlined" sx={{ mt: 2 }}>
          <Grid container>
            {/* Image Preview */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 2,
                  bgcolor: "rgba(0,0,0,0.02)",
                }}
              >
                <img
                  src={preview}
                  alt="Property Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                  }}
                />
              </Box>
            </Grid>

            {/* Analysis or Upload Controls */}
            <Grid item xs={12} md={7}>
              <CardContent>
                {!analysis ? (
                  <>
                    <Typography variant="h6" component="div" gutterBottom>
                      <PhotoCameraIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                      Property Photo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {file.name} ({Math.round(file.size / 1024)} KB)
                    </Typography>

                    {isUploading ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Analyzing property condition...
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={uploadProgress}
                          sx={{ mt: 1, mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(uploadProgress)}% complete
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                        <Button variant="contained" color="primary" onClick={handleUpload}>
                          Analyze Condition
                        </Button>
                        <Button variant="outlined" onClick={handleReset}>
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </>
                ) : (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        Analysis Complete
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Typography variant="body1" sx={{ mr: 2 }}>
                        Condition Score:
                      </Typography>
                      <Chip
                        label={`${analysis.condition_score} - ${getConditionLabel(analysis.condition_score)}`}
                        sx={{
                          bgcolor: getConditionColor(analysis.condition_score),
                          color: "white",
                          fontWeight: "bold",
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {analysis.description}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Feature Details:
                    </Typography>

                    {analysis.features.map((feature /* , index */) => (
                      <Box
                        key={index}
                        sx={{ mb: 1, display: "flex", justifyContent: "space-between" }}
                      >
                        <Typography variant="body2">{feature.name}</Typography>
                        <Chip
                          size="small"
                          label={feature.score}
                          sx={{
                            bgcolor: getConditionColor(feature.score),
                            color: "white",
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                    ))}

                    <Box sx={{ mt: 2 }}>
                      <Button variant="outlined" size="small" onClick={handleReset}>
                        Upload Another Photo
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Grid>
          </Grid>
        </Card>
      )}
    </Box>
  );
};

export default ConditionPhotoUpload;
