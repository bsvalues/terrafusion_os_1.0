# DevOps Plan for TerraMiner Data Intelligence Platform

## Executive Summary

This DevOps plan outlines the infrastructure, processes, and tools needed to transform TerraMiner from a basic real estate data platform into a comprehensive data intelligence system with robust data processing, statistical analysis capabilities, and machine learning integration. The plan is divided into phases with clear milestones, focusing on establishing a reliable data pipeline foundation before advancing to more complex analytical features.

## Phase 1: Infrastructure Foundation (Weeks 1-4)

### 1.1 Containerization Strategy

**Goal**: Establish consistent development, testing, and production environments.

**Implementation**:
- Create Docker images for different service components:
  ```dockerfile
  # Example Dockerfile for the data processing service
  FROM python:3.11-slim
  
  WORKDIR /app
  
  COPY requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  
  COPY . .
  
  CMD ["gunicorn", "--bind", "0.0.0.0:5000", "main:app"]
  ```
- Develop Docker Compose configuration for local development:
  ```yaml
  # docker-compose.yml
  version: '3.8'
  
  services:
    web:
      build: .
      ports:
        - "5000:5000"
      depends_on:
        - db
        - redis
      env_file:
        - .env
        
    db:
      image: postgres:14
      volumes:
        - postgres_data:/var/lib/postgresql/data
      environment:
        - POSTGRES_PASSWORD=postgres
        - POSTGRES_USER=postgres
        - POSTGRES_DB=terraminer
        
    redis:
      image: redis:alpine
      volumes:
        - redis_data:/data
  
  volumes:
    postgres_data:
    redis_data:
  ```

### 1.2 Database Infrastructure

**Goal**: Implement analytical-optimized database architecture.

**Implementation**:
- Set up PostgreSQL with TimescaleDB extension for time-series data:
  ```sql
  -- Initialize TimescaleDB
  CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
  
  -- Create hypertable for property price history
  CREATE TABLE property_price_history (
    property_id VARCHAR NOT NULL,
    recorded_date TIMESTAMP NOT NULL,
    price NUMERIC NOT NULL,
    event_type VARCHAR NOT NULL,
    source VARCHAR NOT NULL
  );
  
  SELECT create_hypertable('property_price_history', 'recorded_date');
  ```
- Implement data partitioning strategy for large tables
- Configure read replicas for analytical workloads
- Set up database migration system with Alembic:
  ```python
  # alembic/env.py configuration
  from alembic import context
  from sqlalchemy import engine_from_config, pool
  
  from models import Base
  
  target_metadata = Base.metadata
  
  def run_migrations_online():
      """Run migrations in 'online' mode."""
      connectable = engine_from_config(...)
      with connectable.connect() as connection:
          context.configure(connection=connection, target_metadata=target_metadata)
          with context.begin_transaction():
              context.run_migrations()
  ```

### 1.3 CI/CD Pipeline Setup

**Goal**: Establish automated testing and deployment workflows.

**Implementation**:
- Set up GitHub Actions for continuous integration:
  ```yaml
  # .github/workflows/ci.yml
  name: Continuous Integration
  
  on:
    push:
      branches: [ main, develop ]
    pull_request:
      branches: [ main, develop ]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      
      services:
        postgres:
          image: postgres:14
          env:
            POSTGRES_PASSWORD: postgres
            POSTGRES_USER: postgres
            POSTGRES_DB: test_terraminer
          ports:
            - 5432:5432
          options: >-
            --health-cmd pg_isready
            --health-interval 10s
            --health-timeout 5s
            --health-retries 5
      
      steps:
        - uses: actions/checkout@v3
        - name: Set up Python
          uses: actions/setup-python@v4
          with:
            python-version: '3.11'
        - name: Install dependencies
          run: |
            python -m pip install --upgrade pip
            pip install -r requirements.txt
            pip install pytest pytest-cov
        - name: Run tests
          run: |
            pytest --cov=. --cov-report=xml
          env:
            DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_terraminer
        - name: Upload coverage
          uses: codecov/codecov-action@v3
  ```
- Configure deployment pipeline with infrastructure-as-code:
  ```yaml
  # .github/workflows/deploy.yml
  name: Deploy
  
  on:
    push:
      branches: [ main ]
      
  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Configure AWS credentials
          uses: aws-actions/configure-aws-credentials@v1
          with:
            aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
            aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            aws-region: us-west-2
        - name: Build and push Docker image
          run: |
            aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ${{ secrets.ECR_REPOSITORY }}
            docker build -t ${{ secrets.ECR_REPOSITORY }}:${{ github.sha }} .
            docker tag ${{ secrets.ECR_REPOSITORY }}:${{ github.sha }} ${{ secrets.ECR_REPOSITORY }}:latest
            docker push ${{ secrets.ECR_REPOSITORY }}:${{ github.sha }}
            docker push ${{ secrets.ECR_REPOSITORY }}:latest
        - name: Deploy to ECS
          run: |
            aws ecs update-service --cluster terraminer --service terraminer-web --force-new-deployment
  ```

### 1.4 Monitoring and Observability

**Goal**: Establish comprehensive system monitoring for data flows.

**Implementation**:
- Implement Prometheus for metrics collection:
  ```python
  # In app.py
  from prometheus_flask_exporter import PrometheusMetrics
  
  metrics = PrometheusMetrics(app)
  
  # Static information as metric
  metrics.info('app_info', 'Application info', version='1.0.0')
  
  # Custom metrics for data pipeline monitoring
  etl_duration = metrics.summary('etl_duration_seconds', 'ETL job duration in seconds', labels={'job': 'label'})
  ```
- Set up Grafana dashboards for data pipeline monitoring:
  - ETL job status and duration
  - Data processing rates
  - Error rates by pipeline stage
- Implement distributed tracing with Jaeger:
  ```python
  # In app.py
  from opentelemetry import trace
  from opentelemetry.instrumentation.flask import FlaskInstrumentor
  from opentelemetry.sdk.trace import TracerProvider
  from opentelemetry.sdk.trace.export import BatchSpanProcessor
  from opentelemetry.exporter.jaeger.thrift import JaegerExporter
  
  # Set up tracing
  trace.set_tracer_provider(TracerProvider())
  tracer = trace.get_tracer(__name__)
  
  # Configure Jaeger exporter
  jaeger_exporter = JaegerExporter(
      agent_host_name="jaeger",
      agent_port=6831,
  )
  
  # Add span processor to the tracer
  trace.get_tracer_provider().add_span_processor(
      BatchSpanProcessor(jaeger_exporter)
  )
  
  # Instrument Flask
  FlaskInstrumentor().instrument_app(app)
  ```
- Configure alerting rules for data quality and pipeline health

## Phase 2: Data Pipeline Enhancement (Weeks 5-10)

### 2.1 ETL Orchestration

**Goal**: Implement a robust, scalable ETL orchestration system.

**Implementation**:
- Set up Apache Airflow for workflow orchestration:
  ```python
  # dags/property_data_etl.py
  from datetime import datetime, timedelta
  from airflow import DAG
  from airflow.operators.python import PythonOperator
  
  default_args = {
      'owner': 'terraminer',
      'depends_on_past': False,
      'start_date': datetime(2025, 4, 1),
      'email_on_failure': True,
      'email_on_retry': False,
      'retries': 3,
      'retry_delay': timedelta(minutes=5)
  }
  
  with DAG(
      'property_data_etl',
      default_args=default_args,
      description='ETL process for property data',
      schedule_interval=timedelta(days=1),
  ) as dag:
      
      extract_task = PythonOperator(
          task_id='extract_property_data',
          python_callable=extract_property_data,
          provide_context=True,
      )
      
      transform_task = PythonOperator(
          task_id='transform_property_data',
          python_callable=transform_property_data,
          provide_context=True,
      )
      
      load_task = PythonOperator(
          task_id='load_property_data',
          python_callable=load_property_data,
          provide_context=True,
      )
      
      validate_task = PythonOperator(
          task_id='validate_property_data',
          python_callable=validate_property_data,
          provide_context=True,
      )
      
      extract_task >> transform_task >> load_task >> validate_task
  ```
