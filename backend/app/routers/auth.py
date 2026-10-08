from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import domain_models
from app.models.domain_models import User, UserProfile, UserPreference
from app.schemas.domain_schemas import UserRegister, UserLogin, TokenResponse, ChangePassword, SetPinCode, VerifyPinCode, PasswordResetRequest, PasswordResetConfirm
from app.auth.security import get_password_hash, verify_password, create_access_token, decode_token
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
import hashlib
import secrets
import smtplib
import logging
from email.message import EmailMessage
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user_id = int(payload["sub"])
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = get_password_hash(data.password)
    user = User(
        email=data.email,
        hashed_password=hashed,
        language=data.language or "en"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize default user preferences
    pref = UserPreference(user_id=user.id, language=data.language or "en")
    db.add(pref)
    db.commit()

    token = create_access_token(user.id)
    background_tasks.add_task(_send_account_created_notification_safely, user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        has_profile=False
    )

def _send_account_created_notification_safely(email: str) -> None:
    try:
        _send_account_created_notification_email(email)
        logger.info("Account creation notification email sent successfully")
    except Exception:
        logger.exception("Account creation notification email could not be sent")


def _send_email(message: EmailMessage) -> None:
    """Send mail through the single server-side sender configured on Render."""
    if not all([settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.EMAIL_FROM]):
        raise RuntimeError("Server email sender is not configured")
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
        smtp.starttls()
        smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(message)


def _send_account_created_notification_email(email: str) -> None

    message = EmailMessage()
    message["Subject"] = "HealthAssist AI - Account created successfully"
    message["From"] = settings.EMAIL_FROM
    message["To"] = email
    message.set_content(
        "Your HealthAssist AI account was created successfully.\\n\\n"
        f"Account: {email}\\n"
        f"Time (server): {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\\n\\n"
        "HealthAssist AI"
    )
    _send_email(message)


def _send_login_notification_safely(email: str) -> None:
    try:
        _send_login_notification_email(email)
        logger.info("Login notification email sent successfully")
    except Exception:
        logger.exception("Login notification email could not be sent")


def _send_login_notification_email(email: str) -> None:
    if not all([settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.EMAIL_FROM]):
        raise RuntimeError("Login notification email is not configured on the server")

    message = EmailMessage()
    message["Subject"] = "HealthAssist AI - New login detected"
    message["From"] = settings.EMAIL_FROM
    message["To"] = email
    message.set_content(
        "A successful login to your HealthAssist AI account was detected.\\n\\n"
        f"Account: {email}\\n"
        f"Time (server): {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\\n\\n"
        "If this was not you, reset your password immediately from the HealthAssist AI app.\\n\\n"
        "HealthAssist AI"
    )
    _send_email(message)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token(user.id)
    has_prof = user.profile is not None
    background_tasks.add_task(_send_login_notification_safely, user.email)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        has_profile=has_prof
    )

def _send_password_reset_email(email: str, reset_url: str) -> None:
    if not all([settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.EMAIL_FROM]):
        raise RuntimeError("Password reset email is not configured on the server")

    message = EmailMessage()
    message["Subject"] = "HealthAssist AI - Reset your password"
    message["From"] = settings.EMAIL_FROM
    message["To"] = email
    message.set_content(
        "We received a request to reset your HealthAssist AI password.\\n\\n"
        f"Use this link to create a new password:\\n{reset_url}\\n\\n"
        "This link expires in 60 minutes and can only be used once.\\n\\n"
        "If you did not request this, you can safely ignore this email.\\n\\n"
        "HealthAssist AI"
    )
    _send_email(message)


@router.post("/password-reset/request")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    # Keep the public response generic to avoid revealing whether an email is registered.
    if not user:
        return {"message": "If an account exists for that email, a password reset link has been sent."}

    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    reset = domain_models.PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=60),
    )
    db.add(reset)
    db.commit()

    base = settings.FRONTEND_URL.rstrip("/")
    reset_url = f"{base}/#/reset-password?token={raw_token}"
    try:
        _send_password_reset_email(user.email, reset_url)
    except Exception as exc:
        db.delete(reset)
        db.commit()
        raise HTTPException(status_code=503, detail="Password reset email service is not configured or unavailable.") from exc

    return {"message": "If an account exists for that email, a password reset link has been sent."}


@router.post("/password-reset/confirm")
def confirm_password_reset(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    token = data.token
    new_password = data.new_password
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    reset = (
        db.query(domain_models.PasswordResetToken)
        .filter(
            domain_models.PasswordResetToken.token_hash == token_hash,
            domain_models.PasswordResetToken.used_at.is_(None),
            domain_models.PasswordResetToken.expires_at > datetime.utcnow(),
        )
        .first()
    )
    if not reset:
        raise HTTPException(status_code=400, detail="Reset link is invalid or expired")

    user = db.query(User).filter(User.id == reset.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Reset link is invalid or expired")

    user.hashed_password = get_password_hash(new_password)
    reset.used_at = datetime.utcnow()
    db.query(domain_models.PasswordResetToken).filter(
        domain_models.PasswordResetToken.user_id == user.id,
        domain_models.PasswordResetToken.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()}, synchronize_session=False)
    db.commit()
    try:
        _send_password_changed_notification_email(user.email)
    except Exception:
        logger.exception("Password changed notification email could not be sent")
    return {"message": "Password reset successfully. You can now sign in with your new password."}


def _send_password_changed_notification_safely(email: str) -> None:
    try:
        _send_password_changed_notification_email(email)
        logger.info("Password changed notification email sent successfully")
    except Exception:
        logger.exception("Password changed notification email could not be sent")


def _send_password_changed_notification_email(email: str) -> None:
    if not all([settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.EMAIL_FROM]):
        raise RuntimeError("Password change notification email is not configured on the server")

    message = EmailMessage()
    message["Subject"] = "HealthAssist AI - Password changed"
    message["From"] = settings.EMAIL_FROM
    message["To"] = email
    message.set_content(
        "Your HealthAssist AI password was changed successfully.\\n\\n"
        f"Account: {email}\\n"
        f"Time (server): {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC\\n\\n"
        "If you did not make this change, reset your password again immediately.\\n\\n"
        "HealthAssist AI"
    )
    _send_email(message)


@router.post("/change-password")
def change_password(data: ChangePassword, background_tasks: BackgroundTasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    background_tasks.add_task(_send_password_changed_notification_safely, current_user.email)
    return {"message": "Password updated successfully"}

@router.post("/pin/set")
def set_pin(data: SetPinCode, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.pin_code = data.pin_code
    db.commit()
    return {"message": "App Lock PIN set successfully"}

@router.post("/pin/verify")
def verify_pin(data: VerifyPinCode, current_user: User = Depends(get_current_user)):
    if current_user.pin_code == data.pin_code:
        return {"valid": True}
    return {"valid": False}

@router.get("/export-data")
def export_user_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    return {
        "user_email": current_user.email,
        "language": current_user.language,
        "profile": {
            "name": profile.name if profile else None,
            "age": profile.age if profile else None,
            "profession": profile.profession if profile else None
        },
        "export_timestamp": str(current_user.created_at)
    }

@router.delete("/delete-account")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(current_user)
    db.commit()
    return {"message": "Account and all associated personal records deleted permanently"}
