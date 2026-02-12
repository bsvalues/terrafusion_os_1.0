/**
 * Security scanner API routes
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

/**
 * @route   POST /api/security/scan
 * @desc    Request a code security scan
 * @access  Public
 * @body    {
 *            repositoryPath: String,
 *            languages: Array,
 *            scanDepth: String,
 *          }
 */
router.post('/scan', async (req, res) => {
  try {
    const { repositoryPath, languages = ['javascript', 'python'], scanDepth = 'standard' } = req.body;
    
    if (!repositoryPath) {
      return res.status(400).json({
        success: false,
        error: 'repositoryPath is required',
        timestamp: new Date()
      });
    }

    // Validate scan depth
    const validDepths = ['quick', 'standard', 'deep'];
    if (!validDepths.includes(scanDepth)) {
      return res.status(400).json({
        success: false,
        error: `scanDepth must be one of: ${validDepths.join(', ')}`,
        timestamp: new Date()
      });
    }

    // Validate languages
    const validLanguages = ['javascript', 'python', 'java', 'csharp', 'go', 'ruby', 'php'];
    const invalidLanguages = languages.filter(lang => !validLanguages.includes(lang));
    
    if (invalidLanguages.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid languages: ${invalidLanguages.join(', ')}. Valid options are: ${validLanguages.join(', ')}`,
        timestamp: new Date()
      });
    }

    // Generate scan ID
    const scanId = `scan_${Date.now()}`;
    
    // In a real implementation, this would call a security scanning service
    // or start a background job. Here we'll simulate a scan with mock data.
    const scanResults = await simulateSecurityScan(repositoryPath, languages, scanDepth);
    
    // Store scan results
    await storeScanResults(scanId, scanResults);
    
    return res.status(202).json({
      success: true,
      data: {
        scanId,
        status: 'in_progress',
        estimatedCompletionTime: new Date(Date.now() + 30000) // 30 seconds from now
      },
      message: 'Security scan initiated',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error initiating security scan:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: new Date()
    });
  }
});

/**
 * @route   GET /api/security/scan/:scanId
 * @desc    Get security scan results
 * @access  Public
 */
router.get('/scan/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    
    if (!scanId) {
      return res.status(400).json({
        success: false,
        error: 'scanId is required',
        timestamp: new Date()
      });
    }
    
    // Get scan results
    const scanResults = await getScanResults(scanId);
    
    if (!scanResults) {
      return res.status(404).json({
        success: false,
        error: `Scan with ID ${scanId} not found`,
        timestamp: new Date()
      });
    }
    
    return res.json({
      success: true,
      data: scanResults,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error retrieving security scan results:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: new Date()
    });
  }
});

/**
 * @route   GET /api/security/scans
 * @desc    List recent security scans
 * @access  Public
 */
router.get('/scans', async (req, res) => {
  try {
    // Get recent scans
    const recentScans = await getRecentScans();
    
    return res.json({
      success: true,
      data: recentScans,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error retrieving recent security scans:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: new Date()
    });
  }
});

/**
 * @route   POST /api/security/dependencies/check
 * @desc    Check dependencies for vulnerabilities
 * @access  Public
 * @body    {
 *            repositoryPath: String,
 *            languages: Array
 *          }
 */
router.post('/dependencies/check', async (req, res) => {
  try {
    const { repositoryPath, languages = ['javascript', 'python'] } = req.body;
    
    if (!repositoryPath) {
      return res.status(400).json({
        success: false,
        error: 'repositoryPath is required',
        timestamp: new Date()
      });
    }
    
    // In a real implementation, this would call a dependency checking service
    // Here we'll simulate a check with mock data
    const checkResults = await simulateDependencyCheck(repositoryPath, languages);
    
    return res.json({
      success: true,
      data: checkResults,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error checking dependencies:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: new Date()
    });
  }
});

/**
 * @route   POST /api/security/secrets/detect
 * @desc    Detect hardcoded secrets in code
 * @access  Public
 * @body    {
 *            repositoryPath: String
 *          }
 */
router.post('/secrets/detect', async (req, res) => {
  try {
    const { repositoryPath } = req.body;
    
    if (!repositoryPath) {
      return res.status(400).json({
        success: false,
        error: 'repositoryPath is required',
        timestamp: new Date()
      });
    }
    
    // In a real implementation, this would call a secret detection service
    // Here we'll simulate detection with mock data
    const secretResults = await simulateSecretDetection(repositoryPath);
    
    return res.json({
      success: true,
      data: secretResults,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error detecting secrets:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      timestamp: new Date()
    });
  }
});

/**
 * Helper function to simulate a security scan
 */
async function simulateSecurityScan(repositoryPath, languages, scanDepth) {
  // This would be a real security scan in production
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate mock vulnerabilities based on scan depth
  const vulnerabilityCount = {
    'quick': Math.floor(Math.random() * 5),
    'standard': Math.floor(Math.random() * 10) + 5,
    'deep': Math.floor(Math.random() * 20) + 10
  }[scanDepth];
  
  const vulnerabilities = [];
  const severities = ['critical', 'high', 'medium', 'low', 'info'];
  const vulnerabilityTypes = [
    'SQL Injection Vulnerability',
    'Cross-site Scripting (XSS) Vulnerability',
    'Command Injection Vulnerability',
    'Insecure Deserialization',
    'Hardcoded Secret or Credential'
  ];
  
  for (let i = 0; i < vulnerabilityCount; i++) {
    const severity = severities[Math.floor(Math.random() * 5)];
    const vulnType = vulnerabilityTypes[Math.floor(Math.random() * vulnerabilityTypes.length)];
    
    vulnerabilities.push({
      vulnerability_id: `VULN-${Date.now()}-${i}`,
      severity,
      name: vulnType,
      description: `This is a ${severity} ${vulnType.toLowerCase()}`,
      file_path: `${repositoryPath}/example${i}.${languages[i % languages.length]}`,
      line_number: Math.floor(Math.random() * 100) + 1,
      code_snippet: 'Example code snippet',
      recommendation: `Fix the ${vulnType.toLowerCase()} by following secure coding practices`,
      cwe_id: `CWE-${Math.floor(Math.random() * 1000)}`,
      references: [
        'https://owasp.org/www-community/attacks/',
        'https://cheatsheetseries.owasp.org/cheatsheets/'
      ]
    });
  }
  
  // Calculate severity counts
  const severityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  vulnerabilities.forEach(vuln => {
    severityCounts[vuln.severity]++;
  });
  
  // Calculate risk score
  const weights = {
    critical: 10.0,
    high: 7.0,
    medium: 4.0,
    low: 1.0,
    info: 0.1
  };
  
  const weightedSum = Object.entries(severityCounts).reduce(
    (sum, [severity, count]) => sum + (weights[severity] * count), 0
  );
  
  const riskScore = vulnerabilityCount > 0
    ? Math.min(10.0, weightedSum / vulnerabilityCount)
    : 0.0;
  
  // Create summary
  const summary = {
    total_files_scanned: Math.floor(Math.random() * 50) + 10,
    vulnerability_count: vulnerabilityCount,
    severity_counts: severityCounts,
    risk_score: riskScore
  };
  
  return {
    scan_id: `scan_${Date.now()}`,
    repository_path: repositoryPath,
    languages,
    scan_depth: scanDepth,
    vulnerabilities,
    summary,
    timestamp: Date.now(),
    status: 'completed'
  };
}

/**
 * Helper function to simulate a dependency check
 */
async function simulateDependencyCheck(repositoryPath, languages) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const dependencyFiles = [];
  const vulnerableDependencies = [];
  
  // Generate mock dependency files
  languages.forEach(lang => {
    if (lang === 'javascript') {
      dependencyFiles.push({
        language: 'javascript',
        file_path: `${repositoryPath}/package.json`,
        file_type: 'package.json'
      });
    } else if (lang === 'python') {
      dependencyFiles.push({
        language: 'python',
        file_path: `${repositoryPath}/requirements.txt`,
        file_type: 'requirements.txt'
      });
    }
  });
  
  // Generate mock vulnerable dependencies
  const mockVulnerableDeps = [
    {
      name: 'lodash',
      version: '4.17.15',
      language: 'javascript',
      vulnerability: 'Prototype pollution vulnerability',
      recommendation: 'Upgrade to lodash 4.17.21 or later',
      severity: 'high'
    },
    {
      name: 'axios',
      version: '0.19.0',
      language: 'javascript',
      vulnerability: 'Server-side request forgery',
      recommendation: 'Upgrade to axios 0.21.1 or later',
      severity: 'medium'
    },
    {
      name: 'django',
      version: '1.11',
      language: 'python',
      vulnerability: 'Multiple CVEs including XSS vulnerabilities',
      recommendation: 'Upgrade to Django 3.2 or later',
      severity: 'high'
    },
    {
      name: 'flask',
      version: '0.12.2',
      language: 'python',
      vulnerability: 'Multiple vulnerabilities including session fixation',
      recommendation: 'Upgrade to Flask 2.0.0 or later',
      severity: 'high'
    }
  ];
  
  // Filter based on selected languages
  mockVulnerableDeps.forEach(dep => {
    if (languages.includes(dep.language)) {
      vulnerableDependencies.push({
        ...dep,
        file_path: `${repositoryPath}/${dep.language === 'javascript' ? 'package.json' : 'requirements.txt'}`
      });
    }
  });
  
  // Summary
  const severityDistribution = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  vulnerableDependencies.forEach(dep => {
    severityDistribution[dep.severity]++;
  });
  
  return {
    vulnerable_dependencies: vulnerableDependencies,
    dependency_files_found: dependencyFiles,
    languages_checked: languages,
    timestamp: Date.now(),
    summary: {
      total_dependency_files: dependencyFiles.length,
      total_vulnerable_dependencies: vulnerableDependencies.length,
      severity_distribution: severityDistribution
    }
  };
}

/**
 * Helper function to simulate secret detection
 */
async function simulateSecretDetection(repositoryPath) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Mock found secrets
  const secretTypes = ['api_key', 'aws_key', 'password', 'auth_token'];
  const secretCount = Math.floor(Math.random() * 5) + 1;
  const secretsFound = [];
  
  for (let i = 0; i < secretCount; i++) {
    const secretType = secretTypes[Math.floor(Math.random() * secretTypes.length)];
    const fileExt = ['js', 'py', 'java', 'config'][Math.floor(Math.random() * 4)];
    
    secretsFound.push({
      type: secretType,
      file_path: `${repositoryPath}/src/config/example${i}.${fileExt}`,
      line_number: Math.floor(Math.random() * 100) + 1,
      line_content: `const ${secretType} = "****************************";`,
      masked_value: 'ab**********xy',
      severity: 'high'
    });
  }
  
  // Count by type
  const typeDistribution = {};
  secretsFound.forEach(secret => {
    if (!typeDistribution[secret.type]) {
      typeDistribution[secret.type] = 0;
    }
    typeDistribution[secret.type]++;
  });
  
  return {
    secrets_found: secretsFound,
    timestamp: Date.now(),
    summary: {
      total_secrets_found: secretsFound.length,
      type_distribution: typeDistribution,
      files_with_secrets: [...new Set(secretsFound.map(s => s.file_path))].length
    }
  };
}

/**
 * Helper function to store scan results
 */
async function storeScanResults(scanId, results) {
  try {
    // Create scans directory if it doesn't exist
    const scansDir = path.join(__dirname, '..', '..', 'data', 'scans');
    await fs.mkdir(scansDir, { recursive: true });
    
    // Write results to file
    const filePath = path.join(scansDir, `${scanId}.json`);
    await fs.writeFile(filePath, JSON.stringify(results, null, 2));
    
    // Update scans index
    const indexPath = path.join(scansDir, 'index.json');
    let index = [];
    
    try {
      const indexData = await fs.readFile(indexPath, 'utf8');
      index = JSON.parse(indexData);
    } catch (error) {
      // Index doesn't exist yet, that's ok
    }
    
    // Add scan to index
    index.push({
      scanId,
      timestamp: results.timestamp,
      repositoryPath: results.repository_path,
      vulnerabilityCount: results.summary.vulnerability_count,
      riskScore: results.summary.risk_score
    });
    
    // Sort by timestamp descending
    index.sort((a, b) => b.timestamp - a.timestamp);
    
    // Keep only the 50 most recent
    if (index.length > 50) {
      index = index.slice(0, 50);
    }
    
    // Write updated index
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error storing scan results:', error);
    return false;
  }
}

/**
 * Helper function to get scan results
 */
async function getScanResults(scanId) {
  try {
    const filePath = path.join(__dirname, '..', '..', 'data', 'scans', `${scanId}.json`);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error retrieving scan results for ${scanId}:`, error);
    return null;
  }
}

/**
 * Helper function to get recent scans
 */
async function getRecentScans() {
  try {
    const indexPath = path.join(__dirname, '..', '..', 'data', 'scans', 'index.json');
    const data = await fs.readFile(indexPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error retrieving recent scans:', error);
    return [];
  }
}

module.exports = router;