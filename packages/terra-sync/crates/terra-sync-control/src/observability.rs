//! Tracing / OpenTelemetry initialization.
//!
//! JSON structured logs always on (for aggregation). If
//! `observability.otlp_endpoint` is set, an OTLP span exporter is
//! installed under the given service name.

use crate::config::ObservabilityConfig;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

pub fn init(cfg: &ObservabilityConfig) -> anyhow::Result<()> {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let fmt_layer = tracing_subscriber::fmt::layer().json();

    let registry = tracing_subscriber::registry().with(filter).with(fmt_layer);

    if let Some(endpoint) = &cfg.otlp_endpoint {
        use opentelemetry::trace::TracerProvider as _;
        use opentelemetry_otlp::WithExportConfig;
        let exporter = opentelemetry_otlp::SpanExporter::builder()
            .with_tonic()
            .with_endpoint(endpoint.clone())
            .build()?;
        let provider = opentelemetry_sdk::trace::TracerProvider::builder()
            .with_batch_exporter(exporter, opentelemetry_sdk::runtime::Tokio)
            .with_resource(opentelemetry_sdk::Resource::new(vec![
                opentelemetry::KeyValue::new("service.name", cfg.service_name.clone()),
            ]))
            .build();
        let tracer = provider.tracer(cfg.service_name.clone());
        opentelemetry::global::set_tracer_provider(provider);
        let otel_layer = tracing_opentelemetry::layer().with_tracer(tracer);
        registry.with(otel_layer).init();
    } else {
        registry.init();
    }

    Ok(())
}

/// Flush the OTLP batch exporter on graceful shutdown so in-flight spans
/// are not lost. Safe to call even if no tracer provider was installed.
pub fn shutdown() {
    opentelemetry::global::shutdown_tracer_provider();
}
