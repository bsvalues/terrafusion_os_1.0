use criterion::{black_box, criterion_group, criterion_main, Criterion};
use geospatial_engine::GeospatialEngine;

fn benchmark_spatial_query(c: &mut Criterion) {
    let mut group = c.benchmark_group("spatial_queries");
    
    // Initialize engine with test data
    let mut engine = GeospatialEngine::new().expect("Failed to create engine");
    
    group.bench_function("bbox_query_1000", |b| {
        b.iter(|| {
            engine.spatial_query(
                black_box(-122.5),  // minX 
                black_box(47.0),    // minY
                black_box(-122.0),  // maxX
                black_box(47.5),    // maxY
                black_box(1000)     // maxResults
            )
        })
    });

    group.finish();
}

fn benchmark_parcel_calculation(c: &mut Criterion) {
    let mut group = c.benchmark_group("parcel_calculations");
    
    let engine = GeospatialEngine::new().expect("Failed to create engine");
    
    group.bench_function("area_calculation_simd", |b| {
        b.iter(|| {
            engine.calculate_parcel_area_simd(
                black_box(&[
                    (47.123, -122.456),
                    (47.124, -122.455),  
                    (47.125, -122.454),
                    (47.126, -122.453)
                ])
            )
        })
    });

    group.finish();
}

criterion_group!(benches, benchmark_spatial_query, benchmark_parcel_calculation);
criterion_main!(benches);