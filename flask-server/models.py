from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False)  # 'student' or 'teacher'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships - Use passive_deletes to handle foreign key constraints properly
    courses_taught = db.relationship('Course', foreign_keys='Course.teacher_id', back_populates='teacher', lazy=True, passive_deletes=True)
    enrollments = db.relationship('Enrollment', foreign_keys='Enrollment.student_id', back_populates='student', lazy=True, cascade='all, delete-orphan')
    quiz_submissions = db.relationship('QuizSubmission', foreign_keys='QuizSubmission.student_id', back_populates='student', lazy=True, cascade='all, delete-orphan')
    answers = db.relationship('Answer', foreign_keys='Answer.student_id', back_populates='student', lazy=True, cascade='all, delete-orphan')
    notifications = db.relationship('Notification', foreign_keys='Notification.user_id', back_populates='user', lazy=True, cascade='all, delete-orphan')
    course_invitations = db.relationship('CourseInvitation', foreign_keys='CourseInvitation.student_id', back_populates='invited_student', lazy=True, cascade='all, delete-orphan')
    
    # Additional relationships for grading - these should allow NULL when grader is deleted
    graded_submissions = db.relationship('QuizSubmission', foreign_keys='QuizSubmission.graded_by', back_populates='grader', lazy=True, passive_deletes=True)
    graded_answers = db.relationship('Answer', foreign_keys='Answer.graded_by', back_populates='grader', lazy=True, passive_deletes=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.name}>'

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(120), nullable=True)  # Course contact email
    description = db.Column(db.Text)
    is_public = db.Column(db.Boolean, default=True)
    max_capacity = db.Column(db.Integer, nullable=True)  # Only for public courses
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_published = db.Column(db.Boolean, default=False)
    
    # Relationships
    teacher = db.relationship('User', foreign_keys=[teacher_id], back_populates='courses_taught')
    quizzes = db.relationship('Quiz', back_populates='course', lazy=True, cascade='all, delete-orphan')
    enrollments = db.relationship('Enrollment', back_populates='course', lazy=True, cascade='all, delete-orphan')
    invitations = db.relationship('CourseInvitation', back_populates='course', lazy=True, cascade='all, delete-orphan')
    
    def get_enrolled_count(self):
        return Enrollment.query.filter_by(course_id=self.id, status='accepted').count()
    
    def is_full(self):
        if not self.max_capacity:
            return False
        return self.get_enrolled_count() >= self.max_capacity
    
    def __repr__(self):
        return f'<Course {self.name}>'

class CourseInvitation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'rejected', 'expired'
    invited_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)  # Optional expiration
    
    # Relationships
    course = db.relationship('Course', foreign_keys=[course_id], back_populates='invitations')
    invited_student = db.relationship('User', foreign_keys=[student_id], back_populates='course_invitations')
    
    def __repr__(self):
        return f'<CourseInvitation {self.course_id}-{self.student_id}>'

