/*
 * AIErrorPredictionService - Predictive Error Analysis
 *
 * Production-ready AI service that analyzes code before execution to predict
 * potential errors, warnings, and issues using static analysis and pattern matching.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 6 Day 2
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.AI.Services
{
    // ==================== MODELS ====================

    public class ErrorPrediction
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Severity { get; set; } = "warning"; // error, warning, info
        public string Type { get; set; } = "syntax"; // syntax, runtime, logical, performance, security
        public string Message { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Line { get; set; }
        public int Column { get; set; }
        public int Confidence { get; set; } // 0-100
        public string SuggestedFix { get; set; } = string.Empty;
        public string CodeSnippet { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
    }

    public class ErrorPredictionResult
    {
        public List<ErrorPrediction> Predictions { get; set; } = new();
        public int TotalIssues { get; set; }
        public int Errors { get; set; }
        public int Warnings { get; set; }
        public int Info { get; set; }
        public double OverallConfidence { get; set; }
        public TimeSpan AnalysisTime { get; set; }
        public string Language { get; set; } = string.Empty;
    }

    public class ErrorPredictionRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = "python";
        public List<string> ImportedModules { get; set; } = new();
        public List<string> DefinedVariables { get; set; } = new();
        public List<string> DefinedFunctions { get; set; } = new();
        public string CellContext { get; set; } = string.Empty;
    }

    // ==================== SERVICE ====================

    public interface IAIErrorPredictionService
    {
        Task<ErrorPredictionResult> PredictErrorsAsync(ErrorPredictionRequest request, CancellationToken cancellationToken = default);
        Task<List<ErrorPrediction>> AnalyzeSecurityIssuesAsync(string code, string language, CancellationToken cancellationToken = default);
        Task<List<ErrorPrediction>> AnalyzePerformanceIssuesAsync(string code, string language, CancellationToken cancellationToken = default);
    }

    public class AIErrorPredictionService : IAIErrorPredictionService
    {
        private readonly ILogger<AIErrorPredictionService> _logger;

        // Python common error patterns
        private static readonly List<ErrorPattern> PythonErrorPatterns = new()
        {
            new ErrorPattern
            {
                Pattern = @"^\s*if\s+.*:\s*$",
                ErrorType = "syntax",
                Severity = "error",
                Message = "Missing indented block after 'if' statement",
                Confidence = 90,
                SuggestedFix = "Add an indented block or use 'pass' statement"
            },
            new ErrorPattern
            {
                Pattern = @"print\s+[^(]",
                ErrorType = "syntax",
                Severity = "error",
                Message = "print requires parentheses in Python 3",
                Confidence = 95,
                SuggestedFix = "Change 'print x' to 'print(x)'"
            },
            new ErrorPattern
            {
                Pattern = @"=\s*=\s*",
                ErrorType = "logical",
                Severity = "warning",
                Message = "Possible assignment in condition (use == for comparison)",
                Confidence = 75,
                SuggestedFix = "Use '==' for comparison or '=' for assignment"
            },
            new ErrorPattern
            {
                Pattern = @"\bopen\([^)]*\)\s*(?!\.|\bwith\b)",
                ErrorType = "runtime",
                Severity = "warning",
                Message = "File opened without using 'with' statement (resource leak)",
                Confidence = 80,
                SuggestedFix = "Use 'with open(...) as f:' to ensure file is closed"
            },
            new ErrorPattern
            {
                Pattern = @"except\s*:",
                ErrorType = "logical",
                Severity = "warning",
                Message = "Bare except clause catches all exceptions (overly broad)",
                Confidence = 85,
                SuggestedFix = "Specify exception type: 'except SpecificError:'"
            },
            new ErrorPattern
            {
                Pattern = @"eval\s*\(",
                ErrorType = "security",
                Severity = "error",
                Message = "Use of eval() is a security risk",
                Confidence = 95,
                SuggestedFix = "Use safer alternatives like ast.literal_eval() or json.loads()"
            },
            new ErrorPattern
            {
                Pattern = @"exec\s*\(",
                ErrorType = "security",
                Severity = "error",
                Message = "Use of exec() is a security risk",
                Confidence = 95,
                SuggestedFix = "Avoid executing arbitrary code"
            },
            new ErrorPattern
            {
                Pattern = @"\/\s*0",
                ErrorType = "runtime",
                Severity = "error",
                Message = "Division by zero will raise ZeroDivisionError",
                Confidence = 100,
                SuggestedFix = "Add check: if denominator != 0:"
            },
            new ErrorPattern
            {
                Pattern = @"\[\s*-?\d+\s*\](?!\s*=)",
                ErrorType = "runtime",
                Severity = "warning",
                Message = "Index access without bounds check may raise IndexError",
                Confidence = 60,
                SuggestedFix = "Check length before accessing: if len(list) > index:"
            },
            new ErrorPattern
            {
                Pattern = @"import\s+\*",
                ErrorType = "logical",
                Severity = "warning",
                Message = "Wildcard import can cause namespace pollution",
                Confidence = 70,
                SuggestedFix = "Import specific items: from module import item1, item2"
            }
        };

        // JavaScript common error patterns
        private static readonly List<ErrorPattern> JavaScriptErrorPatterns = new()
        {
            new ErrorPattern
            {
                Pattern = @"==\s*null",
                ErrorType = "logical",
                Severity = "warning",
                Message = "Use === instead of == for null check",
                Confidence = 80,
                SuggestedFix = "Use strict equality: === null"
            },
            new ErrorPattern
            {
                Pattern = @"var\s+\w+",
                ErrorType = "logical",
                Severity = "info",
                Message = "Use 'let' or 'const' instead of 'var'",
                Confidence = 70,
                SuggestedFix = "Replace 'var' with 'let' or 'const'"
            },
            new ErrorPattern
            {
                Pattern = @"eval\s*\(",
                ErrorType = "security",
                Severity = "error",
                Message = "Use of eval() is a security risk",
                Confidence = 95,
                SuggestedFix = "Use JSON.parse() or Function constructor"
            },
            new ErrorPattern
            {
                Pattern = @"innerHTML\s*=",
                ErrorType = "security",
                Severity = "warning",
                Message = "Setting innerHTML can lead to XSS vulnerabilities",
                Confidence = 85,
                SuggestedFix = "Use textContent or sanitize HTML"
            }
        };

        public AIErrorPredictionService(ILogger<AIErrorPredictionService> logger)
        {
            _logger = logger;
        }

        // ==================== PUBLIC METHODS ====================

        public async Task<ErrorPredictionResult> PredictErrorsAsync(
            ErrorPredictionRequest request,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;

            try
            {
                _logger.LogInformation("Analyzing code for potential errors in {Language}", request.Language);

                var predictions = new List<ErrorPrediction>();

                // Get language-specific patterns
                var patterns = request.Language.ToLower() switch
                {
                    "python" => PythonErrorPatterns,
                    "javascript" => JavaScriptErrorPatterns,
                    _ => new List<ErrorPattern>()
                };

                // Analyze code with each pattern
                var lines = request.Code.Split('\n');
                for (int i = 0; i < lines.Length; i++)
                {
                    var line = lines[i];
                    foreach (var pattern in patterns)
                    {
                        if (Regex.IsMatch(line, pattern.Pattern))
                        {
                            predictions.Add(new ErrorPrediction
                            {
                                Severity = pattern.Severity,
                                Type = pattern.ErrorType,
                                Message = pattern.Message,
                                Description = pattern.Message,
                                Line = i + 1,
                                Column = 0,
                                Confidence = pattern.Confidence,
                                SuggestedFix = pattern.SuggestedFix,
                                CodeSnippet = line.Trim(),
                                Tags = new List<string> { pattern.ErrorType, request.Language }
                            });
                        }
                    }
                }

                // Additional language-specific analysis
                if (request.Language.ToLower() == "python")
                {
                    predictions.AddRange(await AnalyzePythonSpecificIssuesAsync(request, cancellationToken));
                }

                // Calculate statistics
                var result = new ErrorPredictionResult
                {
                    Predictions = predictions.OrderByDescending(p => p.Confidence).ToList(),
                    TotalIssues = predictions.Count,
                    Errors = predictions.Count(p => p.Severity == "error"),
                    Warnings = predictions.Count(p => p.Severity == "warning"),
                    Info = predictions.Count(p => p.Severity == "info"),
                    OverallConfidence = predictions.Any() ? predictions.Average(p => p.Confidence) : 0,
                    AnalysisTime = DateTime.UtcNow - startTime,
                    Language = request.Language
                };

                _logger.LogInformation("Found {Count} potential issues in {Time}ms",
                    result.TotalIssues, result.AnalysisTime.TotalMilliseconds);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error predicting errors");
                return new ErrorPredictionResult
                {
                    Language = request.Language,
                    AnalysisTime = DateTime.UtcNow - startTime
                };
            }
        }

        public async Task<List<ErrorPrediction>> AnalyzeSecurityIssuesAsync(
            string code,
            string language,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;

            var issues = new List<ErrorPrediction>();

            if (language.ToLower() == "python")
            {
                // Check for SQL injection
                if (Regex.IsMatch(code, @"execute\s*\([^)]*%|execute\s*\([^)]*\+"))
                {
                    issues.Add(new ErrorPrediction
                    {
                        Severity = "error",
                        Type = "security",
                        Message = "Potential SQL injection vulnerability",
                        Description = "String concatenation in SQL queries can lead to SQL injection",
                        Confidence = 90,
                        SuggestedFix = "Use parameterized queries: cursor.execute('SELECT * FROM table WHERE id = ?', (id,))",
                        Tags = new List<string> { "sql-injection", "security" }
                    });
                }

                // Check for command injection
                if (Regex.IsMatch(code, @"os\.system|subprocess\.call.*shell\s*=\s*True"))
                {
                    issues.Add(new ErrorPrediction
                    {
                        Severity = "error",
                        Type = "security",
                        Message = "Potential command injection vulnerability",
                        Description = "Executing shell commands with user input is dangerous",
                        Confidence = 85,
                        SuggestedFix = "Use subprocess with arguments list instead of shell=True",
                        Tags = new List<string> { "command-injection", "security" }
                    });
                }

                // Check for pickle usage
                if (code.Contains("pickle.load"))
                {
                    issues.Add(new ErrorPrediction
                    {
                        Severity = "warning",
                        Type = "security",
                        Message = "Pickle can execute arbitrary code when loading",
                        Description = "Unpickling untrusted data can lead to code execution",
                        Confidence = 75,
                        SuggestedFix = "Use safer serialization formats like JSON",
                        Tags = new List<string> { "pickle", "security" }
                    });
                }
            }

            return issues;
        }

        public async Task<List<ErrorPrediction>> AnalyzePerformanceIssuesAsync(
            string code,
            string language,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;

            var issues = new List<ErrorPrediction>();

            if (language.ToLower() == "python")
            {
                // Check for inefficient list concatenation
                if (Regex.IsMatch(code, @"\bfor\s+.*:\s*\n?\s*.*\+=\s*\["))
                {
                    issues.Add(new ErrorPrediction
                    {
                        Severity = "warning",
                        Type = "performance",
                        Message = "Inefficient list concatenation in loop",
                        Description = "Repeatedly extending lists in loops is slow",
                        Confidence = 80,
                        SuggestedFix = "Use list comprehension or append() method",
                        Tags = new List<string> { "performance", "list-operations" }
                    });
                }

                // Check for inefficient string concatenation
                if (Regex.IsMatch(code, @"\bfor\s+.*:\s*\n?\s*.*\+=\s*[""']"))
                {
                    issues.Add(new ErrorPrediction
                    {
                        Severity = "info",
                        Type = "performance",
                        Message = "Inefficient string concatenation in loop",
                        Description = "String concatenation in loops creates many temporary objects",
                        Confidence = 75,
                        SuggestedFix = "Use ''.join() or list accumulation",
                        Tags = new List<string> { "performance", "string-operations" }
                    });
                }

                // Check for global variables in functions
                if (Regex.IsMatch(code, @"def\s+\w+[^:]*:\s*\n\s*global\s+"))
                {
                    issues.Add(new ErrorPrediction
                    {
                        Severity = "warning",
                        Type = "performance",
                        Message = "Use of global variables impacts performance",
                        Description = "Global variable access is slower than local variables",
                        Confidence = 60,
                        SuggestedFix = "Pass values as parameters instead of using global",
                        Tags = new List<string> { "performance", "globals" }
                    });
                }
            }

            return issues;
        }

        // ==================== PRIVATE METHODS ====================

        private async Task<List<ErrorPrediction>> AnalyzePythonSpecificIssuesAsync(
            ErrorPredictionRequest request,
            CancellationToken cancellationToken)
        {
            await Task.CompletedTask;

            var issues = new List<ErrorPrediction>();

            // Check for undefined variable usage
            var variableUsagePattern = @"\b([a-zA-Z_]\w*)\b";
            var matches = Regex.Matches(request.Code, variableUsagePattern);

            var pythonKeywords = new HashSet<string>
            {
                "False", "None", "True", "and", "as", "assert", "async", "await",
                "break", "class", "continue", "def", "del", "elif", "else", "except",
                "finally", "for", "from", "global", "if", "import", "in", "is",
                "lambda", "nonlocal", "not", "or", "pass", "raise", "return",
                "try", "while", "with", "yield", "print", "len", "range", "str",
                "int", "float", "list", "dict", "set", "tuple"
            };

            var usedVariables = new HashSet<string>();
            foreach (Match match in matches)
            {
                var variable = match.Groups[1].Value;
                if (!pythonKeywords.Contains(variable) &&
                    !request.DefinedVariables.Contains(variable) &&
                    !request.DefinedFunctions.Contains(variable) &&
                    !usedVariables.Contains(variable))
                {
                    issues.Add(new ErrorPrediction
                    {
                        Severity = "warning",
                        Type = "runtime",
                        Message = $"Variable '{variable}' may not be defined",
                        Description = "Using undefined variables will raise NameError at runtime",
                        Confidence = 65,
                        SuggestedFix = $"Define '{variable}' before using it",
                        CodeSnippet = variable,
                        Tags = new List<string> { "undefined-variable", "runtime" }
                    });

                    usedVariables.Add(variable);
                }
            }

            return issues;
        }
    }

    // ==================== HELPER CLASSES ====================

    public class ErrorPattern
    {
        public string Pattern { get; set; } = string.Empty;
        public string ErrorType { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public int Confidence { get; set; }
        public string SuggestedFix { get; set; } = string.Empty;
    }
}
