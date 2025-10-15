#!/usr/bin/env python3

import os
import sys
import json
import sqlite3
import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, ElasticNet
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib

from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain.schema import Document
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TrainingConfig:
    model_type: str = "random_forest"
    auto_retrain_interval: int = 24  # hours
    performance_threshold: float = 0.85
    data_freshness_threshold: int = 7  # days
    min_training_samples: int = 100
    validation_split: float = 0.2
    enable_auto_training: bool = True
    enable_continuous_learning: bool = True
    backup_models: bool = True
    max_model_versions: int = 10

@dataclass
class ModelMetrics:
    model_id: str
    model_type: str
    r2_score: float
    mse: float
    mae: float
    training_samples: int
    validation_samples: int
    training_time: float
    created_at: datetime
    performance_score: float

class TerraFusionAITrainingSystem:
    def __init__(self, config: TrainingConfig = None):
        self.config = config or TrainingConfig()
        self.db_path = "terrafusionsync_real.db"
        self.models_dir = Path("ai_models")
        self.models_dir.mkdir(exist_ok=True)
        
        self.embeddings = OpenAIEmbeddings()
        self.llm = ChatOpenAI(model="gpt-4", temperature=0.1)
        
        self.active_models = {}
        self.training_history = []
        self.auto_training_thread = None
        self.is_training = False
        
        self._initialize_database()
        self._load_existing_models()
        
        if self.config.enable_auto_training:
            self._start_auto_training()
    
    def _initialize_database(self):
        """Initialize training database tables"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create training metrics table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ai_training_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_id TEXT NOT NULL,
                    model_type TEXT NOT NULL,
                    r2_score REAL,
                    mse REAL,
                    mae REAL,
                    training_samples INTEGER,
                    validation_samples INTEGER,
                    training_time REAL,
                    performance_score REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    model_path TEXT,
                    is_active BOOLEAN DEFAULT 0
                )
            """)
            
            # Create training data feedback table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ai_feedback_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT NOT NULL,
                    response TEXT NOT NULL,
                    user_rating INTEGER,
                    correction TEXT,
                    property_id TEXT,
                    feedback_type TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed BOOLEAN DEFAULT 0
                )
            """)
            
            # Create vector embeddings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ai_embeddings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    content_type TEXT,
                    embedding BLOB,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            conn.close()
            logger.info("Training database initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize training database: {e}")
    
    def _load_existing_models(self):
        """Load existing trained models"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT model_id, model_type, model_path, performance_score 
                FROM ai_training_metrics 
                WHERE is_active = 1 
                ORDER BY created_at DESC
            """)
            
            for row in cursor.fetchall():
                model_id, model_type, model_path, performance_score = row
                if os.path.exists(model_path):
                    try:
                        model = joblib.load(model_path)
                        self.active_models[model_id] = {
                            'model': model,
                            'type': model_type,
                            'performance': performance_score,
                            'path': model_path
                        }
                        logger.info(f"Loaded model {model_id} ({model_type}) with performance {performance_score:.3f}")
                    except Exception as e:
                        logger.warning(f"Failed to load model {model_id}: {e}")
            
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to load existing models: {e}")
    
    def train_property_valuation_model(self, force_retrain: bool = False) -> Dict[str, Any]:
        """Train or retrain property valuation model"""
        if self.is_training and not force_retrain:
            return {"status": "error", "message": "Training already in progress"}
        
        self.is_training = True
        start_time = time.time()
        
        try:
            # Get training data
            training_data = self._get_property_training_data()
            if len(training_data) < self.config.min_training_samples:
                return {
                    "status": "error", 
                    "message": f"Insufficient training data: {len(training_data)} < {self.config.min_training_samples}"
                }
            
            # Prepare features and target
            X, y, feature_names = self._prepare_training_features(training_data)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=self.config.validation_split, random_state=42
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train model based on config
            if self.config.model_type == "random_forest":
                model = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42,
                    n_jobs=-1
                )
            elif self.config.model_type == "gradient_boosting":
                model = GradientBoostingRegressor(
                    n_estimators=100,
                    max_depth=6,
                    random_state=42
                )
            elif self.config.model_type == "linear":
                model = LinearRegression()
            elif self.config.model_type == "elastic_net":
                model = ElasticNet(random_state=42)
            else:
                model = RandomForestRegressor(n_estimators=100, random_state=42)
            
            # Train the model
            model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            r2 = r2_score(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            
            training_time = time.time() - start_time
            performance_score = r2  # Use R² as primary performance metric
            
            # Save model
            model_id = f"valuation_{self.config.model_type}_{int(time.time())}"
            model_path = self.models_dir / f"{model_id}.joblib"
            scaler_path = self.models_dir / f"{model_id}_scaler.joblib"
            
            # Save model and scaler
            joblib.dump({
                'model': model,
                'scaler': scaler,
                'feature_names': feature_names,
                'metadata': {
                    'model_type': self.config.model_type,
                    'training_samples': len(X_train),
                    'features': feature_names,
                    'performance': performance_score
                }
            }, model_path)
            
            # Record metrics
            metrics = ModelMetrics(
                model_id=model_id,
                model_type=self.config.model_type,
                r2_score=r2,
                mse=mse,
                mae=mae,
                training_samples=len(X_train),
                validation_samples=len(X_test),
                training_time=training_time,
                created_at=datetime.now(),
                performance_score=performance_score
            )
            
            self._save_training_metrics(metrics, str(model_path))
            
            # Update active models if performance is good
            if performance_score >= self.config.performance_threshold:
                self._deactivate_old_models(self.config.model_type)
                self.active_models[model_id] = {
                    'model': model,
                    'scaler': scaler,
                    'type': self.config.model_type,
                    'performance': performance_score,
                    'path': str(model_path),
                    'feature_names': feature_names
                }
                self._activate_model(model_id)
                logger.info(f"New model {model_id} activated with performance {performance_score:.3f}")
            
            return {
                "status": "success",
                "model_id": model_id,
                "metrics": asdict(metrics),
                "feature_importance": self._get_feature_importance(model, feature_names) if hasattr(model, 'feature_importances_') else None
            }
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            return {"status": "error", "message": str(e)}
        
        finally:
            self.is_training = False
    
    def train_rag_embeddings(self, force_rebuild: bool = False) -> Dict[str, Any]:
        """Train/update RAG embeddings from property data"""
        try:
            # Get property documents
            documents = self._get_property_documents()
            
            if not documents:
                return {"status": "error", "message": "No documents found for embedding"}
            
            # Split documents
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len
            )
            
            split_docs = text_splitter.split_documents(documents)
            
            # Create embeddings
            vectorstore = FAISS.from_documents(split_docs, self.embeddings)
            
            # Save vectorstore
            vectorstore_path = self.models_dir / "property_vectorstore"
            vectorstore.save_local(str(vectorstore_path))
            
            # Update database
            self._save_embeddings_metadata(len(split_docs), str(vectorstore_path))
            
            logger.info(f"RAG embeddings updated with {len(split_docs)} document chunks")
            
            return {
                "status": "success",
                "documents_processed": len(documents),
                "chunks_created": len(split_docs),
                "vectorstore_path": str(vectorstore_path)
            }
            
        except Exception as e:
            logger.error(f"RAG training failed: {e}")
            return {"status": "error", "message": str(e)}
    
    def continuous_learning_from_feedback(self) -> Dict[str, Any]:
        """Implement continuous learning from user feedback"""
        try:
            # Get unprocessed feedback
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, query, response, user_rating, correction, property_id, feedback_type
                FROM ai_feedback_data 
                WHERE processed = 0
                ORDER BY created_at ASC
                LIMIT 100
            """)
            
            feedback_data = cursor.fetchall()
            
            if not feedback_data:
                return {"status": "info", "message": "No new feedback to process"}
            
            processed_count = 0
            improvements = []
            
            for feedback in feedback_data:
                feedback_id, query, response, rating, correction, property_id, feedback_type = feedback
                
                # Process different types of feedback
                if feedback_type == "valuation" and correction:
                    # Update training data with corrected valuation
                    self._update_valuation_training_data(property_id, correction)
                    improvements.append(f"Updated valuation for property {property_id}")
                
                elif rating is not None and rating < 3:  # Poor rating
                    # Analyze poor responses for pattern improvement
                    self._analyze_poor_response(query, response, rating)
                    improvements.append(f"Analyzed poor response pattern")
                
                # Mark as processed
                cursor.execute("UPDATE ai_feedback_data SET processed = 1 WHERE id = ?", (feedback_id,))
                processed_count += 1
            
            conn.commit()
            conn.close()
            
            # Trigger retraining if enough feedback accumulated
            if processed_count >= 50:
                self._schedule_retraining()
            
            return {
                "status": "success",
                "processed_feedback": processed_count,
                "improvements": improvements
            }
            
        except Exception as e:
            logger.error(f"Continuous learning failed: {e}")
            return {"status": "error", "message": str(e)}
    
    def _get_property_training_data(self) -> pd.DataFrame:
        """Get property data for training"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            query = """
                SELECT 
                    p.prop_id,
                    p.geo_id,
                    p.property_use_desc,
                    p.legal_acreage,
                    p.market_value,
                    p.assessed_value,
                    p.improvement_value,
                    p.land_value,
                    p.year_built,
                    p.total_finished_area,
                    p.bedrooms,
                    p.bathrooms,
                    p.stories,
                    addr.property_address,
                    addr.property_city,
                    addr.property_zip
                FROM properties p
                LEFT JOIN addresses addr ON p.prop_id = addr.prop_id
                WHERE p.market_value > 0 
                AND p.assessed_value > 0
                ORDER BY p.prop_id
            """
            
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to get training data: {e}")
            return pd.DataFrame()
    
    def _prepare_training_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        """Prepare features for training"""
        # Select numeric features
        numeric_features = [
            'legal_acreage', 'improvement_value', 'land_value', 
            'year_built', 'total_finished_area', 'bedrooms', 
            'bathrooms', 'stories'
        ]
        
        # Handle categorical features
        categorical_features = ['property_use_desc', 'property_city']
        
        # Prepare feature matrix
        feature_df = df[numeric_features].copy()
        
        # Fill missing values
        feature_df = feature_df.fillna(feature_df.median())
        
        # Encode categorical features
        for cat_feature in categorical_features:
            if cat_feature in df.columns:
                le = LabelEncoder()
                feature_df[f'{cat_feature}_encoded'] = le.fit_transform(df[cat_feature].fillna('Unknown'))
        
        # Target variable
        y = df['market_value'].values
        
        # Feature names
        feature_names = list(feature_df.columns)
        
        return feature_df.values, y, feature_names
    
    def _get_property_documents(self) -> List[Document]:
        """Get property data as documents for RAG"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    p.prop_id,
                    p.property_use_desc,
                    p.market_value,
                    p.assessed_value,
                    addr.property_address,
                    addr.property_city
                FROM properties p
                LEFT JOIN addresses addr ON p.prop_id = addr.prop_id
                LIMIT 1000
            """)
            
            documents = []
            for row in cursor.fetchall():
                prop_id, use_desc, market_val, assessed_val, address, city = row
                
                content = f"""
                Property ID: {prop_id}
                Address: {address}, {city}
                Property Type: {use_desc}
                Market Value: ${market_val:,.2f}
                Assessed Value: ${assessed_val:,.2f}
                """
                
                doc = Document(
                    page_content=content,
                    metadata={
                        "prop_id": prop_id,
                        "property_type": use_desc,
                        "market_value": market_val,
                        "source": "property_database"
                    }
                )
                documents.append(doc)
            
            conn.close()
            return documents
            
        except Exception as e:
            logger.error(f"Failed to get property documents: {e}")
            return []
    
    def _save_training_metrics(self, metrics: ModelMetrics, model_path: str):
        """Save training metrics to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO ai_training_metrics 
                (model_id, model_type, r2_score, mse, mae, training_samples, 
                 validation_samples, training_time, performance_score, model_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metrics.model_id, metrics.model_type, metrics.r2_score,
                metrics.mse, metrics.mae, metrics.training_samples,
                metrics.validation_samples, metrics.training_time,
                metrics.performance_score, model_path
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to save training metrics: {e}")
    
    def _start_auto_training(self):
        """Start auto-training background thread"""
        def auto_training_loop():
            while self.config.enable_auto_training:
                try:
                    # Check if retraining is needed
                    if self._should_retrain():
                        logger.info("Starting automatic retraining...")
                        result = self.train_property_valuation_model()
                        logger.info(f"Auto-training result: {result['status']}")
                    
                    # Process continuous learning
                    self.continuous_learning_from_feedback()
                    
                    # Sleep for the configured interval
                    time.sleep(self.config.auto_retrain_interval * 3600)
                    
                except Exception as e:
                    logger.error(f"Auto-training error: {e}")
                    time.sleep(3600)  # Wait 1 hour before retrying
        
        self.auto_training_thread = threading.Thread(target=auto_training_loop, daemon=True)
        self.auto_training_thread.start()
        logger.info("Auto-training system started")
    
    def _should_retrain(self) -> bool:
        """Check if model should be retrained"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check last training time
            cursor.execute("""
                SELECT MAX(created_at) FROM ai_training_metrics 
                WHERE is_active = 1
            """)
            
            last_training = cursor.fetchone()[0]
            if last_training:
                last_training_dt = datetime.fromisoformat(last_training)
                hours_since_training = (datetime.now() - last_training_dt).total_seconds() / 3600
                
                if hours_since_training < self.config.auto_retrain_interval:
                    return False
            
            # Check for new data
            cursor.execute("""
                SELECT COUNT(*) FROM properties 
                WHERE created_at > datetime('now', '-1 day')
            """)
            
            new_records = cursor.fetchone()[0]
            conn.close()
            
            return new_records > 10  # Retrain if more than 10 new records
            
        except Exception as e:
            logger.error(f"Failed to check retrain conditions: {e}")
            return False
    
    def get_training_status(self) -> Dict[str, Any]:
        """Get current training system status"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get latest metrics
            cursor.execute("""
                SELECT model_id, model_type, performance_score, created_at
                FROM ai_training_metrics 
                WHERE is_active = 1
                ORDER BY created_at DESC
                LIMIT 5
            """)
            
            active_models = []
            for row in cursor.fetchall():
                model_id, model_type, performance, created_at = row
                active_models.append({
                    "model_id": model_id,
                    "type": model_type,
                    "performance": performance,
                    "created_at": created_at
                })
            
            # Get feedback stats
            cursor.execute("""
                SELECT COUNT(*) as total, 
                       COUNT(CASE WHEN processed = 0 THEN 1 END) as pending
                FROM ai_feedback_data
            """)
            
            feedback_stats = cursor.fetchone()
            conn.close()
            
            return {
                "status": "operational",
                "auto_training_enabled": self.config.enable_auto_training,
                "is_training": self.is_training,
                "active_models": active_models,
                "feedback_stats": {
                    "total": feedback_stats[0] if feedback_stats else 0,
                    "pending": feedback_stats[1] if feedback_stats else 0
                },
                "config": asdict(self.config)
            }
            
        except Exception as e:
            logger.error(f"Failed to get training status: {e}")
            return {"status": "error", "message": str(e)}
    
    def add_feedback(self, query: str, response: str, rating: int = None, 
                    correction: str = None, property_id: str = None, 
                    feedback_type: str = "general") -> bool:
        """Add user feedback for continuous learning"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO ai_feedback_data 
                (query, response, user_rating, correction, property_id, feedback_type)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (query, response, rating, correction, property_id, feedback_type))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Feedback added: {feedback_type} - Rating: {rating}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add feedback: {e}")
            return False

def create_training_system(config: TrainingConfig = None) -> TerraFusionAITrainingSystem:
    """Factory function to create training system"""
    return TerraFusionAITrainingSystem(config)

if __name__ == "__main__":
    # Example usage
    config = TrainingConfig(
        model_type="random_forest",
        auto_retrain_interval=12,  # 12 hours
        enable_auto_training=True,
        enable_continuous_learning=True
    )
    
    training_system = create_training_system(config)
    
    # Train initial model
    result = training_system.train_property_valuation_model()
    print(f"Training result: {result}")
    
    # Train RAG embeddings
    rag_result = training_system.train_rag_embeddings()
    print(f"RAG training result: {rag_result}")
    
    # Get status
    status = training_system.get_training_status()
    print(f"Training system status: {status}") 