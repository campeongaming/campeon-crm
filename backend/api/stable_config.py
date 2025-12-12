from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from database.models import StableConfig
from api.schemas import StableConfigCreate, StableConfigResponse

router = APIRouter()


@router.post("/stable-config", response_model=StableConfigResponse)
def save_stable_config(config: StableConfigCreate, db: Session = Depends(get_db)):
    """
    Save or update stable configuration for a provider.
    Creates new record if provider doesn't exist, otherwise updates existing.
    """
    try:
        # Check if config exists for this provider
        existing_config = db.query(StableConfig).filter(
            StableConfig.provider == config.provider
        ).first()

        if existing_config:
            # Update existing
            existing_config.cost = config.cost
            existing_config.maximum_amount = config.maximum_amount
            existing_config.minimum_amount = config.minimum_amount
            existing_config.minimum_stake_to_wager = config.minimum_stake_to_wager
            existing_config.maximum_stake_to_wager = config.maximum_stake_to_wager
            existing_config.maximum_withdraw = config.maximum_withdraw
            db.commit()
            db.refresh(existing_config)
            return existing_config
        else:
            # Create new
            new_config = StableConfig(**config.dict())
            db.add(new_config)
            db.commit()
            db.refresh(new_config)
            return new_config

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error saving config: {str(e)}")


@router.get("/stable-config/{provider}", response_model=StableConfigResponse)
def get_stable_config(provider: str, db: Session = Depends(get_db)):
    """
    Retrieve stable configuration for a specific provider.
    """
    config = db.query(StableConfig).filter(
        StableConfig.provider == provider.upper()
    ).first()

    if not config:
        raise HTTPException(
            status_code=404, detail=f"Config not found for provider: {provider}")

    return config


@router.get("/stable-config", response_model=List[StableConfigResponse])
def get_all_stable_configs(db: Session = Depends(get_db)):
    """
    Retrieve all stable configurations.
    """
    configs = db.query(StableConfig).all()
    return configs
