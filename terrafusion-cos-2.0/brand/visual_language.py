"""
TerraFusion cOS Visual Language System
Professional visual design language for government interfaces
"""

from typing import Dict, Any, Tuple
from .colors import TerraFusionColors
from .typography import TerraFusionTypography

class TerraFusionVisualLanguage:
    """Visual design language for TerraFusion cOS"""
    
    # Spacing scale (in pixels)
    SPACING = {
        "xs": 4,
        "sm": 8,
        "md": 16,
        "lg": 24,
        "xl": 32,
        "2xl": 48,
        "3xl": 64,
        "4xl": 96
    }
    
    # Border radius values
    BORDER_RADIUS = {
        "none": 0,
        "sm": 2,
        "md": 4,
        "lg": 8,
        "xl": 12,
        "2xl": 16,
        "full": 9999
    }
    
    # Shadow definitions
    SHADOWS = {
        "none": "none",
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        "inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"
    }
    
    # Border weights
    BORDER_WEIGHTS = {
        "none": 0,
        "thin": 1,
        "medium": 2,
        "thick": 4,
        "heavy": 8
    }
    
    # Animation durations (in milliseconds)
    ANIMATION_DURATION = {
        "fast": 150,
        "normal": 300,
        "slow": 500,
        "slower": 750
    }
    
    # Z-index layers
    Z_INDEX = {
        "base": 0,
        "dropdown": 1000,
        "sticky": 1020,
        "fixed": 1030,
        "modal_backdrop": 1040,
        "modal": 1050,
        "popover": 1060,
        "tooltip": 1070,
        "system_notification": 1080
    }
    
    @classmethod
    def get_component_style(cls, component_type: str, variant: str = "primary") -> Dict[str, Any]:
        """Get complete component styling"""
        styles = {
            "button": {
                "primary": {
                    "background_color": TerraFusionColors.PRIMARY["main"],
                    "text_color": TerraFusionColors.PRIMARY["contrast"],
                    "border_radius": cls.BORDER_RADIUS["md"],
                    "padding": f"{cls.SPACING['sm']}px {cls.SPACING['md']}px",
                    "font": TerraFusionTypography.get_tkinter_font("button"),
                    "border": f"{cls.BORDER_WEIGHTS['thin']}px solid {TerraFusionColors.PRIMARY['main']}",
                    "shadow": cls.SHADOWS["sm"],
                    "hover_background": TerraFusionColors.PRIMARY["dark"],
                    "active_background": TerraFusionColors.PRIMARY["darker"]
                },
                "secondary": {
                    "background_color": TerraFusionColors.NEUTRAL["white"],
                    "text_color": TerraFusionColors.PRIMARY["main"],
                    "border_radius": cls.BORDER_RADIUS["md"],
                    "padding": f"{cls.SPACING['sm']}px {cls.SPACING['md']}px",
                    "font": TerraFusionTypography.get_tkinter_font("button"),
                    "border": f"{cls.BORDER_WEIGHTS['thin']}px solid {TerraFusionColors.PRIMARY['main']}",
                    "shadow": cls.SHADOWS["sm"],
                    "hover_background": TerraFusionColors.PRIMARY["lightest"],
                    "active_background": TerraFusionColors.PRIMARY["lighter"]
                },
                "accent": {
                    "background_color": TerraFusionColors.ACCENT["main"],
                    "text_color": TerraFusionColors.ACCENT["contrast"],
                    "border_radius": cls.BORDER_RADIUS["md"],
                    "padding": f"{cls.SPACING['sm']}px {cls.SPACING['md']}px",
                    "font": TerraFusionTypography.get_tkinter_font("button"),
                    "border": f"{cls.BORDER_WEIGHTS['thin']}px solid {TerraFusionColors.ACCENT['main']}",
                    "shadow": cls.SHADOWS["sm"],
                    "hover_background": TerraFusionColors.ACCENT["dark"],
                    "active_background": TerraFusionColors.ACCENT["darker"]
                }
            },
            "card": {
                "default": {
                    "background_color": TerraFusionColors.NEUTRAL["white"],
                    "border_radius": cls.BORDER_RADIUS["lg"],
                    "padding": cls.SPACING["lg"],
                    "border": f"{cls.BORDER_WEIGHTS['thin']}px solid {TerraFusionColors.NEUTRAL['200']}",
                    "shadow": cls.SHADOWS["md"]
                },
                "elevated": {
                    "background_color": TerraFusionColors.NEUTRAL["white"],
                    "border_radius": cls.BORDER_RADIUS["lg"],
                    "padding": cls.SPACING["lg"],
                    "border": "none",
                    "shadow": cls.SHADOWS["lg"]
                }
            },
            "input": {
                "default": {
                    "background_color": TerraFusionColors.NEUTRAL["white"],
                    "text_color": TerraFusionColors.NEUTRAL["900"],
                    "border_radius": cls.BORDER_RADIUS["md"],
                    "padding": f"{cls.SPACING['sm']}px {cls.SPACING['md']}px",
                    "font": TerraFusionTypography.get_tkinter_font("input"),
                    "border": f"{cls.BORDER_WEIGHTS['thin']}px solid {TerraFusionColors.NEUTRAL['300']}",
                    "focus_border": f"{cls.BORDER_WEIGHTS['medium']}px solid {TerraFusionColors.PRIMARY['main']}",
                    "placeholder_color": TerraFusionColors.NEUTRAL["500"]
                },
                "error": {
                    "background_color": TerraFusionColors.NEUTRAL["white"],
                    "text_color": TerraFusionColors.NEUTRAL["900"],
                    "border_radius": cls.BORDER_RADIUS["md"],
                    "padding": f"{cls.SPACING['sm']}px {cls.SPACING['md']}px",
                    "font": TerraFusionTypography.get_tkinter_font("input"),
                    "border": f"{cls.BORDER_WEIGHTS['medium']}px solid {TerraFusionColors.SEMANTIC['error']}",
                    "focus_border": f"{cls.BORDER_WEIGHTS['medium']}px solid {TerraFusionColors.SEMANTIC['error']}",
                    "placeholder_color": TerraFusionColors.NEUTRAL["500"]
                }
            },
            "panel": {
                "default": {
                    "background_color": TerraFusionColors.NEUTRAL["50"],
                    "border_radius": cls.BORDER_RADIUS["lg"],
                    "padding": cls.SPACING["lg"],
                    "border": f"{cls.BORDER_WEIGHTS['thin']}px solid {TerraFusionColors.NEUTRAL['200']}"
                },
                "primary": {
                    "background_color": TerraFusionColors.PRIMARY["lightest"],
                    "border_radius": cls.BORDER_RADIUS["lg"],
                    "padding": cls.SPACING["lg"],
                    "border": f"{cls.BORDER_WEIGHTS['thin']}px solid {TerraFusionColors.PRIMARY['light']}"
                }
            },
            "header": {
                "main": {
                    "background_color": TerraFusionColors.PRIMARY["main"],
                    "text_color": TerraFusionColors.PRIMARY["contrast"],
                    "padding": f"{cls.SPACING['md']}px {cls.SPACING['lg']}px",
                    "font": TerraFusionTypography.get_tkinter_font("page_title"),
                    "shadow": cls.SHADOWS["sm"]
                },
                "section": {
                    "background_color": TerraFusionColors.NEUTRAL["100"],
                    "text_color": TerraFusionColors.NEUTRAL["900"],
                    "padding": f"{cls.SPACING['sm']}px {cls.SPACING['md']}px",
                    "font": TerraFusionTypography.get_tkinter_font("section_header"),
                    "border_bottom": f"{cls.BORDER_WEIGHTS['thin']}px solid {TerraFusionColors.NEUTRAL['200']}"
                }
            },
            "status_indicator": {
                "success": {
                    "background_color": TerraFusionColors.SEMANTIC["success"],
                    "text_color": TerraFusionColors.NEUTRAL["white"],
                    "border_radius": cls.BORDER_RADIUS["full"],
                    "padding": f"{cls.SPACING['xs']}px {cls.SPACING['sm']}px",
                    "font": TerraFusionTypography.get_tkinter_font("status_indicator")
                },
                "warning": {
                    "background_color": TerraFusionColors.SEMANTIC["warning"],
                    "text_color": TerraFusionColors.NEUTRAL["900"],
                    "border_radius": cls.BORDER_RADIUS["full"],
                    "padding": f"{cls.SPACING['xs']}px {cls.SPACING['sm']}px",
                    "font": TerraFusionTypography.get_tkinter_font("status_indicator")
                },
                "error": {
                    "background_color": TerraFusionColors.SEMANTIC["error"],
                    "text_color": TerraFusionColors.NEUTRAL["white"],
                    "border_radius": cls.BORDER_RADIUS["full"],
                    "padding": f"{cls.SPACING['xs']}px {cls.SPACING['sm']}px",
                    "font": TerraFusionTypography.get_tkinter_font("status_indicator")
                },
                "info": {
                    "background_color": TerraFusionColors.PRIMARY["main"],
                    "text_color": TerraFusionColors.PRIMARY["contrast"],
                    "border_radius": cls.BORDER_RADIUS["full"],
                    "padding": f"{cls.SPACING['xs']}px {cls.SPACING['sm']}px",
                    "font": TerraFusionTypography.get_tkinter_font("status_indicator")
                }
            }
        }
        
        return styles.get(component_type, {}).get(variant, {})
    
    @classmethod
    def get_layout_grid(cls) -> Dict[str, int]:
        """Get grid system configuration"""
        return {
            "columns": 12,
            "gutter": cls.SPACING["md"],
            "margin": cls.SPACING["lg"],
            "max_width": 1200,
            "breakpoints": {
                "sm": 640,
                "md": 768,
                "lg": 1024,
                "xl": 1280,
                "2xl": 1536
            }
        }
    
    @classmethod
    def get_icon_sizes(cls) -> Dict[str, int]:
        """Get standard icon sizes"""
        return {
            "xs": 12,
            "sm": 16,
            "md": 20,
            "lg": 24,
            "xl": 32,
            "2xl": 48
        }
    
    @classmethod
    def get_government_theme(cls) -> Dict[str, Any]:
        """Get government-specific theme configuration"""
        return {
            "accessibility": {
                "contrast_ratio_minimum": 4.5,
                "focus_outline_width": cls.BORDER_WEIGHTS["medium"],
                "focus_outline_color": TerraFusionColors.ACCENT["main"],
                "focus_outline_offset": 2
            },
            "security_indicators": {
                "secure_connection": TerraFusionColors.SEMANTIC["success"],
                "warning_level": TerraFusionColors.SEMANTIC["warning"],
                "alert_level": TerraFusionColors.SEMANTIC["error"],
                "classification_colors": {
                    "unclassified": TerraFusionColors.NEUTRAL["600"],
                    "cui": TerraFusionColors.PRIMARY["main"],
                    "confidential": TerraFusionColors.SEMANTIC["warning"],
                    "secret": TerraFusionColors.SEMANTIC["error"]
                }
            },
            "compliance_visual_cues": {
                "fisma_compliant": TerraFusionColors.SEMANTIC["success"],
                "fedramp_authorized": TerraFusionColors.PRIMARY["main"],
                "nist_aligned": TerraFusionColors.ACCENT["main"],
                "audit_required": TerraFusionColors.SEMANTIC["warning"]
            }
        }
    
    @classmethod
    def get_motion_preferences(cls) -> Dict[str, Any]:
        """Get animation and motion design preferences"""
        return {
            "preferred_reduced_motion": False,
            "transitions": {
                "fast": f"{cls.ANIMATION_DURATION['fast']}ms ease-out",
                "normal": f"{cls.ANIMATION_DURATION['normal']}ms ease-in-out",
                "slow": f"{cls.ANIMATION_DURATION['slow']}ms ease-in-out"
            },
            "hover_effects": {
                "scale": 1.02,
                "opacity_change": 0.1,
                "transition": f"{cls.ANIMATION_DURATION['fast']}ms ease-out"
            },
            "loading_animations": {
                "spinner_duration": f"{cls.ANIMATION_DURATION['normal']}ms",
                "pulse_duration": f"{cls.ANIMATION_DURATION['slow']}ms",
                "fade_duration": f"{cls.ANIMATION_DURATION['normal']}ms"
            }
        }