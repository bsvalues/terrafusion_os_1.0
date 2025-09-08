use anyhow::Result;
use rayon::prelude::*;

#[derive(Debug)]
pub struct DataProcessor {
    batch_size: usize,
    cache: std::collections::HashMap<String, Vec<f64>>,
}

impl DataProcessor {
    pub async fn new() -> Result<Self> {
        Ok(Self {
            batch_size: 1000,
            cache: std::collections::HashMap::new(),
        })
    }
    
    pub async fn process_batch(&mut self, data: Vec<f64>, processing_type: &str) -> Result<Vec<f64>> {
        match processing_type {
            "normalize" => Ok(self.normalize_data(&data)),
            "standardize" => Ok(self.standardize_data(&data)),
            "smooth" => Ok(self.smooth_data(&data)),
            "filter" => Ok(self.filter_outliers(&data)),
            _ => Ok(data),
        }
    }
    
    fn normalize_data(&self, data: &[f64]) -> Vec<f64> {
        let min = data.iter().fold(f64::INFINITY, |a, &b| a.min(b));
        let max = data.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
        let range = max - min;
        
        if range == 0.0 {
            return vec![0.0; data.len()];
        }
        
        data.par_iter()
            .map(|&x| (x - min) / range)
            .collect()
    }
    
    fn standardize_data(&self, data: &[f64]) -> Vec<f64> {
        let mean = data.iter().sum::<f64>() / data.len() as f64;
        let variance = data.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / data.len() as f64;
        let std_dev = variance.sqrt();
        
        if std_dev == 0.0 {
            return vec![0.0; data.len()];
        }
        
        data.par_iter()
            .map(|&x| (x - mean) / std_dev)
            .collect()
    }
    
    fn smooth_data(&self, data: &[f64]) -> Vec<f64> {
        let window_size = 5.min(data.len());
        let mut smoothed = Vec::with_capacity(data.len());
        
        for i in 0..data.len() {
            let start = if i >= window_size / 2 { i - window_size / 2 } else { 0 };
            let end = (i + window_size / 2 + 1).min(data.len());
            let window_mean = data[start..end].iter().sum::<f64>() / (end - start) as f64;
            smoothed.push(window_mean);
        }
        
        smoothed
    }
    
    fn filter_outliers(&self, data: &[f64]) -> Vec<f64> {
        let sorted_data: Vec<f64> = {
            let mut sorted = data.to_vec();
            sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
            sorted
        };
        
        let q1_idx = sorted_data.len() / 4;
        let q3_idx = 3 * sorted_data.len() / 4;
        let q1 = sorted_data[q1_idx];
        let q3 = sorted_data[q3_idx];
        let iqr = q3 - q1;
        let lower_bound = q1 - 1.5 * iqr;
        let upper_bound = q3 + 1.5 * iqr;
        
        data.iter()
            .filter(|&&x| x >= lower_bound && x <= upper_bound)
            .copied()
            .collect()
    }
}