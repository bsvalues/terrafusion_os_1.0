use crate::agents::base::{Agent, AgentHealth, create_success_response, create_error_response};
use crate::mcp::protocol::{MCPMessage, MCPResponseMessage};
use async_trait::async_trait;
use serde_json;
use tracing::{info, warn, error};
use std::collections::HashMap;

#[derive(Default)]
pub struct RAGAgent {
    pub vector_store: HashMap<String, DocumentVector>,
    pub knowledge_base: HashMap<String, String>,
}

impl RAGAgent {
    pub fn new() -> Self {
        let mut agent = Self::default();
        agent.initialize_knowledge_base();
        agent
    }

    fn initialize_knowledge_base(&mut self) {
        self.knowledge_base.insert(
            "market_trends".to_string(),
            "Real estate market shows consistent growth in Pacific Northwest regions with 4.2% annual appreciation.".to_string()
        );
        
        self.knowledge_base.insert(
            "appraisal_standards".to_string(),
            "USPAP standards require consistent methodology and supporting documentation for all property valuations.".to_string()
        );

        self.knowledge_base.insert(
            "comparable_analysis".to_string(),
            "Comparable sales should be within 1 mile radius and sold within 6 months for optimal accuracy.".to_string()
        );
    }

    async fn search_knowledge(&self, query: &str) -> Result<Vec<SearchResult>, Box<dyn std::error::Error + Send + Sync>> {
        let query_lower = query.to_lowercase();
        let mut results = Vec::new();

        for (key, content) in &self.knowledge_base {
            if content.to_lowercase().contains(&query_lower) || key.contains(&query_lower) {
                results.push(SearchResult {
                    id: key.clone(),
                    content: content.clone(),
                    relevance_score: self.calculate_relevance(&query_lower, content),
                    metadata: HashMap::new(),
                });
            }
        }

        results.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());
        Ok(results.into_iter().take(5).collect())
    }

    fn calculate_relevance(&self, query: &str, content: &str) -> f64 {
        let query_words: Vec<&str> = query.split_whitespace().collect();
        let content_lower = content.to_lowercase();
        
        let matches = query_words.iter()
            .filter(|word| content_lower.contains(*word))
            .count();
        
        matches as f64 / query_words.len() as f64
    }

    async fn generate_response(&self, query: &str, context: &[SearchResult]) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        if context.is_empty() {
            return Ok("I don't have specific information about that topic in my knowledge base.".to_string());
        }

        let mut response = String::new();
        response.push_str(&format!("Based on the available information about '{}': ", query));
        
        for (i, result) in context.iter().enumerate() {
            if i > 0 {
                response.push_str(" Additionally, ");
            }
            response.push_str(&result.content);
        }

        Ok(response)
    }
}

#[async_trait]
impl Agent for RAGAgent {
    fn id(&self) -> &str {
        "rag-agent"
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "knowledge-search".to_string(),
            "document-retrieval".to_string(),
            "question-answering".to_string(),
            "context-generation".to_string(),
        ]
    }

    async fn health_check(&self) -> AgentHealth {
        let mut health = AgentHealth::healthy("RAG agent operational");
        health.metrics.insert("knowledge_base_size".to_string(), self.knowledge_base.len() as f64);
        health.metrics.insert("vector_store_size".to_string(), self.vector_store.len() as f64);
        health
    }

    async fn handle(&mut self, msg: MCPMessage) -> MCPResponseMessage {
        info!("RAGAgent processing message: {}", msg.content_type);

        match msg.content_type.as_str() {
            "knowledge-search-request" => {
                let query = msg.content.get("query").and_then(|v| v.as_str()).unwrap_or("");
                
                match self.search_knowledge(query).await {
                    Ok(results) => {
                        let content = serde_json::json!({
                            "query": query,
                            "results": results,
                            "total_results": results.len(),
                        });
                        create_success_response(self.id(), &msg, "knowledge-search-response", content)
                    }
                    Err(e) => {
                        error!("Knowledge search failed: {}", e);
                        create_error_response(self.id(), &msg, &format!("Search failed: {}", e))
                    }
                }
            }
            "question-answering-request" => {
                let question = msg.content.get("question").and_then(|v| v.as_str()).unwrap_or("");
                
                match self.search_knowledge(question).await {
                    Ok(context) => {
                        match self.generate_response(question, &context).await {
                            Ok(answer) => {
                                let content = serde_json::json!({
                                    "question": question,
                                    "answer": answer,
                                    "confidence": if context.is_empty() { 0.2 } else { 0.85 },
                                    "sources": context.len(),
                                });
                                create_success_response(self.id(), &msg, "question-answering-response", content)
                            }
                            Err(e) => {
                                create_error_response(self.id(), &msg, &format!("Response generation failed: {}", e))
                            }
                        }
                    }
                    Err(e) => {
                        create_error_response(self.id(), &msg, &format!("Context retrieval failed: {}", e))
                    }
                }
            }
            _ => {
                warn!("Unknown message type: {}", msg.content_type);
                create_error_response(self.id(), &msg, "Unknown message type")
            }
        }
    }
}

#[derive(Clone)]
pub struct DocumentVector {
    pub id: String,
    pub content: String,
    pub embedding: Vec<f32>,
    pub metadata: HashMap<String, String>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub content: String,
    pub relevance_score: f64,
    pub metadata: HashMap<String, String>,
}