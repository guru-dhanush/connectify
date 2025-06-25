# GitHub File Upload Application

A full-stack web application that allows users to upload files directly to GitHub repositories.

## Features

- File upload support (single, multiple, ZIP archives)
- GitHub authentication via token or SSH key
- Real-time upload status
- Branch management
- Secure file handling
- Containerized deployment

## Prerequisites

- Node.js 18+
- Docker
- GitHub account with repository access

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Create a `.env` file:
   ```bash
   PORT=8080
   NODE_ENV=production
   MAX_FILE_SIZE=50MB
   UPLOAD_TIMEOUT=300000
   CORS_ORIGIN=http://localhost:3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Docker Deployment

Build and run the container:
```bash
# Build
docker build -t github-file-upload .

# Run
docker run -d -p 8080:8080 github-file-upload
```

## API Endpoints

- `POST /api/upload` - Upload files to GitHub
- `GET /api/health` - Check server status
- `POST /api/validate-repo` - Validate repository URL

## GitHub Authentication

### Using GitHub Token
1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate a new token with `repo` scope
3. Use this token in the authentication method

### Using SSH Key
1. Generate a new SSH key pair
2. Add the public key to your GitHub account
3. Use the private key in the authentication method

## Security Notes

- Credentials are never stored
- All operations are performed in temporary directories
- Rate limiting is implemented to prevent abuse
- Input validation is enforced

## Error Handling

The API returns detailed error messages with:
- HTTP status code
- Error message
- Stack trace (in development)
- Specific error details

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
