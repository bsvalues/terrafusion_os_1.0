FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["streamlit", "run", "terraflow_enhanced_refactored.py", "--server.port", "5000", "--server.address", "0.0.0.0"]