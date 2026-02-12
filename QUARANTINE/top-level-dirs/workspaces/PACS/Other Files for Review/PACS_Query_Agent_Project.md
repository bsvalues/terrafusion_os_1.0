
# PACS Query Agent with Secure Authentication

An AI-powered query agent for the PACS database that securely processes user queries, converts them into SQL, and retrieves results. The system includes JWT-based authentication for secure access.

---

## Features
- **Natural Language Querying**: Converts user queries to SQL using OpenAI's API.
- **Database Interaction**: Connects to the PACS database to retrieve and analyze data.
- **Secure Authentication**: JWT-based authentication ensures only authorized users can access the query API.
- **REST API**: Provides endpoints for user registration, login, and querying.
- **Dynamic Front-End**: Simple web interface for querying and displaying results.

---

## Prerequisites
- **Python 3.8+**
- **PostgreSQL Database**
- **Node.js (optional for front-end development)**

---

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-repo/pacs-query-agent.git
cd pacs-query-agent
```

### 2. Set Up the Virtual Environment
```bash
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure the Database
- Ensure you have a PostgreSQL database with PACS schema configured.
- Update the `DATABASE_URL` in the script to point to your database.

### 5. Set Your OpenAI API Key
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

### 6. Run the Flask Server
```bash
python app.py
```

---

## Usage

### API Endpoints
#### 1. **Register a New User**
Register a user with the `/register` endpoint (for demonstration only):
```bash
curl -X POST http://127.0.0.1:5000/register \
-H "Content-Type: application/json" \
-d '{"username": "admin", "password": "admin123"}'
```

#### 2. **Login to Get a Token**
Authenticate with the `/login` endpoint to receive a JWT token:
```bash
curl -X POST http://127.0.0.1:5000/login \
-H "Content-Type: application/json" \
-d '{"username": "admin", "password": "admin123"}'
```
Response:
```json
{
    "access_token": "your_jwt_token"
}
```

#### 3. **Query the PACS Database**
Use the `/query` endpoint with your JWT token:
```bash
curl -X POST http://127.0.0.1:5000/query \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your_jwt_token" \
-d '{"query": "Show me the top 10 property sales in 2023."}'
```
Response:
```json
{
    "sql_query": "SELECT ...",
    "results": [...]
}
```

---

## Front-End Interface
A simple web interface is included in `templates/index.html`:
1. Open `index.html` in your browser.
2. Enter your query and view the results directly.

---

## Project Structure
```
pacs-query-agent/
│
├── app.py                 # Flask application with authentication and endpoints
├── database.py            # Database connection and query functions
├── query_generator.py     # Natural language to SQL query conversion
├── requirements.txt       # Python dependencies
├── templates/             # HTML templates for the front-end
│   └── index.html
└── static/                # Static files (CSS/JavaScript)
```

---

## Security Features
- **JWT Authentication**: Ensures only authenticated users can query the PACS database.
- **Secure Password Storage**: Uses bcrypt to hash passwords.
- **Input Validation**: Sanitizes user inputs to prevent SQL injection.
- **Access Control**: Protects sensitive endpoints with `@jwt_required`.

---

## Example Query

### Input
```
Show me the top 10 property sales in 2023 with the highest price-to-assessment ratio.
```

### Generated SQL
```sql
SELECT p.prop_id, s.sl_price, s.adjusted_sl_price, s.sl_date
FROM sales s
JOIN property p ON s.prop_id = p.prop_id
WHERE s.sl_date BETWEEN '2023-01-01' AND '2023-12-31'
ORDER BY (s.sl_price / p.assessed_val) DESC
LIMIT 10;
```

### Output
```json
[
    { "prop_id": 101, "sl_price": 450000, "adjusted_sl_price": 460000, "sl_date": "2023-05-01" },
    ...
]
```

---

## Technologies Used
- **Python**: Core application logic.
- **Flask**: REST API framework.
- **SQLAlchemy**: Database connection and querying.
- **OpenAI API**: Natural language processing.
- **Flask-JWT-Extended**: Authentication with JWT.
- **bcrypt**: Secure password hashing.
- **HTML/CSS/JavaScript**: Front-end interface.

---

## Future Enhancements
- **Role-Based Access Control**: Add user roles for fine-grained permissions.
- **Advanced Visualizations**: Integrate with Plotly or Power BI for dynamic charts.
- **GIS Integration**: Support geographic property data analysis.
- **Session Management**: Add features for token revocation and session tracking.

---

## Contributing
Contributions are welcome! Please fork the repository and create a pull request with your changes.

---

## License
This project is licensed under the MIT License.

---

## Contact
For any issues or feature requests, contact [your_email@example.com].
