"""
Database Models

This module defines SQLAlchemy models for the TerraFusion database schema.
These models represent the core entities in the system and their relationships.
"""

import datetime
from typing import List, Optional, Dict, Any, Union
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, JSON, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

# Association tables for many-to-many relationships
repository_tag_association = Table(
    'repository_tag_association',
    Base.metadata,
    Column('repository_id', Integer, ForeignKey('repositories.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

agent_capability_association = Table(
    'agent_capability_association',
    Base.metadata,
    Column('agent_id', Integer, ForeignKey('agents.id'), primary_key=True),
    Column('capability_id', Integer, ForeignKey('capabilities.id'), primary_key=True)
)

plugin_service_association = Table(
    'plugin_service_association',
    Base.metadata,
    Column('plugin_id', Integer, ForeignKey('plugins.id'), primary_key=True),
    Column('service_id', Integer, ForeignKey('services.id'), primary_key=True)
)


class Repository(Base):
    """A code repository that has been analyzed by the system"""
    __tablename__ = 'repositories'

    id = Column(Integer, primary_key=True)
    url = Column(String(255), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    primary_language = Column(String(50), nullable=True)
    stars = Column(Integer, default=0)
    forks = Column(Integer, default=0)
    last_analyzed = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    analyses = relationship("Analysis", back_populates="repository")
    tags = relationship("Tag", secondary=repository_tag_association, back_populates="repositories")
    workflows = relationship("Workflow", back_populates="repository")


class Analysis(Base):
    """An analysis performed on a repository"""
    __tablename__ = 'analyses'

    id = Column(Integer, primary_key=True)
    repository_id = Column(Integer, ForeignKey('repositories.id'), nullable=False)
    analysis_type = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    results = Column(JSON, nullable=True)
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    
    # Relationships
    repository = relationship("Repository", back_populates="analyses")
    findings = relationship("Finding", back_populates="analysis")


class Finding(Base):
    """A specific finding from an analysis"""
    __tablename__ = 'findings'

    id = Column(Integer, primary_key=True)
    analysis_id = Column(Integer, ForeignKey('analyses.id'), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=True)  # low, medium, high, critical
    location = Column(String(255), nullable=True)  # file path, line number, etc.
    recommendation = Column(Text, nullable=True)
    
    # Relationships
    analysis = relationship("Analysis", back_populates="findings")


class Tag(Base):
    """A tag for categorizing repositories"""
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    
    # Relationships
    repositories = relationship("Repository", secondary=repository_tag_association, back_populates="tags")


class Workflow(Base):
    """A workflow identified in a repository"""
    __tablename__ = 'workflows'

    id = Column(Integer, primary_key=True)
    repository_id = Column(Integer, ForeignKey('repositories.id'), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    entry_points = Column(JSON, nullable=True)
    dependencies = Column(JSON, nullable=True)
    bottlenecks = Column(JSON, nullable=True)
    optimization_score = Column(Float, nullable=True)
    
    # Relationships
    repository = relationship("Repository", back_populates="workflows")
    services = relationship("Service", back_populates="workflow")


class Service(Base):
    """A service in a microservices architecture"""
    __tablename__ = 'services'

    id = Column(Integer, primary_key=True)
    workflow_id = Column(Integer, ForeignKey('workflows.id'), nullable=False)
    name = Column(String(100), nullable=False)
    service_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    endpoints = Column(JSON, nullable=True)
    dependencies = Column(JSON, nullable=True)
    health_status = Column(String(20), default="unknown")  # unknown, healthy, degraded, offline
    
    # Relationships
    workflow = relationship("Workflow", back_populates="services")
    plugins = relationship("Plugin", secondary=plugin_service_association, back_populates="services")


class Agent(Base):
    """An AI agent in the system"""
    __tablename__ = 'agents'

    id = Column(Integer, primary_key=True)
    agent_id = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    agent_type = Column(String(50), nullable=False)
    status = Column(String(20), default="offline")  # offline, idle, busy, learning
    version = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_active = Column(DateTime, nullable=True)
    configuration = Column(JSON, nullable=True)
    
    # Relationships
    capabilities = relationship("Capability", secondary=agent_capability_association, back_populates="agents")
    tasks = relationship("Task", back_populates="agent")
    feedback = relationship("Feedback", back_populates="agent")


class Capability(Base):
    """A capability that an agent can have"""
    __tablename__ = 'capabilities'

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    parameters = Column(JSON, nullable=True)
    
    # Relationships
    agents = relationship("Agent", secondary=agent_capability_association, back_populates="capabilities")


class Task(Base):
    """A task assigned to an agent"""
    __tablename__ = 'tasks'

    id = Column(Integer, primary_key=True)
    task_id = Column(String(50), nullable=False, unique=True)
    agent_id = Column(Integer, ForeignKey('agents.id'), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    priority = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    result = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    
    # Relationships
    agent = relationship("Agent", back_populates="tasks")


class Feedback(Base):
    """Feedback on an agent's performance"""
    __tablename__ = 'feedback'

    id = Column(Integer, primary_key=True)
    agent_id = Column(Integer, ForeignKey('agents.id'), nullable=False)
    task_id = Column(String(50), nullable=True)
    action_type = Column(String(50), nullable=False)
    rating = Column(Float, nullable=False)
    comments = Column(Text, nullable=True)
    context = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    agent = relationship("Agent", back_populates="feedback")


class LearningUpdate(Base):
    """A learning update for agents"""
    __tablename__ = 'learning_updates'

    id = Column(Integer, primary_key=True)
    update_id = Column(String(50), nullable=False, unique=True)
    pattern = Column(JSON, nullable=False)
    capability = Column(String(50), nullable=False)
    effectiveness = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    applicable_agent_types = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    applied_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class Plugin(Base):
    """A plugin in the SDK system"""
    __tablename__ = 'plugins'

    id = Column(Integer, primary_key=True)
    plugin_id = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String(20), nullable=False)
    author = Column(String(100), nullable=True)
    capabilities = Column(JSON, nullable=True)
    is_enabled = Column(Boolean, default=True)
    configuration = Column(JSON, nullable=True)
    
    # Relationships
    services = relationship("Service", secondary=plugin_service_association, back_populates="plugins")