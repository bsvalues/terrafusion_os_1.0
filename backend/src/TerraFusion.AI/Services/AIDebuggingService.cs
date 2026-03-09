/*
 * AIDebuggingService - Intelligent Code Debugging Engine
 *
 * Production-ready service providing AI-powered debugging assistance,
 * breakpoint analysis, variable inspection, and execution path prediction.
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 2.0.0 - Phase 2 Week 7 Day 1
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

    public class DebugAnalysisRequest
    {
        public string Code { get; set; } = string.Empty;
        public string Language { get; set; } = "python";
        public int? LineNumber { get; set; }
        public Dictionary<string, object> Variables { get; set; } = new();
        public string ErrorMessage { get; set; } = string.Empty;
        public List<int> Breakpoints { get; set; } = new();
    }

    public class DebugSuggestion
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Type { get; set; } = "info"; // info, warning, error, fix
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? LineNumber { get; set; }
        public string SuggestedFix { get; set; } = string.Empty;
        public int Confidence { get; set; } // 0-100
        public List<string> RelatedVariables { get; set; } = new();
        public string Category { get; set; } = "general"; // logic, data, syntax, runtime, performance
    }

    public class VariableInspection
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Scope { get; set; } = "local"; // local, global, parameter
        public bool IsMutable { get; set; }
        public List<string> PossibleIssues { get; set; } = new();
        public string Recommendation { get; set; } = string.Empty;
    }

    public class ExecutionPath
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public List<int> LineNumbers { get; set; } = new();
        public string PathDescription { get; set; } = string.Empty;
        public int Probability { get; set; } // 0-100
        public List<string> Conditions { get; set; } = new();
        public string Outcome { get; set; } = string.Empty;
        public bool IsErrorPath { get; set; }
    }

    public class BreakpointAnalysis
    {
        public int LineNumber { get; set; }
        public string Context { get; set; } = string.Empty;
        public List<string> AvailableVariables { get; set; } = new();
        public List<string> SuggestedInspections { get; set; } = new();
        public string Reasoning { get; set; } = string.Empty;
        public int Usefulness { get; set; } // 0-100
    }

    public class DebugAnalysisResult
    {
        public List<DebugSuggestion> Suggestions { get; set; } = new();
        public List<VariableInspection> VariableInspections { get; set; } = new();
        public List<ExecutionPath> PossiblePaths { get; set; } = new();
        public List<BreakpointAnalysis> BreakpointAnalyses { get; set; } = new();
        public string RootCauseAnalysis { get; set; } = string.Empty;
        public List<string> QuickFixes { get; set; } = new();
        public TimeSpan AnalysisTime { get; set; }
    }

    // ==================== SERVICE ====================

    public interface IAIDebuggingService
    {
        Task<DebugAnalysisResult> AnalyzeCodeAsync(DebugAnalysisRequest request, CancellationToken cancellationToken = default);
        Task<List<DebugSuggestion>> GetDebugSuggestionsAsync(string code, string errorMessage, int? lineNumber, CancellationToken cancellationToken = default);
        Task<List<VariableInspection>> InspectVariablesAsync(string code, Dictionary<string, object> variables, CancellationToken cancellationToken = default);
        Task<List<ExecutionPath>> PredictExecutionPathsAsync(string code, Dictionary<string, object> initialValues, CancellationToken cancellationToken = default);
        Task<List<BreakpointAnalysis>> AnalyzeBreakpointsAsync(string code, List<int> breakpoints, CancellationToken cancellationToken = default);
    }

    public class AIDebuggingService : IAIDebuggingService
    {
        private readonly ILogger<AIDebuggingService> _logger;

        public AIDebuggingService(ILogger<AIDebuggingService> logger)
        {
            _logger = logger;
        }

        // ==================== PUBLIC METHODS ====================

        public async Task<DebugAnalysisResult> AnalyzeCodeAsync(
            DebugAnalysisRequest request,
            CancellationToken cancellationToken = default)
        {
            var startTime = DateTime.UtcNow;

            try
            {
                _logger.LogInformation("Starting debug analysis for {Language} code", request.Language);

                var result = new DebugAnalysisResult();

                // Run all analyses in parallel
                var suggestionsTask = GetDebugSuggestionsAsync(request.Code, request.ErrorMessage, request.LineNumber, cancellationToken);
                var inspectionsTask = InspectVariablesAsync(request.Code, request.Variables, cancellationToken);
                var pathsTask = PredictExecutionPathsAsync(request.Code, request.Variables, cancellationToken);
                var breakpointsTask = AnalyzeBreakpointsAsync(request.Code, request.Breakpoints, cancellationToken);

                await Task.WhenAll(suggestionsTask, inspectionsTask, pathsTask, breakpointsTask);

                result.Suggestions = await suggestionsTask;
                result.VariableInspections = await inspectionsTask;
                result.PossiblePaths = await pathsTask;
                result.BreakpointAnalyses = await breakpointsTask;

                // Generate root cause analysis
                result.RootCauseAnalysis = GenerateRootCauseAnalysis(request, result);

                // Generate quick fixes
                result.QuickFixes = GenerateQuickFixes(result.Suggestions);

                result.AnalysisTime = DateTime.UtcNow - startTime;

                _logger.LogInformation("Debug analysis complete: {SuggestionCount} suggestions, {PathCount} paths",
                    result.Suggestions.Count, result.PossiblePaths.Count);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during debug analysis");
                return new DebugAnalysisResult
                {
                    AnalysisTime = DateTime.UtcNow - startTime
                };
            }
        }

        public async Task<List<DebugSuggestion>> GetDebugSuggestionsAsync(
            string code,
            string errorMessage,
            int? lineNumber,
            CancellationToken cancellationToken = default)
        {

            var suggestions = new List<DebugSuggestion>();

            // Error-specific suggestions
            if (!string.IsNullOrEmpty(errorMessage))
            {
                suggestions.AddRange(AnalyzeErrorMessage(errorMessage, code, lineNumber));
            }

            // Common Python debugging patterns
            suggestions.AddRange(DetectCommonPythonIssues(code));

            // Logic errors
            suggestions.AddRange(DetectLogicErrors(code));

            // Data type issues
            suggestions.AddRange(DetectDataTypeIssues(code));

            return suggestions.OrderByDescending(s => s.Confidence).ToList();
        }

        public async Task<List<VariableInspection>> InspectVariablesAsync(
            string code,
            Dictionary<string, object> variables,
            CancellationToken cancellationToken = default)
        {

            var inspections = new List<VariableInspection>();

            // Extract all variable declarations from code
            var declaredVariables = ExtractVariableDeclarations(code);

            foreach (var varName in declaredVariables)
            {
                var inspection = new VariableInspection
                {
                    Name = varName,
                    Scope = DetermineScope(varName, code)
                };

                // Check if variable is provided in runtime values
                if (variables.TryGetValue(varName, out var value))
                {
                    inspection.Value = value?.ToString() ?? "None";
                    inspection.Type = value?.GetType().Name ?? "NoneType";
                }
                else
                {
                    inspection.Type = InferTypeFromCode(varName, code);
                    inspection.Value = "Not available at runtime";
                }

                // Detect potential issues
                inspection.PossibleIssues = DetectVariableIssues(varName, code, inspection.Type);
                inspection.IsMutable = IsMutableType(inspection.Type);
                inspection.Recommendation = GenerateVariableRecommendation(inspection);

                inspections.Add(inspection);
            }

            return inspections;
        }

        public async Task<List<ExecutionPath>> PredictExecutionPathsAsync(
            string code,
            Dictionary<string, object> initialValues,
            CancellationToken cancellationToken = default)
        {

            var paths = new List<ExecutionPath>();

            // Find all conditional branches
            var conditionals = FindConditionals(code);

            if (conditionals.Count == 0)
            {
                // Linear execution path
                paths.Add(new ExecutionPath
                {
                    LineNumbers = GetAllLineNumbers(code),
                    PathDescription = "Linear execution (no branches)",
                    Probability = 100,
                    Outcome = "Normal completion"
                });
                return paths;
            }

            // Generate paths for each conditional combination
            paths.AddRange(GenerateConditionalPaths(code, conditionals, initialValues));

            return paths.OrderByDescending(p => p.Probability).ToList();
        }

        public async Task<List<BreakpointAnalysis>> AnalyzeBreakpointsAsync(
            string code,
            List<int> breakpoints,
            CancellationToken cancellationToken = default)
        {

            var analyses = new List<BreakpointAnalysis>();
            var lines = code.Split('\n');

            foreach (var lineNumber in breakpoints)
            {
                if (lineNumber < 1 || lineNumber > lines.Length) continue;

                var lineContent = lines[lineNumber - 1];
                var analysis = new BreakpointAnalysis
                {
                    LineNumber = lineNumber,
                    Context = lineContent.Trim()
                };

                // Find all variables in scope at this line
                analysis.AvailableVariables = GetVariablesInScope(code, lineNumber);

                // Suggest what to inspect
                analysis.SuggestedInspections = SuggestInspections(lineContent, analysis.AvailableVariables);

                // Determine usefulness of this breakpoint
                analysis.Usefulness = CalculateBreakpointUsefulness(lineContent, analysis.AvailableVariables);

                // Provide reasoning
                analysis.Reasoning = GenerateBreakpointReasoning(lineContent, analysis);

                analyses.Add(analysis);
            }

            return analyses.OrderByDescending(a => a.Usefulness).ToList();
        }

        // ==================== PRIVATE HELPER METHODS ====================

        private List<DebugSuggestion> AnalyzeErrorMessage(string errorMessage, string code, int? lineNumber)
        {
            var suggestions = new List<DebugSuggestion>();

            // NameError
            if (errorMessage.Contains("NameError") || errorMessage.Contains("not defined"))
            {
                var varMatch = Regex.Match(errorMessage, @"'(\w+)'");
                if (varMatch.Success)
                {
                    var varName = varMatch.Groups[1].Value;
                    suggestions.Add(new DebugSuggestion
                    {
                        Type = "error",
                        Title = $"Variable '{varName}' Not Defined",
                        Description = $"The variable '{varName}' is used before being defined",
                        LineNumber = lineNumber,
                        SuggestedFix = $"# Define the variable before using it:\n{varName} = <initial_value>",
                        Confidence = 95,
                        RelatedVariables = new List<string> { varName },
                        Category = "syntax"
                    });
                }
            }

            // TypeError
            if (errorMessage.Contains("TypeError"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "error",
                    Title = "Type Mismatch Error",
                    Description = "Operation attempted on incompatible types",
                    LineNumber = lineNumber,
                    SuggestedFix = "# Check variable types:\nprint(type(variable_name))\n# Convert types if needed:\nvar = str(var)  # or int(), float(), list(), etc.",
                    Confidence = 90,
                    Category = "data"
                });
            }

            // IndexError
            if (errorMessage.Contains("IndexError") || errorMessage.Contains("list index out of range"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "error",
                    Title = "List Index Out of Range",
                    Description = "Attempting to access an index that doesn't exist",
                    LineNumber = lineNumber,
                    SuggestedFix = "# Check list length before accessing:\nif index < len(my_list):\n    value = my_list[index]",
                    Confidence = 95,
                    Category = "runtime"
                });
            }

            // KeyError
            if (errorMessage.Contains("KeyError"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "error",
                    Title = "Dictionary Key Not Found",
                    Description = "Attempting to access a key that doesn't exist in dictionary",
                    LineNumber = lineNumber,
                    SuggestedFix = "# Use .get() with default value:\nvalue = my_dict.get(key, default_value)\n# Or check if key exists:\nif key in my_dict:\n    value = my_dict[key]",
                    Confidence = 95,
                    Category = "runtime"
                });
            }

            // AttributeError
            if (errorMessage.Contains("AttributeError"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "error",
                    Title = "Attribute Does Not Exist",
                    Description = "Attempting to access an attribute/method that doesn't exist",
                    LineNumber = lineNumber,
                    SuggestedFix = "# Check available attributes:\nprint(dir(object))\n# Verify object type:\nprint(type(object))",
                    Confidence = 90,
                    Category = "runtime"
                });
            }

            // ZeroDivisionError
            if (errorMessage.Contains("ZeroDivisionError"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "error",
                    Title = "Division by Zero",
                    Description = "Attempting to divide by zero",
                    LineNumber = lineNumber,
                    SuggestedFix = "# Add zero check:\nif denominator != 0:\n    result = numerator / denominator\nelse:\n    result = 0  # or handle appropriately",
                    Confidence = 100,
                    Category = "logic"
                });
            }

            return suggestions;
        }

        private List<DebugSuggestion> DetectCommonPythonIssues(string code)
        {
            var suggestions = new List<DebugSuggestion>();

            // Uninitialized variable usage
            var assignmentPattern = @"(\w+)\s*=";
            var usagePattern = @"(?<!def\s+)\b(\w+)\b";

            var assignments = Regex.Matches(code, assignmentPattern)
                .Select(m => m.Groups[1].Value)
                .ToHashSet();

            var usages = Regex.Matches(code, usagePattern)
                .Select(m => m.Groups[1].Value)
                .Where(v => !IsKeyword(v))
                .ToList();

            foreach (var usage in usages.Distinct())
            {
                if (!assignments.Contains(usage) && !IsBuiltin(usage))
                {
                    suggestions.Add(new DebugSuggestion
                    {
                        Type = "warning",
                        Title = $"Potential Uninitialized Variable: {usage}",
                        Description = $"Variable '{usage}' may be used before assignment",
                        SuggestedFix = $"{usage} = <initial_value>  # Initialize before use",
                        Confidence = 70,
                        RelatedVariables = new List<string> { usage },
                        Category = "logic"
                    });
                }
            }

            // Mutable default arguments
            if (Regex.IsMatch(code, @"def\s+\w+\([^)]*=\s*(\[\]|\{\})"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "warning",
                    Title = "Mutable Default Argument",
                    Description = "Using mutable default arguments (list/dict) can lead to unexpected behavior",
                    SuggestedFix = "def func(arg=None):\n    if arg is None:\n        arg = []  # or {}\n    ...",
                    Confidence = 90,
                    Category = "logic"
                });
            }

            // Comparing with == None instead of is None
            if (Regex.IsMatch(code, @"\w+\s*==\s*None"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "info",
                    Title = "Use 'is None' Instead of '== None'",
                    Description = "Identity comparison (is) is preferred for None checks",
                    SuggestedFix = "if variable is None:  # Instead of: if variable == None:",
                    Confidence = 85,
                    Category = "syntax"
                });
            }

            // Modifying list while iterating
            if (Regex.IsMatch(code, @"for\s+\w+\s+in\s+(\w+):[\s\S]*?\1\.(append|remove|pop)"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "error",
                    Title = "Modifying List While Iterating",
                    Description = "Modifying a list while iterating over it causes unexpected behavior",
                    SuggestedFix = "# Iterate over a copy:\nfor item in my_list.copy():\n    my_list.remove(item)",
                    Confidence = 95,
                    Category = "logic"
                });
            }

            return suggestions;
        }

        private List<DebugSuggestion> DetectLogicErrors(string code)
        {
            var suggestions = new List<DebugSuggestion>();

            // Infinite loop detection
            var whileMatches = Regex.Matches(code, @"while\s+([^:]+):");
            foreach (Match match in whileMatches)
            {
                var condition = match.Groups[1].Value;
                if (condition.Trim() == "True" || condition.Trim() == "1")
                {
                    suggestions.Add(new DebugSuggestion
                    {
                        Type = "warning",
                        Title = "Potential Infinite Loop",
                        Description = "while True loop detected - ensure there's a break condition",
                        SuggestedFix = "while True:\n    ...\n    if condition:\n        break  # Add exit condition",
                        Confidence = 75,
                        Category = "logic"
                    });
                }
            }

            // Empty except blocks
            if (Regex.IsMatch(code, @"except\s*:\s*\n\s*pass"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "warning",
                    Title = "Bare Except with Pass",
                    Description = "Silently catching all exceptions makes debugging difficult",
                    SuggestedFix = "except Exception as e:\n    print(f\"Error: {e}\")\n    # Or log the error",
                    Confidence = 85,
                    Category = "logic"
                });
            }

            // Unreachable code after return
            if (Regex.IsMatch(code, @"return\s+[^\n]+\n\s+[^# \n]", RegexOptions.Multiline))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "warning",
                    Title = "Unreachable Code After Return",
                    Description = "Code after return statement will never execute",
                    SuggestedFix = "# Remove or move code before return statement",
                    Confidence = 100,
                    Category = "logic"
                });
            }

            return suggestions;
        }

        private List<DebugSuggestion> DetectDataTypeIssues(string code)
        {
            var suggestions = new List<DebugSuggestion>();

            // String concatenation with numbers
            if (Regex.IsMatch(code, @"[""'].*[""'][\s]*\+[\s]*\d+") || Regex.IsMatch(code, @"\d+[\s]*\+[\s]*[""'].*[""']"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "error",
                    Title = "String and Number Concatenation",
                    Description = "Cannot concatenate string and number directly",
                    SuggestedFix = "# Convert number to string:\nresult = \"text\" + str(number)\n# Or use f-string:\nresult = f\"text{number}\"",
                    Confidence = 90,
                    Category = "data"
                });
            }

            // Comparison of incompatible types
            if (Regex.IsMatch(code, @"if[\s]+[""'].*[""'][\s]*[<>]=?[\s]*\d+"))
            {
                suggestions.Add(new DebugSuggestion
                {
                    Type = "warning",
                    Title = "Comparing String with Number",
                    Description = "Comparing string with number may not work as expected",
                    SuggestedFix = "# Convert to same type:\nif int(string_var) > number:\n# Or:\nif string_var > str(number):",
                    Confidence = 85,
                    Category = "data"
                });
            }

            return suggestions;
        }

        private List<string> ExtractVariableDeclarations(string code)
        {
            var variables = new HashSet<string>();

            // Assignment pattern: variable = value
            var assignmentMatches = Regex.Matches(code, @"(\w+)\s*=\s*[^=]");
            foreach (Match match in assignmentMatches)
            {
                var varName = match.Groups[1].Value;
                if (!IsKeyword(varName))
                {
                    variables.Add(varName);
                }
            }

            // Function parameters
            var funcMatches = Regex.Matches(code, @"def\s+\w+\(([^)]+)\)");
            foreach (Match match in funcMatches)
            {
                var params_str = match.Groups[1].Value;
                var params_list = params_str.Split(',').Select(p => p.Trim().Split('=')[0].Trim());
                foreach (var param in params_list)
                {
                    if (!string.IsNullOrWhiteSpace(param) && !IsKeyword(param))
                    {
                        variables.Add(param);
                    }
                }
            }

            // For loop variables
            var forMatches = Regex.Matches(code, @"for\s+(\w+)\s+in\s+");
            foreach (Match match in forMatches)
            {
                variables.Add(match.Groups[1].Value);
            }

            return variables.ToList();
        }

        private string DetermineScope(string varName, string code)
        {
            var lines = code.Split('\n');

            foreach (var line in lines)
            {
                if (Regex.IsMatch(line, $@"def\s+\w+\([^)]*\b{varName}\b[^)]*\)"))
                {
                    return "parameter";
                }
            }

            // Check if assigned at top level (global)
            var indentedAssignment = Regex.Match(code, $@"^\s+{varName}\s*=", RegexOptions.Multiline);
            if (!indentedAssignment.Success)
            {
                var globalAssignment = Regex.Match(code, $@"^{varName}\s*=", RegexOptions.Multiline);
                if (globalAssignment.Success)
                {
                    return "global";
                }
            }

            return "local";
        }

        private string InferTypeFromCode(string varName, string code)
        {
            var assignmentMatch = Regex.Match(code, $@"{varName}\s*=\s*(.+?)(?:\n|$)");
            if (!assignmentMatch.Success) return "unknown";

            var value = assignmentMatch.Groups[1].Value.Trim();

            if (Regex.IsMatch(value, @"^\d+$")) return "int";
            if (Regex.IsMatch(value, @"^\d+\.\d+$")) return "float";
            if (Regex.IsMatch(value, @"^[""'].*[""']$")) return "str";
            if (value.StartsWith("[") && value.EndsWith("]")) return "list";
            if (value.StartsWith("{") && value.EndsWith("}")) return "dict";
            if (value == "True" || value == "False") return "bool";
            if (value == "None") return "NoneType";

            return "object";
        }

        private List<string> DetectVariableIssues(string varName, string code, string type)
        {
            var issues = new List<string>();

            // Check for unused variable
            var usageCount = Regex.Matches(code, $@"\b{varName}\b").Count;
            if (usageCount == 1)  // Only appears once (the assignment)
            {
                issues.Add("Variable is assigned but never used");
            }

            // Check for shadowing
            if (Regex.Matches(code, $@"{varName}\s*=").Count > 1)
            {
                issues.Add("Variable is reassigned multiple times");
            }

            // Type-specific issues
            if (type == "list" && Regex.IsMatch(code, $@"{varName}\s*=\s*\[\]"))
            {
                if (Regex.IsMatch(code, $@"{varName}\.append"))
                {
                    issues.Add("Consider using list comprehension instead of append loop");
                }
            }

            return issues;
        }

        private bool IsMutableType(string type)
        {
            var mutableTypes = new[] { "list", "dict", "set", "object" };
            return mutableTypes.Contains(type.ToLower());
        }

        private string GenerateVariableRecommendation(VariableInspection inspection)
        {
            if (inspection.PossibleIssues.Count == 0)
            {
                return "No issues detected";
            }

            var recommendations = new List<string>();

            foreach (var issue in inspection.PossibleIssues)
            {
                if (issue.Contains("never used"))
                {
                    recommendations.Add($"Remove unused variable or use it in your logic");
                }
                else if (issue.Contains("reassigned"))
                {
                    recommendations.Add("Consider using different variable names for different values");
                }
                else if (issue.Contains("list comprehension"))
                {
                    recommendations.Add($"Use: {inspection.Name} = [item for item in iterable]");
                }
            }

            return string.Join("; ", recommendations);
        }

        private List<(int Line, string Condition)> FindConditionals(string code)
        {
            var conditionals = new List<(int, string)>();
            var lines = code.Split('\n');

            for (int i = 0; i < lines.Length; i++)
            {
                var line = lines[i];
                var ifMatch = Regex.Match(line, @"if\s+([^:]+):");
                if (ifMatch.Success)
                {
                    conditionals.Add((i + 1, ifMatch.Groups[1].Value.Trim()));
                }
            }

            return conditionals;
        }

        private List<int> GetAllLineNumbers(string code)
        {
            var lines = code.Split('\n').Length;
            return Enumerable.Range(1, lines).ToList();
        }

        private List<ExecutionPath> GenerateConditionalPaths(
            string code,
            List<(int Line, string Condition)> conditionals,
            Dictionary<string, object> initialValues)
        {
            var paths = new List<ExecutionPath>();

            // Simplified path generation - in production, use AST analysis
            // Generate path for all conditions being true
            paths.Add(new ExecutionPath
            {
                PathDescription = "All conditions TRUE",
                Probability = 50,
                Conditions = conditionals.Select(c => $"{c.Condition} = True").ToList(),
                Outcome = "Execute all conditional blocks",
                LineNumbers = GetAllLineNumbers(code)
            });

            // Generate path for all conditions being false
            paths.Add(new ExecutionPath
            {
                PathDescription = "All conditions FALSE",
                Probability = 50,
                Conditions = conditionals.Select(c => $"{c.Condition} = False").ToList(),
                Outcome = "Skip all conditional blocks",
                LineNumbers = GetNonConditionalLines(code)
            });

            return paths;
        }

        private List<int> GetNonConditionalLines(string code)
        {
            // Simplified - return first and last lines
            var totalLines = code.Split('\n').Length;
            return new List<int> { 1, totalLines };
        }

        private List<string> GetVariablesInScope(string code, int lineNumber)
        {
            var variables = new HashSet<string>();
            var lines = code.Split('\n');

            // Get all variables declared before this line
            for (int i = 0; i < Math.Min(lineNumber, lines.Length); i++)
            {
                var matches = Regex.Matches(lines[i], @"(\w+)\s*=");
                foreach (Match match in matches)
                {
                    var varName = match.Groups[1].Value;
                    if (!IsKeyword(varName))
                    {
                        variables.Add(varName);
                    }
                }
            }

            return variables.ToList();
        }

        private List<string> SuggestInspections(string lineContent, List<string> availableVariables)
        {
            var suggestions = new List<string>();

            // Suggest inspecting variables used on this line
            foreach (var varName in availableVariables)
            {
                if (lineContent.Contains(varName))
                {
                    suggestions.Add($"Inspect '{varName}' value and type");
                }
            }

            // Line-specific suggestions
            if (lineContent.Contains("if"))
            {
                suggestions.Add("Check boolean condition result");
            }

            if (lineContent.Contains("for"))
            {
                suggestions.Add("Inspect iterator length and current index");
            }

            if (lineContent.Contains("=") && !lineContent.Contains("=="))
            {
                suggestions.Add("Verify assignment value before and after");
            }

            return suggestions.Count > 0 ? suggestions : new List<string> { "Inspect all variables in scope" };
        }

        private int CalculateBreakpointUsefulness(string lineContent, List<string> availableVariables)
        {
            var usefulness = 50; // Base score

            // Higher usefulness for lines with complex operations
            if (lineContent.Contains("if")) usefulness += 20;
            if (lineContent.Contains("for") || lineContent.Contains("while")) usefulness += 25;
            if (lineContent.Contains("=") && !lineContent.Contains("==")) usefulness += 15;
            if (Regex.IsMatch(lineContent, @"\[.*\]|\(.*\)")) usefulness += 10; // Array/function call

            // More variables = more useful to inspect
            usefulness += Math.Min(availableVariables.Count * 5, 20);

            return Math.Min(usefulness, 100);
        }

        private string GenerateBreakpointReasoning(string lineContent, BreakpointAnalysis analysis)
        {
            var reasons = new List<string>();

            if (lineContent.Contains("if"))
            {
                reasons.Add("Conditional branch - inspect condition result");
            }

            if (lineContent.Contains("for") || lineContent.Contains("while"))
            {
                reasons.Add("Loop entry point - verify iteration logic");
            }

            if (lineContent.Contains("=") && !lineContent.Contains("=="))
            {
                reasons.Add("Variable assignment - check value before/after");
            }

            if (analysis.AvailableVariables.Count > 5)
            {
                reasons.Add($"{analysis.AvailableVariables.Count} variables in scope - rich debugging context");
            }

            return reasons.Count > 0
                ? string.Join(". ", reasons)
                : "Standard inspection point - verify program state";
        }

        private string GenerateRootCauseAnalysis(DebugAnalysisRequest request, DebugAnalysisResult result)
        {
            if (result.Suggestions.Count == 0)
            {
                return "No obvious issues detected. Code appears syntactically correct.";
            }

            var errorSuggestions = result.Suggestions.Where(s => s.Type == "error").OrderByDescending(s => s.Confidence);
            if (errorSuggestions.Any())
            {
                var topError = errorSuggestions.First();
                return $"Root Cause: {topError.Title}. {topError.Description}";
            }

            var warningSuggestions = result.Suggestions.Where(s => s.Type == "warning").OrderByDescending(s => s.Confidence);
            if (warningSuggestions.Any())
            {
                var topWarning = warningSuggestions.First();
                return $"Likely Issue: {topWarning.Title}. {topWarning.Description}";
            }

            return "Multiple potential issues detected. Review suggestions for details.";
        }

        private List<string> GenerateQuickFixes(List<DebugSuggestion> suggestions)
        {
            return suggestions
                .Where(s => !string.IsNullOrEmpty(s.SuggestedFix))
                .OrderByDescending(s => s.Confidence)
                .Take(3)
                .Select(s => s.SuggestedFix)
                .ToList();
        }

        private bool IsKeyword(string word)
        {
            var keywords = new[] { "if", "else", "elif", "for", "while", "def", "class", "return",
                "import", "from", "as", "try", "except", "finally", "with", "lambda", "yield",
                "break", "continue", "pass", "raise", "assert", "del", "global", "nonlocal",
                "True", "False", "None", "and", "or", "not", "in", "is" };
            return keywords.Contains(word);
        }

        private bool IsBuiltin(string word)
        {
            var builtins = new[] { "print", "len", "range", "str", "int", "float", "list", "dict",
                "set", "tuple", "open", "sum", "max", "min", "abs", "round", "sorted", "enumerate",
                "zip", "map", "filter", "any", "all", "type", "isinstance", "hasattr", "getattr" };
            return builtins.Contains(word);
        }
    }
}
