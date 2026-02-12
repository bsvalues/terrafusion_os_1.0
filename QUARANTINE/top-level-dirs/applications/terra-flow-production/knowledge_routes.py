"""
Knowledge Base Routes

This module provides the routes for the knowledge base UI
and API endpoints for knowledge management.
"""

import json
import logging
import datetime
from typing import Dict, List, Any, Optional
from flask import Blueprint, render_template, request, jsonify, session, g
from collections import Counter

from mcp.core import mcp_instance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
knowledge_bp = Blueprint('knowledge', __name__, url_prefix='/knowledge')

# Define colors for different entry types
ENTRY_TYPE_COLORS = {
    'insight': 'info',
    'warning': 'warning',
    'error': 'danger',
    'best_practice': 'success',
    'compliance': 'primary',
    'tip': 'secondary'
}

# Helper functions
def format_date(timestamp: float) -> str:
    """Format a timestamp into a readable date string"""
    if not timestamp:
        return "Unknown"
    return datetime.datetime.fromtimestamp(timestamp).strftime('%b %d, %Y %H:%M')

def get_agent_id() -> str:
    """Get the current agent ID from the session or user"""
    # Default to system agent if not logged in
    if hasattr(g, 'user') and g.user:
        return g.user.get('username', 'system')
    return 'system'

@knowledge_bp.route('/', methods=['GET'])
def knowledge_base():
    """Render the knowledge base UI"""
    # Get all knowledge entries
    entries = []
    
    try:
        # Use the system agent to get all entries
        all_agents = mcp_instance.get_agent_info()
        if all_agents and isinstance(all_agents, dict):
            agent_ids = list(all_agents.keys())
            
            # Get knowledge from each agent
            for agent_id in agent_ids:
                agent_entries = mcp_instance.get_agent_knowledge(agent_id)
                entries.extend(agent_entries)
                
            # Remove duplicates based on ID
            unique_entries = {}
            for entry in entries:
                unique_entries[entry.get('id')] = entry
            
            entries = list(unique_entries.values())
            
            # Sort by date (newest first)
            entries.sort(key=lambda x: x.get('created_at', 0), reverse=True)
        
        # Extract tags and counts
        all_tags = []
        for entry in entries:
            all_tags.extend(entry.get('tags', []))
        
        tag_counts = Counter(all_tags)
        tags = sorted(tag_counts.keys())
        
        # Extract entry types and counts
        type_counts = Counter([entry.get('entry_type', 'unknown') for entry in entries])
        
        # Pass data to template
        return render_template(
            'knowledge_base.html',
            entries=entries,
            tags=tags,
            tag_counts=tag_counts,
            type_counts=type_counts,
            total_entries=len(entries),
            entry_type_colors=ENTRY_TYPE_COLORS
        )
    except Exception as e:
        logger.error(f"Error rendering knowledge base: {str(e)}")
        return render_template(
            'knowledge_base.html',
            entries=[],
            tags=[],
            tag_counts={},
            type_counts={},
            total_entries=0,
            entry_type_colors=ENTRY_TYPE_COLORS,
            error=str(e)
        )

