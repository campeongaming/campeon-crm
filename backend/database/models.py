from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class StableConfig(Base):
    """
    Stores provider-specific stable configuration values.
    Contains pricing tables with currency-specific values for cost, amounts, stakes, and withdrawals.
    """
    __tablename__ = "stable_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider = Column(String(50), nullable=False,
                      index=True)  # "PRAGMATIC", "BETSOFT"

    # Pricing tables stored as JSON
    # Structure: [{"id": "1", "name": "Table 1", "values": {"EUR": 0.2, "USD": 0.25, ...}}, ...]
    cost = Column(JSON, default=[])
    maximum_amount = Column(JSON, default=[])
    minimum_amount = Column(JSON, default=[])
    currency_unit = Column(JSON, default=[])
    minimum_stake_to_wager = Column(JSON, default=[])
    maximum_stake_to_wager = Column(JSON, default=[])
    maximum_withdraw = Column(JSON, default=[])

    # Proportions stored as text (JSON strings)
    casino_proportions = Column(Text, default='')
    live_casino_proportions = Column(Text, default='')

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<StableConfig {self.provider}>"


class BonusTemplate(Base):
    """
    Stores the complete bonus template with schedule, trigger, and config.
    All multilingual and multi-currency data is stored as JSON.
    """
    __tablename__ = "bonus_templates"

    id = Column(String(255), primary_key=True, index=True)
    # e.g., "Black Friday: Casino Reload 200% up to €300 21.11.25"

    # SCHEDULE
    # "period", "weekly", "daily"
    schedule_type = Column(String(50), default="period")
    schedule_from = Column(String(50))  # "21-11-2025 10:00"
    schedule_to = Column(String(50))    # "28-11-2025 22:59"

    # TRIGGER - Multilingual (stored as JSON)
    # Structure: {"*": "default", "en": "...", "de": "...", "GBP_en": "...", etc.}
    trigger_name = Column(JSON)
    trigger_description = Column(JSON)

    trigger_type = Column(String(50))  # "deposit", "reload", "cashback", etc.
    trigger_iterations = Column(Integer)  # How many times can be claimed
    trigger_duration = Column(String(20))  # "7d", "24h", etc.

    # TRIGGER - Minimums (per currency)
    # Structure: {"*": 25, "EUR": 25, "USD": 25, "GBP": 25, ...}
    minimum_amount = Column(JSON)

    # TRIGGER - Restricted countries (optional array)
    # Structure: ["BR", "AU", "NZ", ...]
    restricted_countries = Column(JSON, default=[])

    # TRIGGER - Segments (optional array)
    # Structure: ["segment1", "segment2", ...]
    segments = Column(JSON, default=[])

    # CONFIG - Cost per FS (per currency)
    # Structure: {"EUR": 0.12, "USD": 0.12, ...}
    cost = Column(JSON)

    # CONFIG - Multiplier (per currency)
    # Structure: {"EUR": 1.44, "USD": 1.44, ...}
    multiplier = Column(JSON)

    # CONFIG - Maximum bets per currency
    # Structure: {"EUR": 600, "USD": 600, ...}
    maximum_bets = Column(JSON)

    # CONFIG - Betting & Wagering
    percentage = Column(Float)  # 200 for 200% bonus
    wagering_multiplier = Column(Float)  # 15 for x15 wager requirement

    # Stake limits per currency
    minimum_stake_to_wager = Column(JSON)  # {"*": 0.5, "EUR": 0.5, ...}
    maximum_stake_to_wager = Column(JSON)  # {"*": 5, "EUR": 5, ...}

    # Maximum bonus per currency
    maximum_amount = Column(JSON)  # {"*": 300, "EUR": 300, ...}

    # Proportions (game-to-percentage mappings, only for cashback/reload)
    # Structure: {"SPINOMENAL.1 Reel Egypt": 0, "ROULETTE": 20, ...}
    # Optional, only for bonus types that need it
    proportions = Column(JSON, nullable=True, default=None)

    # Withdrawal limits per currency (in units of bonus, e.g., 3 = 3x bonus)
    maximum_withdraw = Column(JSON)  # {"*": 3, "EUR": 3, ...}

    # CONFIG - Flags
    include_amount_on_target_wager = Column(Boolean, default=True)
    cap_calculation_to_maximum = Column(Boolean, default=False)
    compensate_overspending = Column(Boolean, default=True)
    withdraw_active = Column(Boolean, default=False)

    # CONFIG - Categories
    category = Column(String(50))  # "GAMES", "SPORTS", etc.
    provider = Column(String(50))  # "SYSTEM", provider name
    brand = Column(String(50))  # "SYSTEM", brand name
    bonus_type = Column(String(50))  # "cash", "bonus", "free_spins"

    # CONFIG - Extra (e.g., game name)
    # Structure: {"game": "Game Name"}
    config_extra = Column(JSON)

    # CONFIG - Game/expiry info
    game = Column(String(255))  # Game name for free spins
    expiry = Column(String(20), default="7d")  # "7d", "24h", etc.

    # CONFIG - Withdrawal
    # "cash", "free_bet", "cashback"
    config_type = Column(String(50), default="free_bet")

    # User notes
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    translations = relationship(
        "BonusTranslation", back_populates="template", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<BonusTemplate {self.id}>"


class BonusTranslation(Base):
    """
    Stores language-specific translations for a bonus template.
    Allows fine-tuning of translations per language/currency combination.
    """
    __tablename__ = "bonus_translations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    template_id = Column(String(255), ForeignKey(
        "bonus_templates.id"), nullable=False)

    # Language code, e.g., "en", "de", "fr", "pt", "es", "it", "pl", "ru", "tr", "az"
    language = Column(String(10), nullable=False)

    # Optional: Currency for language-specific currency variants
    # e.g., "GBP_en", "USD_en", "BRL_pt", "NOK_no", etc.
    currency = Column(String(10), nullable=True)

    # Translated name
    name = Column(String(255), nullable=False)

    # Translated description
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    template = relationship("BonusTemplate", back_populates="translations")

    def __repr__(self):
        return f"<BonusTranslation {self.template_id}:{self.language}>"


class CurrencyReference(Base):
    """
    Reference sheet for currency conversion rates and deposit limits.
    Base currency is EUR.
    """
    __tablename__ = "currency_references"

    id = Column(Integer, primary_key=True, autoincrement=True)
    currency = Column(String(10), unique=True, nullable=False, index=True)
    eur_rate = Column(Float, nullable=False)  # 1 EUR = X in this currency
    min_deposit = Column(Float, nullable=False)
    max_deposit = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CurrencyReference {self.currency}: 1 EUR = {self.eur_rate}>"


class CustomLanguage(Base):
    """
    Stores user-defined custom languages for translations.
    """
    __tablename__ = "custom_languages"

    # e.g., "ja", "zh", "pt-BR"
    code = Column(String(10), primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g., "Japanese", "Chinese"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CustomLanguage {self.code}: {self.name}>"


class User(Base):
    """
    Stores user accounts for authentication.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="admin", nullable=False)  # admin, user
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow,
                        onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
