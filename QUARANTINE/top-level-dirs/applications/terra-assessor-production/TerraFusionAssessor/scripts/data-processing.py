# TerraFusion data processing utilities
import json
import random
import time
from datetime import datetime, timedelta
import math

def generate_sample_geospatial_data(num_points=1000):
    """Generate sample geospatial data points for testing"""
    print(f"🌍 Generating {num_points} sample geospatial data points...")
    
    data_points = []
    
    # Define some interesting geographic regions
    regions = [
        {"name": "San Francisco Bay Area", "lat": 37.7749, "lon": -122.4194, "radius": 0.5},
        {"name": "New York City", "lat": 40.7128, "lon": -74.0060, "radius": 0.3},
        {"name": "London", "lat": 51.5074, "lon": -0.1278, "radius": 0.4},
        {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503, "radius": 0.6},
        {"name": "Sydney", "lat": -33.8688, "lon": 151.2093, "radius": 0.3}
    ]
    
    for i in range(num_points):
        # Select a random region
        region = random.choice(regions)
        
        # Generate point within region radius
        angle = random.uniform(0, 2 * math.pi)
        radius = random.uniform(0, region["radius"])
        
        lat = region["lat"] + radius * math.cos(angle)
        lon = region["lon"] + radius * math.sin(angle)
        
        # Generate realistic sensor data
        data_point = {
            "id": i + 1,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "region": region["name"],
            "timestamp": (datetime.now() - timedelta(hours=random.randint(0, 168))).isoformat(),
            "data": {
                "temperature": round(random.uniform(-10, 40), 1),
                "humidity": round(random.uniform(20, 90), 1),
                "pressure": round(random.uniform(980, 1030), 1),
                "wind_speed": round(random.uniform(0, 25), 1),
                "elevation": round(random.uniform(0, 500), 1),
                "vegetation_index": round(random.uniform(0, 1), 3)
            }
        }
        
        data_points.append(data_point)
    
    print(f"✅ Generated {len(data_points)} data points")
    return data_points

def process_data_layers(data_points):
    """Process data points into different visualization layers"""
    print("🔄 Processing data into visualization layers...")
    
    layers = {
        "temperature": [],
        "humidity": [],
        "elevation": [],
        "vegetation": []
    }
    
    for point in data_points:
        base_point = {
            "lat": point["latitude"],
            "lon": point["longitude"],
            "timestamp": point["timestamp"]
        }
        
        # Temperature layer
        layers["temperature"].append({
            **base_point,
            "value": point["data"]["temperature"],
            "color_intensity": min(1.0, (point["data"]["temperature"] + 10) / 50)
        })
        
        # Humidity layer
        layers["humidity"].append({
            **base_point,
            "value": point["data"]["humidity"],
            "color_intensity": point["data"]["humidity"] / 100
        })
        
        # Elevation layer
        layers["elevation"].append({
            **base_point,
            "value": point["data"]["elevation"],
            "color_intensity": point["data"]["elevation"] / 500
        })
        
        # Vegetation layer
        layers["vegetation"].append({
            **base_point,
            "value": point["data"]["vegetation_index"],
            "color_intensity": point["data"]["vegetation_index"]
        })
    
    print("✅ Data processing complete")
    return layers

def calculate_statistics(data_points):
    """Calculate statistical summaries of the data"""
    print("📊 Calculating data statistics...")
    
    if not data_points:
        return {}
    
    temperatures = [p["data"]["temperature"] for p in data_points]
    humidities = [p["data"]["humidity"] for p in data_points]
    elevations = [p["data"]["elevation"] for p in data_points]
    
    stats = {
        "total_points": len(data_points),
        "temperature": {
            "min": min(temperatures),
            "max": max(temperatures),
            "avg": round(sum(temperatures) / len(temperatures), 2),
            "std": round(math.sqrt(sum((x - sum(temperatures)/len(temperatures))**2 for x in temperatures) / len(temperatures)), 2)
        },
        "humidity": {
            "min": min(humidities),
            "max": max(humidities),
            "avg": round(sum(humidities) / len(humidities), 2)
        },
        "elevation": {
            "min": min(elevations),
            "max": max(elevations),
            "avg": round(sum(elevations) / len(elevations), 2)
        },
        "regions": {}
    }
    
    # Calculate regional statistics
    for point in data_points:
        region = point["region"]
        if region not in stats["regions"]:
            stats["regions"][region] = {"count": 0, "avg_temp": 0}
        stats["regions"][region]["count"] += 1
    
    for region in stats["regions"]:
        region_temps = [p["data"]["temperature"] for p in data_points if p["region"] == region]
        stats["regions"][region]["avg_temp"] = round(sum(region_temps) / len(region_temps), 2)
    
    print("📈 Statistics calculated:")
    print(f"   Total data points: {stats['total_points']}")
    print(f"   Temperature range: {stats['temperature']['min']}°C to {stats['temperature']['max']}°C")
    print(f"   Average humidity: {stats['humidity']['avg']}%")
    print(f"   Regions covered: {len(stats['regions'])}")
    
    return stats

def simulate_real_time_processing():
    """Simulate real-time data processing"""
    print("⚡ Starting real-time data processing simulation...")
    
    processing_stats = {
        "start_time": datetime.now().isoformat(),
        "points_processed": 0,
        "processing_rate": 0,
        "errors": 0
    }
    
    for i in range(10):  # Simulate 10 processing cycles
        # Simulate processing delay
        time.sleep(0.5)
        
        # Generate batch of new data
        batch_size = random.randint(50, 200)
        processing_stats["points_processed"] += batch_size
        
        # Calculate processing rate
        elapsed_time = (datetime.now() - datetime.fromisoformat(processing_stats["start_time"])).total_seconds()
        processing_stats["processing_rate"] = round(processing_stats["points_processed"] / elapsed_time, 2)
        
        # Simulate occasional errors
        if random.random() < 0.1:  # 10% chance of error
            processing_stats["errors"] += 1
        
        print(f"   Cycle {i+1}: Processed {batch_size} points (Total: {processing_stats['points_processed']}, Rate: {processing_stats['processing_rate']} pts/sec)")
    
    processing_stats["end_time"] = datetime.now().isoformat()
    print(f"✅ Real-time processing simulation complete")
    print(f"   Total processed: {processing_stats['points_processed']} points")
    print(f"   Average rate: {processing_stats['processing_rate']} points/second")
    print(f"   Errors encountered: {processing_stats['errors']}")
    
    return processing_stats

# Main execution
if __name__ == "__main__":
    print("🚀 TerraFusion Data Processing Pipeline")
    print("=" * 50)
    
    # Generate sample data
    sample_data = generate_sample_geospatial_data(500)
    
    # Process into layers
    processed_layers = process_data_layers(sample_data)
    
    # Calculate statistics
    statistics = calculate_statistics(sample_data)
    
    # Simulate real-time processing
    rt_stats = simulate_real_time_processing()
    
    print("\n🎯 Processing Summary:")
    print(f"   Sample data points: {len(sample_data)}")
    print(f"   Visualization layers: {len(processed_layers)}")
    print(f"   Statistical analysis: Complete")
    print(f"   Real-time simulation: {rt_stats['points_processed']} points processed")
    
    print("\n✨ TerraFusion data processing pipeline ready!")
