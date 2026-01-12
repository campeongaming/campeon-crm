from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import json

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
        # Convert Pydantic models to dicts for JSON serialization
        config_data = config.dict()

        # Convert CurrencyTable objects to dicts if needed
        for field in ['cost', 'maximum_amount', 'minimum_amount', 'minimum_stake_to_wager', 'maximum_stake_to_wager', 'maximum_withdraw']:
            if field in config_data and config_data[field]:
                config_data[field] = [
                    item.dict() if hasattr(item, 'dict') else item
                    for item in config_data[field]
                ]

        # Convert proportions to JSON strings if they're dicts/lists
        if config_data.get('casino_proportions'):
            if isinstance(config_data['casino_proportions'], (dict, list)):
                config_data['casino_proportions'] = json.dumps(
                    config_data['casino_proportions'])
        else:
            config_data['casino_proportions'] = ""

        if config_data.get('live_casino_proportions'):
            if isinstance(config_data['live_casino_proportions'], (dict, list)):
                config_data['live_casino_proportions'] = json.dumps(
                    config_data['live_casino_proportions'])
        else:
            config_data['live_casino_proportions'] = ""

        # Check if config exists for this provider
        existing_config = db.query(StableConfig).filter(
            StableConfig.provider == config.provider
        ).first()

        if existing_config:
            # Update existing
            existing_config.cost = config_data['cost']
            existing_config.maximum_amount = config_data['maximum_amount']
            existing_config.minimum_amount = config_data['minimum_amount']
            existing_config.minimum_stake_to_wager = config_data['minimum_stake_to_wager']
            existing_config.maximum_stake_to_wager = config_data['maximum_stake_to_wager']
            existing_config.maximum_withdraw = config_data['maximum_withdraw']
            existing_config.casino_proportions = config_data['casino_proportions']
            existing_config.live_casino_proportions = config_data['live_casino_proportions']
            db.commit()
            db.refresh(existing_config)
            return existing_config
        else:
            # Create new
            new_config = StableConfig(
                provider=config.provider,
                cost=config_data['cost'],
                maximum_amount=config_data['maximum_amount'],
                minimum_amount=config_data['minimum_amount'],
                minimum_stake_to_wager=config_data['minimum_stake_to_wager'],
                maximum_stake_to_wager=config_data['maximum_stake_to_wager'],
                maximum_withdraw=config_data['maximum_withdraw'],
                casino_proportions=config_data['casino_proportions'],
                live_casino_proportions=config_data['live_casino_proportions']
            )
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
    Returns proportions as JSON strings (for admin panel display).
    """
    config = db.query(StableConfig).filter(
        StableConfig.provider == provider.upper()
    ).first()

    if not config:
        raise HTTPException(
            status_code=404, detail=f"Config not found for provider: {provider}")

    return config


@router.get("/stable-config/{provider}/with-tables", response_model=StableConfigResponse)
def get_stable_config_with_tables(provider: str, db: Session = Depends(get_db)):
    """
    Retrieve stable configuration for a specific provider.
    Converts JSON string proportions to table structures (for bonus creation forms).
    """
    import json

    config = db.query(StableConfig).filter(
        StableConfig.provider == provider.upper()
    ).first()

    if not config:
        raise HTTPException(
            status_code=404, detail=f"Config not found for provider: {provider}")

    # Convert proportions from JSON strings to table structures for frontend forms
    try:
        if config.casino_proportions and isinstance(config.casino_proportions, str):
            proportions_obj = json.loads(config.casino_proportions)
            # Wrap in table structure for bonus creation form
            config.casino_proportions = [
                {
                    "id": "1",
                    "name": "Casino Proportions",
                    "values": proportions_obj
                }
            ]

        if config.live_casino_proportions and isinstance(config.live_casino_proportions, str):
            proportions_obj = json.loads(config.live_casino_proportions)
            # Wrap in table structure for bonus creation form
            config.live_casino_proportions = [
                {
                    "id": "2",
                    "name": "Live Casino Proportions",
                    "values": proportions_obj
                }
            ]
    except (json.JSONDecodeError, TypeError):
        # If JSON parsing fails, leave as empty
        config.casino_proportions = []
        config.live_casino_proportions = []

    return config


@router.get("/stable-config", response_model=List[StableConfigResponse])
def get_all_stable_configs(db: Session = Depends(get_db)):
    """
    Retrieve all stable configurations.
    """
    configs = db.query(StableConfig).all()
    return configs
