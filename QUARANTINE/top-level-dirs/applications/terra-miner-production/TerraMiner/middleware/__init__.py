"""
Middleware package for TerraMiner application.
"""

from middleware.template_middleware import init_template_middleware, template_preference_decorator

__all__ = ['init_template_middleware', 'template_preference_decorator']