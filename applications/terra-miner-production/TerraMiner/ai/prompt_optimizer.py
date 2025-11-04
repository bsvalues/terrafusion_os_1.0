"""
Prompt Optimization Pipeline for AI agents.
This module analyzes feedback data to suggest improvements to prompts.
"""
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

from app import db
# Move model imports inside functions to avoid circular imports

# Setup logger
logger = logging.getLogger(__name__)

class PromptOptimizer:
    """
    Analyzes feedback and suggests optimizations for AI prompts.
    """
    
    def __init__(self):
        """Initialize the prompt optimizer."""
        self.min_feedback_threshold = 5  # Minimum number of feedback entries needed for analysis
        self.low_rating_threshold = 3.5  # Ratings below this are considered "low"
    
    def get_feedback_for_analysis(self, agent_type: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get recent feedback data for a specific agent type.
        
        Args:
            agent_type (str): The agent type to get feedback for
            days (int): Number of days to look back
            
        Returns:
            List[Dict[str, Any]]: List of feedback entries
        """
        try:
            # Import models here to avoid circular imports
            from models import AIFeedback
            
            # Calculate date cutoff
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Query feedback data
            feedback_entries = AIFeedback.query.filter(
                AIFeedback.agent_type == agent_type,
                AIFeedback.created_at >= cutoff_date
            ).order_by(AIFeedback.created_at.desc()).all()
            
            # Format results
            formatted_entries = []
            for entry in feedback_entries:
                formatted_entries.append({
                    "id": entry.id,
                    "agent_type": entry.agent_type,
                    "query_data": entry.query_data,
                    "response_data": entry.response_data,
                    "rating": entry.rating,
                    "comments": entry.comments,
                    "created_at": entry.created_at.isoformat()
                })
            
            return formatted_entries
        except Exception as e:
            logger.error(f"Error getting feedback for analysis: {str(e)}")
            return []
    
    def analyze_feedback_patterns(self, feedback_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze feedback data to identify patterns in low-rated responses.
        
        Args:
            feedback_data (List[Dict[str, Any]]): List of feedback entries
            
        Returns:
            Dict[str, Any]: Analysis results
        """
        if not feedback_data or len(feedback_data) < self.min_feedback_threshold:
            return {
                "status": "insufficient_data",
                "message": f"Need at least {self.min_feedback_threshold} feedback entries for analysis"
            }
        
        # Split feedback into high and low rated
        high_rated = []
        low_rated = []
        
        for entry in feedback_data:
            if entry["rating"] >= self.low_rating_threshold:
                high_rated.append(entry)
            else:
                low_rated.append(entry)
        
        # Calculate statistics
        total_entries = len(feedback_data)
        avg_rating = sum(entry["rating"] for entry in feedback_data) / total_entries
        low_rated_percent = (len(low_rated) / total_entries) * 100 if total_entries > 0 else 0
        
        # Extract common terms/phrases from low-rated queries
        common_terms = self._extract_common_terms(low_rated)
        
        # Extract potential issues from low-rated responses
        potential_issues = self._identify_potential_issues(low_rated)
        
        # Compare high vs low rated responses
        comparison = self._compare_response_characteristics(high_rated, low_rated)
        
        return {
            "status": "success",
            "total_analyzed": total_entries,
            "average_rating": avg_rating,
            "low_rated_count": len(low_rated),
            "low_rated_percent": low_rated_percent,
            "common_terms_in_low_rated": common_terms,
            "potential_issues": potential_issues,
            "high_vs_low_comparison": comparison
        }
    
    def _extract_common_terms(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract common terms or phrases from the query data of entries.
        
        Args:
            entries (List[Dict[str, Any]]): List of feedback entries
            
        Returns:
            List[Dict[str, Any]]: Common terms with frequency
        """
        import re
        from collections import Counter
        
        # Extract all queries
        all_text = " ".join([entry.get("query_data", "") for entry in entries])
        
        # Remove special characters and convert to lowercase
        clean_text = re.sub(r'[^\w\s]', ' ', all_text.lower())
        
        # Split into words
        words = clean_text.split()
        
        # Remove common stop words
        stop_words = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", 
            "about", "of", "by", "is", "are", "was", "were", "be", "been", "being", 
            "that", "this", "these", "those", "I", "you", "he", "she", "it", "we", "they"
        }
        filtered_words = [word for word in words if word not in stop_words and len(word) > 2]
        
        # Count frequency
        word_counts = Counter(filtered_words)
        
        # Extract bigrams (two-word phrases)
        bigrams = []
        for i in range(len(words) - 1):
            if words[i] not in stop_words and words[i+1] not in stop_words:
                bigrams.append(f"{words[i]} {words[i+1]}")
        
        bigram_counts = Counter(bigrams)
        
        # Combine results
        common_terms = []
        
        # Add top single words
        for word, count in word_counts.most_common(10):
            common_terms.append({
                "term": word,
                "frequency": count,
                "type": "word"
            })
        
        # Add top bigrams
        for bigram, count in bigram_counts.most_common(5):
            if count > 1:  # Only include if it appears more than once
                common_terms.append({
                    "term": bigram,
                    "frequency": count,
                    "type": "phrase"
                })
        
        return common_terms
    
    def _identify_potential_issues(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identify potential issues in low-rated responses.
        
        Args:
            entries (List[Dict[str, Any]]): List of low-rated feedback entries
            
        Returns:
            List[Dict[str, Any]]: Potential issues
        """
        issues = []
        
        # Check for unusually short responses
        short_responses = []
        avg_length = sum(len(entry.get("response_data", "")) for entry in entries) / len(entries) if entries else 0
        
        for entry in entries:
            response = entry.get("response_data", "")
            if len(response) < avg_length * 0.5:
                short_responses.append(entry["id"])
        
        if short_responses:
            issues.append({
                "type": "brevity",
                "description": "Responses are unusually short",
                "frequency": len(short_responses),
                "affected_entries": short_responses
            })
        
        # Check for generic/template responses
        generic_phrases = [
            "I don't have enough information",
            "I cannot provide",
            "I'm unable to",
            "without more context",
            "I'd need more details"
        ]
        
        generic_responses = []
        for entry in entries:
            response = entry.get("response_data", "").lower()
            if any(phrase.lower() in response for phrase in generic_phrases):
                generic_responses.append(entry["id"])
        
        if generic_responses:
            issues.append({
                "type": "generic_response",
                "description": "Responses contain generic phrases or disclaimers",
                "frequency": len(generic_responses),
                "affected_entries": generic_responses
            })
        
        # Check for lack of specific details
        detail_phrases = [
            "specific", "details", "precisely", "exactly", 
            "particularly", "namely", "explicitly"
        ]
        
        detail_counts = {}
        for entry in entries:
            response = entry.get("response_data", "").lower()
            count = sum(1 for phrase in detail_phrases if phrase in response)
            detail_counts[entry["id"]] = count
        
        low_detail_entries = [
            entry_id for entry_id, count in detail_counts.items() 
            if count < 2  # Arbitrary threshold
        ]
        
        if low_detail_entries and len(low_detail_entries) > len(entries) * 0.3:  # If more than 30% have low detail
            issues.append({
                "type": "lack_of_detail",
                "description": "Responses lack specific details",
                "frequency": len(low_detail_entries),
                "affected_entries": low_detail_entries
            })
        
        return issues
    
    def _compare_response_characteristics(
        self, high_rated: List[Dict[str, Any]], low_rated: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Compare characteristics between high and low rated responses.
        
        Args:
            high_rated (List[Dict[str, Any]]): List of high-rated feedback entries
            low_rated (List[Dict[str, Any]]): List of low-rated feedback entries
            
        Returns:
            Dict[str, Any]: Comparison results
        """
        # If either list is empty, return empty comparison
        if not high_rated or not low_rated:
            return {}
        
        comparison = {}
        
        # Compare response length
        high_avg_length = sum(len(entry.get("response_data", "")) for entry in high_rated) / len(high_rated)
        low_avg_length = sum(len(entry.get("response_data", "")) for entry in low_rated) / len(low_rated)
        
        comparison["length_comparison"] = {
            "high_rated_avg_chars": round(high_avg_length, 2),
            "low_rated_avg_chars": round(low_avg_length, 2),
            "difference_percent": round(((high_avg_length - low_avg_length) / high_avg_length) * 100, 2)
        }
        
        # Compare structure (paragraphs)
        def count_paragraphs(text):
            return len([p for p in text.split("\n\n") if p.strip()])
        
        high_avg_paras = sum(count_paragraphs(entry.get("response_data", "")) for entry in high_rated) / len(high_rated)
        low_avg_paras = sum(count_paragraphs(entry.get("response_data", "")) for entry in low_rated) / len(low_rated)
        
        comparison["structure_comparison"] = {
            "high_rated_avg_paragraphs": round(high_avg_paras, 2),
            "low_rated_avg_paragraphs": round(low_avg_paras, 2)
        }
        
        return comparison
    
    def generate_prompt_suggestions(self, agent_type: str, days: int = 30) -> Dict[str, Any]:
        """
        Generate suggestions for improving prompts based on feedback analysis.
        
        Args:
            agent_type (str): The agent type to analyze
            days (int): Number of days to look back
            
        Returns:
            Dict[str, Any]: Prompt improvement suggestions
        """
        # Get feedback data
        feedback_data = self.get_feedback_for_analysis(agent_type, days)
        
        if not feedback_data or len(feedback_data) < self.min_feedback_threshold:
            return {
                "status": "insufficient_data",
                "message": f"Need at least {self.min_feedback_threshold} feedback entries for analysis",
                "suggestions": []
            }
        
        # Analyze feedback
        analysis = self.analyze_feedback_patterns(feedback_data)
        
        if analysis.get("status") != "success":
            return {
                "status": analysis.get("status"),
                "message": analysis.get("message", "Analysis failed"),
                "suggestions": []
            }
        
        # Generate suggestions based on analysis
        suggestions = []
        
        # Suggestion based on length comparison
        length_comparison = analysis.get("high_vs_low_comparison", {}).get("length_comparison", {})
        if length_comparison and length_comparison.get("difference_percent", 0) > 20:
            suggestions.append({
                "type": "length",
                "issue": "Low-rated responses are significantly shorter",
                "suggestion": "Encourage more comprehensive responses by specifying a minimum expected length or level of detail in the prompt"
            })
        
        # Suggestions based on identified issues
        for issue in analysis.get("potential_issues", []):
            if issue["type"] == "brevity":
                suggestions.append({
                    "type": "brevity",
                    "issue": "Responses are too brief",
                    "suggestion": "Modify prompt to explicitly request detailed explanations with multiple paragraphs"
                })
            elif issue["type"] == "generic_response":
                suggestions.append({
                    "type": "specificity",
                    "issue": "Responses contain too many generic statements",
                    "suggestion": "Add instructions to provide specific, actionable information rather than general statements"
                })
            elif issue["type"] == "lack_of_detail":
                suggestions.append({
                    "type": "detail",
                    "issue": "Responses lack sufficient detail",
                    "suggestion": "Request multiple specific examples in the prompt and specify areas that need detailed explanation"
                })
        
        # Suggestions based on common terms
        common_terms = analysis.get("common_terms_in_low_rated", [])
        if common_terms:
            term_suggestions = []
            for term in common_terms[:3]:  # Top 3 terms
                term_suggestions.append(f"'{term['term']}'")
            
            term_text = ", ".join(term_suggestions)
            suggestions.append({
                "type": "terminology",
                "issue": f"Low-rated responses frequently contain terms like {term_text}",
                "suggestion": "Consider providing additional context or instructions on how to address these specific topics in the prompt"
            })
        
        return {
            "status": "success",
            "analysis_summary": {
                "total_analyzed": analysis.get("total_analyzed"),
                "average_rating": round(analysis.get("average_rating", 0), 2),
                "low_rated_percent": round(analysis.get("low_rated_percent", 0), 2)
            },
            "suggestions": suggestions
        }
    
    def run_a_b_test(
        self, 
        agent_type: str, 
        original_prompt: str, 
        improved_prompt: str,
        test_duration_days: int = 7
    ) -> Dict[str, Any]:
        """
        Set up an A/B test between original and improved prompts.
        
        Args:
            agent_type (str): The agent type to test
            original_prompt (str): The original prompt (A)
            improved_prompt (str): The improved prompt (B)
            test_duration_days (int): Duration of the test in days
            
        Returns:
            Dict[str, Any]: Test configuration
        """
        # Import models here to avoid circular imports
        from models import PromptABTest
        
        # Create test record
        test = PromptABTest(
            agent_type=agent_type,
            original_prompt=original_prompt,
            improved_prompt=improved_prompt,
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=test_duration_days),
            status="active"
        )
        
        try:
            db.session.add(test)
            db.session.commit()
            
            return {
                "status": "success",
                "test_id": test.id,
                "agent_type": agent_type,
                "start_date": test.start_date.isoformat(),
                "end_date": test.end_date.isoformat(),
                "message": f"A/B test created successfully for {agent_type} agent. Test will run until {test.end_date.strftime('%Y-%m-%d')}."
            }
        except Exception as e:
            logger.error(f"Error creating A/B test: {str(e)}")
            db.session.rollback()
            
            return {
                "status": "error",
                "message": f"Failed to create A/B test: {str(e)}"
            }
    
    def evaluate_ab_test(self, test_id: int) -> Dict[str, Any]:
        """
        Evaluate the results of an A/B test.
        
        Args:
            test_id (int): The ID of the test to evaluate
            
        Returns:
            Dict[str, Any]: Test results
        """
        from models import PromptABTest, AIFeedback
        
        try:
            # Get test details
            test = PromptABTest.query.get(test_id)
            
            if not test:
                return {
                    "status": "error",
                    "message": f"Test with ID {test_id} not found"
                }
            
            # Check if test has ended
            if test.status != "completed" and datetime.now() < test.end_date:
                return {
                    "status": "pending",
                    "message": f"Test is still running until {test.end_date.strftime('%Y-%m-%d')}",
                    "current_progress": {
                        "days_elapsed": (datetime.now() - test.start_date).days,
                        "total_days": (test.end_date - test.start_date).days
                    }
                }
            
            # Get feedback for version A (original)
            version_a_feedback = AIFeedback.query.filter(
                AIFeedback.agent_type == test.agent_type,
                AIFeedback.created_at >= test.start_date,
                AIFeedback.created_at <= test.end_date,
                AIFeedback.extra_data.contains('"prompt_version": "A"')
            ).all()
            
            # Get feedback for version B (improved)
            version_b_feedback = AIFeedback.query.filter(
                AIFeedback.agent_type == test.agent_type,
                AIFeedback.created_at >= test.start_date,
                AIFeedback.created_at <= test.end_date,
                AIFeedback.extra_data.contains('"prompt_version": "B"')
            ).all()
            
            # Calculate statistics
            a_count = len(version_a_feedback)
            b_count = len(version_b_feedback)
            
            if a_count == 0 or b_count == 0:
                return {
                    "status": "insufficient_data",
                    "message": "Not enough feedback data collected for both versions",
                    "counts": {
                        "version_a": a_count,
                        "version_b": b_count
                    }
                }
            
            a_avg_rating = sum(f.rating for f in version_a_feedback) / a_count if a_count > 0 else 0
            b_avg_rating = sum(f.rating for f in version_b_feedback) / b_count if b_count > 0 else 0
            
            # Calculate statistical significance (simplified)
            is_significant = abs(a_avg_rating - b_avg_rating) > 0.5 and min(a_count, b_count) >= 10
            
            # Determine winner
            if is_significant:
                winner = "B" if b_avg_rating > a_avg_rating else "A"
            else:
                winner = "tie"
            
            # Update test status
            test.status = "completed"
            test.results = json.dumps({
                "version_a_count": a_count,
                "version_b_count": b_count,
                "version_a_avg_rating": a_avg_rating,
                "version_b_avg_rating": b_avg_rating,
                "winner": winner,
                "is_significant": is_significant
            })
            db.session.commit()
            
            return {
                "status": "success",
                "test_id": test.id,
                "agent_type": test.agent_type,
                "date_range": {
                    "start": test.start_date.isoformat(),
                    "end": test.end_date.isoformat()
                },
                "results": {
                    "version_a": {
                        "sample_size": a_count,
                        "avg_rating": round(a_avg_rating, 2)
                    },
                    "version_b": {
                        "sample_size": b_count,
                        "avg_rating": round(b_avg_rating, 2)
                    },
                    "improvement": round(((b_avg_rating - a_avg_rating) / a_avg_rating) * 100, 2) if a_avg_rating > 0 else 0,
                    "is_statistically_significant": is_significant,
                    "winner": winner,
                    "conclusion": self._generate_test_conclusion(a_avg_rating, b_avg_rating, is_significant)
                }
            }
        except Exception as e:
            logger.error(f"Error evaluating A/B test: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to evaluate A/B test: {str(e)}"
            }
    
    def _generate_test_conclusion(self, a_rating: float, b_rating: float, is_significant: bool) -> str:
        """
        Generate a conclusion based on test results.
        
        Args:
            a_rating (float): Average rating for version A
            b_rating (float): Average rating for version B
            is_significant (bool): Whether the difference is statistically significant
            
        Returns:
            str: Conclusion text
        """
        if not is_significant:
            return "The difference between the two prompt versions is not statistically significant. Continue testing or maintain the original prompt."
        
        if b_rating > a_rating:
            difference = round(((b_rating - a_rating) / a_rating) * 100, 2)
            return f"The improved prompt (B) performed significantly better with a {difference}% increase in average rating. We recommend implementing this version permanently."
        else:
            difference = round(((a_rating - b_rating) / b_rating) * 100, 2)
            return f"The original prompt (A) performed significantly better with a {difference}% higher average rating. We recommend keeping the original prompt and trying a different improvement approach."