"""
LUMIX OS - Advanced Intelligence-First SMS
Created by: Faizain Murtuza
© 2025 Faizain Murtuza. All Rights Reserved.
"""

import pytest
from unittest.mock import MagicMock
from datetime import datetime
from backend import models, database

@pytest.fixture
def mock_db():
    return MagicMock()

def test_learning_progress_persistence(mock_db):
    # Simulate a user finishing a quiz
    user_id = 1
    subject = "Mathematics"
    score = 85.0
    
    # Check if record exists
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    # Logic to update mastery (normally in an endpoint)
    # Here we just verify the model fields
    progress = models.LearningProgress(
        user_id=user_id,
        subject=subject,
        mastery_level=score,
        last_score=score,
        total_quizzes=1
    )
    
    assert progress.user_id == 1
    assert progress.subject == "Mathematics"
    assert progress.mastery_level == 85.0
    assert progress.total_quizzes == 1

def test_ai_feedback_model():
    now = datetime.utcnow()
    feedback = models.AIFeedback(
        user_id=1,
        request_id="req_123",
        feedback_type="up",
        comment="Great explanation!",
        created_at=now
    )
    
    assert feedback.user_id == 1
    assert feedback.request_id == "req_123"
    assert feedback.feedback_type == "up"
    assert feedback.comment == "Great explanation!"
    assert feedback.created_at == now
