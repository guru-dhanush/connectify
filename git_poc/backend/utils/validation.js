const validateRepoUrl = (url) => {
  const sshRegex = /^git@github\.com[:/].+?[/][^.]+?\.git$/;
  const httpsRegex = /^https:\/\/github\.com\/.+?[/][^.]+?\.git$/;
  
  return sshRegex.test(url) || httpsRegex.test(url);
};

const validateBranchName = (branch) => {
  // Basic branch name validation
  return /^[a-zA-Z0-9._-]+$/.test(branch);
};

const validateCommitMessage = (message) => {
  // Basic commit message validation
  return message.length > 0 && message.length <= 100;
};

const validateAuthMethod = (method) => {
  return ['token', 'ssh'].includes(method);
};

module.exports = {
  validateRepoUrl,
  validateBranchName,
  validateCommitMessage,
  validateAuthMethod
};
