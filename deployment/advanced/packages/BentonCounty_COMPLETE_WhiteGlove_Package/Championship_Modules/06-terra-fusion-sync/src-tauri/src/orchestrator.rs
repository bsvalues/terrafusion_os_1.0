use anyhow::Result;
use chrono::Utc;
use std::collections::HashMap;

#[derive(Debug)]
pub struct Orchestrator {
    service_registry: HashMap<String, ServiceInfo>,
    load_balancer: LoadBalancer,
}

#[derive(Debug, Clone)]
struct ServiceInfo {
    name: String,
    endpoint: String,
    health_status: String,
    last_check: chrono::DateTime<chrono::Utc>,
    load: f64,
}

#[derive(Debug)]
struct LoadBalancer {
    routing_rules: HashMap<String, Vec<String>>,
}

impl Orchestrator {
    pub async fn new() -> Result<Self> {
        let mut service_registry = HashMap::new();
        
        // Register core TerraFusion services
        service_registry.insert("terra-agent".to_string(), ServiceInfo {
            name: "TerraAgent".to_string(),
            endpoint: "http://localhost:5003".to_string(),
            health_status: "healthy".to_string(),
            last_check: Utc::now(),
            load: 0.25,
        });
        
        service_registry.insert("terra-flow".to_string(), ServiceInfo {
            name: "TerraFlow".to_string(),
            endpoint: "http://localhost:5004".to_string(),
            health_status: "healthy".to_string(),
            last_check: Utc::now(),
            load: 0.18,
        });
        
        service_registry.insert("terra-insight".to_string(), ServiceInfo {
            name: "TerraInsight".to_string(),
            endpoint: "http://localhost:3003".to_string(),
            health_status: "healthy".to_string(),
            last_check: Utc::now(),
            load: 0.32,
        });
        
        let mut routing_rules = HashMap::new();
        routing_rules.insert("data-sync".to_string(), vec![
            "terra-agent".to_string(),
            "terra-flow".to_string(),
        ]);
        routing_rules.insert("analytics".to_string(), vec![
            "terra-insight".to_string(),
        ]);
        
        Ok(Self {
            service_registry,
            load_balancer: LoadBalancer { routing_rules },
        })
    }
    
    pub async fn run_orchestration_cycle(&mut self) -> Result<()> {
        // Check service health
        self.check_service_health().await?;
        
        // Balance load
        self.balance_load().await?;
        
        // Route requests
        self.update_routing_rules().await?;
        
        Ok(())
    }
    
    async fn check_service_health(&mut self) -> Result<()> {
        for (service_id, service_info) in self.service_registry.iter_mut() {
            // Simulate health check
            let is_healthy = rand::random::<f64>() > 0.05; // 95% uptime
            
            service_info.health_status = if is_healthy {
                "healthy".to_string()
            } else {
                "unhealthy".to_string()
            };
            
            service_info.last_check = Utc::now();
            service_info.load = 0.1 + rand::random::<f64>() * 0.4; // 10-50% load
            
            println!("Health check for {}: {}", service_id, service_info.health_status);
        }
        
        Ok(())
    }
    
    async fn balance_load(&mut self) -> Result<()> {
        // Simple load balancing logic
        let total_load: f64 = self.service_registry.values()
            .map(|s| s.load)
            .sum();
        
        let average_load = total_load / self.service_registry.len() as f64;
        
        println!("Average system load: {:.2}%", average_load * 100.0);
        
        // Identify overloaded services
        for (service_id, service_info) in self.service_registry.iter() {
            if service_info.load > average_load * 1.5 {
                println!("Service {} is overloaded: {:.2}%", service_id, service_info.load * 100.0);
                // In a real implementation, we would scale or redistribute load
            }
        }
        
        Ok(())
    }
    
    async fn update_routing_rules(&mut self) -> Result<()> {
        // Update routing based on service health and load
        for (route, services) in self.load_balancer.routing_rules.iter_mut() {
            services.retain(|service_id| {
                if let Some(service) = self.service_registry.get(service_id) {
                    service.health_status == "healthy" && service.load < 0.8
                } else {
                    false
                }
            });
            
            if services.is_empty() {
                println!("Warning: No healthy services available for route {}", route);
            }
        }
        
        Ok(())
    }
    
    pub async fn get_orchestration_status(&self) -> Result<serde_json::Value> {
        let healthy_services = self.service_registry.values()
            .filter(|s| s.health_status == "healthy")
            .count();
        
        let total_services = self.service_registry.len();
        let average_load = self.service_registry.values()
            .map(|s| s.load)
            .sum::<f64>() / total_services as f64;
        
        Ok(serde_json::json!({
            "orchestration": {
                "status": if healthy_services == total_services { "optimal" } else { "degraded" },
                "healthy_services": healthy_services,
                "total_services": total_services,
                "average_load": average_load,
                "uptime": "99.8%"
            },
            "services": self.service_registry.iter().map(|(id, info)| {
                serde_json::json!({
                    "id": id,
                    "name": info.name,
                    "endpoint": info.endpoint,
                    "status": info.health_status,
                    "load": info.load,
                    "last_check": info.last_check
                })
            }).collect::<Vec<_>>(),
            "routing": self.load_balancer.routing_rules.iter().map(|(route, services)| {
                serde_json::json!({
                    "route": route,
                    "available_services": services.len(),
                    "services": services
                })
            }).collect::<Vec<_>>()
        }))
    }
    
    pub async fn register_service(&mut self, service_id: String, endpoint: String, name: String) -> Result<()> {
        let service_info = ServiceInfo {
            name,
            endpoint,
            health_status: "healthy".to_string(),
            last_check: Utc::now(),
            load: 0.0,
        };
        
        self.service_registry.insert(service_id.clone(), service_info);
        println!("Registered service: {}", service_id);
        
        Ok(())
    }
    
    pub async fn unregister_service(&mut self, service_id: &str) -> Result<()> {
        self.service_registry.remove(service_id);
        
        // Remove from routing rules
        for (_, services) in self.load_balancer.routing_rules.iter_mut() {
            services.retain(|s| s != service_id);
        }
        
        println!("Unregistered service: {}", service_id);
        Ok(())
    }
}