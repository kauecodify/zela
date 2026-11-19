"""Configuracao de logging"""

import logging
import sys
from typing import Optional
from pythonjsonlogger import jsonlogger


def get_logger(name: str, json_format: bool = False) -> logging.Logger:
    """
    Retorna um logger configurado
    
    Args:
        name: Nome do logger
        json_format: Se True, formata logs em JSON
        
    Returns:
        Logger configurado
    """
    logger = logging.getLogger(name)
    
    # Evitar duplicacao de handlers
    if logger.handlers:
        return logger
    
    # Nivel de log
    level = logging.INFO
    
    # Formatter
    if json_format:
        formatter = jsonlogger.JsonFormatter(
            fmt='%(asctime)s %(levelname)s %(name)s %(message)s %(lineno)d %(pathname)s'
        )
    else:
        formatter = logging.Formatter(
            fmt='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    # Handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    # Nivel
    logger.setLevel(level)
    
    return logger
