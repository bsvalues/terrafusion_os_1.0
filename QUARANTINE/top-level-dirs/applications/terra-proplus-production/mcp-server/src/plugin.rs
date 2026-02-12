// Shared plugin trait for agentic microservices
use serde_json::Value;

pub trait AgentPlugin: Send + Sync {
    fn name(&self) -> &'static str;
    fn can_handle(&self, intent: &str) -> bool;
    fn handle(&self, intent: &str, context: &Value) -> Value;
}

// Example plugin registry
pub struct PluginRegistry {
    plugins: Vec<Box<dyn AgentPlugin>>,
}

impl PluginRegistry {
    pub fn new() -> Self { Self { plugins: vec![] } }
    pub fn register(&mut self, plugin: Box<dyn AgentPlugin>) { self.plugins.push(plugin); }
    pub fn get_handler(&self, intent: &str) -> Option<&Box<dyn AgentPlugin>> {
        self.plugins.iter().find(|p| p.can_handle(intent))
    }
}