- Implement data quality validation with Great Expectations:
  ```python
  # In transform_property_data function
  import great_expectations as ge
  
  def transform_property_data(**context):
      # Get data from XCom
      raw_data = context['ti'].xcom_pull(task_ids='extract_property_data')
      
      # Convert to Great Expectations DataFrame
      df = ge.from_pandas(raw_data)
      
      # Define and validate expectations
      df.expect_column_values_to_not_be_null("property_id")
      df.expect_column_values_to_be_between("price", min_value=1000, max_value=100000000)
      df.expect_column_values_to_match_regex("zip_code", r"^\d{5}(-\d{4})?$")
      
      # Get validation results
      validation_results = df.validate()
      
      # If validation fails, raise an exception
      if not validation_results.success:
          raise ValueError(f"Data validation failed: {validation_results.to_json_dict()}")
          
      # Perform transformations
      # ...
      
      return transformed_data
  ```
- Configure retry and error handling policies for pipeline resilience

### 2.2 Data Warehouse Implementation

**Goal**: Set up a proper data warehouse for analytical workloads.

**Implementation**:
- Design and implement star schema for property analytics:
  ```sql
  -- Fact table for property transactions
  CREATE TABLE fact_property_transactions (
      transaction_id SERIAL PRIMARY KEY,
      property_key INT NOT NULL REFERENCES dim_property(property_key),
      date_key INT NOT NULL REFERENCES dim_date(date_key),
      location_key INT NOT NULL REFERENCES dim_location(location_key),
      transaction_type_key INT NOT NULL REFERENCES dim_transaction_type(transaction_type_key),
      price NUMERIC NOT NULL,
      price_per_sqft NUMERIC NOT NULL,
      days_on_market INT
  );
  
  -- Dimension tables
  CREATE TABLE dim_property (
      property_key SERIAL PRIMARY KEY,
      property_id VARCHAR NOT NULL,
      bedrooms INT,
      bathrooms NUMERIC,
      sqft INT,
      year_built INT,
      property_type VARCHAR,
      effective_date DATE NOT NULL,
      expiration_date DATE
  );
  
  CREATE TABLE dim_location (
      location_key SERIAL PRIMARY KEY,
      zip_code VARCHAR,
      city VARCHAR,
      state VARCHAR,
      county VARCHAR,
      neighborhood VARCHAR,
      latitude NUMERIC,
      longitude NUMERIC,
      effective_date DATE NOT NULL,
      expiration_date DATE
  );
  ```
- Set up automated data warehouse loading processes
- Implement slowly changing dimension management
- Configure analytical views for common reporting needs

### 2.3 Data Processing Framework

**Goal**: Deploy a scalable data processing framework.

**Implementation**:
- Implement Apache Spark for large-scale data processing:
  ```python
  # etl/spark_processor.py
  from pyspark.sql import SparkSession
  from pyspark.sql.functions import col, explode, to_date
  
  def process_property_data(input_path, output_path):
      # Initialize Spark session
      spark = SparkSession.builder \
          .appName("TerraMiner Property Processing") \
          .config("spark.sql.warehouse.dir", "/warehouse") \
          .enableHiveSupport() \
          .getOrCreate()
      
      # Read data
      df = spark.read.json(input_path)
      
      # Perform transformations
      processed_df = df.filter(col("price").isNotNull()) \
          .withColumn("date", to_date(col("list_date"))) \
          .withColumn("year", year(col("date"))) \
          .withColumn("month", month(col("date"))) \
          .withColumn("property_age", year(current_date()) - col("year_built"))
      
      # Calculate aggregate metrics
      agg_df = processed_df.groupBy("zip_code", "year", "month") \
          .agg(
              avg("price").alias("avg_price"),
              avg("price_per_sqft").alias("avg_price_per_sqft"),
              count("*").alias("property_count")
          )
      
      # Write results
      agg_df.write.partitionBy("year", "month").parquet(f"{output_path}/aggregates")
      processed_df.write.partitionBy("year", "month").parquet(f"{output_path}/processed")
      
      spark.stop()
  ```
- Set up Kubernetes for batch processing jobs:
  ```yaml
  # k8s/spark-job.yaml
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: property-data-processing
  spec:
    template:
      spec:
        containers:
        - name: spark-job
          image: terraminer/spark-processor:latest
          command: ["/bin/sh", "-c"]
          args:
          - >
            spark-submit 
            --master k8s://https://kubernetes.default.svc.cluster.local:443
            --deploy-mode cluster
            --conf spark.executor.instances=3
            --conf spark.kubernetes.container.image=terraminer/spark-processor:latest
            /app/etl/spark_processor.py
          env:
          - name: INPUT_PATH
            value: "s3://terraminer-data/raw/2025/04/30/"
          - name: OUTPUT_PATH
            value: "s3://terraminer-data/processed/2025/04/30/"
        restartPolicy: Never
  ```
- Implement backfill and incremental processing capabilities

## Phase 3: Statistical Analysis Infrastructure (Weeks 11-16)

### 3.1 Statistical Computing Environment

**Goal**: Set up a robust statistical computing environment.

**Implementation**:
- Deploy JupyterHub for data exploration and analysis:
  ```yaml
  # helm-jupyterhub.yaml
  config:
    Authenticator:
      admin_users:
        - admin
      allowed_users:
        - analyst1
        - analyst2
        - datascientist1
    KubeSpawner:
      image: terraminer/datascience-notebook:latest
      cpu_limit: 2
      mem_limit: '4G'
      environment:
        DATABASE_URL: postgresql://jupyteruser:password@analytics-db:5432/analytics
    Spawner:
      default_url: "/lab"
    JupyterHub:
      authenticator_class: jupyterhub.auth.PAMAuthenticator
  ```
- Create containerized analytics environment:
  ```dockerfile
  # Dockerfile.datascience
  FROM jupyter/datascience-notebook:latest
  
  USER root
  
  # Install system dependencies
  RUN apt-get update && apt-get install -y \
      postgresql-client \
      libpq-dev \
      && apt-get clean && rm -rf /var/lib/apt/lists/*
  
  USER $NB_UID
  
  # Install Python packages
  COPY requirements-ds.txt /tmp/
  RUN pip install --no-cache-dir -r /tmp/requirements-ds.txt
  
  # Install Jupyter extensions
  RUN jupyter labextension install @jupyterlab/git
  
  # Configure startup
  COPY start-notebook.sh /usr/local/bin/
  RUN chmod +x /usr/local/bin/start-notebook.sh
  
  ENTRYPOINT ["tini", "-g", "--", "/usr/local/bin/start-notebook.sh"]
  ```
- Setup R Studio Server for statistical modeling

### 3.2 Real-time Analytics Infrastructure

**Goal**: Enable real-time data analysis.

