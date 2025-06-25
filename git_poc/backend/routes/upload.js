// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const { handleFileUpload } = require('../utils/gitOperations');
// const { validateRepoUrl, validateBranchName, validateAuthMethod } = require('../utils/validation');

// // Configure multer to handle both files and fields
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 50 * 1024 * 1024, // 50MB limit
//     files: 10, // Allow up to 10 files
//     fields: 8 // Allow up to 8 text fields
//   },
//   fileFilter: function (req, file, cb) {
//     console.log('File filter called for:', file.fieldname);
//     console.log('File info:', {
//       originalname: file.originalname,
//       mimetype: file.mimetype
//     });
//     cb(null, true);
//   }
// });

// // Main upload endpoint
// router.post('/', upload.array('files', 10), async (req, res) => {
//   try {
//     console.log('Upload request received');
//     console.log('Request headers:', req.headers);

//     // Extract form data from request body
//     const {
//       repoUrl,
//       branch = 'main',
//       authMethod,
//       authToken,
//       sshKey,
//       commitMessage = 'Files uploaded via web interface',
//       authorName = 'GitHub Uploader',
//       authorEmail = 'uploader@github.com'
//     } = req.body;

//     console.log('Parsed form data:', {
//       repoUrl,
//       branch,
//       authMethod,
//       authToken: authToken ? '***HIDDEN***' : '(empty)',
//       sshKey: sshKey ? '***HIDDEN***' : '(empty)',
//       commitMessage,
//       authorName,
//       authorEmail
//     });

//     // Validate required fields
//     if (!repoUrl || !branch) {
//       console.log('Missing required parameters: repoUrl or branch');
//       return res.status(400).json({
//         error: 'Missing required parameters',
//         details: 'Repository URL and branch are required'
//       });
//     }

//     if (!authMethod) {
//       console.log('Missing authentication method');
//       return res.status(400).json({
//         error: 'Authentication method is required',
//         details: 'Please specify either "token" or "ssh"'
//       });
//     }

//     // Validate inputs
//     if (!validateRepoUrl(repoUrl)) {
//       return res.status(400).json({
//         error: 'Invalid repository URL',
//         details: 'URL must be in format: https://github.com/user/repo.git or git@github.com:user/repo.git'
//       });
//     }

//     if (!validateBranchName(branch)) {
//       return res.status(400).json({
//         error: 'Invalid branch name',
//         details: 'Branch name contains invalid characters'
//       });
//     }

//     if (!validateAuthMethod(authMethod)) {
//       return res.status(400).json({
//         error: 'Invalid authentication method',
//         details: 'Authentication method must be either "token" or "ssh"'
//       });
//     }

//     // Validate authentication credentials
//     if (authMethod === 'token' && (!authToken || authToken.trim() === '')) {
//       console.log('Invalid token for token auth');
//       return res.status(400).json({
//         error: 'GitHub token is required',
//         details: 'Please provide a valid GitHub personal access token'
//       });
//     }

//     if (authMethod === 'ssh' && (!sshKey || sshKey.trim() === '')) {
//       console.log('Invalid SSH key for SSH auth');
//       return res.status(400).json({
//         error: 'SSH key is required',
//         details: 'Please provide a valid SSH private key'
//       });
//     }

//     // Validate files
//     console.log('Request files:', req.files ? req.files.length : 0);

//     const files = req.files || [];

//     if (!files || files.length === 0) {
//       console.log('No files uploaded');
//       return res.status(400).json({
//         error: 'No files uploaded',
//         details: 'Please select at least one file to upload'
//       });
//     }

//     console.log('Starting file upload process with files:', files.map(f => f.originalname));

//     // Call the git operations handler
//     const result = await handleFileUpload(
//       repoUrl,
//       branch,
//       authorName,
//       authorEmail,
//       files,
//       authMethod,
//       authMethod === 'token' ? authToken : sshKey,
//       commitMessage
//     );

//     console.log('Upload completed successfully');
//     res.json(result);

//   } catch (error) {
//     console.error('Upload error:', error);

//     const errorMessage = error.message || 'Upload failed';
//     const errorDetails = error.details || error.stack || 'No additional details available';

//     res.status(500).json({
//       error: 'Upload failed',
//       message: errorMessage,
//       details: errorDetails
//     });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const { handleFileUpload } = require("../utils/gitOperations");
const {
  validateRepoUrl,
  validateBranchName,
  validateAuthMethod,
} = require("../utils/validation");

