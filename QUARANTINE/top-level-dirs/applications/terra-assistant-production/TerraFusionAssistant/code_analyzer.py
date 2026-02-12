import os
import re
import json
import logging
from typing import List, Dict, Any, Optional, Tuple, Union
from model_interface import ModelInterface

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('code_analyzer')

class CodeAnalysisResult:
    """Result of a code analysis operation."""
    
    def __init__(
        self,
        quality_score: float,
        issues: List[Dict[str, Any]],
        suggestions: List[Dict[str, Any]],
        metrics: Dict[str, Any],
        summary: str
    ):
        """
        Initialize a code analysis result.
        
        Args:
            quality_score: Overall code quality score (0-10)
            issues: List of identified issues
            suggestions: List of improvement suggestions
            metrics: Dictionary of code metrics
            summary: Summary of the analysis
        """
        self.quality_score = quality_score
        self.issues = issues
        self.suggestions = suggestions
        self.metrics = metrics
        self.summary = summary
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the result to a dictionary.
        
        Returns:
            Dictionary representation of the result
        """
        return {
            "quality_score": self.quality_score,
            "issues": self.issues,
            "suggestions": self.suggestions,
            "metrics": self.metrics,
            "summary": self.summary
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'CodeAnalysisResult':
        """
        Create a result from a dictionary.
        
        Args:
            data: Dictionary representation of the result
            
        Returns:
            CodeAnalysisResult instance
        """
        return cls(
            quality_score=data.get("quality_score", 0.0),
            issues=data.get("issues", []),
            suggestions=data.get("suggestions", []),
            metrics=data.get("metrics", {}),
            summary=data.get("summary", "")
        )

class CodeAnalyzer:
    """
    Analyzer for code quality, architecture, and performance.
    
    This class analyzes code using AI models to provide quality assessments,
    identify issues, and suggest improvements.
    """
    
    def __init__(self, model_interface: Optional[ModelInterface] = None):
        """
        Initialize the code analyzer.
        
        Args:
            model_interface: Model interface for AI operations
        """
        self.model_interface = model_interface or ModelInterface()
    
    def analyze_code(
        self,
        code: str,
        language: str,
        analysis_type: str = "quality",
        provider: str = "openai"
    ) -> CodeAnalysisResult:
        """
        Analyze code for quality, issues, and improvements.
        
        Args:
            code: Code to analyze
            language: Programming language of the code
            analysis_type: Type of analysis to perform (quality, architecture, performance, security)
            provider: AI provider to use
        
        Returns:
            CodeAnalysisResult with analysis results
        
        Raises:
            Exception: If analysis fails
        """
        try:
            # Truncate code if too long
            max_code_length = 8000
            truncated = False
            if len(code) > max_code_length:
                code = code[:max_code_length]
                truncated = True
            
            # Select prompt based on analysis type
            if analysis_type == "architecture":
                prompt, system_message = self._get_architecture_analysis_prompt(code, language, truncated)
            elif analysis_type == "performance":
                prompt, system_message = self._get_performance_analysis_prompt(code, language, truncated)
            elif analysis_type == "security":
                prompt, system_message = self._get_security_analysis_prompt(code, language, truncated)
            else:  # Default to quality analysis
                prompt, system_message = self._get_quality_analysis_prompt(code, language, truncated)
            
            # Generate analysis using AI model
            analysis_text = self.model_interface.generate_text(
                prompt=prompt,
                system_message=system_message,
                provider=provider,
                max_tokens=2000,
                temperature=0.3
            )
            
            # Extract JSON from response
            analysis_data = self._extract_json_from_text(analysis_text)
            
            # Create and return analysis result
            return CodeAnalysisResult.from_dict(analysis_data)
        
        except Exception as e:
            logger.error(f"Error analyzing code: {str(e)}")
            # Return a basic error result
            return CodeAnalysisResult(
                quality_score=0.0,
                issues=[{"severity": "high", "message": f"Analysis failed: {str(e)}"}],
                suggestions=[],
                metrics={},
                summary=f"Code analysis failed due to an error: {str(e)}"
            )
    
    def analyze_file(
        self,
        file_path: str,
        analysis_type: str = "quality",
        provider: str = "openai"
    ) -> CodeAnalysisResult:
        """
        Analyze a code file.
        
        Args:
            file_path: Path to the file to analyze
            analysis_type: Type of analysis to perform
            provider: AI provider to use
        
        Returns:
            CodeAnalysisResult with analysis results
        
        Raises:
            Exception: If file reading or analysis fails
        """
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                code = f.read()
            
            # Determine language from file extension
            _, ext = os.path.splitext(file_path)
            language = self._get_language_from_extension(ext)
            
            # Analyze code
            return self.analyze_code(code, language, analysis_type, provider)
        
        except Exception as e:
            logger.error(f"Error analyzing file {file_path}: {str(e)}")
            # Return a basic error result
            return CodeAnalysisResult(
                quality_score=0.0,
                issues=[{"severity": "high", "message": f"File analysis failed: {str(e)}"}],
                suggestions=[],
                metrics={},
                summary=f"File analysis failed due to an error: {str(e)}"
            )
    
    def _get_language_from_extension(self, extension: str) -> str:
        """
        Determine programming language from file extension.
        
        Args:
            extension: File extension
        
        Returns:
            Programming language name
        """
        extension = extension.lower()
        language_map = {
            '.py': 'Python',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'JavaScript (React)',
            '.tsx': 'TypeScript (React)',
            '.java': 'Java',
            '.c': 'C',
            '.cpp': 'C++',
            '.cs': 'C#',
            '.go': 'Go',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.rs': 'Rust',
            '.scala': 'Scala',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sql': 'SQL'
        }
        
        return language_map.get(extension, 'Unknown')
    
    def _get_quality_analysis_prompt(self, code: str, language: str, truncated: bool) -> Tuple[str, str]:
        """
        Get prompt for code quality analysis.
        
        Args:
            code: Code to analyze
            language: Programming language
            truncated: Whether the code was truncated
        
        Returns:
            Tuple of (prompt, system_message)
        """
        system_message = f"""
        You are an expert {language} developer specializing in code quality analysis.
        Analyze the provided code for quality issues, code style, maintainability, and best practices.
        Focus on identifying anti-patterns, code smells, and opportunities for improvement.
        Provide a thorough, objective assessment with specific examples from the code.
        Format your response as a JSON object containing analysis results.
        """
        
        prompt = f"""
        Please analyze the following {language} code for quality:
        
        ```{language.lower()}
        {code}
        ```
        
        {" (Note: This code has been truncated due to length limitations.)" if truncated else ""}
        
        Analyze the code for:
        1. Code style and formatting
        2. Variable and function naming
        3. Code structure and organization
        4. Error handling
        5. Comments and documentation
        6. Adherence to {language} best practices
        
        Return your analysis as a JSON object with the following structure:
        {{
            "quality_score": number from 1 to 10,
            "issues": [
                {{
                    "line": line number (optional),
                    "severity": "high", "medium", or "low",
                    "type": issue type (e.g., "naming", "error handling"),
                    "message": description of the issue
                }}
            ],
            "suggestions": [
                {{
                    "type": suggestion type,
                    "message": description of the suggestion,
                    "example": example of improved code (optional)
                }}
            ],
            "metrics": {{
                "complexity": number from 1 to 10,
                "maintainability": number from 1 to 10,
                "readability": number from 1 to 10,
                "test_coverage": estimated test coverage percentage
            }},
            "summary": summary of the analysis
        }}
        """
        
        return prompt, system_message
    
    def _get_architecture_analysis_prompt(self, code: str, language: str, truncated: bool) -> Tuple[str, str]:
        """
        Get prompt for code architecture analysis.
        
        Args:
            code: Code to analyze
            language: Programming language
            truncated: Whether the code was truncated
        
        Returns:
            Tuple of (prompt, system_message)
        """
        system_message = f"""
        You are an expert {language} architect specializing in software design and architecture analysis.
        Analyze the provided code for architectural patterns, component relationships, and design quality.
        Focus on identifying design patterns, architectural issues, and opportunities for improvement.
        Provide a thorough, objective assessment with specific examples from the code.
        Format your response as a JSON object containing analysis results.
        """
        
        prompt = f"""
        Please analyze the following {language} code for architectural quality:
        
        ```{language.lower()}
        {code}
        ```
        
        {" (Note: This code has been truncated due to length limitations.)" if truncated else ""}
        
        Analyze the code for:
        1. Architecture and design patterns
        2. Component/class relationships
        3. Separation of concerns
        4. Cohesion and coupling
        5. Extensibility and modularity
        6. Adherence to SOLID principles and clean architecture
        
        Return your analysis as a JSON object with the following structure:
        {{
            "quality_score": number from 1 to 10,
            "issues": [
                {{
                    "severity": "high", "medium", or "low",
                    "type": issue type (e.g., "coupling", "modularity"),
                    "message": description of the issue
                }}
            ],
            "suggestions": [
                {{
                    "type": suggestion type,
                    "message": description of the suggestion,
                    "example": example of improved design (optional)
                }}
            ],
            "metrics": {{
                "cohesion": number from 1 to 10,
                "coupling": number from 1 to 10,
                "modularity": number from 1 to 10,
                "extensibility": number from 1 to 10
            }},
            "summary": summary of the analysis
        }}
        """
        
        return prompt, system_message
    
    def _get_performance_analysis_prompt(self, code: str, language: str, truncated: bool) -> Tuple[str, str]:
        """
        Get prompt for code performance analysis.
        
        Args:
            code: Code to analyze
            language: Programming language
            truncated: Whether the code was truncated
        
        Returns:
            Tuple of (prompt, system_message)
        """
        system_message = f"""
        You are an expert {language} performance engineer specializing in optimization and efficiency analysis.
        Analyze the provided code for performance issues, algorithmic complexity, and resource usage patterns.
        Focus on identifying performance bottlenecks and opportunities for optimization.
        Provide a thorough, objective assessment with specific examples from the code.
        Format your response as a JSON object containing analysis results.
        """
        
        prompt = f"""
        Please analyze the following {language} code for performance:
        
        ```{language.lower()}
        {code}
        ```
        
        {" (Note: This code has been truncated due to length limitations.)" if truncated else ""}
        
        Analyze the code for:
        1. Time complexity (Big O notation)
        2. Memory usage patterns
        3. Algorithm efficiency
        4. Resource management
        5. Performance bottlenecks
        6. I/O and network operations
        
        Return your analysis as a JSON object with the following structure:
        {{
            "quality_score": number from 1 to 10,
            "issues": [
                {{
                    "severity": "high", "medium", or "low",
                    "type": issue type (e.g., "time complexity", "memory usage"),
                    "message": description of the issue
                }}
            ],
            "suggestions": [
                {{
                    "type": suggestion type,
                    "message": description of the suggestion,
                    "example": example of optimized code (optional)
                }}
            ],
            "metrics": {{
                "time_complexity": estimated Big O notation,
                "memory_efficiency": number from 1 to 10,
                "algorithm_efficiency": number from 1 to 10,
                "resource_management": number from 1 to 10
            }},
            "summary": summary of the analysis
        }}
        """
        
        return prompt, system_message
    
    def _get_security_analysis_prompt(self, code: str, language: str, truncated: bool) -> Tuple[str, str]:
        """
        Get prompt for code security analysis.
        
        Args:
            code: Code to analyze
            language: Programming language
            truncated: Whether the code was truncated
        
        Returns:
            Tuple of (prompt, system_message)
        """
        system_message = f"""
        You are an expert {language} security engineer specializing in application security and vulnerability assessment.
        Analyze the provided code for security vulnerabilities, injection points, and security best practices.
        Focus on identifying common security issues like injection attacks, authentication issues, and data exposure.
        Provide a thorough, objective assessment with specific examples from the code.
        Format your response as a JSON object containing analysis results.
        """
        
        prompt = f"""
        Please analyze the following {language} code for security vulnerabilities:
        
        ```{language.lower()}
        {code}
        ```
        
        {" (Note: This code has been truncated due to length limitations.)" if truncated else ""}
        
        Analyze the code for:
        1. Injection vulnerabilities (SQL, XSS, command injection)
        2. Authentication and authorization issues
        3. Sensitive data exposure
        4. Security misconfiguration
        5. Input validation and sanitization
        6. Cryptographic issues
        
        Return your analysis as a JSON object with the following structure:
        {{
            "quality_score": number from 1 to 10,
            "issues": [
                {{
                    "severity": "high", "medium", or "low",
                    "type": issue type (e.g., "injection", "authentication"),
                    "message": description of the vulnerability,
                    "cwe": CWE identifier if applicable (optional)
                }}
            ],
            "suggestions": [
                {{
                    "type": suggestion type,
                    "message": description of the security improvement,
                    "example": example of secure code (optional)
                }}
            ],
            "metrics": {{
                "input_validation": number from 1 to 10,
                "authentication": number from 1 to 10,
                "data_protection": number from 1 to 10,
                "overall_security": number from 1 to 10
            }},
            "summary": summary of the security analysis
        }}
        """
        
        return prompt, system_message
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """
        Extract JSON data from text response.
        
        Args:
            text: Text response from AI model
        
        Returns:
            Extracted JSON data as dictionary
        """
        try:
            # Try to find JSON block in markdown
            json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
            if json_match:
                json_str = json_match.group(1).strip()
                return json.loads(json_str)
            
            # Try to find JSON object directly (starts with { and ends with })
            json_match = re.search(r"(\{[\s\S]*\})", text)
            if json_match:
                json_str = json_match.group(1).strip()
                return json.loads(json_str)
            
            # If no JSON found, try to parse the entire text
            return json.loads(text)
        except Exception as e:
            logger.error(f"Error extracting JSON from text: {str(e)}")
            # Return default structure if JSON extraction fails
            return {
                "quality_score": 5.0,
                "issues": [{"severity": "medium", "message": "Could not parse detailed analysis results"}],
                "suggestions": [],
                "metrics": {},
                "summary": "The analysis was completed, but results could not be properly formatted."
            }


# Singleton instance for global access
_default_analyzer = None

def get_code_analyzer() -> CodeAnalyzer:
    """
    Get the default code analyzer instance.
    
    Returns:
        Default code analyzer instance
    """
    global _default_analyzer
    
    if _default_analyzer is None:
        _default_analyzer = CodeAnalyzer()
    
    return _default_analyzer