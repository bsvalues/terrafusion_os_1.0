#!/bin/bash

set -e

function test_compression_requirements {
    echo "Checking compression requirements..."
    
    if ! command -v 7z &> /dev/null; then
        echo "❌ 7-Zip is not installed"
        return 1
    fi
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python is not installed"
        return 1
    fi
    
    return 0
}

function initialize_compression_environment {
    echo "Initializing compression environment..."
    
    mkdir -p models/compressed models/temp
}

function compress_model {
    local model_path="$1"
    local output_path="$2"
    
    echo "Compressing $model_path..."
    
    start_time=$(date +%s)
    original_size=$(stat -f%z "$model_path")
    
    temp_path="models/temp/$(basename "$model_path")"
    cp "$model_path" "$temp_path"
    
    7z a -t7z -m0=lzma2 -mx=9 "$output_path" "$temp_path"
    
    compressed_size=$(stat -f%z "$output_path")
    compression_ratio=$(echo "scale=2; ($original_size - $compressed_size) / $original_size * 100" | bc)
    compression_time=$(($(date +%s) - start_time))
    
    echo "✅ Compressed $model_path in ${compression_time} seconds"
    echo "   Original size: $(echo "scale=2; $original_size / 1048576" | bc) MB"
    echo "   Compressed size: $(echo "scale=2; $compressed_size / 1048576" | bc) MB"
    echo "   Compression ratio: ${compression_ratio}%"
    
    rm "$temp_path"
    
    echo "{\"status\":\"success\",\"original_size\":$original_size,\"compressed_size\":$compressed_size,\"compression_ratio\":$compression_ratio,\"compression_time\":$compression_time}"
}

function optimize_model {
    local model_path="$1"
    
    echo "Optimizing $model_path..."
    
    python_script=$(cat << 'EOF'
import torch
import os
import sys

def optimize_model(input_path, output_path):
    try:
        model = torch.load(input_path)
        model = model.half()
        torch.save(model, output_path)
        return True
    except Exception as e:
        print(f"Error optimizing model: {e}")
        return False

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = input_path.replace(".bin", "_optimized.bin")
    success = optimize_model(input_path, output_path)
    if success:
        print("Model optimization completed successfully")
    else:
        print("Model optimization failed")
EOF
)
    
    script_path="optimize_model.py"
    echo "$python_script" > "$script_path"
    
    start_time=$(date +%s)
    python3 "$script_path" "$model_path"
    optimization_time=$(($(date +%s) - start_time))
    
    optimized_path="${model_path%.bin}_optimized.bin"
    if [ -f "$optimized_path" ]; then
        echo "✅ Optimized $model_path in ${optimization_time} seconds"
        echo "{\"status\":\"success\",\"optimization_time\":$optimization_time}"
    else
        echo "❌ Optimization failed for $model_path"
        echo "{\"status\":\"error\",\"optimization_time\":0}"
    fi
    
    rm "$script_path"
}

function update_dashboard {
    local model_metrics="$1"
    
    echo "Updating build dashboard..."
    
    mkdir -p build-dashboard
    
    echo "{\"models\":$model_metrics,\"timestamp\":\"$(date '+%Y-%m-%d %H:%M:%S')\"}" > build-dashboard/compression-metrics.json
}

function main {
    echo "Starting model compression..."
    
    if ! test_compression_requirements; then
        echo "❌ Compression requirements not met"
        exit 1
    fi
    
    initialize_compression_environment
    
    models=(
        "models/gpt4all/gpt4all.bin"
        "models/mistral/mistral.bin"
    )
    
    model_metrics="["
    first=true
    
    for model in "${models[@]}"; do
        if [ -f "$model" ]; then
            if [ "$first" = true ]; then
                first=false
            else
                model_metrics+=","
            fi
            
            optimization_metrics=$(optimize_model "$model")
            compressed_path="models/compressed/$(basename "$model")"
            compression_metrics=$(compress_model "${model%.bin}_optimized.bin" "$compressed_path")
            
            model_metrics+="{\"name\":\"$(basename "$model")\",\"optimization\":$optimization_metrics,\"compression\":$compression_metrics}"
        else
            echo "❌ Model not found: $model"
        fi
    done
    
    model_metrics+="]"
    update_dashboard "$model_metrics"
    
    echo "✅ Model compression completed successfully!"
}

main 