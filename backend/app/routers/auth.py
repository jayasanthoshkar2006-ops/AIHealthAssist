from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain_models import User, UserProfile, UserPreference
from app.schemas.domain_schemas import UserRegister, UserLogin, TokenResponse, ChangePassword, SetPinCode, VerifyPinCode
from app.auth.security import get_password_hash, verify_password, create_access_token, decode_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/auth", tags=["Authentication"])
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
def register(data: UserRegister, db: Session = Depends(get_db)):
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
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        has_profile=False
    )

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token = create_access_token(user.id)
    has_prof = user.profile is not None
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        has_profile=has_prof
    )

@router.post("/change-password")
def change_password(data: ChangePassword, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
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
