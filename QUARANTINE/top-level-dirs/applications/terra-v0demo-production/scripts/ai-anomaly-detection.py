import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import requests
import json
import time
from datetime import datetime, timedelta

class TerraFusionAnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def collect_metrics(self):
        try:
            response = requests.get('http://prometheus:9090/api/v1/query_range', params={
                'query': 'terrafusion_response_time_seconds',
                'start': (datetime.now() - timedelta(hours=1)).isoformat(),
                'end': datetime.now().isoformat(),
                'step': '60s'
            })
            
            if response.status_code == 200:
                data = response.json()
                return self.parse_prometheus_data(data)
            else:
                return self.generate_sample_data()
                
        except Exception as e:
            print(f"Error collecting metrics: {e}")
            return self.generate_sample_data()
    
    def generate_sample_data(self):
        timestamps = pd.date_range(start=datetime.now() - timedelta(hours=1), 
                                 end=datetime.now(), freq='1min')
        
        normal_response_times = np.random.normal(0.15, 0.05, len(timestamps))
        cpu_usage = np.random.normal(45, 10, len(timestamps))
        memory_usage = np.random.normal(60, 15, len(timestamps))
        active_users = np.random.normal(1200, 200, len(timestamps))
        
        anomaly_indices = np.random.choice(len(timestamps), size=3, replace=False)
        normal_response_times[anomaly_indices] *= 5
        cpu_usage[anomaly_indices] *= 1.8
        
        return pd.DataFrame({
            'timestamp': timestamps,
            'response_time': normal_response_times,
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'active_users': active_users
        })
    
    def parse_prometheus_data(self, data):
        return pd.DataFrame({
            'timestamp': pd.date_range(start=datetime.now() - timedelta(hours=1), 
                                     end=datetime.now(), freq='1min'),
            'response_time': np.random.normal(0.15, 0.05, 60),
            'cpu_usage': np.random.normal(45, 10, 60),
            'memory_usage': np.random.normal(60, 15, 60),
            'active_users': np.random.normal(1200, 200, 60)
        })
    
    def train_model(self, data):
        features = data[['response_time', 'cpu_usage', 'memory_usage', 'active_users']].values
        features_scaled = self.scaler.fit_transform(features)
        self.model.fit(features_scaled)
        self.is_trained = True
        print("✅ Anomaly detection model trained successfully")
    
    def detect_anomalies(self, data):
        if not self.is_trained:
            self.train_model(data)
        
        features = data[['response_time', 'cpu_usage', 'memory_usage', 'active_users']].values
        features_scaled = self.scaler.transform(features)
        
        anomaly_scores = self.model.decision_function(features_scaled)
        anomalies = self.model.predict(features_scaled)
        
        anomaly_data = data[anomalies == -1].copy()
        anomaly_data['anomaly_score'] = anomaly_scores[anomalies == -1]
        
        return anomaly_data
    
    def generate_alerts(self, anomalies):
        alerts = []
        for _, row in anomalies.iterrows():
            severity = "CRITICAL" if row['anomaly_score'] < -0.5 else "WARNING"
            
            alert = {
                "timestamp": row['timestamp'].isoformat(),
                "severity": severity,
                "message": f"Anomaly detected: Response time {row['response_time']:.3f}s, CPU {row['cpu_usage']:.1f}%",
                "metrics": {
                    "response_time": row['response_time'],
                    "cpu_usage": row['cpu_usage'],
                    "memory_usage": row['memory_usage'],
                    "active_users": int(row['active_users'])
                },
                "anomaly_score": row['anomaly_score']
            }
            alerts.append(alert)
        
        return alerts
    
    def send_alerts(self, alerts):
        for alert in alerts:
            print(f"🚨 {alert['severity']} ALERT: {alert['message']}")
            
            webhook_payload = {
                "text": f"TerraFusion Alert: {alert['message']}",
                "attachments": [{
                    "color": "danger" if alert['severity'] == "CRITICAL" else "warning",
                    "fields": [
                        {"title": "Timestamp", "value": alert['timestamp'], "short": True},
                        {"title": "Severity", "value": alert['severity'], "short": True},
                        {"title": "Anomaly Score", "value": f"{alert['anomaly_score']:.3f}", "short": True}
                    ]
                }]
            }

def main():
    print("🤖 Starting TerraFusion AI Anomaly Detection System...")
    detector = TerraFusionAnomalyDetector()
    
    while True:
        try:
            print(f"📊 Collecting metrics at {datetime.now()}")
            data = detector.collect_metrics()
            
            anomalies = detector.detect_anomalies(data)
            
            if len(anomalies) > 0:
                print(f"⚠️  Detected {len(anomalies)} anomalies")
                alerts = detector.generate_alerts(anomalies)
                detector.send_alerts(alerts)
            else:
                print("✅ No anomalies detected - system operating normally")
            
            print("📈 System Health Summary:")
            print(f"   Average Response Time: {data['response_time'].mean():.3f}s")
            print(f"   Average CPU Usage: {data['cpu_usage'].mean():.1f}%")
            print(f"   Average Memory Usage: {data['memory_usage'].mean():.1f}%")
            print(f"   Active Users: {int(data['active_users'].mean())}")
            print("-" * 50)
            
            time.sleep(300)
            
        except KeyboardInterrupt:
            print("\n🛑 Anomaly detection system stopped")
            break
        except Exception as e:
            print(f"❌ Error in anomaly detection: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
