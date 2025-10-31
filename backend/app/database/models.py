"""
Database models for long-term memory storage
"""

from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
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

    # Clerk user identification
    clerk_user_id = Column(String, unique=True, nullable=False, index=True)

    # Clerk user data
    email = Column(String, unique=True, nullable=False, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    username = Column(String, unique=True, nullable=True, index=True)

    # User preferences (JSON)
    preferences = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship to LinkedInPost
    linkedin_posts = relationship("LinkedInPost", back_populates="user_preferences")

    def __repr__(self):
        return f"<UserPreferences(clerk_user_id={self.clerk_user_id}, email={self.email})>"


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


class LinkedInPost(Base):
    """Store generated LinkedIn posts"""

    __tablename__ = "linkedin_posts"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # User identification (Foreign Key to user_preferences)
    user_id = Column(String, ForeignKey('user_preferences.clerk_user_id'), nullable=False, index=True)
    session_id = Column(String, nullable=True, index=True)

    # Link to original research (optional FK)
    research_memory_id = Column(Integer, nullable=True)
    original_content = Column(Text, nullable=False)

    # Generated LinkedIn post components
    hook = Column(Text, nullable=False)
    main_content = Column(Text, nullable=False)
    cta = Column(Text, nullable=False)
    hashtags = Column(JSON, default=list)  # ["Hashtag1", "Hashtag2"]
    full_post = Column(Text, nullable=False)

    # Metadata
    emojis_used = Column(JSON, default=list)  # ["🚀", "💡"]
    character_count = Column(Integer)
    post_style = Column(String, default="professional")  # professional, casual, storytelling
    tone = Column(String, default="educational")  # educational, promotional, thought_leadership, inspirational
    target_length = Column(String, default="medium")  # short, medium, long

    # Status tracking
    is_saved = Column(Boolean, default=True)
    is_posted = Column(Boolean, default=False)
    posted_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationship to UserPreferences
    user_preferences = relationship("UserPreferences", back_populates="linkedin_posts")

    def __repr__(self):
        return f"<LinkedInPost(id={self.id}, user_id={self.user_id}, character_count={self.character_count})>"
