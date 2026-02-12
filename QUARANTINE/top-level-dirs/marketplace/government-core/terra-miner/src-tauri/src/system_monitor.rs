use crate::SystemMetrics;
use anyhow::Result;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug)]
pub struct SystemMonitor {
    metrics_history: Vec<SystemMetrics>,
    max_history: usize,
}

impl SystemMonitor {
    pub async fn new() -> Result<Self> {
        Ok(Self {
            metrics_history: Vec::new(),
            max_history: 100,
        })
    }
    
    pub async fn get_current_metrics(&self) -> Result<SystemMetrics> {
        // Simulate system metrics collection
        let metrics = SystemMetrics {
            cpu_usage: self.get_cpu_usage(),
            memory_usage: self.get_memory_usage(),
            disk_usage: 65.4,
            network_io: self.get_network_io(),
            active_jobs: 2,
            processing_rate: 2300.0 + (rand::random::<f64>() * 500.0),
            queue_size: 3,
            cache_hit_rate: 0.87,
        };
        
        Ok(metrics)
    }
    
    fn get_cpu_usage(&self) -> f64 {
        // Simulate CPU usage with some variability
        40.0 + (rand::random::<f64>() * 40.0)
    }
    
    fn get_memory_usage(&self) -> f64 {
        // Simulate memory usage
        60.0 + (rand::random::<f64>() * 25.0)
    }
    
    fn get_network_io(&self) -> f64 {
        // Simulate network I/O
        100.0 + (rand::random::<f64>() * 900.0)
    }
    
    pub async fn record_metrics(&mut self, metrics: SystemMetrics) -> Result<()> {
        self.metrics_history.push(metrics);
        
        if self.metrics_history.len() > self.max_history {
            self.metrics_history.remove(0);
        }
        
        Ok(())
    }
    
    pub async fn get_metrics_history(&self) -> Result<Vec<SystemMetrics>> {
        Ok(self.metrics_history.clone())
    }
}