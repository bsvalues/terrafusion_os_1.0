/*
 * CodeOptimizationService - Automated Code Optimization Engine
 *
 * Production-ready service providing automated code optimization suggestions,
 * refactoring recommendations, and performance improvements.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 6 Day 4
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

    public class OptimizationSuggestion
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Type { get; set; } = "performance"; // performance, readability, maintainability
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string OriginalCode { get; set; } = string.Empty;
        public string OptimizedCode { get; set; } = string.Empty;
        public int ImprovementPercentage { get; set; } // Estimated performance improvement
        public int Confidence { get; set; } // 0-100
        public List<string> Benefits { get; set; } = new();
        public List<string> Tags { get; set; } = new();
    }

    public class RefactoringRecommendation
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Pattern { get; set; } = string.Empty; // Extract Method, Replace Magic Number, etc.
        public string Description { get; set; } = string.Empty;
        public string Before { get; set; } = string.Empty;
        public string After { get; set; } = string.Empty;
        public string Rationale { get; set; } = string.Empty;
        public int Priority { get; set; } // 1-5, 5 being highest
        public List<string> Steps { get; set; } = new();
    }

    public class CodeOptimizationResult
    {
        public List<OptimizationSuggestion> Optimizations { get; set; } = new();
        public List<RefactoringRecommendation> Refactorings { get; set; } = new();
        public int TotalImprovementPotential { get; set; }
        public TimeSpan AnalysisTime { get; set; }
        public string Language { get; set; } = string.Empty;
    }

    // ==================== SERVICE ====================

    public interface ICodeOptimizationService
    {
        Task<CodeOptimizationResult> OptimizeCodeAsync(string code, string language, CancellationToken cancellationToken = default);
        Task<List<OptimizationSuggestion>> GetPerformanceOptimizationsAsync(string code, string language, CancellationToken cancellationToken = default);
        Task<List<RefactoringRecommendation>> GetRefactoringRecommendationsAsync(string code, string language, CancellationToken cancellationToken = default);
    }

    public class CodeOptimizationService : ICodeOptimizationService
    {
        private readonly ILogger<CodeOptimizationService> _logger;

        public CodeOptimizationService(ILogger<CodeOptimizationService> logger)
        {
            _logger = logger;
        }

        // ==================== PUBLIC METHODS ====================

        public async Task<CodeOptimizationResult> OptimizeCodeAsync(
            string code,
            string language,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;

            try
            {
                _logger.LogInformation("Analyzing code for optimization opportunities in {Language}", language);

                var optimizations = await GetPerformanceOptimizationsAsync(code, language, cancellationToken);
                var refactorings = await GetRefactoringRecommendationsAsync(code, language, cancellationToken);

                var result = new CodeOptimizationResult
                {
                    Optimizations = optimizations,
                    Refactorings = refactorings,
                    TotalImprovementPotential = optimizations.Sum(o => o.ImprovementPercentage),
                    AnalysisTime = DateTime.UtcNow - startTime,
                    Language = language
                };

                _logger.LogInformation("Found {OptCount} optimizations and {RefCount} refactorings",
                    optimizations.Count, refactorings.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing code for optimization");
                return new CodeOptimizationResult
                {
                    Language = language,
                    AnalysisTime = DateTime.UtcNow - startTime
                };
            }
        }

        public async Task<List<OptimizationSuggestion>> GetPerformanceOptimizationsAsync(
            string code,
            string language,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;

            var optimizations = new List<OptimizationSuggestion>();

            if (language.ToLower() == "python")
            {
                // List comprehension optimization
                var forLoopPattern = @"(\w+)\s*=\s*\[\]\s*\n\s*for\s+(\w+)\s+in\s+([^\:]+):\s*\n\s+\1\.append\(([^\)]+)\)";
                var matches = Regex.Matches(code, forLoopPattern, RegexOptions.Multiline);

                foreach (Match match in matches)
                {
                    var listName = match.Groups[1].Value;
                    var item = match.Groups[2].Value;
                    var iterable = match.Groups[3].Value;
                    var expression = match.Groups[4].Value;

                    optimizations.Add(new OptimizationSuggestion
                    {
                        Type = "performance",
                        Title = "Convert to List Comprehension",
                        Description = "Replace append loop with list comprehension for better performance",
                        OriginalCode = match.Value,
                        OptimizedCode = $"{listName} = [{expression} for {item} in {iterable}]",
                        ImprovementPercentage = 30,
                        Confidence = 95,
                        Benefits = new List<string>
                        {
                            "30% faster execution",
                            "More readable and Pythonic",
                            "Less memory overhead"
                        },
                        Tags = new List<string> { "list-comprehension", "performance" }
                    });
                }

                // String concatenation in loop
                if (Regex.IsMatch(code, @"for\s+\w+\s+in\s+[^:]+:\s*\n\s*\w+\s*\+=\s*[""']"))
                {
                    optimizations.Add(new OptimizationSuggestion
                    {
                        Type = "performance",
                        Title = "Use join() for String Concatenation",
                        Description = "String concatenation in loops is inefficient",
                        OriginalCode = "result = ''\nfor item in items:\n    result += str(item)",
                        OptimizedCode = "result = ''.join(str(item) for item in items)",
                        ImprovementPercentage = 50,
                        Confidence = 90,
                        Benefits = new List<string>
                        {
                            "50% faster for large datasets",
                            "Reduces memory allocations",
                            "More idiomatic Python"
                        },
                        Tags = new List<string> { "string-operations", "performance" }
                    });
                }

                // DataFrame iterrows optimization
                if (code.Contains("iterrows()"))
                {
                    optimizations.Add(new OptimizationSuggestion
                    {
                        Type = "performance",
                        Title = "Replace iterrows() with Vectorized Operations",
                        Description = "iterrows() is very slow; use vectorized operations or apply()",
                        OriginalCode = "for index, row in df.iterrows():\n    result = row['col1'] + row['col2']",
                        OptimizedCode = "df['result'] = df['col1'] + df['col2']",
                        ImprovementPercentage = 90,
                        Confidence = 95,
                        Benefits = new List<string>
                        {
                            "90% faster with vectorization",
                            "Leverages NumPy optimizations",
                            "Cleaner, more readable code"
                        },
                        Tags = new List<string> { "pandas", "vectorization" }
                    });
                }

                // NumPy array operations
                if (code.Contains("for") && code.Contains("append") && code.Contains("np."))
                {
                    optimizations.Add(new OptimizationSuggestion
                    {
                        Type = "performance",
                        Title = "Use NumPy Vectorization",
                        Description = "Replace loops with vectorized NumPy operations",
                        OriginalCode = "result = []\nfor i in range(len(arr)):\n    result.append(arr[i] * 2)",
                        OptimizedCode = "result = arr * 2",
                        ImprovementPercentage = 80,
                        Confidence = 90,
                        Benefits = new List<string>
                        {
                            "80% faster with NumPy",
                            "Utilizes C-level optimizations",
                            "More concise code"
                        },
                        Tags = new List<string> { "numpy", "vectorization" }
                    });
                }

                // Set membership testing
                if (Regex.IsMatch(code, @"if\s+\w+\s+in\s+\["))
                {
                    optimizations.Add(new OptimizationSuggestion
                    {
                        Type = "performance",
                        Title = "Use Set for Membership Testing",
                        Description = "Sets have O(1) lookup vs O(n) for lists",
                        OriginalCode = "valid_items = [1, 2, 3, 4, 5]\nif item in valid_items:",
                        OptimizedCode = "valid_items = {1, 2, 3, 4, 5}\nif item in valid_items:",
                        ImprovementPercentage = 60,
                        Confidence = 85,
                        Benefits = new List<string>
                        {
                            "O(1) vs O(n) lookup time",
                            "60% faster for repeated checks",
                            "Scales better with data size"
                        },
                        Tags = new List<string> { "data-structures", "performance" }
                    });
                }

                // Dict.get() instead of key checking
                if (Regex.IsMatch(code, @"if\s+\w+\s+in\s+\w+:\s*\n\s+\w+\s*=\s*\w+\[\w+\]"))
                {
                    optimizations.Add(new OptimizationSuggestion
                    {
                        Type = "readability",
                        Title = "Use dict.get() with Default Value",
                        Description = "Simplify dictionary access with get()",
                        OriginalCode = "if key in my_dict:\n    value = my_dict[key]\nelse:\n    value = default",
                        OptimizedCode = "value = my_dict.get(key, default)",
                        ImprovementPercentage = 20,
                        Confidence = 95,
                        Benefits = new List<string>
                        {
                            "More concise and readable",
                            "Single dictionary lookup",
                            "Idiomatic Python pattern"
                        },
                        Tags = new List<string> { "dict-operations", "readability" }
                    });
                }
            }

            return optimizations;
        }

        public async Task<List<RefactoringRecommendation>> GetRefactoringRecommendationsAsync(
            string code,
            string language,
            CancellationToken cancellationToken = default)
        {
            await Task.CompletedTask;

            var recommendations = new List<RefactoringRecommendation>();

            if (language.ToLower() == "python")
            {
                // Extract method for long functions
                var functionMatches = Regex.Matches(code, @"def\s+(\w+)\([^\)]*\):[^\n]*\n((?:\s+[^\n]+\n)+)", RegexOptions.Multiline);

                foreach (Match match in functionMatches)
                {
                    var functionName = match.Groups[1].Value;
                    var body = match.Groups[2].Value;
                    var lineCount = body.Split('\n').Where(l => !string.IsNullOrWhiteSpace(l)).Count();

                    if (lineCount > 20)
                    {
                        recommendations.Add(new RefactoringRecommendation
                        {
                            Pattern = "Extract Method",
                            Description = $"Function '{functionName}' is too long ({lineCount} lines)",
                            Before = match.Value,
                            After = "# Split into smaller, focused functions\ndef process_step1():\n    ...\n\ndef process_step2():\n    ...\n\ndef " + functionName + "():\n    process_step1()\n    process_step2()",
                            Rationale = "Functions should do one thing well. Long functions are hard to test and maintain.",
                            Priority = 4,
                            Steps = new List<string>
                            {
                                "Identify logical sections in the function",
                                "Extract each section into a separate function",
                                "Give each function a descriptive name",
                                "Update the original function to call the extracted ones"
                            }
                        });
                    }
                }

                // Replace magic numbers
                var magicNumberMatches = Regex.Matches(code, @"[^a-zA-Z_]\d{2,}[^a-zA-Z_]");
                if (magicNumberMatches.Count > 3)
                {
                    recommendations.Add(new RefactoringRecommendation
                    {
                        Pattern = "Replace Magic Number",
                        Description = "Multiple magic numbers found in code",
                        Before = "if age > 18 and score > 100:",
                        After = "ADULT_AGE = 18\nPASSING_SCORE = 100\n\nif age > ADULT_AGE and score > PASSING_SCORE:",
                        Rationale = "Magic numbers reduce code readability and make maintenance difficult.",
                        Priority = 3,
                        Steps = new List<string>
                        {
                            "Identify all magic numbers",
                            "Create named constants at module level",
                            "Replace numbers with constant names",
                            "Document what each constant represents"
                        }
                    });
                }

                // Simplify conditionals
                if (Regex.IsMatch(code, @"if\s+\w+\s*==\s*True:"))
                {
                    recommendations.Add(new RefactoringRecommendation
                    {
                        Pattern = "Simplify Boolean Expression",
                        Description = "Unnecessary boolean comparison detected",
                        Before = "if is_active == True:",
                        After = "if is_active:",
                        Rationale = "Boolean variables can be used directly in conditions.",
                        Priority = 2,
                        Steps = new List<string>
                        {
                            "Remove '== True' comparisons",
                            "Use 'not variable' instead of '== False'",
                            "Apply consistently across codebase"
                        }
                    });
                }

                // Consolidate duplicate code
                var duplicatePatterns = FindDuplicateCodePatterns(code);
                if (duplicatePatterns.Count > 0)
                {
                    recommendations.Add(new RefactoringRecommendation
                    {
                        Pattern = "Extract Common Code",
                        Description = $"Found {duplicatePatterns.Count} potential code duplications",
                        Before = "# Code block 1\nresult1 = process(data1)\nvalidate(result1)\n\n# Code block 2\nresult2 = process(data2)\nvalidate(result2)",
                        After = "def process_and_validate(data):\n    result = process(data)\n    validate(result)\n    return result\n\nresult1 = process_and_validate(data1)\nresult2 = process_and_validate(data2)",
                        Rationale = "Duplicate code increases maintenance burden and bug risk.",
                        Priority = 5,
                        Steps = new List<string>
                        {
                            "Identify duplicate code blocks",
                            "Extract common logic into a function",
                            "Parameterize the differences",
                            "Replace duplicates with function calls"
                        }
                    });
                }

                // Use context managers
                if (code.Contains("open(") && !code.Contains("with open"))
                {
                    recommendations.Add(new RefactoringRecommendation
                    {
                        Pattern = "Use Context Manager",
                        Description = "File operations should use context managers",
                        Before = "f = open('file.txt')\ndata = f.read()\nf.close()",
                        After = "with open('file.txt') as f:\n    data = f.read()",
                        Rationale = "Context managers ensure resources are properly cleaned up.",
                        Priority = 4,
                        Steps = new List<string>
                        {
                            "Replace open() with 'with open()'",
                            "Remove explicit close() calls",
                            "Ensure all file operations are within context"
                        }
                    });
                }
            }

            return recommendations.OrderByDescending(r => r.Priority).ToList();
        }

        // ==================== PRIVATE METHODS ====================

        private List<string> FindDuplicateCodePatterns(string code)
        {
            // Simplified duplicate detection - in production, use AST analysis
            var duplicates = new List<string>();

            var lines = code.Split('\n')
                .Where(l => !string.IsNullOrWhiteSpace(l) && !l.TrimStart().StartsWith("#"))
                .ToList();

            // Look for sequences of 3+ identical lines
            for (int i = 0; i < lines.Count - 2; i++)
            {
                for (int j = i + 3; j < lines.Count - 2; j++)
                {
                    if (lines[i] == lines[j] && lines[i + 1] == lines[j + 1] && lines[i + 2] == lines[j + 2])
                    {
                        duplicates.Add($"Lines {i}-{i + 2} match lines {j}-{j + 2}");
                    }
                }
            }

            return duplicates.Distinct().ToList();
        }
    }
}

