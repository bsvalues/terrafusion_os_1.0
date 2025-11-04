"""
Deduplication Metrics Dashboard with Email Alerting

Configuration:
- Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO below.
- Alerts are sent if the last 5 deduplication rates for any source fall below the healthy threshold.
"""
import pandas as pd
from flask import Flask, render_template_string
import plotly.graph_objs as go
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
import os

# --- EMAIL ALERT CONFIG ---
SMTP_HOST = os.environ.get('DEDUP_SMTP_HOST', 'smtp.example.com')
SMTP_PORT = int(os.environ.get('DEDUP_SMTP_PORT', '587'))
SMTP_USER = os.environ.get('DEDUP_SMTP_USER', 'user@example.com')
SMTP_PASS = os.environ.get('DEDUP_SMTP_PASS', 'password')
EMAIL_FROM = os.environ.get('DEDUP_EMAIL_FROM', 'dedup-alert@example.com')
EMAIL_TO = os.environ.get('DEDUP_EMAIL_TO', 'your.email@example.com')

# Thresholds for alerting (source: min_rate)
SOURCE_THRESHOLDS = {
    'zillow': 0.95,
    'pacmls': 0.92,
    'attom': 0.92,
}

app = Flask(__name__)

TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Deduplication Metrics Dashboard</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
</head>
<body>
    <h1>Deduplication Metrics Dashboard</h1>
    {% if last_alert %}
    <div style="color: red; font-weight: bold;">Last Alert: {{ last_alert }}</div>
    {% endif %}
    <div id="dedup_chart" style="width:90vw;height:60vh;"></div>
    <h2>Latest Deduplication Rates</h2>
    <table border="1" cellpadding="5">
        <tr><th>Timestamp</th><th>Source</th><th>Input</th><th>Strict</th><th>Fuzzy</th><th>Threshold</th></tr>
        {% for row in latest_rows %}
        <tr>
            <td>{{ row['timestamp'] }}</td>
            <td>{{ row['source'] }}</td>
            <td>{{ row['input_count'] }}</td>
            <td>{{ row['strict_count'] }}</td>
            <td>{{ row['fuzzy_count'] }}</td>
            <td>{{ row['threshold'] }}</td>
        </tr>
        {% endfor %}
    </table>
    <script>
        var chart_data = {{ chart_data | safe }};
        Plotly.newPlot('dedup_chart', chart_data.data, chart_data.layout);
    </script>
</body>
</html>
'''

_last_alert = None

def check_and_alert(df):
    global _last_alert
    alert_msgs = []
    for source, min_rate in SOURCE_THRESHOLDS.items():
        sdf = df[df['source'] == source].tail(5)
        if not sdf.empty:
            rates = (sdf['fuzzy_count'] / sdf['strict_count']).clip(0,1)
            if (rates < min_rate).any():
                alert_msg = f"Deduplication rate for {source} below threshold {min_rate}:\n" + \
                    '\n'.join([f"{r:.3f}" for r in rates])
                alert_msgs.append(alert_msg)
    if alert_msgs:
        msg = '\n\n'.join(alert_msgs)
        _last_alert = f"{datetime.utcnow().isoformat()}\n{msg}"
        send_email_alert(_last_alert)
    return _last_alert

def send_email_alert(body):
    try:
        msg = MIMEText(body)
        msg['Subject'] = 'Deduplication Rate Alert'
        msg['From'] = EMAIL_FROM
        msg['To'] = EMAIL_TO
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(EMAIL_FROM, [EMAIL_TO], msg.as_string())
    except Exception as e:
        print(f"Failed to send alert: {e}")

@app.route("/")
def dashboard():
    try:
        df = pd.read_csv('dedup_metrics.csv', names=[
            'timestamp', 'source', 'input_count', 'strict_count', 'fuzzy_count', 'threshold'
        ])
    except Exception:
        df = pd.DataFrame(columns=[
            'timestamp', 'source', 'input_count', 'strict_count', 'fuzzy_count', 'threshold'
        ])
    latest_rows = df.tail(10).to_dict('records')
    chart_data = make_chart_data(df)
    last_alert = check_and_alert(df) if not df.empty else None
    return render_template_string(TEMPLATE, latest_rows=latest_rows, chart_data=chart_data, last_alert=last_alert)

def make_chart_data(df):
    data = []
    layout = go.Layout(
        title="Deduplication Rate Over Time",
        xaxis=dict(title="Timestamp"),
        yaxis=dict(title="Deduplication Rate (Fuzzy/Strict)", range=[0,1]),
        legend=dict(x=0, y=1.2, orientation="h")
    )
    if not df.empty:
        for source in df['source'].unique():
            sdf = df[df['source'] == source]
            x = sdf['timestamp']
            y = (sdf['fuzzy_count'] / sdf['strict_count']).clip(0,1)
            data.append(go.Scatter(x=x, y=y, mode='lines+markers', name=source))
    return {'data': data, 'layout': layout}

if __name__ == "__main__":
    # For LAN preview, access http://<your-local-ip>:5001 from any device on your network
    # Production-safe configuration - debug only enabled via environment variable
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    app.run(host='0.0.0.0', port=5001, debug=debug_mode)

def make_chart_data(df):
    data = []
    layout = go.Layout(
        title="Deduplication Rate Over Time",
        xaxis=dict(title="Timestamp"),
        yaxis=dict(title="Deduplication Rate (Fuzzy/Strict)", range=[0,1]),
        legend=dict(x=0, y=1.2, orientation="h")
    )
    if not df.empty:
        for source in df['source'].unique():
            sdf = df[df['source'] == source]
            x = sdf['timestamp']
            y = (sdf['fuzzy_count'] / sdf['strict_count']).clip(0,1)
            data.append(go.Scatter(x=x, y=y, mode='lines+markers', name=source))
    return {'data': data, 'layout': layout}

if __name__ == "__main__":
    # For LAN preview, access http://<your-local-ip>:5001 from any device on your network
    # Production-safe configuration - debug only enabled via environment variable
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    app.run(host='0.0.0.0', port=5001, debug=debug_mode)
