"""
TerraFusion cOS Typography System
Professional typography configuration for government interfaces
"""

class TerraFusionTypography:
    """Typography configuration for TerraFusion cOS"""
    
    # Primary font stack
    PRIMARY_FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    
    # Secondary font stack (monospace for code/data)
    MONOSPACE_FONT = "'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', monospace"
    
    # Header font stack
    HEADER_FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    
    # Font sizes (in pixels)
    FONT_SIZES = {
        "xs": 10,
        "sm": 12,
        "base": 14,
        "lg": 16,
        "xl": 18,
        "2xl": 24,
        "3xl": 30,
        "4xl": 36,
        "5xl": 48,
        "6xl": 60
    }
    
    # Font weights
    FONT_WEIGHTS = {
        "light": 300,
        "normal": 400,
        "medium": 500,
        "semibold": 600,
        "bold": 700,
        "extrabold": 800
    }
    
    # Line heights
    LINE_HEIGHTS = {
        "tight": 1.25,
        "snug": 1.375,
        "normal": 1.5,
        "relaxed": 1.625,
        "loose": 2.0
    }
    
    # Letter spacing
    LETTER_SPACING = {
        "tighter": "-0.05em",
        "tight": "-0.025em",
        "normal": "0em",
        "wide": "0.025em",
        "wider": "0.05em",
        "widest": "0.1em"
    }
    
    @classmethod
    def get_font_config(cls, element_type: str) -> dict:
        """Get font configuration for specific UI elements"""
        configs = {
            "system_title": {
                "family": cls.HEADER_FONT,
                "size": cls.FONT_SIZES["4xl"],
                "weight": cls.FONT_WEIGHTS["bold"],
                "line_height": cls.LINE_HEIGHTS["tight"],
                "letter_spacing": cls.LETTER_SPACING["tight"]
            },
            "page_title": {
                "family": cls.HEADER_FONT,
                "size": cls.FONT_SIZES["3xl"],
                "weight": cls.FONT_WEIGHTS["semibold"],
                "line_height": cls.LINE_HEIGHTS["tight"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "section_header": {
                "family": cls.HEADER_FONT,
                "size": cls.FONT_SIZES["2xl"],
                "weight": cls.FONT_WEIGHTS["semibold"],
                "line_height": cls.LINE_HEIGHTS["snug"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "subsection_header": {
                "family": cls.HEADER_FONT,
                "size": cls.FONT_SIZES["xl"],
                "weight": cls.FONT_WEIGHTS["medium"],
                "line_height": cls.LINE_HEIGHTS["snug"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "body_text": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["base"],
                "weight": cls.FONT_WEIGHTS["normal"],
                "line_height": cls.LINE_HEIGHTS["relaxed"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "body_small": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["sm"],
                "weight": cls.FONT_WEIGHTS["normal"],
                "line_height": cls.LINE_HEIGHTS["normal"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "caption": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["xs"],
                "weight": cls.FONT_WEIGHTS["normal"],
                "line_height": cls.LINE_HEIGHTS["normal"],
                "letter_spacing": cls.LETTER_SPACING["wide"]
            },
            "button": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["base"],
                "weight": cls.FONT_WEIGHTS["medium"],
                "line_height": cls.LINE_HEIGHTS["tight"],
                "letter_spacing": cls.LETTER_SPACING["wide"]
            },
            "button_small": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["sm"],
                "weight": cls.FONT_WEIGHTS["medium"],
                "line_height": cls.LINE_HEIGHTS["tight"],
                "letter_spacing": cls.LETTER_SPACING["wide"]
            },
            "input": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["base"],
                "weight": cls.FONT_WEIGHTS["normal"],
                "line_height": cls.LINE_HEIGHTS["normal"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "code": {
                "family": cls.MONOSPACE_FONT,
                "size": cls.FONT_SIZES["sm"],
                "weight": cls.FONT_WEIGHTS["normal"],
                "line_height": cls.LINE_HEIGHTS["relaxed"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "code_block": {
                "family": cls.MONOSPACE_FONT,
                "size": cls.FONT_SIZES["sm"],
                "weight": cls.FONT_WEIGHTS["normal"],
                "line_height": cls.LINE_HEIGHTS["relaxed"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "data_display": {
                "family": cls.MONOSPACE_FONT,
                "size": cls.FONT_SIZES["base"],
                "weight": cls.FONT_WEIGHTS["normal"],
                "line_height": cls.LINE_HEIGHTS["normal"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "status_indicator": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["sm"],
                "weight": cls.FONT_WEIGHTS["semibold"],
                "line_height": cls.LINE_HEIGHTS["tight"],
                "letter_spacing": cls.LETTER_SPACING["wider"]
            },
            "metric_value": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["2xl"],
                "weight": cls.FONT_WEIGHTS["bold"],
                "line_height": cls.LINE_HEIGHTS["tight"],
                "letter_spacing": cls.LETTER_SPACING["normal"]
            },
            "metric_label": {
                "family": cls.PRIMARY_FONT,
                "size": cls.FONT_SIZES["sm"],
                "weight": cls.FONT_WEIGHTS["medium"],
                "line_height": cls.LINE_HEIGHTS["tight"],
                "letter_spacing": cls.LETTER_SPACING["wide"]
            }
        }
        
        return configs.get(element_type, configs["body_text"])
    
    @classmethod
    def get_tkinter_font(cls, element_type: str) -> tuple:
        """Get tkinter-compatible font tuple for UI elements"""
        config = cls.get_font_config(element_type)
        
        # Extract font family name (first option)
        font_family = config["family"].split(",")[0].strip().strip("'\"")
        
        # Convert weight to tkinter format
        weight_map = {
            300: "normal",
            400: "normal", 
            500: "normal",
            600: "bold",
            700: "bold",
            800: "bold"
        }
        weight = weight_map.get(config["weight"], "normal")
        
        return (font_family, config["size"], weight)
    
    @classmethod
    def get_all_fonts(cls) -> dict:
        """Get all typography configurations"""
        return {
            "fonts": {
                "primary": cls.PRIMARY_FONT,
                "monospace": cls.MONOSPACE_FONT,
                "header": cls.HEADER_FONT
            },
            "sizes": cls.FONT_SIZES,
            "weights": cls.FONT_WEIGHTS,
            "line_heights": cls.LINE_HEIGHTS,
            "letter_spacing": cls.LETTER_SPACING
        }