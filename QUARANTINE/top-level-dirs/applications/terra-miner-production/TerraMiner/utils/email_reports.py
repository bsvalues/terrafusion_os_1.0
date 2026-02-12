"""
Utility functions for sending feedback report emails.
"""
import logging
import os
import sys
from datetime import datetime, timedelta

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Attachment, FileContent, FileName, FileType, Disposition
import base64

from utils.feedback_export import export_to_csv, export_to_excel, format_feedback_data

def compute_feedback_stats(feedback_data):
    """
    Compute statistics from feedback data.
    
    Args:
        feedback_data (List[Dict[str, Any]]): List of feedback entries
        
    Returns:
        Dict: Statistics dictionary
    """
    # Initialize stats
    stats = {
        "overall": {
            "total_feedback": 0,
            "avg_rating": 0,
            "highest_rating": 0,
            "lowest_rating": 5,  # Start with highest possible
        },
        "by_agent": {}
    }
    
    # Initialize rating distribution
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    
    if not feedback_data:
        return {"overall": {"total_feedback": 0, "avg_rating": 0}, "by_agent": {}, "rating_distribution": rating_distribution}
    
    # Process feedback data
    total_rating = 0
    agent_ratings = {}
    
    for item in feedback_data:
        rating = item.get("rating", 0)
        agent_type = item.get("agent_type", "unknown")
        
        # Skip invalid ratings
        if rating < 1 or rating > 5:
            continue
        
        # Update overall stats
        stats["overall"]["total_feedback"] += 1
        total_rating += rating
        
        if rating > stats["overall"]["highest_rating"]:
            stats["overall"]["highest_rating"] = rating
            
        if rating < stats["overall"]["lowest_rating"]:
            stats["overall"]["lowest_rating"] = rating
            
        # Update rating distribution
        rating_distribution[rating] = rating_distribution.get(rating, 0) + 1
        
        # Update agent stats
        if agent_type not in agent_ratings:
            agent_ratings[agent_type] = {"total": 0, "count": 0}
            
        agent_ratings[agent_type]["total"] += rating
        agent_ratings[agent_type]["count"] += 1
    
    # Calculate averages
    if stats["overall"]["total_feedback"] > 0:
        stats["overall"]["avg_rating"] = total_rating / stats["overall"]["total_feedback"]
    
    # Calculate agent averages
    for agent_type, data in agent_ratings.items():
        if data["count"] > 0:
            stats["by_agent"][agent_type] = {
                "avg_rating": data["total"] / data["count"],
                "count": data["count"]
            }
    
    # Add rating distribution to stats
    stats["rating_distribution"] = rating_distribution
    
    return stats

# Setup logger
logger = logging.getLogger(__name__)

def get_sendgrid_api_key():
    """
    Get the SendGrid API key from environment variables.
    
    Returns:
        str: SendGrid API key
    """
    api_key = os.environ.get('SENDGRID_API_KEY')
    if not api_key:
        logger.error("SendGrid API key not found in environment variables")
        return None
    
    return api_key

