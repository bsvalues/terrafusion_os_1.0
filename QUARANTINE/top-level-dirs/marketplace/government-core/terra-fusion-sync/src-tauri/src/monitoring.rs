use crate::{SystemStatus, HealthStatus, SyncJob, JobStatus};
use anyhow::Result;
use chrono::Utc;
use dashmap::DashMap;
use std::sync::Arc;

#[derive(Debug)]
pub struct SystemMonitor {
    start_time: chrono::DateTime<chrono::Utc>,
    metrics_history: Vec<MetricsSnapshot>,
}

#[derive(Debug, Clone)]
struct MetricsSnapshot {
    timestamp: chrono::DateTime<chrono::Utc>,
    cpu_usage: f64,
    memory_usage: f64,
    data_throughput: f64,
    active_connections: usize,
}

impl SystemMonitor {
    pub async fn new() -> Result<Self> {
        Ok(Self {
            start_time: Utc::now(),
            metrics_history: Vec::new(),
        })
    }
    
    pub async fn get_current_status(&self, active_jobs: &Arc<DashMap<String, SyncJob>>) -> Result<SystemStatus> {
        let uptime = Utc::now() - self.start_time;
        let uptime_str = format!("{}d {}h {}m", 
            uptime.num_days(),
            uptime.num_hours() % 24,
            uptime.num_minutes() % 60
        );
        
        let active_syncs = active_jobs.iter()
            .filter(|entry| matches!(entry.value().status, JobStatus::Running))
            .count();
        
        let queued_jobs = active_jobs.iter()
            .filter(|entry| matches!(entry.value().status, JobStatus::Queued))
            .count();
        
        let total_records_synced = active_jobs.iter()
            .map(|entry| entry.value().records_processed)
            .sum();
        
        // Simulate system metrics
        let cpu_usage = 20.0 + rand::random::<f64>() * 30.0;
        let memory_usage = 60.0 + rand::random::<f64>() * 25.0;
        let data_throughput = 1.8 + rand::random::<f64>() * 1.0;
        
        let overall_health = if cpu_usage < 80.0 && memory_usage < 85.0 && active_syncs < 10 {
            HealthStatus::Healthy
        } else if cpu_usage < 90.0 && memory_usage < 95.0 {
            HealthStatus::Warning
        } else {
            HealthStatus::Critical
        };
        
        Ok(SystemStatus {
            overall_health,
            active_syncs,
            queued_jobs,
            total_records_synced,
            data_throughput,
            uptime: uptime_str,
            memory_usage,
            cpu_usage,
        })
    }
    
    pub async fn get_real_time_metrics(&mut self, active_jobs: &Arc<DashMap<String, SyncJob>>) -> Result<SystemStatus> {
        let status = self.get_current_status(active_jobs).await?;
        
        // Store metrics snapshot
        let snapshot = MetricsSnapshot {
            timestamp: Utc::now(),
            cpu_usage: status.cpu_usage,
            memory_usage: status.memory_usage,
            data_throughput: status.data_throughput,
            active_connections: active_jobs.len(),
        };
        
        self.metrics_history.push(snapshot);
        
        // Keep only last 100 snapshots
        if self.metrics_history.len() > 100 {
            self.metrics_history.remove(0);
        }
        
        Ok(status)
    }
    
    pub async fn get_performance_trends(&self) -> Result<serde_json::Value> {
        if self.metrics_history.is_empty() {
            return Ok(serde_json::json!({
                "trends": {
                    "cpu_trend": "stable",
                    "memory_trend": "stable",
                    "throughput_trend": "stable"
                },
                "message": "Insufficient data for trend analysis"
            }));
        }
        
        let recent_metrics = &self.metrics_history[self.metrics_history.len().saturating_sub(10)..];
        
        // Calculate simple trends
        let cpu_trend = self.calculate_trend(recent_metrics.iter().map(|m| m.cpu_usage).collect());
        let memory_trend = self.calculate_trend(recent_metrics.iter().map(|m| m.memory_usage).collect());
        let throughput_trend = self.calculate_trend(recent_metrics.iter().map(|m| m.data_throughput).collect());
        
        Ok(serde_json::json!({
            "trends": {
                "cpu_trend": cpu_trend,
                "memory_trend": memory_trend,
                "throughput_trend": throughput_trend
            },
            "metrics_count": self.metrics_history.len(),
            "last_updated": if let Some(last) = self.metrics_history.last() {
                last.timestamp
            } else {
                Utc::now()
            }
        }))
    }
    
