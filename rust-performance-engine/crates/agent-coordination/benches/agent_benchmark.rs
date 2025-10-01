use criterion::{black_box, criterion_group, criterion_main, Criterion};
use agent_coordination::AgentCoordinationEngine;
use uuid::Uuid;

fn benchmark_agent_registration(c: &mut Criterion) {
    let mut group = c.benchmark_group("agent_registration");
    
    let engine = AgentCoordinationEngine::new().expect("Failed to create engine");
    
    group.bench_function("register_1000_agents", |b| {
        b.iter(|| {
            for i in 0..1000 {
                let agent_id = Uuid::new_v4();
                engine.register_agent(
                    black_box(agent_id),
                    black_box(1), // tier
                    black_box(42.0), // performance
                ).expect("Failed to register agent");
            }
        })
    });

    group.finish();
}

fn benchmark_message_broadcast(c: &mut Criterion) {
    let mut group = c.benchmark_group("message_broadcast");
    
    let engine = AgentCoordinationEngine::new().expect("Failed to create engine");
    
    // Pre-register agents
    for _ in 0..1000 {
        let agent_id = Uuid::new_v4();
        engine.register_agent(agent_id, 1, 42.0).expect("Failed to register agent");
    }
    
    group.bench_function("broadcast_to_1000_agents", |b| {
        b.iter(|| {
            engine.broadcast_message(
                black_box("performance_update"),
                black_box("System performance: 99.9%")
            ).expect("Failed to broadcast message");
        })
    });

    group.finish();
}

criterion_group!(benches, benchmark_agent_registration, benchmark_message_broadcast);
criterion_main!(benches);