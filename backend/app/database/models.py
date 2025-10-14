"""
Database models for long-term memory storage
"""

from sqlalchemy import Column, String, Text, DateTime, Integer, JSON
from sqlalchemy.sql import func
from datetime import datetime

from app.database.connection import Base


class ResearchMemory(Base):
    """Store user research queries and responses"""

    __tablename__ = "research_memory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    sources = Column(JSON, default=list)  # List of URLs/sources used
    extra_data = Column(JSON, default=dict)  # Additional metadata (renamed from metadata)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<ResearchMemory(id={self.id}, user_id={self.user_id}, query={self.query[:50]}...)>"


class UserPreferences(Base):
    """Store user preferences and settings"""

    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, nullable=False, index=True)
    preferences = Column(JSON, default=dict)  # Store various user preferences
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self):
        return f"<UserPreferences(user_id={self.user_id})>"


class ConversationHistory(Base):
    """Store conversation history for context"""

    __tablename__ = "conversation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False, index=True)
    session_id = Column(String, nullable=False, index=True)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    extra_data = Column(JSON, default=dict)  # Additional data (renamed from metadata)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ConversationHistory(id={self.id}, user_id={self.user_id}, role={self.role})>"
