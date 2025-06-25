const simpleGit = require('simple-git');
const AdmZip = require('adm-zip');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { URL } = require('url');

async function handleFileUpload(repoUrl, branch, authorName, authorEmail, files, authMethod, authCredentials, commitMessage) {
  let workDir = null;
  
  try {
    console.log('Starting file upload process...');
    
    // Validate inputs
    if (!repoUrl || !branch || !files || files.length === 0) {
      throw new Error('Missing required parameters: repoUrl, branch, or files');
    }

    if (!authMethod || !authCredentials) {
      throw new Error('Missing authentication method or credentials');
    }

    // Determine Git provider
    const provider = detectGitProvider(repoUrl);
    console.log('Detected Git provider:', provider);

    // Create a temporary directory for the repository
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-upload-'));
    console.log('Created work directory:', workDir);
    
    // Initialize git in the temporary directory with proper configuration
    const git = simpleGit(workDir, {
      binary: 'git',
      maxConcurrentProcesses: 1,
      config: [
        'credential.helper=', // Disable credential helper to prevent prompts
        'core.askpass=', // Disable askpass to prevent password prompts
        'user.useConfigOnly=true' // Only use explicitly set user config
      ]
    });
    console.log('Initialized git in work directory');

    // Configure authentication and get clone URL
    const cloneUrl = await configureAuthentication(repoUrl, authMethod, authCredentials, provider);
    console.log(`Using ${authMethod} authentication for ${provider}`);

    console.log('Cloning repository...');
    
    try {
      // Try to clone the specific branch first
      await git.clone(cloneUrl, '.', {
        '--branch': branch,
        '--single-branch': true,
        '--depth': 1
      });
      console.log(`Successfully cloned branch: ${branch}`);
    } catch (cloneError) {
      console.log(`Branch ${branch} might not exist, cloning default branch and creating new branch`);
      // Clone without specific branch
      await git.clone(cloneUrl, '.', {
        '--depth': 1
      });
      
      // Create and checkout the new branch
      await git.checkoutLocalBranch(branch);
      console.log(`Created and checked out new branch: ${branch}`);
    }

    // Configure git user and disable prompts
    console.log('Configuring git user and settings');
    await git.addConfig('user.name', authorName);
    await git.addConfig('user.email', authorEmail);
    await git.addConfig('credential.helper', ''); // Disable credential helper
    await git.addConfig('core.askpass', ''); // Disable askpass prompts
    
    // Set the remote URL with authentication for push
    if (authMethod !== 'ssh') {
      await git.remote(['set-url', 'origin', cloneUrl]);
      console.log('Remote URL updated with authentication');
    }

    // Process and copy files
    console.log('Processing files...');
    const processedFiles = await processFiles(files);
    console.log(`Processed ${processedFiles.length} files`);
    
    await copyFilesToRepo(workDir, processedFiles);
    console.log('Files copied to repository');

    // Add all new files
    console.log('Adding files to git...');
    await git.add('.');
    
    // Check status
    const status = await git.status();
    console.log('Git status after add:', {
      created: status.created.length,
      modified: status.modified.length,
      deleted: status.deleted.length,
      renamed: status.renamed.length
    });
    
    if (status.files.length === 0) {
      throw new Error('No changes detected - files may already exist with the same content');
    }

    // Commit changes
    console.log('Committing changes...');
    await git.commit(commitMessage || 'Files uploaded via web interface');
    console.log('Changes committed successfully');

    // Push to remote with explicit configuration
    console.log('Pushing to remote...');
    
    // For HTTP authentication, ensure the remote URL is correct before pushing
    if (authMethod !== 'ssh') {
      const remotes = await git.getRemotes(true);
      console.log('Current remotes:', remotes);
      
      // Verify the remote URL has authentication
      const currentRemoteUrl = remotes.find(r => r.name === 'origin')?.refs?.push;
      if (!currentRemoteUrl || !hasAuthentication(currentRemoteUrl)) {
        console.log('Updating remote URL for push...');
        await git.remote(['set-url', 'origin', cloneUrl]);
      }
    }
    
    await git.push('origin', branch, {
      '--set-upstream': null
    });
    console.log('Successfully pushed to remote');

    return { 
      success: true, 
      message: 'Files uploaded successfully',
      filesProcessed: processedFiles.length,
      branch: branch,
      provider: provider,
      commitMessage: commitMessage || 'Files uploaded via web interface'
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    let errorDetails = error.stack;
    
    if (error.message.includes('Authentication failed') || error.message.includes('denied')) {
      errorMessage = 'Authentication failed - please check your credentials';
      errorDetails = 'Verify your access token has the correct permissions or your SSH key is valid';
    } else if (error.message.includes('Repository not found')) {
      errorMessage = 'Repository not found or access denied';
      errorDetails = 'Check the repository URL and ensure you have access to it';
    } else if (error.message.includes('Network') || error.message.includes('timeout')) {
      errorMessage = 'Network error occurred';
      errorDetails = 'Please check your internet connection and try again';
    } else if (error.message.includes('remote rejected')) {
      errorMessage = 'Push was rejected by remote';
      errorDetails = 'This might happen if the branch is protected or you lack push permissions';
    }
    
    throw {
      error: 'Upload failed',
      message: errorMessage,
      details: errorDetails
    };
  } finally {
    // Cleanup
    if (workDir) {
      try {
        await cleanup(workDir);
        console.log('Cleanup completed');
      } catch (cleanupError) {
        console.error('Failed to cleanup work directory:', cleanupError);
      }
    }
  }
}

function detectGitProvider(repoUrl) {
  try {
    const url = new URL(repoUrl.replace('git@', 'https://').replace(':', '/'));
    const hostname = url.hostname.toLowerCase();
    
    if (hostname.includes('github.com')) {
      return 'github';
    } else if (hostname.includes('gitlab.com') || hostname.includes('gitlab.')) {
      return 'gitlab';
    } else if (hostname.includes('bitbucket.org') || hostname.includes('bitbucket.')) {
      return 'bitbucket';
    } else if (hostname.includes('azure.com') || hostname.includes('visualstudio.com')) {
      return 'azure';
    } else if (hostname.includes('codeberg.org')) {
      return 'codeberg';
    } else {
      return 'generic';
    }
  } catch (error) {
    // Handle SSH URLs or malformed URLs
    if (repoUrl.includes('github.com')) return 'github';
    if (repoUrl.includes('gitlab.com') || repoUrl.includes('gitlab.')) return 'gitlab';
    if (repoUrl.includes('bitbucket.org') || repoUrl.includes('bitbucket.')) return 'bitbucket';
    if (repoUrl.includes('azure.com') || repoUrl.includes('visualstudio.com')) return 'azure';
    if (repoUrl.includes('codeberg.org')) return 'codeberg';
    return 'generic';
  }
}

async function configureAuthentication(repoUrl, authMethod, authCredentials, provider) {
  switch (authMethod) {
    case 'token':
      return formatTokenUrl(repoUrl, authCredentials.token, provider);
    
    case 'basic':
      return formatBasicAuthUrl(repoUrl, authCredentials.username, authCredentials.password);
    
    case 'ssh':
      await setupSshAuthentication(authCredentials.sshKey);
      return formatSshUrl(repoUrl);
    
    default:
      throw new Error(`Unsupported authentication method: ${authMethod}`);
  }
}

function formatTokenUrl(repoUrl, token, provider) {
  // Remove any existing credentials from the URL first
  let cleanUrl = normalizeToHttps(repoUrl);
  
  // Provider-specific token formatting
  switch (provider) {
    case 'github':
      // GitHub uses token as username with empty password
      return cleanUrl.replace('https://', `https://${encodeURIComponent(token)}@`);
    
    case 'gitlab':
      // GitLab uses 'oauth2' as username with token as password
      return cleanUrl.replace('https://', `https://oauth2:${encodeURIComponent(token)}@`);
    
    case 'bitbucket':
      // Bitbucket uses username with app password
      return cleanUrl.replace('https://', `https://x-token-auth:${encodeURIComponent(token)}@`);
    
    case 'azure':
      // Azure DevOps uses empty username with token
      return cleanUrl.replace('https://', `https://:${encodeURIComponent(token)}@`);
    
    default:
      // Generic token auth - try as username
      return cleanUrl.replace('https://', `https://${encodeURIComponent(token)}@`);
  }
}

function formatBasicAuthUrl(repoUrl, username, password) {
  const cleanUrl = normalizeToHttps(repoUrl);
  return cleanUrl.replace('https://', `https://${encodeURIComponent(username)}:${encodeURIComponent(password)}@`);
}

function formatSshUrl(repoUrl) {
  // If already SSH format, return as is
  if (repoUrl.startsWith('git@') || repoUrl.startsWith('ssh://')) {
    return repoUrl;
  }
  
  // Convert HTTPS URLs to SSH format based on provider
  try {
    const url = new URL(repoUrl);
    const hostname = url.hostname;
    const pathname = url.pathname.replace(/^\//, '').replace(/\.git$/, '');
    
    if (hostname.includes('bitbucket.org')) {
      return `git@bitbucket.org:${pathname}.git`;
    } else if (hostname.includes('gitlab.com')) {
      return `git@gitlab.com:${pathname}.git`;
    } else if (hostname.includes('github.com')) {
      return `git@github.com:${pathname}.git`;
    } else {
      // Generic SSH format
      return `git@${hostname}:${pathname}.git`;
    }
  } catch (error) {
    console.warn('Could not convert to SSH format, using original URL:', error.message);
    return repoUrl;
  }
}

function normalizeToHttps(repoUrl) {
  // Convert SSH URLs to HTTPS
  if (repoUrl.startsWith('git@')) {
    // Handle git@hostname:path format
    const sshMatch = repoUrl.match(/git@([^:]+):(.+)/);
    if (sshMatch) {
      const [, hostname, repoPath] = sshMatch;
      return `https://${hostname}/${repoPath.replace(/\.git$/, '')}.git`;
    }
  }
  
  // Remove existing credentials from HTTPS URLs
  if (repoUrl.includes('@') && repoUrl.startsWith('https://')) {
    return repoUrl.replace(/https:\/\/[^@]*@/, 'https://');
  }
  
  // Ensure .git suffix
  let normalizedUrl = repoUrl;
  if (!normalizedUrl.endsWith('.git')) {
    normalizedUrl += '.git';
  }
  
  return normalizedUrl;
}

function hasAuthentication(url) {
  return url.includes('@') && !url.startsWith('git@');
}

async function setupSshAuthentication(sshKey) {
  const sshDir = path.join(os.tmpdir(), 'ssh-' + Date.now());
  const sshKeyPath = path.join(sshDir, 'id_rsa');
  const sshConfigPath = path.join(sshDir, 'config');

  try {
    await fs.mkdir(sshDir, { recursive: true });
    
    // Write SSH key with proper permissions
    await fs.writeFile(sshKeyPath, sshKey.trim() + '\n', { mode: 0o600 });
    
    // Create SSH config for multiple providers
    const sshConfig = `# Generic SSH config for Git providers
Host *
  IdentityFile ${sshKeyPath}
  IdentitiesOnly yes
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  PreferredAuthentications publickey
  BatchMode yes

# GitHub
Host github.com
  HostName github.com
  User git

# GitLab
Host gitlab.com
  HostName gitlab.com
  User git

# Bitbucket
Host bitbucket.org
  HostName bitbucket.org
  User git

# Azure DevOps
Host ssh.dev.azure.com
  HostName ssh.dev.azure.com
  User git

# Codeberg
Host codeberg.org
  HostName codeberg.org
  User git`;
    
    await fs.writeFile(sshConfigPath, sshConfig);
    
    // Set SSH command environment variable
    process.env.GIT_SSH_COMMAND = `ssh -F ${sshConfigPath} -o BatchMode=yes`;
    
    console.log('SSH authentication configured for multiple providers');
  } catch (error) {
    console.error('Failed to setup SSH authentication:', error);
    throw new Error('Failed to configure SSH authentication: ' + error.message);
  }
}

async function processFiles(files) {
  const processedFiles = [];
  
  for (const file of files) {
    try {
      if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
        console.log('Processing ZIP file:', file.originalname);
        
        // Process ZIP file
        const zip = new AdmZip(file.buffer);
        const entries = zip.getEntries();
        
        for (const entry of entries) {
          if (!entry.isDirectory && !entry.entryName.includes('__MACOSX') && !entry.entryName.startsWith('.')) {
            processedFiles.push({
              name: entry.entryName,
              content: entry.getData()
            });
          }
        }
        
        console.log(`Extracted ${entries.length} files from ZIP`);
      } else {
        // Regular file
        processedFiles.push({
          name: file.originalname,
          content: file.buffer
        });
      }
    } catch (error) {
      console.error(`Error processing file ${file.originalname}:`, error);
      throw new Error(`Failed to process file ${file.originalname}: ${error.message}`);
    }
  }

  console.log(`Total processed files: ${processedFiles.length}`);
  return processedFiles;
}

async function copyFilesToRepo(workDir, files) {
  for (const file of files) {
    if (!file.name || !file.content) {
      console.warn('Skipping invalid file object:', file);
      continue;
    }
    
    // Skip hidden files and git directories
    if (file.name.startsWith('.') || file.name.includes('.git/')) {
      console.log('Skipping hidden/git file:', file.name);
      continue;
    }
    
    const destPath = path.join(workDir, file.name);
    
    try {
      // Create directory structure if needed
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      
      // Write file
      await fs.writeFile(destPath, file.content);
      console.log('Copied file:', file.name);
    } catch (error) {
      console.error(`Failed to copy file ${file.name}:`, error);
      throw new Error(`Failed to copy file ${file.name}: ${error.message}`);
    }
  }
}

async function cleanup(workDir) {
  try {
    // Clean up work directory
    const workDirStats = await fs.stat(workDir).catch(() => null);
    if (workDirStats && workDirStats.isDirectory()) {
      await fs.rm(workDir, { recursive: true, force: true });
      console.log('Cleaned up work directory:', workDir);
    }

    // Clean up SSH directories
    const tmpDir = os.tmpdir();
    const entries = await fs.readdir(tmpDir).catch(() => []);
    
    for (const entry of entries) {
      if (entry.startsWith('ssh-')) {
        const sshDir = path.join(tmpDir, entry);
        try {
          await fs.rm(sshDir, { recursive: true, force: true });
          console.log('Cleaned up SSH directory:', sshDir);
        } catch (cleanupError) {
          console.warn('Failed to cleanup SSH directory:', cleanupError.message);
        }
      }
    }
    
    // Clear SSH environment variable
    delete process.env.GIT_SSH_COMMAND;
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    // Don't throw cleanup errors
  }
}

module.exports = {
  handleFileUpload
};