class Enrollment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='accepted')  # 'accepted', 'dropped'
    enrollment_type = db.Column(db.String(20), default='direct')  # 'direct', 'invitation'
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    dropped_at = db.Column(db.DateTime, nullable=True)
    grade = db.Column(db.Float, default=0.0)  # Student's final grade for the course
    
    # Unique constraint to prevent duplicate enrollments
    __table_args__ = (db.UniqueConstraint('course_id', 'student_id'),)
    
    # Relationships
    course = db.relationship('Course', foreign_keys=[course_id], back_populates='enrollments')
    student = db.relationship('User', foreign_keys=[student_id], back_populates='enrollments')
    
    def calculate_grade(self):
        """Calculate the student's grade based on quiz submissions for this course"""
        from models import QuizSubmission, Quiz
        
        # Get all quizzes for this course
        quizzes = Quiz.query.filter_by(course_id=self.course_id, is_published=True).all()
        if not quizzes:
            return 0.0
        
        # Get all graded submissions for this student in this course
        total_score = 0
        total_possible = 0
        
        for quiz in quizzes:
            submission = QuizSubmission.query.filter_by(
                quiz_id=quiz.id,
                student_id=self.student_id,
                is_graded=True
            ).first()
            
            if submission:
                total_score += submission.score or 0
                total_possible += submission.total_possible or 0
        
        if total_possible == 0:
            return 0.0
        
        # Calculate percentage grade
        grade_percentage = (total_score / total_possible) * 100
        return round(grade_percentage, 2)
    
    def update_grade(self):
        """Update the stored grade based on current quiz performance"""
        self.grade = self.calculate_grade()
        return self.grade
    
    def __repr__(self):
        return f'<Enrollment {self.course_id}-{self.student_id}>'

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=True)
    is_published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    course = db.relationship('Course', foreign_keys=[course_id], back_populates='quizzes')
    questions = db.relationship('Question', back_populates='quiz', lazy=True, cascade='all, delete-orphan')
    submissions = db.relationship('QuizSubmission', back_populates='quiz', lazy=True, cascade='all, delete-orphan')
    
    def get_total_points(self):
        return sum(question.points for question in self.questions)
    
    def is_past_due(self):
        if not self.due_date:
            return False
        return datetime.utcnow() > self.due_date
    
    def __repr__(self):
        return f'<Quiz {self.title}>'

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)  # 'multiple_choice' or 'text'
    points = db.Column(db.Integer, nullable=False, default=1)
    order = db.Column(db.Integer, nullable=False, default=1)  # Question order in quiz
    
    # Relationships
    quiz = db.relationship('Quiz', foreign_keys=[quiz_id], back_populates='questions')
    options = db.relationship('Option', back_populates='question', lazy=True, cascade='all, delete-orphan')
    answers = db.relationship('Answer', back_populates='question', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Question {self.id}>'

class Option(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    order = db.Column(db.Integer, nullable=False, default=1)  # Option order
    
    # Relationships
    question = db.relationship('Question', foreign_keys=[question_id], back_populates='options')
    
    def __repr__(self):
        return f'<Option {self.id}>'

class QuizSubmission(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_graded = db.Column(db.Boolean, default=False)
    total_score = db.Column(db.Integer, nullable=True)
    max_possible_score = db.Column(db.Integer, nullable=True)
    auto_graded_score = db.Column(db.Integer, nullable=True)  # Score from auto-graded questions
    manual_graded_score = db.Column(db.Integer, nullable=True)  # Score from manually graded questions
    graded_at = db.Column(db.DateTime, nullable=True)
    graded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Relationships
    quiz = db.relationship('Quiz', foreign_keys=[quiz_id], back_populates='submissions')
    student = db.relationship('User', foreign_keys=[student_id], back_populates='quiz_submissions')
    grader = db.relationship('User', foreign_keys=[graded_by], back_populates='graded_submissions')
    answers = db.relationship('Answer', back_populates='submission', lazy=True)
    
    # Define foreign key relationships explicitly
    __table_args__ = (db.UniqueConstraint('quiz_id', 'student_id'),)
    
    def calculate_auto_grade(self):
        """Calculate score for multiple choice questions"""
        auto_score = 0
        for answer in self.answers:
            if answer.question.question_type == 'multiple_choice' and answer.option:
                if answer.option.is_correct:
                    auto_score += answer.question.points
        self.auto_graded_score = auto_score
        return auto_score
    
    def calculate_total_score(self):
        """Calculate total score including manual grades"""
        total = 0
        if self.auto_graded_score is not None:
            total += self.auto_graded_score
        if self.manual_graded_score is not None:
            total += self.manual_graded_score
        self.total_score = total
        return total
    
    def get_percentage(self):
        if not self.max_possible_score or self.max_possible_score == 0:
            return 0
        return round((self.total_score / self.max_possible_score) * 100, 2)
    
    def __repr__(self):
        return f'<QuizSubmission {self.quiz_id}-{self.student_id}>'

class Answer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    submission_id = db.Column(db.Integer, db.ForeignKey('quiz_submission.id'), nullable=False)
    
    # Answer content (one of these will be filled based on question type)
    option_id = db.Column(db.Integer, db.ForeignKey('option.id'), nullable=True)  # For multiple choice
    text_answer = db.Column(db.Text, nullable=True)  # For text questions
    
    # Grading
    score = db.Column(db.Integer, nullable=True)  # Null means not graded yet
    graded_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    graded_at = db.Column(db.DateTime, nullable=True)
    grading_comment = db.Column(db.Text, nullable=True)  # Teacher feedback
    
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate answers
    __table_args__ = (db.UniqueConstraint('question_id', 'student_id', 'submission_id'),)
    
    # Relationships
    question = db.relationship('Question', foreign_keys=[question_id], back_populates='answers')
    student = db.relationship('User', foreign_keys=[student_id], back_populates='answers')
    grader = db.relationship('User', foreign_keys=[graded_by], back_populates='graded_answers')
    submission = db.relationship('QuizSubmission', foreign_keys=[submission_id], back_populates='answers')
    option = db.relationship('Option', foreign_keys=[option_id])
    
    def __repr__(self):
        return f'<Answer {self.question_id}-{self.student_id}>'

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)  # Short notification title
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(db.String(50), nullable=False)
    # Types: 'course_invitation', 'invitation_accepted', 'quiz_published', 'course_published', 
    #        'quiz_graded', 'course_joined', 'quiz_answered', 'quiz_due_soon'
    
    is_read = db.Column(db.Boolean, default=False)
    related_id = db.Column(db.Integer, nullable=True)  # ID of related course/quiz/etc
    related_type = db.Column(db.String(50), nullable=True)  # 'course', 'quiz', 'invitation'
    action_url = db.Column(db.String(500), nullable=True)  # URL for clickable notifications
    expires_at = db.Column(db.DateTime, nullable=True)  # For time-sensitive notifications
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], back_populates='notifications')
    
    def is_expired(self):
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    def __repr__(self):
        return f'<Notification {self.title}>'

class GradeThreshold(db.Model):
    """Define grading thresholds for statistics (passing, regular, bad scores)"""
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=True)  # Null = system default
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=True)  # Null = course/system default
    
    excellent_threshold = db.Column(db.Float, default=90.0)  # >= 90% = excellent
    good_threshold = db.Column(db.Float, default=80.0)       # >= 80% = good  
    passing_threshold = db.Column(db.Float, default=60.0)    # >= 60% = passing
    # Below passing = failing
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<GradeThreshold {self.course_id}-{self.quiz_id}>'
