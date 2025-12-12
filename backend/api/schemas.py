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

    # Schedule
    schedule_type: str = "period"
    schedule_from: str
    schedule_to: str

    # Trigger
    # {"*": "default", "en": "...", "de": "...", ...}
    trigger_name: Dict[str, str]
    trigger_description: Dict[str, str]
    trigger_type: str
    trigger_iterations: int
    trigger_duration: str
    minimum_amount: Dict[str, float]  # {"*": 25, "EUR": 25, ...}

    # Config
    percentage: float
    wagering_multiplier: float
    minimum_stake_to_wager: Dict[str, float]
    maximum_stake_to_wager: Dict[str, float]
    maximum_amount: Dict[str, float]
    maximum_withdraw: Dict[str, float]

    # Flags
    include_amount_on_target_wager: bool = True
    cap_calculation_to_maximum: bool = False
    compensate_overspending: bool = True
    withdraw_active: bool = False

    # Categories
    category: str
    provider: str
    brand: str
    bonus_type: str


class BonusTemplateResponse(BonusTemplateCreate):
    """Schema for bonus template responses"""
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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
