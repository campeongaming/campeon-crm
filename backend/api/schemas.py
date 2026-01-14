from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class CurrencyTable(BaseModel):
    """Schema for a single pricing table with currencies"""
    id: str
    name: str
    values: Dict[str, float]


class StableConfigCreate(BaseModel):
    """Schema for creating/updating stable config"""
    provider: str  # "PRAGMATIC", "BETSOFT"
    cost: List[CurrencyTable] = []
    maximum_amount: List[CurrencyTable] = []
    minimum_amount: List[CurrencyTable] = []
    minimum_stake_to_wager: List[CurrencyTable] = []
    maximum_stake_to_wager: List[CurrencyTable] = []
    maximum_withdraw: List[CurrencyTable] = []
    casino_proportions: Any = None  # Can be string or list of tables
    live_casino_proportions: Any = None  # Can be string or list of tables


class StableConfigResponse(StableConfigCreate):
    """Schema for stable config responses"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BonusTemplateCreate(BaseModel):
    """Schema for creating a new bonus template"""
    id: str  # e.g., "Black Friday: Casino Reload 200% up to €300 21.11.25"

    # Schedule (optional - if not provided, bonus has no schedule)
    schedule_type: str = "period"
    schedule_from: Optional[str] = None
    schedule_to: Optional[str] = None

    # Trigger
    # {"*": "default", "en": "...", "de": "...", ...}
    trigger_name: Optional[Dict[str, str]] = None
    trigger_description: Optional[Dict[str, str]] = None
    trigger_type: Optional[str] = None
    trigger_iterations: Optional[int] = None
    trigger_duration: Optional[str] = None
    minimum_amount: Optional[Dict[str, float]
                             ] = None  # {"*": 25, "EUR": 25, ...}
    restricted_countries: Optional[List[str]] = None  # ["BR", "AU", "NZ", ...]
    segments: Optional[List[str]] = None  # ["segment1", "segment2", ...]

    # Config - Cost and multiplier per currency
    cost: Optional[Dict[str, float]] = None  # {"EUR": 0.12, "USD": 0.12, ...}
    multiplier: Optional[Dict[str, float]] = None  # {"EUR": 1.44, ...}
    # {"EUR": 600, "USD": 600, ...}
    maximum_bets: Optional[Dict[str, float]] = None

    # Config - Betting
    percentage: Optional[float] = None
    wagering_multiplier: Optional[float] = None
    minimum_stake_to_wager: Optional[Dict[str, float]] = None
    maximum_stake_to_wager: Optional[Dict[str, float]] = None
    maximum_amount: Optional[Dict[str, float]] = None
    maximum_withdraw: Optional[Dict[str, float]] = None

    # Config - Flags
    include_amount_on_target_wager: bool = True
    cap_calculation_to_maximum: bool = False
    compensate_overspending: bool = True
    withdraw_active: bool = False

    # Config - Categories
    category: Optional[str] = None
    provider: Optional[str] = None
    brand: Optional[str] = None
    bonus_type: Optional[str] = None
    config_type: str = "free_bet"
    game: Optional[str] = None
    expiry: str = "7d"
    config_extra: Optional[Dict[str, Any]] = None

    # User notes
    notes: Optional[str] = None


class BonusTemplateResponse(BonusTemplateCreate):
    """Schema for bonus template responses"""
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BonusTemplatePatch(BaseModel):
    """Schema for partially updating a bonus template"""
    schedule_from: Optional[str] = None
    schedule_to: Optional[str] = None
    trigger_name: Optional[Dict[str, str]] = None
    trigger_description: Optional[Dict[str, str]] = None
    percentage: Optional[float] = None
    wagering_multiplier: Optional[float] = None
    expiry: Optional[str] = None
    trigger_duration: Optional[str] = None
    trigger_iterations: Optional[int] = None
    notes: Optional[str] = None


class BonusTranslationCreate(BaseModel):
    """Schema for creating translation for a bonus"""
    language: str
    currency: Optional[str] = None
    name: str
    description: Optional[str] = None


class BonusTranslationResponse(BonusTranslationCreate):
    """Schema for translation responses"""
    id: int
    template_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CurrencyReferenceCreate(BaseModel):
    """Schema for currency reference"""
    currency: str
    eur_rate: float
    min_deposit: float
    max_deposit: Optional[float] = None


class CurrencyReferenceResponse(CurrencyReferenceCreate):
    """Schema for currency reference responses"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BonusJSONOutput(BaseModel):
    """Schema for the final JSON output matching config.json structure"""
    id: str
    schedule: Dict[str, Any]
    trigger: Dict[str, Any]
    config: Dict[str, Any]