**Implementation**:
- Implement streaming data processing with Kafka and Spark Streaming:
  ```python
  # streaming/property_streaming.py
  from pyspark.sql import SparkSession
  from pyspark.sql.functions import *
  from pyspark.sql.types import *
  
  def process_streaming_data():
      # Initialize Spark session with Kafka
      spark = SparkSession.builder \
          .appName("TerraMiner Streaming") \
          .config("spark.sql.streaming.checkpointLocation", "/checkpoint") \
          .getOrCreate()
      
      # Define schema for JSON messages
      schema = StructType([
          StructField("property_id", StringType(), True),
          StructField("price", DoubleType(), True),
          StructField("event_type", StringType(), True),
          StructField("timestamp", TimestampType(), True),
          # Other fields...
      ])
      
      # Read from Kafka
      df = spark \
          .readStream \
          .format("kafka") \
          .option("kafka.bootstrap.servers", "kafka:9092") \
          .option("subscribe", "property-events") \
          .load()
      
      # Parse JSON data
      parsed_df = df \
          .select(from_json(col("value").cast("string"), schema).alias("data")) \
          .select("data.*")
      
      # Process data - calculate windowed metrics
      windowed_stats = parsed_df \
          .withWatermark("timestamp", "1 hour") \
          .groupBy(
              window(col("timestamp"), "10 minutes", "5 minutes"),
              col("event_type")
          ) \
          .agg(
              count("*").alias("event_count"),
              avg("price").alias("avg_price")
          )
      
      # Output to console for testing
      query = windowed_stats \
          .writeStream \
          .outputMode("append") \
          .format("console") \
          .start()
      
      # In production, write to database or other sink
      sink_query = windowed_stats \
          .writeStream \
          .foreachBatch(lambda batch_df, batch_id: batch_df.write \
              .format("jdbc") \
              .option("url", "jdbc:postgresql://analytics-db:5432/analytics") \
              .option("dbtable", "streaming_property_stats") \
              .option("user", "sparkuser") \
              .option("password", "password") \
              .mode("append") \
              .save()
          ) \
          .start()
      
      query.awaitTermination()
  ```
- Set up Redis for real-time caching:
  ```python
  # services/cache_service.py
  import redis
  import json
  from datetime import timedelta
  
  class CacheService:
      def __init__(self, host='redis', port=6379, db=0):
          self.redis = redis.Redis(host=host, port=port, db=db)
          
      def get_property_stats(self, zip_code):
          """Get cached property statistics for a zip code."""
          cache_key = f"property_stats:{zip_code}"
          cached_data = self.redis.get(cache_key)
          
          if cached_data:
              return json.loads(cached_data)
          return None
          
      def set_property_stats(self, zip_code, stats, expiry=timedelta(hours=1)):
          """Cache property statistics with expiration."""
          cache_key = f"property_stats:{zip_code}"
          self.redis.setex(
              cache_key,
              expiry,
              json.dumps(stats)
          )
          
      def invalidate_property_stats(self, zip_code=None):
          """Invalidate property statistics cache for a zip code or all zip codes."""
          if zip_code:
              self.redis.delete(f"property_stats:{zip_code}")
          else:
              for key in self.redis.scan_iter("property_stats:*"):
                  self.redis.delete(key)
  ```
- Configure real-time data dashboards with Dash or Plotly

### 3.3 Statistical Models Integration

**Goal**: Deploy statistical models as services.

**Implementation**:
- Develop REST API for statistical models:
  ```python
  # api/stats_api.py
  from flask import Blueprint, request, jsonify
  from statsmodels.tsa.arima.model import ARIMA
  import pandas as pd
  import numpy as np
  
  stats_api = Blueprint('stats_api', __name__)
  
  @stats_api.route('/api/stats/time_series_forecast', methods=['POST'])
  def time_series_forecast():
      data = request.json
      
      if not data or 'values' not in data:
          return jsonify({'error': 'No time series data provided'}), 400
          
      try:
          # Convert to pandas series
          series = pd.Series(data['values'])
          
          # Fit ARIMA model
          model = ARIMA(series, order=(5,1,0))
          model_fit = model.fit()
          
          # Forecast
          forecast_periods = data.get('forecast_periods', 12)
          forecast = model_fit.forecast(steps=forecast_periods)
          
          # Calculate confidence intervals
          confidence = data.get('confidence', 0.95)
          conf_int = model_fit.get_forecast(steps=forecast_periods).conf_int(alpha=1-confidence)
          
          return jsonify({
              'forecast': forecast.tolist(),
              'lower_bound': conf_int.iloc[:, 0].tolist(),
              'upper_bound': conf_int.iloc[:, 1].tolist()
          })
      except Exception as e:
          return jsonify({'error': str(e)}), 500
  ```
- Implement model versioning and serving with MLflow:
  ```python
  # ml/train_model.py
  import mlflow
  import mlflow.sklearn
  from sklearn.ensemble import RandomForestRegressor
  from sklearn.metrics import mean_squared_error
  import pandas as pd
  
  def train_valuation_model(training_data_path):
      # Set MLflow tracking URI
      mlflow.set_tracking_uri("http://mlflow:5000")
      mlflow.set_experiment("property-valuation")
      
      # Load and prepare data
      data = pd.read_csv(training_data_path)
      X = data.drop(['price'], axis=1)
      y = data['price']
      
      # Train model with parameter logging
      with mlflow.start_run():
          # Log parameters
          params = {
              'n_estimators': 100,
              'max_depth': 10,
              'min_samples_split': 5
          }
          mlflow.log_params(params)
          
          # Train model
          model = RandomForestRegressor(**params)
          model.fit(X, y)
          
          # Log metrics
          preds = model.predict(X)
          mse = mean_squared_error(y, preds)
          mlflow.log_metric("mse", mse)
          
          # Log feature importance
          for i, col in enumerate(X.columns):
              mlflow.log_metric(f"feature_importance_{col}", model.feature_importances_[i])
          
          # Save model
          mlflow.sklearn.log_model(model, "random_forest_model")
          
          print(f"Model trained and logged to MLflow with run_id: {mlflow.active_run().info.run_id}")
  ```
- Create API layer for accessing statistical insights

## Phase 4: Machine Learning Infrastructure (Weeks 17-24)

### 4.1 Feature Engineering Pipeline

**Goal**: Establish automated feature engineering processes.

**Implementation**:
- Implement feature store with Feast:
  ```python
  # feature_store/features.py
  from datetime import timedelta
  from feast import Entity, Feature, FeatureView, ValueType, FileSource
  
  # Define an entity for properties
  property = Entity(
      name="property_id",
      description="Property identifier",
      value_type=ValueType.STRING,
  )
  
  # Define property feature source (from processed data)
  property_source = FileSource(
      path="s3://terraminer-data/features/property_features.parquet",
      event_timestamp_column="event_timestamp",
  )
  
  # Define property features
  property_features = FeatureView(
      name="property_features",
      entities=["property_id"],
      ttl=timedelta(days=90),
      features=[
          Feature(name="bedrooms", dtype=ValueType.INT64),
          Feature(name="bathrooms", dtype=ValueType.FLOAT),
          Feature(name="sqft", dtype=ValueType.INT64),
          Feature(name="year_built", dtype=ValueType.INT64),
          Feature(name="lot_size", dtype=ValueType.FLOAT),
          Feature(name="days_on_market", dtype=ValueType.INT64),
      ],
      online=True,
      batch_source=property_source,
      tags={"team": "data_science"},
  )
  
  # Define location source
  location_source = FileSource(
      path="s3://terraminer-data/features/location_features.parquet",
      event_timestamp_column="event_timestamp",
  )
  
  # Define location features
  location_features = FeatureView(
      name="location_features",
      entities=["property_id"],
      ttl=timedelta(days=90),
      features=[
          Feature(name="median_income", dtype=ValueType.FLOAT),
          Feature(name="crime_rate", dtype=ValueType.FLOAT),
          Feature(name="school_rating", dtype=ValueType.FLOAT),
          Feature(name="walkability_score", dtype=ValueType.FLOAT),
      ],
      online=True,
      batch_source=location_source,
      tags={"team": "data_science"},
  )
  ```
