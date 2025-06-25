import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import StatusLogger from "./StatusLogger";
import api from "../utils/api";
import { testBackendConnection } from "../utils/testConnection";
import FileUploader from "./FileUploader";

const schema = z
  .object({
    repoUrl: z.string().min(1, "Repository URL is required"),
    branch: z.string().min(1, "Branch name is required"),
    authMethod: z.enum(["token", "ssh"]),
    authToken: z.string().optional(),
    sshKey: z.string().optional(),
    commitMessage: z.string().min(1, "Commit message is required"),
    authorName: z.string().min(1, "Author name is required"),
    authorEmail: z.string().min(1, "Author email is required"),
  })
  .refine(
    (data) => {
      if (data.authMethod === "token") {
        return data.authToken && data.authToken.trim().length > 0;
      }
      if (data.authMethod === "ssh") {
        return data.sshKey && data.sshKey.trim().length > 0;
      }
      return true;
    },
    {
      message:
        "Authentication credentials are required based on selected method",
      path: ["authToken"], // This will show the error on the authToken field
    }
  );

const UploadForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      authMethod: "token",
      branch: "main",
      commitMessage: "Files uploaded via web interface",
      authToken: "",
      sshKey: "",
    },
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [statusLogs, setStatusLogs] = useState([]);
  const [error, setError] = useState(null);

  // Watch the auth method to conditionally render fields
  const authMethod = watch("authMethod");

  const addStatusLog = (message) => {
    setStatusLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  const onSubmit = async (data) => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file to upload");
      return;
    }

    // Debug: Log the raw form data
    console.log("Raw form data:", data);
    console.log("Auth method:", authMethod);
    console.log("Auth token value:", data.authToken);

    try {
      setIsUploading(true);
      setError(null);
      setStatusLogs([]);

      addStatusLog("Starting upload process...");

      // Create FormData for file upload
      const formData = new FormData();
      console.log("Selected files:", selectedFiles);
      console.log("Form data:", data);

      // Append files
      selectedFiles.forEach((file) => {
        formData.append("files", file, file.name);
      });

      // Append form data
      formData.append("repoUrl", data.repoUrl);
      formData.append("branch", data.branch);
      formData.append("authorName", data.authorName);
      formData.append("authorEmail", data.authorEmail);
      formData.append("authMethod", data.authMethod);
      formData.append("commitMessage", data.commitMessage);

      // Append authentication data based on method
      if (data.authMethod === "token" && data.authToken) {
        formData.append("authToken", data.authToken);
      }
      if (data.authMethod === "ssh" && data.sshKey) {
        formData.append("sshKey", data.sshKey);
      }

      await api.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          addStatusLog(`Upload progress: ${percentCompleted}%`);
        },
      });

      addStatusLog("Upload completed successfully!");
    } catch (err) {
      console.log("err", err);

      setError(
        err.response?.data?.message || "An error occurred during upload"
      );
      addStatusLog(`Error: ${err.response?.data?.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    const result = await testBackendConnection();
    setTestResult(result);
    if (result.success) {
      setError(null);
      addStatusLog("Backend connection successful!");
    } else {
      setError(result.error);
      addStatusLog(`Backend connection failed: ${result.error}`);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: "auto", mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        GitHub File Upload
      </Typography>

      {testResult && (
        <Alert
          severity={testResult.success ? "success" : "error"}
          sx={{ mb: 2 }}
        >
          {testResult.success
            ? "Backend connection successful!"
            : `Backend connection failed: ${testResult.error}`}
        </Alert>
      )}

      <Button variant="outlined" onClick={handleTestConnection} sx={{ mb: 3 }}>
        Test Backend Connection
      </Button>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          {/* Repository Configuration */}
          <TextField
            {...register("repoUrl")}
            label="Repository URL"
            fullWidth
            error={!!errors.repoUrl}
            helperText={errors.repoUrl?.message}
          />

          <TextField
            {...register("branch")}
            label="Branch Name"
            fullWidth
            error={!!errors.branch}
            helperText={errors.branch?.message}
          />

          {/* Authentication Method */}
          <FormControl>
            <FormLabel>Authentication Method</FormLabel>
            <RadioGroup {...register("authMethod")} row>
              <FormControlLabel
                value="token"
                control={<Radio />}
                label="GitHub Token"
              />
              {/* <FormControlLabel
                value="ssh"
                control={<Radio />}
                label="SSH Key"
              /> */}
            </RadioGroup>
          </FormControl>

          {/* Authentication Inputs */}
          <TextField
            {...register("authToken")}
            label="GitHub Token"
            fullWidth
            multiline
            rows={4}
            error={!!errors.authToken}
            helperText={
              errors.authToken?.message ||
              "Enter your GitHub personal access token"
            }
            style={{ display: authMethod === "token" ? "block" : "none" }}
          />

          <TextField
            {...register("sshKey")}
            label="SSH Private Key"
            fullWidth
            multiline
            rows={4}
            error={!!errors.sshKey}
            helperText={errors.sshKey?.message || "Enter your SSH private key"}
            style={{ display: authMethod === "ssh" ? "block" : "none" }}
          />

          {/* File Upload */}
          <FileUploader
            selectedFiles={selectedFiles}
            onFilesSelected={setSelectedFiles}
          />

          {/* Commit Configuration */}
          <TextField
            {...register("commitMessage")}
            label="Commit Message"
            fullWidth
            error={!!errors.commitMessage}
            helperText={errors.commitMessage?.message}
          />

          <TextField
            {...register("authorName")}
            label="Author Name"
            fullWidth
            error={!!errors.authorName}
            helperText={errors.authorName?.message}
          />

          <TextField
            {...register("authorEmail")}
            label="Author Email"
            fullWidth
            error={!!errors.authorEmail}
            helperText={errors.authorEmail?.message}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isUploading || selectedFiles.length === 0}
            startIcon={isUploading ? <CircularProgress size={20} /> : undefined}
            sx={{ mt: 2 }}
          >
            {isUploading ? "Uploading..." : "Upload Files"}
          </Button>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Stack>
      </form>

      {/* Status Logger */}
      <StatusLogger logs={statusLogs} />
    </Paper>
  );
};

export default UploadForm;
