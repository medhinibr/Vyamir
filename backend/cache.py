import os
import json
from datetime import datetime, timedelta
import redis

# Try connecting to Redis
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
redis_client = None

try:
    # Use decode_responses=True so we get string values instead of bytes
    redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2)
    # Ping to check connection
    redis_client.ping()
    print("Vyamir Cache: Stabilized connection to Redis server.", flush=True)
except Exception as e:
    print(f"Vyamir Cache: Redis offline/unavailable ({e}). Fallback to local memory matrix.", flush=True)
    redis_client = None

# Fallback local memory cache
_local_cache = {}

def get_cache(key):
    """
    Get a value from cache. Returns None if expired or not found.
    """
    if redis_client:
        try:
            val = redis_client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            print(f"Vyamir Cache Read Error (Redis): {e}", flush=True)
    
    # Local fallback
    if key in _local_cache:
        expire_time, data = _local_cache[key]
        if datetime.now() < expire_time:
            return data
        else:
            del _local_cache[key] # Clean up expired
    return None

def set_cache(key, value, expiry_seconds=900):
    """
    Set a value in the cache with a specified expiration time (seconds).
    """
    if redis_client:
        try:
            redis_client.setex(key, expiry_seconds, json.dumps(value))
            return True
        except Exception as e:
            print(f"Vyamir Cache Write Error (Redis): {e}", flush=True)
            
    # Local fallback
    expire_time = datetime.now() + timedelta(seconds=expiry_seconds)
    _local_cache[key] = (expire_time, value)
    return True