- Create automated feature generation pipelines:
  ```python
  # feature_generation/generate_property_features.py
  import pandas as pd
  import numpy as np
  from datetime import datetime
  
  def generate_property_features(input_path, output_path):
      """Generate property features from raw property data."""
      # Load raw data
      df = pd.read_parquet(input_path)
      
      # Create timestamp for feature store
      df['event_timestamp'] = datetime.now()
      
      # Feature: property age
      df['property_age'] = datetime.now().year - df['year_built']
      
      # Feature: price per bedroom
      df['price_per_bedroom'] = df['price'] / df['bedrooms']
      
      # Feature: price per bathroom
      df['price_per_bathroom'] = df['price'] / df['bathrooms']
      
      # Feature: total rooms
      df['total_rooms'] = df['bedrooms'] + df['bathrooms'].apply(lambda x: int(x))
      
      # Feature: has_garage (binary)
      df['has_garage'] = df['garage_spaces'].apply(lambda x: 1 if x > 0 else 0)
      
      # Feature: property size category
      df['size_category'] = pd.cut(
          df['sqft'],
          bins=[0, 1000, 2000, 3000, 5000, np.inf],
          labels=['tiny', 'small', 'medium', 'large', 'mansion']
      )
      
      # Feature: days since last sale
      df['days_since_last_sale'] = (datetime.now() - pd.to_datetime(df['last_sale_date'])).dt.days
      
      # Save features
      df.to_parquet(output_path)
  ```
- Implement feature monitoring and validation

### 4.2 Model Development Environment

**Goal**: Set up infrastructure for model development and experimentation.

**Implementation**:
- Configure MLflow for experiment tracking:
  ```yaml
  # docker-compose.mlflow.yml
  version: '3'
  
  services:
    mlflow:
      image: ghcr.io/mlflow/mlflow:latest
      ports:
        - "5000:5000"
      command: mlflow server --host 0.0.0.0 --backend-store-uri postgresql://mlflow:mlflow@db:5432/mlflow --default-artifact-root s3://terraminer-mlflow/artifacts
      environment:
        - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
        - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
        - MLFLOW_S3_ENDPOINT_URL=${MLFLOW_S3_ENDPOINT_URL}
      depends_on:
        - db
  
    db:
      image: postgres:14
      environment:
        - POSTGRES_USER=mlflow
        - POSTGRES_PASSWORD=mlflow
        - POSTGRES_DB=mlflow
      volumes:
        - mlflow-db-data:/var/lib/postgresql/data
  
  volumes:
    mlflow-db-data:
  ```
- Set up GPU-enabled workstations for model training:
  ```dockerfile
  # Dockerfile.tensorflow-gpu
  FROM tensorflow/tensorflow:latest-gpu
  
  # Install system dependencies
  RUN apt-get update && apt-get install -y \
      git \
      wget \
      && apt-get clean && rm -rf /var/lib/apt/lists/*
  
  # Install Python packages
  COPY requirements-ml.txt /tmp/
  RUN pip install --no-cache-dir -r /tmp/requirements-ml.txt
  
  # Set up working directory
  WORKDIR /workspace
  
  # Set up Jupyter
  EXPOSE 8888
  CMD ["jupyter", "lab", "--ip=0.0.0.0", "--allow-root", "--no-browser"]
  ```
- Implement automated hyperparameter tuning with Optuna:
  ```python
  # ml/hyperparameter_tuning.py
  import optuna
  from sklearn.ensemble import RandomForestRegressor
  from sklearn.model_selection import cross_val_score
  import pandas as pd
  import mlflow
  
  def objective(trial):
      # Load data (cached in memory)
      X_train = pd.read_parquet("data/X_train.parquet")
      y_train = pd.read_parquet("data/y_train.parquet").values.ravel()
      
      # Define hyperparameters to tune
      params = {
          'n_estimators': trial.suggest_int('n_estimators', 50, 300),
          'max_depth': trial.suggest_int('max_depth', 3, 15),
          'min_samples_split': trial.suggest_int('min_samples_split', 2, 10),
          'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 5),
          'bootstrap': trial.suggest_categorical('bootstrap', [True, False])
      }
      
      # Create model
      model = RandomForestRegressor(**params, n_jobs=-1, random_state=42)
      
      # Evaluate using cross-validation
      score = cross_val_score(model, X_train, y_train, cv=5, scoring='neg_mean_squared_error').mean()
      
      # Log to MLflow
      with mlflow.start_run(nested=True):
          mlflow.log_params(params)
          mlflow.log_metric('neg_mse', score)
      
      return score
  
  def run_hyperparameter_tuning(n_trials=100):
      mlflow.set_tracking_uri("http://mlflow:5000")
      mlflow.set_experiment("property-valuation-tuning")
      
      with mlflow.start_run():
          study = optuna.create_study(direction='maximize')
          study.optimize(objective, n_trials=n_trials)
          
          # Log best parameters
          mlflow.log_params(study.best_params)
          mlflow.log_metric('best_score', study.best_value)
          
          # Train final model with best parameters
          X_train = pd.read_parquet("data/X_train.parquet")
          y_train = pd.read_parquet("data/y_train.parquet").values.ravel()
          
          model = RandomForestRegressor(**study.best_params, n_jobs=-1, random_state=42)
          model.fit(X_train, y_train)
          
          # Save model
          mlflow.sklearn.log_model(model, "random_forest_model")
          
          print(f"Best parameters: {study.best_params}")
          print(f"Best score: {study.best_value}")
  ```

### 4.3 Model Deployment Infrastructure

**Goal**: Set up robust model serving and monitoring.

**Implementation**:
- Deploy models with KFServing:
  ```yaml
  # k8s/model-serving.yaml
  apiVersion: serving.kserve.io/v1beta1
  kind: InferenceService
  metadata:
    name: property-valuation
    namespace: terraminer
  spec:
    predictor:
      tensorflow:
        storageUri: "s3://terraminer-models/property-valuation/model/1"
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
  ```
- Implement model registry and versioning:
  ```python
  # ml/register_model.py
  import mlflow
  from mlflow.tracking import MlflowClient
  
  def register_model(run_id, model_name="property-valuation"):
      """Register a model from a run to the MLflow Model Registry."""
      client = MlflowClient()
      
      # Register model from run
      result = mlflow.register_model(
          f"runs:/{run_id}/random_forest_model",
          model_name
      )
      
      print(f"Model registered as: {result.name} version: {result.version}")
      
      # Set model stage to Production if it passes validation
      if validate_model(model_name, result.version):
          client.transition_model_version_stage(
              name=model_name,
              version=result.version,
              stage="Production"
          )
          print(f"Model {model_name} version {result.version} transitioned to Production")
      else:
          print(f"Model {model_name} version {result.version} validation failed")
  
  def validate_model(model_name, version):
      """Validate model meets performance requirements."""
      client = MlflowClient()
      
      # Get run ID
      model_version = client.get_model_version(model_name, version)
      run_id = model_version.run_id
      
      # Get metrics
      run = client.get_run(run_id)
      metrics = run.data.metrics
      
      # Define validation thresholds
      mse_threshold = 1000000  # Example threshold
      
      # Perform validation
      if metrics.get("mse", float("inf")) < mse_threshold:
          return True
      
      return False
  ```
