#!/bin/bash

# TerraFusion Import System Benchmark Script
# Tests ingestion throughput for 10K+ files

set -e

echo "🔧 TerraFusion Import Benchmarking Tool"
echo "========================================"

# Configuration
BENCH_DIR="./bench"
TEST_FILES_COUNT=1000
CONCURRENT_JOBS=10
API_BASE="http://localhost:5000"

# Create benchmark directory
mkdir -p $BENCH_DIR

# Function to generate test SQLite file
generate_test_sqlite() {
    local file_path=$1
    local record_count=$2
    
    sqlite3 "$file_path" <<EOF
CREATE TABLE properties (
    id INTEGER PRIMARY KEY,
    address TEXT,
    sale_price REAL,
    living_area_sqft INTEGER,
    lot_size_sqft INTEGER,
    bedrooms INTEGER,
    bathrooms REAL,
    year_built INTEGER,
    sale_date TEXT,
    property_type TEXT
);

INSERT INTO properties (address, sale_price, living_area_sqft, lot_size_sqft, bedrooms, bathrooms, year_built, sale_date, property_type)
VALUES 
    ('123 Test St, City, ST', 450000, 1800, 7200, 3, 2.5, 1995, '2023-06-15', 'Single Family'),
    ('456 Demo Ave, Town, ST', 620000, 2200, 8500, 4, 3, 2001, '2023-07-20', 'Single Family'),
    ('789 Sample Rd, Village, ST', 380000, 1500, 6000, 2, 2, 1988, '2023-08-10', 'Townhouse');
EOF
}

# Function to generate test CSV file
generate_test_csv() {
    local file_path=$1
    
    cat > "$file_path" <<EOF
address,sale_price,living_area_sqft,lot_size_sqft,bedrooms,bathrooms,year_built,sale_date,property_type
"123 Test St, City, ST",450000,1800,7200,3,2.5,1995,2023-06-15,Single Family
"456 Demo Ave, Town, ST",620000,2200,8500,4,3,2001,2023-07-20,Single Family
"789 Sample Rd, Village, ST",380000,1500,6000,2,2,1988,2023-08-10,Townhouse
EOF
}

# Setup benchmark files
echo "📁 Setting up benchmark files..."
if [ ! -f "$BENCH_DIR/setup_complete" ]; then
    echo "Creating $TEST_FILES_COUNT test files..."
    
    for i in $(seq 1 $TEST_FILES_COUNT); do
        if [ $((i % 2)) -eq 0 ]; then
            generate_test_sqlite "$BENCH_DIR/test_${i}.sqlite" 3
        else
            generate_test_csv "$BENCH_DIR/test_${i}.csv"
        fi
        
        if [ $((i % 100)) -eq 0 ]; then
            echo "Generated $i files..."
        fi
    done
    
    touch "$BENCH_DIR/setup_complete"
    echo "✅ Benchmark files ready"
else
    echo "✅ Using existing benchmark files"
fi

# Function to upload file and measure time
upload_file() {
    local file_path=$1
    local start_time=$(date +%s.%N)
    
    response=$(curl -s -w "%{http_code}" -X POST \
        -F "files=@$file_path" \
        "$API_BASE/api/import/upload" \
        -o /tmp/upload_response.json)
    
    local end_time=$(date +%s.%N)
    local duration=$(echo "$end_time - $start_time" | bc)
    
    if [ "$response" = "200" ]; then
        echo "$duration"
    else
        echo "ERROR"
    fi
}

# Run benchmark
echo "🚀 Starting ingestion benchmark..."
echo "Files to process: $TEST_FILES_COUNT"
echo "Concurrent jobs: $CONCURRENT_JOBS"
echo "Target API: $API_BASE"
echo ""

# Check if server is running
if ! curl -s "$API_BASE/api/import/jobs" > /dev/null; then
    echo "❌ Server not accessible at $API_BASE"
    echo "Please ensure TerraFusion server is running with 'npm run dev'"
    exit 1
