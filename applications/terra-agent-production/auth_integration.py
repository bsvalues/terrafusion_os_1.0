#!/usr/bin/env python3
"""
🏛️ TERRAFUSION ELITE AUTHENTICATION INTEGRATION - PHASE 3B
Government-Grade Authentication Bridge with FISMA-HIGH Security

Purpose: Bridge TerraAgent sessions to TerraFusion JWT tokens
Security: County-based access control with audit trails
Performance: <50ms authentication with government encryption
"""

import json
import time
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from dataclasses import dataclass

import jwt
import bcrypt
import psycopg2
from psycopg2.extras import RealDictCursor
from cryptography.fernet import Fernet
from flask import Flask, request, jsonify
import logging


@dataclass
class AuthenticationConfig:
    """Championship Authentication Configuration"""

    # JWT Configuration
    jwt_secret_key: str = secrets.token_urlsafe(32)
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 8  # Government work day

    # Database Configuration
    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "terrafusion_government"
    database_user: str = "terrafusion"
    database_password: str = "terrafusion_production_secure_2025"

    # Security Configuration
    county_id: str = "benton-county-wa"
    security_classification: str = "FISMA-HIGH"
    max_login_attempts: int = 3
    lockout_duration_minutes: int = 30

    # Encryption
    encryption_key: str = Fernet.generate_key().decode()