// Configure multer to handle both files and fields
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Allow up to 10 files
    fields: 8, // Allow up to 8 text fields
  },
  fileFilter: function (req, file, cb) {
    console.log("File filter called for:", file.fieldname);
    console.log("File info:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    cb(null, true);
  },
});

// Main upload endpoint
router.post("/", upload.array("files", 10), async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("Request headers:", req.headers);

    // Extract form data from request body
    const {
      repoUrl,
      branch = "main",
      authMethod,
      authToken,
      sshKey,
      username, // For basic auth (BitBucket, GitLab)
      password, // For basic auth or app passwords
      commitMessage = "Files uploaded via web interface",
      authorName = "Git Uploader",
      authorEmail = "uploader@example.com",
    } = req.body;

    console.log("Parsed form data:", {
      repoUrl,
      branch,
      authMethod,
      authToken: authToken ? "***HIDDEN***" : "(empty)",
      sshKey: sshKey ? "***HIDDEN***" : "(empty)",
      username: username || "(empty)",
      password: password ? "***HIDDEN***" : "(empty)",
      commitMessage,
      authorName,
      authorEmail,
    });

    // Validate required fields
    if (!repoUrl || !branch) {
      console.log("Missing required parameters: repoUrl or branch");
      return res.status(400).json({
        error: "Missing required parameters",
        details: "Repository URL and branch are required",
      });
    }

    if (!authMethod) {
      console.log("Missing authentication method");
      return res.status(400).json({
        error: "Authentication method is required",
        details: 'Please specify "token", "ssh", or "basic"',
      });
    }

    // Validate inputs
    // if (!validateRepoUrl(repoUrl)) {
    //   return res.status(400).json({
    //     error: 'Invalid repository URL',
    //     details: 'URL must be a valid Git repository URL (GitHub, GitLab, BitBucket, etc.)'
    //   });
    // }

    if (!validateBranchName(branch)) {
      return res.status(400).json({
        error: "Invalid branch name",
        details: "Branch name contains invalid characters",
      });
    }

    if (!validateAuthMethod(authMethod)) {
      return res.status(400).json({
        error: "Invalid authentication method",
        details: 'Authentication method must be "token", "ssh", or "basic"',
      });
    }

    // Validate authentication credentials based on method
    let authCredentials = {};

    switch (authMethod) {
      case "token":
        if (!authToken || authToken.trim() === "") {
          console.log("Invalid token for token auth");
          return res.status(400).json({
            error: "Access token is required",
            details: "Please provide a valid personal access token",
          });
        }
        authCredentials = { token: authToken };
        break;

      case "ssh":
        if (!sshKey || sshKey.trim() === "") {
          console.log("Invalid SSH key for SSH auth");
          return res.status(400).json({
            error: "SSH key is required",
            details: "Please provide a valid SSH private key",
          });
        }
        authCredentials = { sshKey: sshKey };
        break;

      case "basic":
        if (
          !username ||
          username.trim() === "" ||
          !password ||
          password.trim() === ""
        ) {
          console.log("Invalid credentials for basic auth");
          return res.status(400).json({
            error: "Username and password are required",
            details:
              "Please provide both username and password for basic authentication",
          });
        }
        authCredentials = { username: username, password: password };
        break;

      default:
        return res.status(400).json({
          error: "Unsupported authentication method",
          details: "Supported methods: token, ssh, basic",
        });
    }

    // Validate files
    console.log("Request files:", req.files ? req.files.length : 0);

    const files = req.files || [];

    if (!files || files.length === 0) {
      console.log("No files uploaded");
      return res.status(400).json({
        error: "No files uploaded",
        details: "Please select at least one file to upload",
      });
    }

    console.log(
      "Starting file upload process with files:",
      files.map((f) => f.originalname)
    );

    // Call the git operations handler
    const result = await handleFileUpload(
      repoUrl,
      branch,
      authorName,
      authorEmail,
      files,
      authMethod,
      authCredentials,
      commitMessage
    );

    console.log("Upload completed successfully");
    res.json(result);
  } catch (error) {
    console.error("Upload error:", error);

    const errorMessage = error.message || "Upload failed";
    const errorDetails =
      error.details || error.stack || "No additional details available";

    res.status(500).json({
      error: "Upload failed",
      message: errorMessage,
      details: errorDetails,
    });
  }
});

module.exports = router;