fi

# Benchmark metrics
total_files=0
successful_uploads=0
failed_uploads=0
total_time=0
start_timestamp=$(date +%s)

echo "⏱️  Starting benchmark at $(date)"
echo "Processing files..."

# Process files in batches
for batch_start in $(seq 1 $CONCURRENT_JOBS $TEST_FILES_COUNT); do
    batch_end=$((batch_start + CONCURRENT_JOBS - 1))
    if [ $batch_end -gt $TEST_FILES_COUNT ]; then
        batch_end=$TEST_FILES_COUNT
    fi
    
    echo "Processing batch $batch_start-$batch_end..."
    
    # Process batch concurrently
    for i in $(seq $batch_start $batch_end); do
        if [ -f "$BENCH_DIR/test_${i}.sqlite" ]; then
            file_path="$BENCH_DIR/test_${i}.sqlite"
        else
            file_path="$BENCH_DIR/test_${i}.csv"
        fi
        
        if [ -f "$file_path" ]; then
            (
                duration=$(upload_file "$file_path")
                if [ "$duration" != "ERROR" ]; then
                    echo "SUCCESS $duration" >> /tmp/benchmark_results.txt
                else
                    echo "FAILED" >> /tmp/benchmark_results.txt
                fi
            ) &
        fi
    done
    
    # Wait for batch to complete
    wait
done

# Calculate results
end_timestamp=$(date +%s)
total_runtime=$((end_timestamp - start_timestamp))

# Process results
if [ -f "/tmp/benchmark_results.txt" ]; then
    successful_uploads=$(grep -c "SUCCESS" /tmp/benchmark_results.txt || echo "0")
    failed_uploads=$(grep -c "FAILED" /tmp/benchmark_results.txt || echo "0")
    
    # Calculate average upload time
    if [ $successful_uploads -gt 0 ]; then
        avg_upload_time=$(grep "SUCCESS" /tmp/benchmark_results.txt | \
            cut -d' ' -f2 | \
            awk '{sum+=$1} END {print sum/NR}')
    else
        avg_upload_time=0
    fi
    
    rm -f /tmp/benchmark_results.txt
fi

# Calculate throughput metrics
files_per_second=$(echo "scale=2; $successful_uploads / $total_runtime" | bc)
estimated_records=$((successful_uploads * 3)) # 3 records per test file

# Display results
echo ""
echo "📊 BENCHMARK RESULTS"
echo "==================="
echo "Total runtime: ${total_runtime}s"
echo "Files processed: $TEST_FILES_COUNT"
echo "Successful uploads: $successful_uploads"
echo "Failed uploads: $failed_uploads"
echo "Success rate: $(echo "scale=1; $successful_uploads * 100 / $TEST_FILES_COUNT" | bc)%"
echo "Average upload time: ${avg_upload_time}s"
echo "Files per second: $files_per_second"
echo "Estimated records processed: $estimated_records"
echo "Records per second: $(echo "scale=2; $estimated_records / $total_runtime" | bc)"
echo ""

# Performance assessment
if (( $(echo "$files_per_second > 5" | bc -l) )); then
    echo "🚀 EXCELLENT: High throughput achieved"
elif (( $(echo "$files_per_second > 2" | bc -l) )); then
    echo "✅ GOOD: Acceptable throughput"
elif (( $(echo "$files_per_second > 0.5" | bc -l) )); then
    echo "⚠️  MODERATE: Consider optimization"
else
    echo "❌ POOR: Performance needs improvement"
fi

# Cleanup option
echo ""
read -p "🗑️  Remove benchmark files? (y/N): " cleanup_choice
if [[ $cleanup_choice =~ ^[Yy]$ ]]; then
    rm -rf "$BENCH_DIR"
    echo "✅ Benchmark files cleaned up"
fi

echo ""
echo "Benchmark complete! Results saved to terminal output."