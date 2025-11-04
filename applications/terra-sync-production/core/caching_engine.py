"""
Intelligent Caching Engine
Provides high-performance caching with LRU eviction and cache warming
"""
import time
import threading
import logging
from typing import Any, Optional, Dict, Callable, Union
from collections import OrderedDict
import json
import hashlib
import pickle
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CacheStats:
    def __init__(self):
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        self.size = 0
        self.max_size = 0

class IntelligentCache:
    def __init__(self, max_size: int = 10000, default_ttl: int = 3600):
        self.max_size = max_size
        self.default_ttl = default_ttl
        self.cache: OrderedDict = OrderedDict()
        self.expiry_times: Dict[str, datetime] = {}
        self.access_counts: Dict[str, int] = {}
        self.stats = CacheStats()
        self.stats.max_size = max_size
        self._lock = threading.RLock()
        
        # Background cleanup thread
        self.cleanup_thread = threading.Thread(target=self._cleanup_expired, daemon=True)
        self.cleanup_thread.start()
        
        logger.info(f"Intelligent cache initialized with max_size={max_size}")

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        with self._lock:
            # Check if key exists and not expired
            if key in self.cache:
                if self._is_expired(key):
                    self._remove_key(key)
                    self.stats.misses += 1
                    return None
                
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                self.access_counts[key] = self.access_counts.get(key, 0) + 1
                self.stats.hits += 1
                return self.cache[key]
            
            self.stats.misses += 1
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache"""
        with self._lock:
            # Remove if already exists
            if key in self.cache:
                self._remove_key(key)
            
            # Evict if at capacity
            while len(self.cache) >= self.max_size:
                self._evict_lru()
            
            # Add new item
            self.cache[key] = value
            expiry_time = datetime.utcnow() + timedelta(seconds=ttl or self.default_ttl)
            self.expiry_times[key] = expiry_time
            self.access_counts[key] = 1
            self.stats.size = len(self.cache)

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        with self._lock:
            if key in self.cache:
                self._remove_key(key)
                return True
            return False

    def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self.cache.clear()
            self.expiry_times.clear()
            self.access_counts.clear()
            self.stats.size = 0

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            hit_rate = (self.stats.hits / max(self.stats.hits + self.stats.misses, 1)) * 100
            return {
                "hits": self.stats.hits,
                "misses": self.stats.misses,
                "hit_rate": round(hit_rate, 2),
                "evictions": self.stats.evictions,
                "size": self.stats.size,
                "max_size": self.stats.max_size,
                "memory_usage": f"{(self.stats.size / self.stats.max_size) * 100:.1f}%"
            }

    def _is_expired(self, key: str) -> bool:
        """Check if cache entry is expired"""
        expiry_time = self.expiry_times.get(key)
        return bool(expiry_time and datetime.utcnow() > expiry_time)

    def _remove_key(self, key: str) -> None:
        """Remove key and associated metadata"""
        if key in self.cache:
            del self.cache[key]
        if key in self.expiry_times:
            del self.expiry_times[key]
        if key in self.access_counts:
            del self.access_counts[key]
        self.stats.size = len(self.cache)

    def _evict_lru(self) -> None:
        """Evict least recently used item"""
        if self.cache:
            lru_key = next(iter(self.cache))
            self._remove_key(lru_key)
            self.stats.evictions += 1

    def _cleanup_expired(self):
        """Background thread to cleanup expired entries"""
        while True:
            try:
                time.sleep(60)  # Check every minute
                
                with self._lock:
                    expired_keys = [
                        key for key in self.expiry_times
                        if self._is_expired(key)
                    ]
                    
                    for key in expired_keys:
                        self._remove_key(key)
                    
                    if expired_keys:
                        logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")
                
            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}")

class CachingEngine:
    def __init__(self):
        self.caches: Dict[str, IntelligentCache] = {}
        self.default_cache = IntelligentCache()
        self.function_cache = IntelligentCache(max_size=5000, default_ttl=1800)
        
        # Predefined caches for different data types
        self.caches["queries"] = IntelligentCache(max_size=2000, default_ttl=600)
        self.caches["sessions"] = IntelligentCache(max_size=10000, default_ttl=3600)
        self.caches["api_responses"] = IntelligentCache(max_size=5000, default_ttl=300)
        self.caches["user_data"] = IntelligentCache(max_size=3000, default_ttl=1800)
        
        logger.info("Caching engine initialized with multiple cache types")

    def get_cache(self, cache_name: str = "default") -> IntelligentCache:
        """Get specific cache by name"""
        if cache_name == "default":
            return self.default_cache
        return self.caches.get(cache_name, self.default_cache)

    def cached(self, cache_name: str = "default", ttl: Optional[int] = None, 
              key_func: Optional[Callable] = None):
        """Decorator for caching function results"""
        def decorator(func: Callable):
            def wrapper(*args, **kwargs):
                # Generate cache key
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    cache_key = self._generate_cache_key(func.__name__, args, kwargs)
                
                # Try to get from cache
                cache = self.get_cache(cache_name)
                result = cache.get(cache_key)
                
                if result is not None:
                    return result
                
                # Execute function and cache result
                result = func(*args, **kwargs)
                cache.set(cache_key, result, ttl)
                return result
            
            return wrapper
        return decorator

    def cache_query_result(self, query: str, params: tuple, result: Any, ttl: int = 600):
        """Cache database query result"""
        cache_key = self._generate_query_key(query, params)
        self.caches["queries"].set(cache_key, result, ttl)

    def get_cached_query(self, query: str, params: tuple) -> Optional[Any]:
        """Get cached database query result"""
        cache_key = self._generate_query_key(query, params)
        return self.caches["queries"].get(cache_key)

    def warm_cache(self, cache_name: str, data_loader: Callable, keys: list):
        """Warm cache with pre-loaded data"""
        cache = self.get_cache(cache_name)
        
        for key in keys:
            try:
                data = data_loader(key)
                cache.set(str(key), data)
            except Exception as e:
                logger.error(f"Error warming cache for key {key}: {e}")
        
        logger.info(f"Warmed cache '{cache_name}' with {len(keys)} entries")

    def invalidate_pattern(self, cache_name: str, pattern: str):
        """Invalidate cache entries matching pattern"""
        cache = self.get_cache(cache_name)
        
        with cache._lock:
            keys_to_remove = [key for key in cache.cache.keys() if pattern in key]
            for key in keys_to_remove:
                cache._remove_key(key)
        
        logger.info(f"Invalidated {len(keys_to_remove)} cache entries matching '{pattern}'")

    def get_comprehensive_stats(self) -> Dict[str, Any]:
        """Get comprehensive caching statistics"""
        return self.get_global_stats()

    def get_global_stats(self) -> Dict[str, Any]:
        """Get statistics for all caches"""
        stats = {}
        
        stats["default"] = self.default_cache.get_stats()
        stats["function"] = self.function_cache.get_stats()
        
        for name, cache in self.caches.items():
            stats[name] = cache.get_stats()
        
        # Calculate global stats
        total_hits = sum(cache_stats["hits"] for cache_stats in stats.values())
        total_misses = sum(cache_stats["misses"] for cache_stats in stats.values())
        global_hit_rate = (total_hits / max(total_hits + total_misses, 1)) * 100
        
        stats["global"] = {
            "total_hits": total_hits,
            "total_misses": total_misses,
            "global_hit_rate": round(global_hit_rate, 2),
            "total_caches": len(stats)
        }
        
        return stats

    def _generate_cache_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """Generate unique cache key for function call"""
        key_data = {
            "function": func_name,
            "args": args,
            "kwargs": sorted(kwargs.items())
        }
        
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        return hashlib.md5(key_string.encode()).hexdigest()

    def _generate_query_key(self, query: str, params: tuple) -> str:
        """Generate unique cache key for database query"""
        key_data = f"{query}:{params}"
        return hashlib.md5(key_data.encode()).hexdigest()

# Global caching engine instance
caching_engine = None

def initialize_caching_engine():
    """Initialize the global caching engine"""
    global caching_engine
    caching_engine = CachingEngine()
    logger.info("Global caching engine initialized")

def get_caching_engine() -> Optional[CachingEngine]:
    """Get the global caching engine instance"""
    return caching_engine