    fn calculate_trend(&self, values: Vec<f64>) -> String {
        if values.len() < 2 {
            return "stable".to_string();
        }
        
        let first_half_avg = values[..values.len()/2].iter().sum::<f64>() / (values.len()/2) as f64;
        let second_half_avg = values[values.len()/2..].iter().sum::<f64>() / (values.len() - values.len()/2) as f64;
        
        let diff_percent = ((second_half_avg - first_half_avg) / first_half_avg) * 100.0;
        
        if diff_percent > 5.0 {
            "increasing".to_string()
        } else if diff_percent < -5.0 {
            "decreasing".to_string()
        } else {
            "stable".to_string()
        }
    }
    
    pub async fn get_system_alerts(&self, active_jobs: &Arc<DashMap<String, SyncJob>>) -> Result<Vec<serde_json::Value>> {
        let mut alerts = Vec::new();
        
        let status = self.get_current_status(active_jobs).await?;
        
        // CPU alert
        if status.cpu_usage > 80.0 {
            alerts.push(serde_json::json!({
                "type": "high_cpu_usage",
                "severity": if status.cpu_usage > 90.0 { "critical" } else { "warning" },
                "message": format!("CPU usage is at {:.1}%", status.cpu_usage),
                "timestamp": Utc::now(),
                "suggested_action": "Consider scaling or optimizing sync jobs"
            }));
        }
        
        // Memory alert
        if status.memory_usage > 85.0 {
            alerts.push(serde_json::json!({
                "type": "high_memory_usage",
                "severity": if status.memory_usage > 95.0 { "critical" } else { "warning" },
                "message": format!("Memory usage is at {:.1}%", status.memory_usage),
                "timestamp": Utc::now(),
                "suggested_action": "Check for memory leaks or reduce concurrent operations"
            }));
        }
        
        // Too many queued jobs
        if status.queued_jobs > 10 {
            alerts.push(serde_json::json!({
                "type": "high_queue_size",
                "severity": "warning",
                "message": format!("{} jobs are queued", status.queued_jobs),
                "timestamp": Utc::now(),
                "suggested_action": "Consider increasing processing capacity"
            }));
        }
        
        // Check for stuck jobs
        let stuck_jobs = active_jobs.iter()
            .filter(|entry| {
                matches!(entry.value().status, JobStatus::Running) &&
                (Utc::now() - entry.value().started_at).num_minutes() > 30
            })
            .count();
        
        if stuck_jobs > 0 {
            alerts.push(serde_json::json!({
                "type": "stuck_jobs",
                "severity": "warning",
                "message": format!("{} jobs have been running for over 30 minutes", stuck_jobs),
                "timestamp": Utc::now(),
                "suggested_action": "Review and potentially restart stuck jobs"
            }));
        }
        
        Ok(alerts)
    }
    
    pub async fn get_uptime_statistics(&self) -> Result<serde_json::Value> {
        let total_uptime = Utc::now() - self.start_time;
        
        // Simulate uptime statistics
        let uptime_percentage = 99.8; // High availability
        let downtime_incidents = 2;
        let mean_time_to_recovery = 4.2; // minutes
        
        Ok(serde_json::json!({
            "uptime": {
                "total_days": total_uptime.num_days(),
                "total_hours": total_uptime.num_hours(),
                "percentage": uptime_percentage,
                "start_time": self.start_time
            },
            "reliability": {
                "downtime_incidents": downtime_incidents,
                "mean_time_to_recovery_minutes": mean_time_to_recovery,
                "availability_sla": 99.5,
                "sla_compliance": uptime_percentage >= 99.5
            },
            "performance": {
                "average_response_time": 150.0,
                "peak_throughput": 5.2,
                "current_load": "normal"
            }
        }))
    }
}