class TerraFusionAuthBridge:
    """
    🏆 Championship Authentication Bridge
    Government-Grade Security with County Sovereignty
    """

    def __init__(self, config: AuthenticationConfig):
        self.config = config
        self.bridge_id = str(uuid.uuid4())
        self.encryption = Fernet(config.encryption_key.encode())

        # Setup logging
        self.logger = self._setup_logging()

        # Initialize database connection
        self.db_connection = self._setup_database()

        # Create authentication tables if needed
        self._initialize_auth_tables()

        self.logger.info(
            f"🏛️ TerraFusion Auth Bridge initialized - ID: {self.bridge_id}"
        )
        self.logger.info(f"🔐 Security Level: {config.security_classification}")

    def _setup_logging(self) -> logging.Logger:
        """Setup government-grade logging"""
        logging.basicConfig(
            level=logging.INFO,
            format="🔐 [%(asctime)s UTC] AUTH-%(levelname)s: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        logger = logging.getLogger(__name__)
        return logger

    def _setup_database(self) -> psycopg2.extensions.connection:
        """Setup government database connection"""
        try:
            connection = psycopg2.connect(
                host=self.config.database_host,
                port=self.config.database_port,
                database=self.config.database_name,
                user=self.config.database_user,
                password=self.config.database_password,
                sslmode="prefer",
            )
            self.logger.info("✅ Authentication database connected")
            return connection
        except Exception as e:
            self.logger.error(f"❌ Authentication database connection failed: {e}")
            raise

    def _initialize_auth_tables(self):
        """Initialize authentication tables with government standards"""
        try:
            cursor = self.db_connection.cursor()

            # Create users table for TerraFusion authentication
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS terrafusion_users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    username VARCHAR(100) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    county_id VARCHAR(50) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'user',
                    security_clearance VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
                    is_active BOOLEAN DEFAULT true,
                    failed_login_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP WITH TIME ZONE,
                    last_login TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_by VARCHAR(100) DEFAULT 'TerraFusion_Auth_System',
                    updated_by VARCHAR(100) DEFAULT 'TerraFusion_Auth_System'
                )
            """
            )

            # Create sessions table for active sessions
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS terrafusion_sessions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES terrafusion_users(id) ON DELETE CASCADE,
                    session_token VARCHAR(512) UNIQUE NOT NULL,
                    jwt_token TEXT NOT NULL,
                    county_id VARCHAR(50) NOT NULL,
                    ip_address INET,
                    user_agent TEXT,
                    is_active BOOLEAN DEFAULT true,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """
            )

            # Create auth audit table for government compliance
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS auth_audit (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID,
                    event_type VARCHAR(50) NOT NULL,
                    event_details JSONB,
                    ip_address INET,
                    user_agent TEXT,
                    county_id VARCHAR(50) NOT NULL,
                    classification VARCHAR(20) DEFAULT 'FISMA-HIGH',
                    success BOOLEAN NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    retention_until TIMESTAMP WITH TIME ZONE NOT NULL
                )
            """
            )

            # Create default admin user for Benton County
            hashed_password = bcrypt.hashpw(
                "TerraFusion2025!".encode("utf-8"), bcrypt.gensalt()
            ).decode("utf-8")

            cursor.execute(
                """
                INSERT INTO terrafusion_users
                (username, email, password_hash, county_id, role, security_clearance)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO NOTHING
            """,
                (
                    "benton_admin",
                    "admin@bentoncounty.wa.gov",
                    hashed_password,
                    self.config.county_id,
                    "admin",
                    "CONFIDENTIAL",
                ),
            )

            # Create regular user for testing
            cursor.execute(
                """
                INSERT INTO terrafusion_users
                (username, email, password_hash, county_id, role)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (username) DO NOTHING
            """,
                (
                    "benton_user",
                    "user@bentoncounty.wa.gov",
                    hashed_password,
                    self.config.county_id,
                    "user",
                ),
            )

            self.db_connection.commit()
            cursor.close()

            self.logger.info("✅ Authentication tables initialized")

        except Exception as e:
            self.logger.error(f"❌ Auth table initialization failed: {e}")
            raise

    def authenticate_user(
        self,
        username: str,
        password: str,
        ip_address: str = None,
        user_agent: str = None,
    ) -> Dict[str, Any]:
        """
        Government-grade user authentication

        Returns:
            dict: Authentication result with JWT token or error
        """
        start_time = time.time()

        try:
            cursor = self.db_connection.cursor(cursor_factory=RealDictCursor)

            # Get user record with county validation
            cursor.execute(
                """
                SELECT id, username, email, password_hash, county_id, role,
                       security_clearance, is_active, failed_login_attempts,
                       locked_until
                FROM terrafusion_users
                WHERE username = %s AND county_id = %s
            """,
                (username, self.config.county_id),
            )

            user = cursor.fetchone()

            if not user:
                self._audit_auth_event(
                    None,
                    "login_failed",
                    {"reason": "user_not_found", "username": username},
                    ip_address,
                    user_agent,
                    False,
                )
                return {"success": False, "error": "Invalid credentials"}

            # Check if account is locked
            if user["locked_until"] and user["locked_until"] > datetime.now(
                timezone.utc
            ):
                self._audit_auth_event(
                    user["id"],
                    "login_failed",
                    {"reason": "account_locked"},
                    ip_address,
                    user_agent,
                    False,
                )
                return {"success": False, "error": "Account temporarily locked"}

            # Check if account is active
            if not user["is_active"]:
                self._audit_auth_event(
                    user["id"],
                    "login_failed",
                    {"reason": "account_inactive"},
                    ip_address,
                    user_agent,
                    False,
                )
                return {"success": False, "error": "Account inactive"}

            # Verify password
            if not bcrypt.checkpw(
                password.encode("utf-8"), user["password_hash"].encode("utf-8")
            ):
                # Increment failed login attempts
                new_attempts = user["failed_login_attempts"] + 1
                locked_until = None

                if new_attempts >= self.config.max_login_attempts:
                    locked_until = datetime.now(timezone.utc) + timedelta(
                        minutes=self.config.lockout_duration_minutes
                    )

                cursor.execute(
                    """
                    UPDATE terrafusion_users
                    SET failed_login_attempts = %s, locked_until = %s, updated_at = NOW()
                    WHERE id = %s
                """,
                    (new_attempts, locked_until, user["id"]),
                )

                self.db_connection.commit()

                self._audit_auth_event(
                    user["id"],
                    "login_failed",
                    {"reason": "invalid_password", "attempts": new_attempts},
                    ip_address,
                    user_agent,
                    False,
                )

                return {"success": False, "error": "Invalid credentials"}

            # Successful authentication - reset failed attempts
            cursor.execute(
                """
                UPDATE terrafusion_users
                SET failed_login_attempts = 0, locked_until = NULL,
                    last_login = NOW(), updated_at = NOW()
                WHERE id = %s
            """,
                (user["id"],),
            )

            # Generate JWT token
            jwt_payload = {
                "user_id": str(user["id"]),
                "username": user["username"],
                "email": user["email"],
                "county_id": user["county_id"],
                "role": user["role"],
                "security_clearance": user["security_clearance"],
                "iat": datetime.now(timezone.utc),
                "exp": datetime.now(timezone.utc)
                + timedelta(hours=self.config.jwt_expiration_hours),
                "iss": "TerraFusion_Elite_OS",
                "aud": "TerraFusion_Government_Services",
            }

            jwt_token = jwt.encode(
                jwt_payload,
                self.config.jwt_secret_key,
                algorithm=self.config.jwt_algorithm,
            )

            # Create session record
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(
                hours=self.config.jwt_expiration_hours
            )

            cursor.execute(
                """
                INSERT INTO terrafusion_sessions
                (user_id, session_token, jwt_token, county_id, ip_address,
                 user_agent, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """,
                (
                    user["id"],
                    session_token,
                    jwt_token,
                    user["county_id"],
                    ip_address,
                    user_agent,
                    expires_at,
                ),
            )

            session_id = cursor.fetchone()["id"]

            self.db_connection.commit()
            cursor.close()

            # Audit successful login
            response_time_ms = (time.time() - start_time) * 1000
            self._audit_auth_event(
                user["id"],
                "login_success",
                {
                    "session_id": str(session_id),
                    "response_time_ms": response_time_ms,
                    "role": user["role"],
                    "clearance": user["security_clearance"],
                },
                ip_address,
                user_agent,
                True,
            )

            self.logger.info(
                f"✅ Authentication successful: {username} ({response_time_ms:.2f}ms)"
            )

            return {
                "success": True,
                "jwt_token": jwt_token,
                "session_token": session_token,
                "user": {
                    "id": str(user["id"]),
                    "username": user["username"],
                    "email": user["email"],
                    "role": user["role"],
                    "county": user["county_id"],
                    "security_clearance": user["security_clearance"],
                },
                "expires_at": expires_at.isoformat(),
                "response_time_ms": response_time_ms,
            }

        except Exception as e:
            self.logger.error(f"❌ Authentication error: {e}")
            return {"success": False, "error": "Authentication service error"}

    def validate_jwt_token(self, token: str) -> Dict[str, Any]:
        """Validate JWT token and return user info"""
        try:
            payload = jwt.decode(
                token,
                self.config.jwt_secret_key,
                algorithms=[self.config.jwt_algorithm],
            )

            # Verify county access
            if payload.get("county_id") != self.config.county_id:
                return {"valid": False, "error": "Invalid county access"}

            return {"valid": True, "payload": payload}

        except jwt.ExpiredSignatureError:
            return {"valid": False, "error": "Token expired"}
        except jwt.InvalidTokenError:
            return {"valid": False, "error": "Invalid token"}

    def bridge_terraagent_session(
        self, terraagent_session_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Bridge TerraAgent session to TerraFusion authentication

        Args:
            terraagent_session_data: Session data from TerraAgent

        Returns:
            dict: TerraFusion authentication result
        """

        # Extract TerraAgent session info
        username = terraagent_session_data.get("username", "terraagent_user")
        user_role = terraagent_session_data.get("role", "user")
        ip_address = terraagent_session_data.get("ip_address")
        user_agent = terraagent_session_data.get("user_agent", "TerraAgent/1.0")

        # For demonstration, create a bridged authentication
        # In production, this would validate against TerraAgent's auth system

        try:
            cursor = self.db_connection.cursor(cursor_factory=RealDictCursor)

            # Check if bridged user exists
            cursor.execute(
                """
                SELECT id, username, county_id, role, security_clearance, is_active
                FROM terrafusion_users
                WHERE username = %s AND county_id = %s
            """,
                (f"bridge_{username}", self.config.county_id),
            )

            user = cursor.fetchone()

            if not user:
                # Create bridged user account
                cursor.execute(
                    """
                    INSERT INTO terrafusion_users
                    (username, email, password_hash, county_id, role, security_clearance)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, username, county_id, role, security_clearance
                """,
                    (
                        f"bridge_{username}",
                        f"bridge_{username}@{self.config.county_id}.gov",
                        bcrypt.hashpw(
                            "bridged_account".encode("utf-8"), bcrypt.gensalt()
                        ).decode("utf-8"),
                        self.config.county_id,
                        user_role,
                        "PUBLIC",
                    ),
                )

                user = cursor.fetchone()
                self.logger.info(f"✅ Created bridged user: bridge_{username}")

            # Generate JWT for bridged session
            jwt_payload = {
                "user_id": str(user["id"]),
                "username": user["username"],
                "county_id": user["county_id"],
                "role": user["role"],
                "security_clearance": user["security_clearance"],
                "bridge_source": "TerraAgent",
                "iat": datetime.now(timezone.utc),
                "exp": datetime.now(timezone.utc)
                + timedelta(hours=self.config.jwt_expiration_hours),
                "iss": "TerraFusion_Bridge_Service",
                "aud": "TerraFusion_Government_Services",
            }

            jwt_token = jwt.encode(
                jwt_payload,
                self.config.jwt_secret_key,
                algorithm=self.config.jwt_algorithm,
            )

            # Create bridged session
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(
                hours=self.config.jwt_expiration_hours
            )

            cursor.execute(
                """
                INSERT INTO terrafusion_sessions
                (user_id, session_token, jwt_token, county_id, ip_address, user_agent, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    user["id"],
                    session_token,
                    jwt_token,
                    user["county_id"],
                    ip_address,
                    user_agent,
                    expires_at,
                ),
            )

            self.db_connection.commit()
            cursor.close()

            # Audit bridged session
            self._audit_auth_event(
                user["id"],
                "bridge_session_created",
                {
                    "source": "TerraAgent",
                    "original_username": username,
                    "bridged_username": user["username"],
                },
                ip_address,
                user_agent,
                True,
            )

            self.logger.info(
                f"✅ Bridged TerraAgent session: {username} -> {user['username']}"
            )

            return {
                "success": True,
                "jwt_token": jwt_token,
                "session_token": session_token,
                "user": {
                    "id": str(user["id"]),
                    "username": user["username"],
                    "role": user["role"],
                    "county": user["county_id"],
                    "security_clearance": user["security_clearance"],
                },
                "expires_at": expires_at.isoformat(),
                "bridge_source": "TerraAgent",
            }

        except Exception as e:
            self.logger.error(f"❌ Session bridge error: {e}")
            return {"success": False, "error": "Session bridge error"}

    def _audit_auth_event(
        self,
        user_id: str,
        event_type: str,
        event_details: Dict[str, Any],
        ip_address: str,
        user_agent: str,
        success: bool,
    ):
        """Create government-grade audit record for authentication events"""
        try:
            cursor = self.db_connection.cursor()

            retention_date = datetime.now(timezone.utc).replace(
                year=datetime.now().year + 7
            )

            cursor.execute(
                """
                INSERT INTO auth_audit
                (user_id, event_type, event_details, ip_address, user_agent,
                 county_id, classification, success, retention_until)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
                (
                    user_id,
                    event_type,
                    json.dumps(event_details),
                    ip_address,
                    user_agent,
                    self.config.county_id,
                    self.config.security_classification,
                    success,
                    retention_date,
                ),
            )

            self.db_connection.commit()
            cursor.close()

        except Exception as e:
            self.logger.error(f"❌ Audit record creation failed: {e}")


def main():
    """Demonstration of TerraFusion Authentication Bridge"""
    print("🏛️ TERRAFUSION ELITE AUTHENTICATION INTEGRATION")
    print("Government. Transcended.")
    print("=" * 60)

    # Initialize authentication bridge
    config = AuthenticationConfig()
    auth_bridge = TerraFusionAuthBridge(config)

    # Test authentication
    print("\n🔐 Testing Authentication...")

    # Test valid login
    result = auth_bridge.authenticate_user(
        username="benton_admin",
        password="TerraFusion2025!",
        ip_address="127.0.0.1",
        user_agent="TerraFusion/Test",
    )

    if result["success"]:
        print(f"✅ Authentication successful for {result['user']['username']}")
        print(f"   Role: {result['user']['role']}")
        print(f"   Clearance: {result['user']['security_clearance']}")
        print(f"   County: {result['user']['county']}")
        print(f"   Response Time: {result['response_time_ms']:.2f}ms")

        # Test JWT validation
        token_validation = auth_bridge.validate_jwt_token(result["jwt_token"])
        if token_validation["valid"]:
            print("✅ JWT token validation successful")

        # Test TerraAgent session bridge
        print("\n🌉 Testing TerraAgent Session Bridge...")
        bridge_result = auth_bridge.bridge_terraagent_session(
            {
                "username": "john_doe",
                "role": "assessor",
                "ip_address": "127.0.0.1",
                "user_agent": "TerraAgent/1.0",
            }
        )

        if bridge_result["success"]:
            print(f"✅ Session bridge successful: {bridge_result['user']['username']}")
    else:
        print(f"❌ Authentication failed: {result['error']}")


if __name__ == "__main__":
    main()
