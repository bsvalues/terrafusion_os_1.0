from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import sqlite3
from datetime import datetime, timedelta
import secrets
import pyotp
import qrcode
from io import BytesIO
import base64

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(32)

class UserManagementSystem:
    def __init__(self):
        self.setup_database()
        self.create_default_users()
    
    def setup_database(self):
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name VARCHAR(100),
                department VARCHAR(50),
                role VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                mfa_secret TEXT,
                mfa_enabled BOOLEAN DEFAULT 0,
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                session_id TEXT PRIMARY KEY,
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action VARCHAR(100),
                resource VARCHAR(100),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users (user_id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def create_default_users(self):
        """Create default Benton County user accounts"""
        default_users = [
            {
                'username': 'admin',
                'email': 'admin@bentoncounty.wa.gov',
                'password': 'BentonAdmin2025!',
                'full_name': 'System Administrator',
                'department': 'IT',
                'role': 'EXECUTIVE'
            },
            {
                'username': 'assessor.chief',
                'email': 'assessor@bentoncounty.wa.gov',
                'password': 'AssessorChief2025!',
                'full_name': 'Chief Assessor',
                'department': 'Assessment',
                'role': 'ASSESSOR'
            },
            {
                'username': 'gis.analyst',
                'email': 'gis@bentoncounty.wa.gov',
                'password': 'GISAnalyst2025!',
                'full_name': 'GIS Analyst',
                'department': 'GIS',
                'role': 'GIS_ANALYST'
            },
            {
                'username': 'permit.manager',
                'email': 'permits@bentoncounty.wa.gov',
                'password': 'PermitMgr2025!',
                'full_name': 'Permit Manager',
                'department': 'Building',
                'role': 'PERMIT_CLERK'
            }
        ]
        
        for user_data in default_users:
            try:
                self.create_user(**user_data)
            except:
                pass  # User already exists
    
    def create_user(self, username, email, password, full_name, department, role):
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        password_hash = generate_password_hash(password)
        mfa_secret = pyotp.random_base32()
        
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, full_name, department, role, mfa_secret)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (username, email, password_hash, full_name, department, role, mfa_secret))
            
            user_id = cursor.lastrowid
            conn.commit()
            
            qr_code = self.generate_mfa_qr_code(username, mfa_secret)
            
            return {
                'user_id': user_id,
                'username': username,
                'mfa_qr_code': qr_code,
                'message': 'User created successfully'
            }
            
        except sqlite3.IntegrityError:
            return {'error': 'Username or email already exists'}
        finally:
            conn.close()
    
    def generate_mfa_qr_code(self, username, secret):
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=username,
            issuer_name="TerraFusion Benton County"
        )
        
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def authenticate_user(self, username, password, mfa_token=None):
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id, password_hash, mfa_secret, mfa_enabled, role, is_active, full_name
            FROM users WHERE username = ?
        ''', (username,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user or not user[5]:
            return {'error': 'Invalid credentials'}
        
        user_id, password_hash, mfa_secret, mfa_enabled, role, is_active, full_name = user
        
        if not check_password_hash(password_hash, password):
            return {'error': 'Invalid credentials'}
        
        if mfa_enabled and mfa_token:
            totp = pyotp.TOTP(mfa_secret)
            if not totp.verify(mfa_token):
                return {'error': 'Invalid MFA token'}
        
        token = jwt.encode({
            'user_id': user_id,
            'username': username,
            'role': role,
            'full_name': full_name,
            'exp': datetime.utcnow() + timedelta(hours=8)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        self.update_last_login(user_id)
        
        return {
            'token': token,
            'user_id': user_id,
            'username': username,
            'role': role,
            'full_name': full_name
        }
    
    def update_last_login(self, user_id):
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?
        ''', (user_id,))
        conn.commit()
        conn.close()

ROLE_PERMISSIONS = {
    'EXECUTIVE': ['VIEW_ALL', 'EDIT_ALL', 'DELETE_ALL', 'ADMIN_ACCESS'],
    'ASSESSOR': ['VIEW_PROPERTIES', 'EDIT_PROPERTIES', 'VIEW_PERMITS', 'EDIT_ASSESSMENTS'],
    'GIS_ANALYST': ['VIEW_PROPERTIES', 'EDIT_GIS', 'VIEW_PERMITS', 'EXPORT_DATA'],
    'PERMIT_CLERK': ['VIEW_PERMITS', 'EDIT_PERMITS', 'VIEW_PROPERTIES'],
    'VIEWER': ['VIEW_PROPERTIES', 'VIEW_PERMITS']
}

def require_permission(permission):
    def decorator(f):
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'Token required'}), 401
            
            try:
                token = token.split(' ')[1]
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                user_role = payload['role']
                
                if permission not in ROLE_PERMISSIONS.get(user_role, []):
                    return jsonify({'error': 'Insufficient permissions'}), 403
                
                return f(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
        
        decorated_function.__name__ = f.__name__
        return decorated_function
    return decorator

user_manager = UserManagementSystem()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    result = user_manager.authenticate_user(
        data['username'], 
        data['password'], 
        data.get('mfa_token')
    )
    return jsonify(result)

@app.route('/api/users', methods=['POST'])
@require_permission('ADMIN_ACCESS')
def create_user():
    data = request.get_json()
    result = user_manager.create_user(
        data['username'],
        data['email'],
        data['password'],
        data['full_name'],
        data['department'],
        data['role']
    )
    return jsonify(result)

@app.route('/api/users', methods=['GET'])
@require_permission('ADMIN_ACCESS')
def list_users():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT user_id, username, email, full_name, department, role, is_active, last_login
        FROM users ORDER BY created_at DESC
    ''')
    users = cursor.fetchall()
    conn.close()
    
    return jsonify([{
        'user_id': user[0],
        'username': user[1],
        'email': user[2],
        'full_name': user[3],
        'department': user[4],
        'role': user[5],
        'is_active': user[6],
        'last_login': user[7]
    } for user in users])

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'service': 'User Management System'})

if __name__ == '__main__':
    print("🔐 TerraFusion Security System - BENTON COUNTY")
    print("👥 User Management & Authentication Ready")
    print("🔑 Default accounts created:")
    print("   - admin / BentonAdmin2025!")
    print("   - assessor.chief / AssessorChief2025!")
    print("   - gis.analyst / GISAnalyst2025!")
    print("   - permit.manager / PermitMgr2025!")
    
    app.run(host='0.0.0.0', port=9001, debug=False) 