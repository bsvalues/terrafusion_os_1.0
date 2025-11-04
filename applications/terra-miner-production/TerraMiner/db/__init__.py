# This file makes the 'db' directory a Python package
import logging
from core import db

logger = logging.getLogger(__name__)
logger.info("DB module imported successfully")