- Set up model monitoring and drift detection:
  ```python
  # monitoring/model_monitoring.py
  import pandas as pd
  import numpy as np
  from scipy.stats import ks_2samp
  from datetime import datetime
  
  class ModelMonitor:
      def __init__(self, reference_data_path, drift_threshold=0.05):
          """
          Initialize model monitor with reference data.
          
          Args:
              reference_data_path: Path to reference data used for training
              drift_threshold: p-value threshold for drift detection
          """
          self.reference_data = pd.read_parquet(reference_data_path)
          self.drift_threshold = drift_threshold
          
      def check_drift(self, current_data_path):
          """
          Check for data drift between reference and current data.
          
          Args:
              current_data_path: Path to current data
              
          Returns:
              dict: Drift detection results
          """
          current_data = pd.read_parquet(current_data_path)
          
          # Initialize results
          drift_results = {
              'timestamp': datetime.now().isoformat(),
              'overall_drift_detected': False,
              'features': {}
          }
          
          # Check each feature for drift
          for feature in self.reference_data.columns:
              # Skip non-numeric features
              if not np.issubdtype(self.reference_data[feature].dtype, np.number):
                  continue
                  
              # Perform Kolmogorov-Smirnov test
              ks_result = ks_2samp(
                  self.reference_data[feature].dropna(), 
                  current_data[feature].dropna()
              )
              
              # Determine if drift is detected
              drift_detected = ks_result.pvalue < self.drift_threshold
              
              # Store results
              drift_results['features'][feature] = {
                  'drift_detected': drift_detected,
                  'p_value': ks_result.pvalue,
                  'statistic': ks_result.statistic
              }
              
              # Update overall drift flag
              if drift_detected:
                  drift_results['overall_drift_detected'] = True
          
          return drift_results
  ```

## Phase 5: System Integration and Testing (Weeks 25-30)

### 5.1 API Layer Development

**Goal**: Develop robust API layer for data access.

**Implementation**:
- Implement GraphQL API for flexible data querying:
  ```python
  # api/graphql_api.py
  from flask import Blueprint
  from ariadne import QueryType, MutationType, gql, make_executable_schema
  from ariadne.constants import PLAYGROUND_HTML
  from ariadne.flask import graphql_sync
  
  # Define schema
  type_defs = gql("""
      type Property {
          id: ID!
          address: String!
          city: String!
          state: String!
          zipCode: String!
          price: Float
          bedrooms: Int
          bathrooms: Float
          sqft: Int
          yearBuilt: Int
          propertyType: String
          lotSize: Float
          daysOnMarket: Int
          lastSaleDate: String
          lastSalePrice: Float
          taxHistory: [TaxRecord]
          priceHistory: [PriceRecord]
      }
      
      type TaxRecord {
          year: Int!
          amount: Float!
          change: Float
      }
      
      type PriceRecord {
          date: String!
          price: Float!
          event: String!
      }
      
      type PropertyStats {
          zipCode: String!
          medianPrice: Float
          averagePrice: Float
          averagePricePerSqft: Float
          propertyCount: Int
          averageDaysOnMarket: Int
      }
      
      type Query {
          property(id: ID!): Property
          searchProperties(
              location: String, 
              minPrice: Float, 
              maxPrice: Float, 
              bedrooms: Int, 
              bathrooms: Float,
              minSqft: Int,
              maxSqft: Int,
              propertyType: String,
              limit: Int = 10,
              offset: Int = 0
          ): [Property]
          propertyStats(zipCode: String!, period: String = "1y"): PropertyStats
      }
  """)
  
  # Define resolvers
  query = QueryType()
  
  @query.field("property")
  def resolve_property(_, info, id):
      # Database logic here
      from models import Property
      return Property.query.get(id)
  
  @query.field("searchProperties")
  def resolve_search_properties(_, info, location=None, minPrice=None, maxPrice=None, 
                               bedrooms=None, bathrooms=None, minSqft=None, maxSqft=None,
                               propertyType=None, limit=10, offset=0):
      # Database logic here
      from models import Property
      from sqlalchemy import and_
      
      filters = []
      if location:
          filters.append(Property.city.ilike(f"%{location}%") | 
                        Property.state.ilike(f"%{location}%") |
                        Property.zip_code.ilike(f"%{location}%"))
      if minPrice:
          filters.append(Property.price >= minPrice)
      if maxPrice:
          filters.append(Property.price <= maxPrice)
      if bedrooms:
          filters.append(Property.bedrooms == bedrooms)
      if bathrooms:
          filters.append(Property.bathrooms == bathrooms)
      if minSqft:
          filters.append(Property.sqft >= minSqft)
      if maxSqft:
          filters.append(Property.sqft <= maxSqft)
      if propertyType:
          filters.append(Property.property_type == propertyType)
          
      return Property.query.filter(and_(*filters)).limit(limit).offset(offset).all()
  
  @query.field("propertyStats")
  def resolve_property_stats(_, info, zipCode, period="1y"):
      # Database logic here
      from models import PropertyStats
      return PropertyStats.query.filter_by(zip_code=zipCode, period=period).first()
  
  # Create executable schema
  schema = make_executable_schema(type_defs, query)
  
  # Blueprint for GraphQL API
  graphql_bp = Blueprint('graphql', __name__)
  
  @graphql_bp.route('/graphql', methods=['GET'])
  def graphql_playground():
      return PLAYGROUND_HTML, 200
  
  @graphql_bp.route('/graphql', methods=['POST'])
  def graphql_server():
      return graphql_sync(schema, request.json, context_value=request, debug=app.debug)
  ```
