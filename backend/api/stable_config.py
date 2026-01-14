from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from database.database import get_db
from database.models import StableConfig
from api.schemas import StableConfigCreate, StableConfigResponse

router = APIRouter()


@router.post("/stable-config")
def save_stable_config(config: StableConfigCreate, tab: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Save or update stable configuration.

    IMPORTANT: Provider is ONLY relevant for cost tab.
    - Cost tab → saves to provider-specific row (PRAGMATIC, BETSOFT)
    - Other tabs → save to DEFAULT row (provider-independent)

    Parameters:
    - tab: Optional tab identifier ('cost', 'amounts', 'stakes', 'withdrawals', 'wager', 'proportions')
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

        # Determine which provider to use based on tab
        # Cost tab → use actual provider (PRAGMATIC/BETSOFT)
        # Other tabs → use "DEFAULT" (provider-independent)
        target_provider = config.provider if tab == 'cost' else "DEFAULT"

        # Check if config exists for this provider
        existing_config = db.query(StableConfig).filter(
            StableConfig.provider == target_provider
        ).first()

        if existing_config:
            # Update existing - only update fields based on tab
            if tab == 'cost':
                # Cost tab → only update cost field
                if config_data['cost']:
                    existing_config.cost = config_data['cost']
            else:
                # Other tabs → update corresponding fields (stored in DEFAULT row)
                if config_data['maximum_amount']:
                    existing_config.maximum_amount = config_data['maximum_amount']
                if config_data['minimum_amount']:
                    existing_config.minimum_amount = config_data['minimum_amount']
                if config_data['minimum_stake_to_wager']:
                    existing_config.minimum_stake_to_wager = config_data['minimum_stake_to_wager']
                if config_data['maximum_stake_to_wager']:
                    existing_config.maximum_stake_to_wager = config_data['maximum_stake_to_wager']
                if config_data['maximum_withdraw']:
                    existing_config.maximum_withdraw = config_data['maximum_withdraw']
                if config_data['casino_proportions']:
                    existing_config.casino_proportions = config_data['casino_proportions']
                if config_data['live_casino_proportions']:
                    existing_config.live_casino_proportions = config_data['live_casino_proportions']

            db.commit()
            db.refresh(existing_config)

            # Return filtered response based on tab
            return _format_response(existing_config, tab)
        else:
            # Create new
            if tab == 'cost':
                # Cost tab → create provider-specific row with only cost
                new_config = StableConfig(
                    provider=target_provider,
                    cost=config_data['cost'],
                    maximum_amount=[],
                    minimum_amount=[],
                    minimum_stake_to_wager=[],
                    maximum_stake_to_wager=[],
                    maximum_withdraw=[],
                    casino_proportions="",
                    live_casino_proportions=""
                )
            else:
                # Other tabs → create DEFAULT row with non-cost fields
                new_config = StableConfig(
                    provider="DEFAULT",
                    cost=[],
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

            # Return filtered response based on tab
            return _format_response(new_config, tab)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error saving config: {str(e)}")


def _format_response(config: StableConfig, tab: Optional[str] = None):
    """
    Format response - include provider field only for cost tab
    """
    response = {
        "id": config.id,
        "created_at": config.created_at,
        "updated_at": config.updated_at,
        "cost": config.cost or [],
        "maximum_amount": config.maximum_amount or [],
        "minimum_amount": config.minimum_amount or [],
        "minimum_stake_to_wager": config.minimum_stake_to_wager or [],
        "maximum_stake_to_wager": config.maximum_stake_to_wager or [],
        "maximum_withdraw": config.maximum_withdraw or [],
        "casino_proportions": config.casino_proportions,
        "live_casino_proportions": config.live_casino_proportions,
    }

    # Only include provider for cost tab or if tab is not specified
    if tab is None or tab == 'cost':
        response["provider"] = config.provider

    return response


@router.get("/stable-config/{provider}")
def get_stable_config(provider: str, cost_only: bool = Query(False), db: Session = Depends(get_db)):
    """
    Retrieve stable configuration for a specific provider.

    Parameters:
    - provider: Provider name (PRAGMATIC, BETSOFT)
    - cost_only: If True, only return cost tables (for bonus creation form).
                If False, return all tables (for admin panel).
    """
    config = db.query(StableConfig).filter(
        StableConfig.provider == provider.upper()
    ).first()

    if not config:
        raise HTTPException(
            status_code=404, detail=f"Config not found for provider: {provider}")

    # If cost_only is True, return ONLY cost tables - provider is only for cost lookup
    if cost_only:
        return {
            "cost": config.cost or [],
        }

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
