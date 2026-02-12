import json
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Simulated user role map
USER_DB = {
    "CO\\jdoe": "Assessor",
    "CO\\mjohnson": "Staff",
    "CO\\bsmith": "ITAdmin",
    "CO\\tauditor": "Auditor"
}

ROLE_PERMISSIONS = {
    "Assessor": ["view", "approve", "diff"],
    "Staff": ["view", "upload"],
    "ITAdmin": ["view", "upload", "approve", "rollback", "export", "diff"],
    "Auditor": ["view", "diff"]
}

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if token not in USER_DB:
        raise HTTPException(status_code=403, detail="Unknown or unauthorized user token")
    username = token
    role = USER_DB[token]
    return {"username": username, "role": role}

def check_permission(action: str):
    def verifier(user=Depends(get_current_user)):
        if action not in ROLE_PERMISSIONS.get(user["role"], []):
            raise HTTPException(status_code=403, detail=f"Role '{user['role']}' not permitted for action '{action}'")
        return user
    return verifier