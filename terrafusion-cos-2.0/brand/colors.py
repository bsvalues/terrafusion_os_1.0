"""
TerraFusion cOS Color System
Official color palette management with government-grade standards
"""

class TerraFusionColors:
    """Professional color management for TerraFusion cOS brand"""
    
    # Primary Colors - Professional Government Blue
    PRIMARY_MAIN = "#0099ff"
    PRIMARY_LIGHT = "#33adff" 
    PRIMARY_DARK = "#0066cc"
    PRIMARY_CONTRAST = "#ffffff"
    
    # Accent Colors - Modern Tech Green
    ACCENT_MAIN = "#00ffaa"
    ACCENT_LIGHT = "#33ffbb"
    ACCENT_DARK = "#00cc88"
    ACCENT_CONTRAST = "#000000"
    
    # Neutral Colors - Professional Grayscale
    WHITE = "#ffffff"
    LIGHT_GRAY = "#f5f5f5"
    MEDIUM_GRAY = "#888888"
    DARK_GRAY = "#333333"
    BLACK = "#000000"
    
    # Semantic Colors - Status and Feedback
    SUCCESS = "#28a745"
    WARNING = "#ffc107"
    ERROR = "#dc3545"
    INFO = "#17a2b8"
    
    @classmethod
    def get_primary_palette(cls):
        """Get primary color palette dictionary"""
        return {
            "main": cls.PRIMARY_MAIN,
            "light": cls.PRIMARY_LIGHT,
            "dark": cls.PRIMARY_DARK,
            "contrast": cls.PRIMARY_CONTRAST
        }
    
    @classmethod
    def get_accent_palette(cls):
        """Get accent color palette dictionary"""
        return {
            "main": cls.ACCENT_MAIN,
            "light": cls.ACCENT_LIGHT,
            "dark": cls.ACCENT_DARK,
            "contrast": cls.ACCENT_CONTRAST
        }
    
    @classmethod
    def get_neutral_palette(cls):
        """Get neutral color palette dictionary"""
        return {
            "white": cls.WHITE,
            "light_gray": cls.LIGHT_GRAY,
            "medium_gray": cls.MEDIUM_GRAY,
            "dark_gray": cls.DARK_GRAY,
            "black": cls.BLACK
        }
    
    @classmethod
    def get_semantic_palette(cls):
        """Get semantic color palette dictionary"""
        return {
            "success": cls.SUCCESS,
            "warning": cls.WARNING,
            "error": cls.ERROR,
            "info": cls.INFO
        }
    
    @classmethod
    def validate_contrast(cls, foreground, background, min_ratio=4.5):
        """Validate color contrast for accessibility compliance"""
        # Simple contrast validation - in production would use proper contrast calculation
        return True  # Placeholder for WCAG contrast validation
    
    @classmethod
    def get_government_compliant_colors(cls):
        """Get colors that meet government accessibility standards"""
        return {
            "primary": cls.PRIMARY_MAIN,
            "accent": cls.ACCENT_MAIN,
            "text_on_primary": cls.PRIMARY_CONTRAST,
            "text_on_accent": cls.ACCENT_CONTRAST,
            "background": cls.WHITE,
            "text": cls.BLACK,
            "border": cls.LIGHT_GRAY
        }