def generate_report_email_content(start_date, end_date, stats):
    """
    Generate email content for the feedback report.
    
    Args:
        start_date (datetime): Start date of the report period
        end_date (datetime): End date of the report period
        stats (dict): Statistics for the report period
        
    Returns:
        str: HTML content for the email
    """
    # Format dates for display
    start_date_str = start_date.strftime('%B %d, %Y')
    end_date_str = end_date.strftime('%B %d, %Y')
    
    # Get overall statistics
    avg_rating = stats.get('overall', {}).get('avg_rating', 0)
    total_feedback = stats.get('overall', {}).get('total_feedback', 0)
    
    # Get agent statistics
    agent_stats = stats.get('by_agent', {})
    
    # Format agent names for display
    agent_name_map = {
        'summarizer': 'Text Summarization',
        'market_analyzer': 'Market Analysis',
        'recommender': 'Property Recommendation',
        'nl_search': 'Natural Language Search'
    }
    
    # Build HTML content
    html_content = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                h1 {{ color: #2a5885; font-size: 24px; margin-bottom: 20px; }}
                h2 {{ color: #2a5885; font-size: 20px; margin-top: 30px; margin-bottom: 15px; }}
                .summary {{ background-color: #f5f8fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
                .summary p {{ margin: 5px 0; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f5f8fa; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #777; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>AI Feedback Report</h1>
                <p>This report summarizes the AI feedback collected from {start_date_str} to {end_date_str}.</p>
                
                <div class="summary">
                    <h2>Summary</h2>
                    <p><strong>Total Feedback:</strong> {total_feedback}</p>
                    <p><strong>Average Rating:</strong> {avg_rating:.1f}/5.0</p>
                </div>
                
                <h2>Agent Performance</h2>
                <table>
                    <tr>
                        <th>Agent Type</th>
                        <th>Average Rating</th>
                        <th>Number of Ratings</th>
                    </tr>
    """
    
    # Add rows for each agent
    for agent_key, stats in agent_stats.items():
        agent_name = agent_name_map.get(agent_key, agent_key)
        avg = stats.get('avg_rating', 0)
        count = stats.get('count', 0)
        
        html_content += f"""
                    <tr>
                        <td>{agent_name}</td>
                        <td>{avg:.1f}</td>
                        <td>{count}</td>
                    </tr>
        """
    
    # Add closing tags and footer
    html_content += """
                </table>
                
                <p>For more detailed information, please see the attached export files.</p>
                
                <div class="footer">
                    <p>This is an automated report. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
    </html>
    """
    
    return html_content

def send_feedback_report(recipient_email, period='weekly', custom_start_date=None, custom_end_date=None):
    """
    Send a feedback report email with attached data export.
    
    Args:
        recipient_email (str): Email address to send the report to
        period (str): 'daily', 'weekly', or 'monthly'
        custom_start_date (datetime, optional): Custom start date for the report
        custom_end_date (datetime, optional): Custom end date for the report
        
    Returns:
        bool: True if sent successfully, False otherwise
    """
    try:
        # Get SendGrid API key
        api_key = get_sendgrid_api_key()
        if not api_key:
            logger.error("Cannot send email: SendGrid API key not available")
            return False
        
        # Set date range based on period
        end_date = custom_end_date or datetime.now()
        
        if custom_start_date:
            start_date = custom_start_date
        else:
            if period == 'daily':
                start_date = end_date - timedelta(days=1)
            elif period == 'weekly':
                start_date = end_date - timedelta(days=7)
            elif period == 'monthly':
                start_date = end_date - timedelta(days=30)
            else:
                # Default to weekly
                start_date = end_date - timedelta(days=7)
        
        # Get feedback data for the period
        from models import AIFeedback
        from app import db
        
        # Build query
        query = db.session.query(AIFeedback)
        query = query.filter(AIFeedback.created_at >= start_date)
        query = query.filter(AIFeedback.created_at <= end_date)
        
        # Get results
        results = query.order_by(AIFeedback.created_at.desc()).all()
        
        # Format feedback data
        feedback_data = []
        for feedback in results:
            feedback_data.append({
                "id": feedback.id,
                "agent_type": feedback.agent_type,
                "rating": feedback.rating,
                "comments": feedback.comments,
                "session_id": feedback.session_id,
                "created_at": feedback.created_at.isoformat(),
                "query_data": feedback.query_data,
                "response_data": feedback.response_data
            })
        
        if not feedback_data:
            logger.warning(f"No feedback data available for the period {start_date} to {end_date}")
            return False
        
        # Generate statistics for the report
        stats = compute_feedback_stats(feedback_data)
        
        # Generate email content
        html_content = generate_report_email_content(start_date, end_date, stats)
        
        # Create subject based on period
        if period == 'daily':
            subject = f"Daily AI Feedback Report - {end_date.strftime('%Y-%m-%d')}"
        elif period == 'weekly':
            subject = f"Weekly AI Feedback Report - Week of {start_date.strftime('%Y-%m-%d')}"
        elif period == 'monthly':
            subject = f"Monthly AI Feedback Report - {end_date.strftime('%B %Y')}"
        else:
            subject = f"AI Feedback Report - {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        
        # Create the email message
        message = Mail(
            from_email='reports@realestatetool.com',
            to_emails=recipient_email,
            subject=subject,
            html_content=html_content
        )
        
        # Generate CSV export
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_filename = f"ai_feedback_export_{timestamp}.csv"
        csv_path = export_to_csv(feedback_data, csv_filename)
        
        # Attach CSV file
        with open(csv_path, 'rb') as f:
            data = f.read()
            encoded_csv = base64.b64encode(data).decode()
        
        csv_attachment = Attachment()
        csv_attachment.file_content = FileContent(encoded_csv)
        csv_attachment.file_name = FileName(csv_filename)
        csv_attachment.file_type = FileType('text/csv')
        csv_attachment.disposition = Disposition('attachment')
        message.attachment = csv_attachment
        
        # Generate Excel export
        excel_filename = f"ai_feedback_export_{timestamp}.xlsx"
        excel_path = export_to_excel(feedback_data, excel_filename)
        
        # Attach Excel file
        with open(excel_path, 'rb') as f:
            data = f.read()
            encoded_excel = base64.b64encode(data).decode()
        
        excel_attachment = Attachment()
        excel_attachment.file_content = FileContent(encoded_excel)
        excel_attachment.file_name = FileName(excel_filename)
        excel_attachment.file_type = FileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        excel_attachment.disposition = Disposition('attachment')
        message.attachment = excel_attachment
        
        # Send the email
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        
        if response.status_code >= 200 and response.status_code < 300:
            logger.info(f"Feedback report email sent successfully to {recipient_email}")
            return True
        else:
            logger.error(f"Failed to send feedback report email: {response.status_code} - {response.body}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending feedback report email: {str(e)}")
        return False