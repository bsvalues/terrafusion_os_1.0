"""
Template middleware for handling UI template selection.

This middleware allows for switching between the legacy UI and the new unified UI
during the transition period. It respects user preferences and URL parameters.
"""

from functools import wraps
from flask import request, session, g, render_template

def init_template_middleware(app):
    """Initialize template middleware for the Flask application."""
    
    # Before request handler to set template preference
    @app.before_request
    def set_template_preference():
        # Check for UI parameter in URL (?ui=unified or ?ui=legacy)
        ui_param = request.args.get('ui')
        
        if ui_param in ['unified', 'legacy']:
            # Store preference in session
            session['ui_template'] = ui_param
        
        # Set template preference in g for access in templates
        g.ui_template = session.get('ui_template', 'unified')
        
        # Log template preference for debugging
        app.logger.debug(f"Current UI template preference: {g.ui_template}")
    
    # Custom render template function that handles template switching
    def render_template_with_fallback(template_name, **context):
        """
        Render template with fallback to legacy template if needed.
        
        Args:
            template_name (str): Template name to render
            context (dict): Template rendering context
            
        Returns:
            str: Rendered template response
        """
        # Add UI template preference to context
        context['ui_template'] = g.ui_template
        
        # If using unified UI and template has a _modern version, try to use it first
        if g.ui_template == 'unified' and not template_name.endswith('_modern.html'):
            # Check if a _modern version exists
            new_template_name = template_name.replace('.html', '_modern.html')
            
            try:
                # Attempt to render new template
                app.logger.debug(f"Attempting to render new template: {new_template_name}")
                rendered = render_template(new_template_name, **context)
                app.logger.debug(f"Successfully rendered new template: {new_template_name}")
                return rendered
            except Exception as e:
                # Fallback to legacy template if new one doesn't exist
                app.logger.warning(f"New template {new_template_name} not found, falling back to {template_name}: {str(e)}")
                return render_template(template_name, **context)
        
        # Otherwise use requested template
        return render_template(template_name, **context)
    
    # Add custom render function to app
    app.jinja_env.globals['render_template_with_fallback'] = render_template_with_fallback
    
    return render_template_with_fallback

def template_preference_decorator(f):
    """
    Decorator to use template preference for route handlers.
    
    Example usage:
    
    @app.route('/monitoring/dashboard')
    @template_preference_decorator
    def monitoring_dashboard():
        # This will use render_template_with_fallback instead of render_template
        return render_template('monitoring_dashboard.html', **context)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Call the original function
        response = f(*args, **kwargs)
        
        # If response is a tuple and the first element is a string (template name)
        if isinstance(response, tuple) and isinstance(response[0], str):
            template_name = response[0]
            context = response[1] if len(response) > 1 else {}
            
            # Return with template fallback
            from flask import current_app
            return current_app.jinja_env.globals['render_template_with_fallback'](template_name, **context)
        
        return response
    
    return decorated_function