@knowledge_bp.route('/entry/<entry_id>', methods=['GET'])
def get_entry(entry_id: str):
    """Get details of a specific knowledge entry"""
    try:
        # Get the entry
        entry = mcp_instance.get_knowledge_entry(entry_id)
        if not entry:
            return jsonify({'success': False, 'error': 'Entry not found'})
        
        # Get related entries
        related = mcp_instance.get_related_knowledge(entry_id, limit=3)
        
        # Add color information
        entry['entry_type_color'] = ENTRY_TYPE_COLORS.get(entry.get('entry_type', ''), 'secondary')
        
        # Format dates
        entry['created_at'] = format_date(entry.get('created_at'))
        entry['updated_at'] = format_date(entry.get('updated_at'))
        
        return jsonify({
            'success': True,
            'entry': entry,
            'related': related
        })
    except Exception as e:
        logger.error(f"Error getting knowledge entry {entry_id}: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@knowledge_bp.route('/add', methods=['POST'])
def add_knowledge():
    """Add a new knowledge entry"""
    try:
        # Get form data
        title = request.form.get('title')
        content = request.form.get('content')
        entry_type = request.form.get('entry_type')
        tags = json.loads(request.form.get('tags', '[]'))
        references = json.loads(request.form.get('references', '[]'))
        
        # Validate required fields
        if not title or not content or not entry_type:
            return jsonify({'success': False, 'error': 'Missing required fields'})
        
        # Get the agent ID from the current user
        agent_id = get_agent_id()
        
        # Add the knowledge entry
        entry_id = mcp_instance.add_knowledge(
            agent_id=agent_id,
            title=title,
            content=content,
            entry_type=entry_type,
            tags=tags,
            references=references
        )
        
        if not entry_id:
            return jsonify({'success': False, 'error': 'Failed to add knowledge entry'})
        
        return jsonify({
            'success': True,
            'entry_id': entry_id
        })
    except Exception as e:
        logger.error(f"Error adding knowledge entry: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@knowledge_bp.route('/rate', methods=['POST'])
def rate_entry():
    """Rate a knowledge entry"""
    try:
        # Get form data
        entry_id = request.form.get('entry_id')
        rating = float(request.form.get('rating', 0))
        
        # Validate required fields
        if not entry_id or rating <= 0 or rating > 5:
            return jsonify({'success': False, 'error': 'Invalid rating data'})
        
        # Get the agent ID from the current user
        agent_id = get_agent_id()
        
        # Submit the rating
        success = mcp_instance.provide_knowledge_feedback(
            agent_id=agent_id,
            entry_id=entry_id,
            rating=rating
        )
        
        return jsonify({'success': success})
    except Exception as e:
        logger.error(f"Error rating knowledge entry: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@knowledge_bp.route('/feedback', methods=['POST'])
def provide_feedback():
    """Provide detailed feedback on a knowledge entry"""
    try:
        # Get form data
        entry_id = request.form.get('entry_id')
        rating = float(request.form.get('rating', 0))
        feedback_text = request.form.get('feedback_text', '')
        
        # Validate required fields
        if not entry_id or rating <= 0 or rating > 5:
            return jsonify({'success': False, 'error': 'Invalid feedback data'})
        
        # Get the agent ID from the current user
        agent_id = get_agent_id()
        
        # Submit the feedback
        success = mcp_instance.provide_knowledge_feedback(
            agent_id=agent_id,
            entry_id=entry_id,
            rating=rating,
            feedback_text=feedback_text
        )
        
        return jsonify({'success': success})
    except Exception as e:
        logger.error(f"Error providing knowledge feedback: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@knowledge_bp.route('/search', methods=['GET'])
def search_knowledge():
    """Search for knowledge entries"""
    try:
        # Get search parameters
        query = request.args.get('q', '')
        entry_type = request.args.get('type')
        tags_param = request.args.get('tags')
        
        # Parse tags if provided
        tags = None
        if tags_param:
            tags = [tag.strip() for tag in tags_param.split(',') if tag.strip()]
        
        # Get the agent ID from the current user
        agent_id = get_agent_id()
        
        # Query the knowledge base
        results = mcp_instance.query_knowledge(
            agent_id=agent_id,
            query_text=query,
            entry_type=entry_type,
            tags=tags,
            limit=20
        )
        
        # Add color information and format dates
        for entry in results:
            entry['entry_type_color'] = ENTRY_TYPE_COLORS.get(entry.get('entry_type', ''), 'secondary')
            entry['created_at'] = format_date(entry.get('created_at'))
            entry['updated_at'] = format_date(entry.get('updated_at'))
        
        return jsonify({
            'success': True,
            'results': results,
            'count': len(results)
        })
    except Exception as e:
        logger.error(f"Error searching knowledge: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@knowledge_bp.route('/stats', methods=['GET'])
def knowledge_stats():
    """Get statistics about the knowledge base"""
    try:
        # Get knowledge stats from MCP
        stats = mcp_instance.knowledge_sharing.get_knowledge_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        logger.error(f"Error getting knowledge stats: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@knowledge_bp.route('/dashboard', methods=['GET'])
def knowledge_dashboard():
    """Render the knowledge dashboard"""
    return render_template('knowledge_dashboard.html')

@knowledge_bp.route('/dashboard-data', methods=['GET'])
def dashboard_data():
    """Get data for the knowledge dashboard"""
    try:
        # Get days parameter (0 = all time)
        days = int(request.args.get('days', 30))
        agent_id = get_agent_id()
        
        # Timestamp for filtering (if needed)
        filter_timestamp = None
        if days > 0:
            filter_timestamp = datetime.datetime.now().timestamp() - (days * 86400)  # 86400 seconds in a day
        
        # Get all knowledge entries
        entries = []
        all_agents = mcp_instance.get_agent_info()
        if all_agents and isinstance(all_agents, dict):
            agent_ids = list(all_agents.keys())
            
            # Get knowledge from each agent
            for agent_id in agent_ids:
                agent_entries = mcp_instance.get_agent_knowledge(agent_id)
                entries.extend(agent_entries)
            
            # Filter by date if needed
            if filter_timestamp:
                entries = [e for e in entries if e.get('created_at', 0) >= filter_timestamp]
        
        # Process entries for dashboard data
        total_entries = len(entries)
        
        # Calculate metrics
        avg_rating = 0
        total_feedback = 0
        contributing_agents = set()
        
        for entry in entries:
            avg_rating += entry.get('rating', 0) * entry.get('rating_count', 0)
            total_feedback += entry.get('rating_count', 0)
            contributing_agents.add(entry.get('source_agent_id', 'unknown'))
        
        avg_rating = avg_rating / total_feedback if total_feedback > 0 else 0
        
        metrics = {
            'total_entries': total_entries,
            'avg_rating': avg_rating,
            'total_feedback': total_feedback,
            'contributing_agents': len(contributing_agents)
        }
        
        # Entry type data
        entry_types = {}
        for entry in entries:
            entry_type = entry.get('entry_type', 'unknown')
            entry_types[entry_type] = entry_types.get(entry_type, 0) + 1
        
        entries_by_type = {
            'labels': list(entry_types.keys()),
            'values': list(entry_types.values())
        }
        
        # Knowledge growth data
        entries_by_date = {}
        for entry in sorted(entries, key=lambda x: x.get('created_at', 0)):
            date_str = datetime.datetime.fromtimestamp(entry.get('created_at', 0)).strftime('%Y-%m-%d')
            entries_by_date[date_str] = entries_by_date.get(date_str, 0) + 1
        
        # Ensure we have all dates in the range
        date_labels = []
        if days > 0 and len(entries_by_date) > 0:
            start_date = datetime.datetime.now() - datetime.timedelta(days=days)
            current_date = start_date
            end_date = datetime.datetime.now()
            
            while current_date <= end_date:
                date_str = current_date.strftime('%Y-%m-%d')
                if date_str not in entries_by_date:
                    entries_by_date[date_str] = 0
                current_date += datetime.timedelta(days=1)
        
        # Sort dates and create cumulative data
        date_labels = sorted(entries_by_date.keys())
        new_entries = [entries_by_date[date] for date in date_labels]
        cumulative = []
        cum_sum = 0
        for val in new_entries:
            cum_sum += val
            cumulative.append(cum_sum)
        
        knowledge_growth = {
            'labels': date_labels,
            'new_entries': new_entries,
            'cumulative': cumulative
        }
        
        # Top tags data
        all_tags = {}
        for entry in entries:
            for tag in entry.get('tags', []):
                all_tags[tag] = all_tags.get(tag, 0) + 1
        
        # Sort tags by count and get top 10
        top_tags_sorted = sorted(all_tags.items(), key=lambda x: x[1], reverse=True)[:10]
        
        top_tags = {
            'labels': [tag for tag, count in top_tags_sorted],
            'values': [count for tag, count in top_tags_sorted]
        }
        
        # Agent contributions data
        agent_contributions = {}
        for entry in entries:
            agent = entry.get('source_agent_id', 'unknown')
            agent_contributions[agent] = agent_contributions.get(agent, 0) + 1
        
        agent_contributions_data = {
            'labels': list(agent_contributions.keys()),
            'values': list(agent_contributions.values())
        }
        
        # Rating distribution data
        rating_distribution = [0, 0, 0, 0, 0]  # 1-5 stars
        
        for entry in entries:
            if entry.get('rating_count', 0) > 0:
                rating = int(round(entry.get('rating', 0)))
                if 1 <= rating <= 5:
                    rating_distribution[rating - 1] += 1
        
        rating_distribution_data = {
            'labels': ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
            'values': rating_distribution
        }
        
        # Tag relationships (simplified bubble chart data)
        # Create co-occurrence matrix
        tag_pairs = {}
        
        for entry in entries:
            tags = entry.get('tags', [])
            for i, tag1 in enumerate(tags):
                for tag2 in tags[i+1:]:
                    key = tuple(sorted([tag1, tag2]))
                    tag_pairs[key] = tag_pairs.get(key, 0) + 1
        
        # Create bubble chart data (simplified)
        tag_relationships_data = {
            'datasets': []
        }
        
        # Get top 5 tags for relationships
        top_5_tags = [tag for tag, _ in top_tags_sorted[:5]]
        
        for tag in top_5_tags:
            data_points = []
            
            for pair, count in tag_pairs.items():
                if tag in pair:
                    other_tag = pair[0] if pair[1] == tag else pair[1]
                    data_points.append({
                        'x': count,  # co-occurrence count
                        'y': all_tags.get(tag, 0),  # tag count
                        'r': 5 + (count * 2)  # bubble size based on co-occurrence
                    })
            
            if data_points:
                tag_relationships_data['datasets'].append({
                    'label': tag,
                    'data': data_points
                })
        
        # Top rated entries
        top_entries = sorted(
            [e for e in entries if e.get('rating_count', 0) > 0],
            key=lambda x: x.get('rating', 0),
            reverse=True
        )[:10]
        
        # Format entries for display
        formatted_top_entries = []
        for entry in top_entries:
            formatted_entry = {
                'id': entry.get('id'),
                'title': entry.get('title'),
                'entry_type': entry.get('entry_type', 'unknown'),
                'source_agent_id': entry.get('source_agent_id', 'unknown'),
                'rating': entry.get('rating', 0),
                'rating_count': entry.get('rating_count', 0),
                'created_at': format_date(entry.get('created_at')),
                'type_color': ENTRY_TYPE_COLORS.get(entry.get('entry_type', ''), 'secondary')
            }
            formatted_top_entries.append(formatted_entry)
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'entries_by_type': entries_by_type,
            'knowledge_growth': knowledge_growth,
            'top_tags': top_tags,
            'agent_contributions': agent_contributions_data,
            'rating_distribution': rating_distribution_data,
            'tag_relationships': tag_relationships_data,
            'top_entries': formatted_top_entries
        })
    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

# Register template filters
@knowledge_bp.app_template_filter('format_date')
def template_format_date(timestamp):
    """Template filter to format dates"""
    return format_date(timestamp)

@knowledge_bp.app_template_filter('timestamp_to_date')
def timestamp_to_date(timestamp):
    """Template filter to convert timestamp to date"""
    if not timestamp:
        return "Unknown"
    try:
        return datetime.datetime.fromtimestamp(float(timestamp)).strftime('%b %d, %Y %H:%M')
    except (ValueError, TypeError):
        return "Invalid date"