- Implement REST API with OpenAPI documentation:
  ```python
  # api/rest_api.py
  from flask import Blueprint, request, jsonify
  from flask_restx import Api, Resource, fields
  from models import Property, PropertyStats
  
  # Blueprint for REST API
  rest_api_bp = Blueprint('rest_api', __name__)
  api = Api(rest_api_bp, version='1.0', title='TerraMiner API',
          description='TerraMiner REST API for property data access')
  
  # Define namespaces
  ns_properties = api.namespace('properties', description='Property operations')
  ns_stats = api.namespace('stats', description='Property statistics operations')
  
  # Models
  property_model = api.model('Property', {
      'id': fields.String(required=True, description='Property ID'),
      'address': fields.String(required=True, description='Street address'),
      'city': fields.String(required=True, description='City'),
      'state': fields.String(required=True, description='State'),
      'zip_code': fields.String(required=True, description='ZIP code'),
      'price': fields.Float(description='Current price'),
      'bedrooms': fields.Integer(description='Number of bedrooms'),
      'bathrooms': fields.Float(description='Number of bathrooms'),
      'sqft': fields.Integer(description='Square footage'),
      'year_built': fields.Integer(description='Year built'),
      'property_type': fields.String(description='Property type'),
      'lot_size': fields.Float(description='Lot size in acres')
  })
  
  property_stats_model = api.model('PropertyStats', {
      'zip_code': fields.String(required=True, description='ZIP code'),
      'median_price': fields.Float(description='Median property price'),
      'average_price': fields.Float(description='Average property price'),
      'average_price_per_sqft': fields.Float(description='Average price per square foot'),
      'property_count': fields.Integer(description='Number of properties'),
      'average_days_on_market': fields.Integer(description='Average days on market')
  })
  
  # Endpoints
  @ns_properties.route('/<string:id>')
  @ns_properties.response(404, 'Property not found')
  class PropertyResource(Resource):
      @ns_properties.doc('get_property')
      @ns_properties.marshal_with(property_model)
      def get(self, id):
          """Get a property by ID"""
          property = Property.query.get(id)
          if property is None:
              api.abort(404, f"Property {id} not found")
          return property
  
  @ns_properties.route('/')
  class PropertyListResource(Resource):
      @ns_properties.doc('list_properties')
      @ns_properties.marshal_list_with(property_model)
      @ns_properties.param('location', 'Location (city, state, or ZIP)')
      @ns_properties.param('min_price', 'Minimum price')
      @ns_properties.param('max_price', 'Maximum price')
      @ns_properties.param('bedrooms', 'Number of bedrooms')
      @ns_properties.param('bathrooms', 'Number of bathrooms')
      @ns_properties.param('min_sqft', 'Minimum square footage')
      @ns_properties.param('max_sqft', 'Maximum square footage')
      @ns_properties.param('property_type', 'Property type')
      @ns_properties.param('limit', 'Maximum number of results', default=10)
      @ns_properties.param('offset', 'Result offset for pagination', default=0)
      def get(self):
          """Search for properties"""
          # Get query parameters
          location = request.args.get('location')
          min_price = request.args.get('min_price', type=float)
          max_price = request.args.get('max_price', type=float)
          bedrooms = request.args.get('bedrooms', type=int)
          bathrooms = request.args.get('bathrooms', type=float)
          min_sqft = request.args.get('min_sqft', type=int)
          max_sqft = request.args.get('max_sqft', type=int)
          property_type = request.args.get('property_type')
          limit = request.args.get('limit', 10, type=int)
          offset = request.args.get('offset', 0, type=int)
          
          # Build query
          query = Property.query
          
          # Apply filters
          if location:
              query = query.filter((Property.city.ilike(f'%{location}%')) | 
                                  (Property.state.ilike(f'%{location}%')) |
                                  (Property.zip_code.ilike(f'%{location}%')))
          if min_price:
              query = query.filter(Property.price >= min_price)
          if max_price:
              query = query.filter(Property.price <= max_price)
          if bedrooms:
              query = query.filter(Property.bedrooms == bedrooms)
          if bathrooms:
              query = query.filter(Property.bathrooms == bathrooms)
          if min_sqft:
              query = query.filter(Property.sqft >= min_sqft)
          if max_sqft:
              query = query.filter(Property.sqft <= max_sqft)
          if property_type:
              query = query.filter(Property.property_type == property_type)
          
          # Apply pagination
          properties = query.limit(limit).offset(offset).all()
          
          return properties
  
  @ns_stats.route('/zip/<string:zip_code>')
  @ns_stats.response(404, 'Statistics not found')
  class PropertyStatsResource(Resource):
      @ns_stats.doc('get_property_stats')
      @ns_stats.marshal_with(property_stats_model)
      @ns_stats.param('period', 'Time period (1y, 6m, 3m, 1m)', default='1y')
      def get(self, zip_code):
          """Get property statistics for a ZIP code"""
          period = request.args.get('period', '1y')
          stats = PropertyStats.query.filter_by(zip_code=zip_code, period=period).first()
          if stats is None:
              api.abort(404, f"Statistics for ZIP code {zip_code} not found")
          return stats
  ```
- Implement rate limiting and authentication for APIs:
  ```python
  # api/auth.py
  from flask import Blueprint, request, jsonify, current_app
  from functools import wraps
  import jwt
  from datetime import datetime, timedelta
  from models import ApiKey
  
  auth_bp = Blueprint('auth', __name__)
  
  def token_required(f):
      @wraps(f)
      def decorated(*args, **kwargs):
          token = None
          
          # Check if token is in headers
          if 'Authorization' in request.headers:
              auth_header = request.headers['Authorization']
              if auth_header.startswith('Bearer '):
                  token = auth_header[7:]
          
          if not token:
              return jsonify({'message': 'Token is missing'}), 401
          
          try:
              # Decode token
              data = jwt.decode(
                  token, 
                  current_app.config['SECRET_KEY'], 
                  algorithms=['HS256']
              )
              
              # Verify API key
              current_key = ApiKey.query.filter_by(key_id=data['key_id']).first()
              if not current_key or not current_key.active:
                  return jsonify({'message': 'Invalid or inactive API key'}), 401
              
          except:
              return jsonify({'message': 'Invalid token'}), 401
          
          return f(*args, **kwargs)
      
      return decorated
  
  @auth_bp.route('/api/auth/token', methods=['POST'])
  def get_token():
      auth = request.get_json()
      
      if not auth or not auth.get('key_id') or not auth.get('key_secret'):
          return jsonify({'message': 'Authentication required'}), 401
      
      key = ApiKey.query.filter_by(key_id=auth.get('key_id')).first()
      
      if not key or not key.active:
          return jsonify({'message': 'Invalid API key'}), 401
      
      if key.verify_secret(auth.get('key_secret')):
          # Create token
          token = jwt.encode({
              'key_id': key.key_id,
              'exp': datetime.utcnow() + timedelta(hours=24)
          }, current_app.config['SECRET_KEY'], algorithm='HS256')
          
          return jsonify({'token': token})
      
      return jsonify({'message': 'Could not verify API key'}), 401
  ```

### 5.2 System Integration

**Goal**: Integrate all components of the data intelligence platform.

**Implementation**:
- Design and implement system event bus with RabbitMQ:
  ```python
  # messaging/event_bus.py
  import pika
  import json
  import logging
  from functools import wraps
  
  class EventBus:
      def __init__(self, host='rabbitmq'):
          self.connection = pika.BlockingConnection(
              pika.ConnectionParameters(host=host)
          )
          self.channel = self.connection.channel()
          
          # Declare exchanges
          self.channel.exchange_declare(
              exchange='terraminer.events',
              exchange_type='topic',
              durable=True
          )
          
          self.logger = logging.getLogger(__name__)
      
      def publish(self, routing_key, message):
          """Publish an event to the bus."""
          try:
              self.channel.basic_publish(
                  exchange='terraminer.events',
                  routing_key=routing_key,
                  body=json.dumps(message),
                  properties=pika.BasicProperties(
                      delivery_mode=2,  # make message persistent
                      content_type='application/json'
                  )
              )
              self.logger.info(f"Published event to {routing_key}: {message}")
              return True
          except Exception as e:
              self.logger.error(f"Failed to publish event: {str(e)}")
              return False
      
      def subscribe(self, routing_key, queue_name=None, callback=None):
          """Subscribe to events matching the routing key."""
          # Create a queue if not provided
          if not queue_name:
              result = self.channel.queue_declare(queue='', exclusive=True)
              queue_name = result.method.queue
          else:
              self.channel.queue_declare(queue=queue_name, durable=True)
          
          # Bind the queue to the exchange
          self.channel.queue_bind(
              exchange='terraminer.events',
              queue=queue_name,
              routing_key=routing_key
          )
          
          # Set up callback if provided
          if callback:
              self.channel.basic_consume(
                  queue=queue_name,
                  on_message_callback=lambda ch, method, properties, body: callback(json.loads(body)),
                  auto_ack=True
              )
              self.logger.info(f"Subscribed to {routing_key} events on queue {queue_name}")
              return queue_name
          
          return queue_name
      
      def start_consuming(self):
          """Start consuming messages from all subscribed queues."""
          self.logger.info("Starting to consume messages")
          self.channel.start_consuming()
      
      def close(self):
          """Close the connection."""
          self.connection.close()
  
  # Decorator for event handlers
  def event_handler(event_bus, routing_key):
      def decorator(f):
          @wraps(f)
          def wrapper(*args, **kwargs):
              return f(*args, **kwargs)
          
          # Register the handler with the event bus
          queue_name = f.__name__ + '_queue'
          event_bus.subscribe(routing_key, queue_name, wrapper)
          
          return wrapper
      return decorator
  ```
- Implement distributed task processing with Celery:
  ```python
  # tasks/celery_config.py
  from celery import Celery
  
  app = Celery('terraminer',
               broker='pyamqp://guest@rabbitmq//',
               include=['tasks.etl_tasks', 'tasks.analysis_tasks', 'tasks.notification_tasks'])
  
  app.conf.update(
      task_serializer='json',
      accept_content=['json'],
      result_serializer='json',
      timezone='UTC',
      enable_utc=True,
  )
  
  # tasks/etl_tasks.py
  from .celery_config import app
  from etl.narrpr_scraper import NarrprScraper
  
  @app.task(bind=True, max_retries=3, soft_time_limit=3600)
  def run_property_scraper(self, username, password, location_ids=None, zip_codes=None):
      """Celery task to run the property scraper."""
      try:
          # Initialize scraper
          scraper = NarrprScraper(username, password)
          
          # Login
          login_success = scraper.login()
          if not login_success:
              raise ValueError("Failed to login to NARRPR")
          
          # Scrape data
          if location_ids:
              for location_id in location_ids:
                  scraper.scrape_location(location_id)
                  
          if zip_codes:
              for zip_code in zip_codes:
                  scraper.scrape_zip_code(zip_code)
          
          # Get results
          results = scraper.get_results()
          
          # Close scraper
          scraper.close()
          
          return results
      except Exception as exc:
          # Retry on failure with exponential backoff
          raise self.retry(exc=exc, countdown=2 ** self.request.retries * 60)
  
  # tasks/analysis_tasks.py
  from .celery_config import app
  import pandas as pd
  import numpy as np
  from sklearn.ensemble import RandomForestRegressor
  from sklearn.metrics import mean_squared_error
  
  @app.task
  def train_valuation_model(feature_store_path, model_path):
      """Celery task to train a property valuation model."""
      # Load features from feature store
      features_df = pd.read_parquet(feature_store_path)
      
      # Split features and target
      X = features_df.drop(['price'], axis=1)
      y = features_df['price']
      
      # Train model
      model = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
      model.fit(X, y)
      
      # Save model
      import joblib
      joblib.dump(model, model_path)
      
      # Log metrics
      predictions = model.predict(X)
      mse = mean_squared_error(y, predictions)
      rmse = np.sqrt(mse)
      
      return {
          'model_path': model_path,
          'metrics': {
              'mse': mse,
              'rmse': rmse,
              'feature_importance': dict(zip(X.columns, model.feature_importances_))
          }
      }
  ```
- Create workflow orchestration with Prefect:
  ```python
  # workflows/property_analytics_flow.py
  from prefect import task, Flow, Parameter
  from prefect.schedules import CronSchedule
  import pandas as pd
  from sqlalchemy import create_engine
  
  @task
  def extract_properties(db_url, days_back=30):
      """Extract recent property data."""
      engine = create_engine(db_url)
      query = f"""
          SELECT * FROM properties 
          WHERE created_at >= NOW() - INTERVAL '{days_back} days'
      """
      df = pd.read_sql(query, engine)
      return df
  
  @task
  def transform_properties(properties_df):
      """Transform property data for analysis."""
      # Data cleaning
      df = properties_df.dropna(subset=['price', 'sqft'])
      
      # Feature engineering
      df['price_per_sqft'] = df['price'] / df['sqft']
      df['age'] = 2025 - df['year_built']
      
      # Outlier removal
      q1 = df['price_per_sqft'].quantile(0.01)
      q3 = df['price_per_sqft'].quantile(0.99)
      df = df[(df['price_per_sqft'] >= q1) & (df['price_per_sqft'] <= q3)]
      
      return df
  
  @task
  def calculate_metrics(df):
      """Calculate property metrics by location."""
      # Group by location
      metrics = df.groupby('zip_code').agg({
          'price': ['mean', 'median', 'count'],
          'price_per_sqft': ['mean', 'median'],
          'days_on_market': ['mean', 'median']
      })
      
      # Flatten column names
      metrics.columns = ['_'.join(col).strip() for col in metrics.columns.values]
      metrics.reset_index(inplace=True)
      
      return metrics
  
  @task
  def load_metrics(metrics_df, db_url):
      """Load metrics to database."""
      engine = create_engine(db_url)
      metrics_df.to_sql('property_metrics', engine, if_exists='replace', index=False)
      return len(metrics_df)
  
  # Define the flow
  schedule = CronSchedule(cron="0 0 * * *")  # Daily at midnight
  
  with Flow("property-analytics", schedule=schedule) as flow:
      # Parameters
      db_url = Parameter("db_url", default="postgresql://user:password@db:5432/terraminer")
      days_back = Parameter("days_back", default=30)
      
      # Tasks
      properties = extract_properties(db_url, days_back)
      transformed = transform_properties(properties)
      metrics = calculate_metrics(transformed)
      loaded_count = load_metrics(metrics, db_url)
  
  # Register flow
  if __name__ == "__main__":
      flow.register(project_name="terraminer")
  ```

### 5.3 System Testing

**Goal**: Implement comprehensive testing at all levels.

**Implementation**:
- Set up unit testing framework:
  ```python
  # tests/test_data_processing.py
  import unittest
  import pandas as pd
  import numpy as np
  from etl.processors import PropertyProcessor
  
  class TestPropertyProcessor(unittest.TestCase):
      def setUp(self):
          # Create test data
          self.test_data = pd.DataFrame({
              'property_id': ['P001', 'P002', 'P003', 'P004'],
              'price': [500000, 750000, 1000000, np.nan],
              'bedrooms': [3, 4, 5, 3],
              'bathrooms': [2.0, 3.0, 4.5, 2.5],
              'sqft': [1800, 2500, 3200, 1950],
              'year_built': [1980, 2000, 2015, 1995],
              'lot_size': [0.25, 0.5, 0.75, 0.3]
          })
          
          # Initialize processor
          self.processor = PropertyProcessor()
      
      def test_clean_data(self):
          # Test data cleaning
          cleaned_data = self.processor.clean_data(self.test_data)
          
          # Check that NaN values are removed
          self.assertEqual(len(cleaned_data), 3)
          self.assertNotIn('P004', cleaned_data['property_id'].values)
      
      def test_engineer_features(self):
          # Test feature engineering
          features = self.processor.engineer_features(self.test_data.dropna())
          
          # Check that new features are created
          self.assertIn('price_per_sqft', features.columns)
          self.assertIn('property_age', features.columns)
          
          # Verify calculations
          self.assertEqual(features.loc[0, 'price_per_sqft'], 500000/1800)
          self.assertEqual(features.loc[0, 'property_age'], 2025-1980)
  ```
- Implement integration testing:
  ```python
  # tests/test_etl_pipeline.py
  import unittest
  import tempfile
  import os
  import pandas as pd
  from unittest.mock import patch, MagicMock
  from etl.extract import NarrprExtractor
  from etl.transform import PropertyTransformer
  from etl.load import DatabaseLoader
  
  class TestETLPipeline(unittest.TestCase):
      def setUp(self):
          # Create temp directory for test data
          self.temp_dir = tempfile.TemporaryDirectory()
          
          # Sample test data
          self.raw_data = [
              {
                  'property_id': 'P001',
                  'address': '123 Main St',
                  'city': 'Anytown',
                  'state': 'CA',
                  'zip_code': '90210',
                  'price': 500000,
                  'bedrooms': 3,
                  'bathrooms': 2.0
              },
              {
                  'property_id': 'P002',
                  'address': '456 Oak Ave',
                  'city': 'Somewhere',
                  'state': 'CA',
                  'zip_code': '90211',
                  'price': 750000,
                  'bedrooms': 4,
                  'bathrooms': 3.0
              }
          ]
      
      def tearDown(self):
          # Clean up temp directory
          self.temp_dir.cleanup()
      
      @patch('etl.extract.NarrprScraper')
      def test_extractor(self, mock_scraper):
          # Configure mock
          mock_instance = mock_scraper.return_value
          mock_instance.login.return_value = True
          mock_instance.scrape_reports.return_value = self.raw_data
          
          # Create extractor
          extractor = NarrprExtractor(username='test', password='test')
          
          # Run extraction
          data = extractor.extract(location_ids=['L001'])
          
          # Verify extraction
          self.assertEqual(len(data), 2)
          mock_instance.login.assert_called_once()
          mock_instance.scrape_reports.assert_called_once()
      
      def test_transformer(self):
          # Create transformer
          transformer = PropertyTransformer()
          
          # Run transformation
          df = pd.DataFrame(self.raw_data)
          transformed_data = transformer.transform(df)
          
          # Verify transformation
          self.assertIn('price_per_sqft', transformed_data.columns)
          self.assertEqual(len(transformed_data), 2)
      
      @patch('etl.load.SQLAlchemy')
      def test_loader(self, mock_sqlalchemy):
          # Configure mock
          mock_session = MagicMock()
          mock_sqlalchemy.session.return_value = mock_session
          
          # Create loader
          loader = DatabaseLoader(db_url='sqlite://')
          
          # Run load
          df = pd.DataFrame(self.raw_data)
          loader.load(df, table_name='properties')
          
          # Verify load
          mock_session.bulk_insert_mappings.assert_called_once()
  ```
- Set up performance testing:
  ```python
  # tests/test_performance.py
  import unittest
  import time
  import pandas as pd
  import numpy as np
  from etl.processors import PropertyProcessor
  
  class TestProcessorPerformance(unittest.TestCase):
      def setUp(self):
          # Create large test dataset (100,000 rows)
          np.random.seed(42)
          n_rows = 100000
          
          self.test_data = pd.DataFrame({
              'property_id': [f'P{i:06d}' for i in range(n_rows)],
              'price': np.random.lognormal(mean=13, sigma=0.5, size=n_rows),
              'bedrooms': np.random.choice([2, 3, 4, 5], size=n_rows),
              'bathrooms': np.random.choice([1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0], size=n_rows),
              'sqft': np.random.normal(loc=2000, scale=500, size=n_rows).astype(int),
              'year_built': np.random.randint(1950, 2023, size=n_rows),
              'lot_size': np.random.lognormal(mean=-1, sigma=0.5, size=n_rows)
          })
          
          # Initialize processor
          self.processor = PropertyProcessor()
      
      def test_processing_performance(self):
          # Measure processing time
          start_time = time.time()
          
          # Process data
          processed_data = self.processor.process(self.test_data)
          
          # Calculate elapsed time
          elapsed_time = time.time() - start_time
          
          # Assert performance meets requirements (e.g., < 10 seconds)
          self.assertLess(elapsed_time, 10, f"Processing took {elapsed_time:.2f} seconds, which exceeds the 10 second limit")
          
          # Assert all data was processed
          self.assertEqual(len(processed_data), len(self.test_data))
  ```
- Implement load testing with Locust:
  ```python
  # tests/locustfile.py
  from locust import HttpUser, task, between
  import random
  
  class PropertyAPIUser(HttpUser):
      wait_time = between(1, 5)
      
      def on_start(self):
          # Authenticate user
          response = self.client.post("/api/auth/token", json={
              "key_id": "test_key",
              "key_secret": "test_secret"
          })
          self.token = response.json()["token"]
          self.client.headers.update({"Authorization": f"Bearer {self.token}"})
      
      @task(10)
      def search_properties(self):
          # Random locations for testing
          locations = ["Los Angeles", "San Francisco", "New York", "Chicago", "Miami"]
          location = random.choice(locations)
          
          # Random price range
          min_price = random.choice([None, 200000, 400000, 600000])
          max_price = random.choice([None, 800000, 1000000, 1200000])
          
          # Random bedrooms
          bedrooms = random.choice([None, 2, 3, 4])
          
          # Build query params
          params = {"location": location}
          
          if min_price:
              params["min_price"] = min_price
          if max_price:
              params["max_price"] = max_price
          if bedrooms:
              params["bedrooms"] = bedrooms
          
          # Make request
          self.client.get("/api/properties", params=params, name="/api/properties")
      
      @task(5)
      def get_property(self):
          # List of property IDs to test with
          property_ids = ["P001", "P002", "P003", "P004", "P005"]
          property_id = random.choice(property_ids)
          
          # Make request
          self.client.get(f"/api/properties/{property_id}", name="/api/properties/:id")
      
      @task(2)
      def get_property_stats(self):
          # List of ZIP codes to test with
          zip_codes = ["90210", "94105", "10001", "60601", "33101"]
          zip_code = random.choice(zip_codes)
          
          # Make request
          self.client.get(f"/api/stats/zip/{zip_code}", name="/api/stats/zip/:zip_code")
  ```

## Phase 6: Documentation and Handover (Weeks 31-32)

### 6.1 System Documentation

**Goal**: Create comprehensive documentation for the system.

**Implementation**:
- Develop architecture diagrams with C4 model
- Create data dictionary and data flow documentation
- Document API specifications with OpenAPI/Swagger
- Write operations manual for system maintenance
- Create user guides for data analytics features

### 6.2 Knowledge Transfer

**Goal**: Ensure smooth handover to operations team.

**Implementation**:
- Conduct training sessions for operations staff
- Create runbooks for common operational tasks
- Document troubleshooting procedures
- Establish support process and escalation paths

## Conclusion

This DevOps plan provides a comprehensive roadmap for transforming TerraMiner into a robust data intelligence platform. By following this phased approach, the team can progressively enhance the platform's capabilities while maintaining operational stability. The focus on data pipeline enhancement in the early phases establishes a solid foundation for the more advanced statistical and machine learning capabilities introduced in later phases.

The modular architecture enables independent scaling of different components based on workload demands, while the comprehensive monitoring and observability infrastructure ensures high reliability and performance. By implementing this plan, TerraMiner will evolve from a basic data collection system to a sophisticated analytical platform capable of delivering deep insights into real estate market dynamics.

## Appendices

### A. Technology Stack Overview

- **Languages**: Python, SQL, JavaScript
- **Web Framework**: Flask
- **Databases**: PostgreSQL with TimescaleDB extension
- **Data Warehousing**: PostgreSQL (star schema)
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **Containerization**: Docker, Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **ETL Orchestration**: Apache Airflow
- **Data Processing**: Apache Spark
- **Feature Store**: Feast
- **Model Tracking**: MLflow
- **API**: GraphQL, REST with OpenAPI
- **Authentication**: JWT

### B. Environment Setup Requirements

- Development environment configuration
- Test environment architecture
- Production environment specifications
- Security requirements for each environment

### C. Migration Strategy

- Data migration plan
- Application migration phases
- Rollback procedures
- Validation checkpoints