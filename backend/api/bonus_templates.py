"""
API endpoints for Bonus Templates
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import json as json_lib

from database.database import get_db
from database.models import BonusTemplate, BonusTranslation
from api.schemas import BonusTemplateCreate, BonusTemplateResponse, BonusTranslationCreate, BonusTranslationResponse, BonusJSONOutput
from services.json_generator import generate_bonus_json_with_currencies

router = APIRouter()


# ============= BONUS TEMPLATES =============

@router.post("/bonus-templates", response_model=BonusTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_bonus_template(template: BonusTemplateCreate, db: Session = Depends(get_db)):
    """Create a new bonus template"""

    # Check if template with this ID already exists
    existing = db.query(BonusTemplate).filter(
        BonusTemplate.id == template.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Template with ID '{template.id}' already exists"
        )

    # Create new template
    db_template = BonusTemplate(
        id=template.id,
        schedule_type=template.schedule_type,
        schedule_from=template.schedule_from,
        schedule_to=template.schedule_to,
        trigger_type=template.trigger_type,
        trigger_iterations=template.trigger_iterations,
        trigger_duration=template.trigger_duration,
        trigger_name=template.trigger_name,
        trigger_description=template.trigger_description,
        minimum_amount=template.minimum_amount,
        restricted_countries=template.restricted_countries,
        segments=template.segments,
        cost=template.cost,
        multiplier=template.multiplier,
        maximum_bets=template.maximum_bets,
        percentage=template.percentage,
        wagering_multiplier=template.wagering_multiplier,
        minimum_stake_to_wager=template.minimum_stake_to_wager,
        maximum_stake_to_wager=template.maximum_stake_to_wager,
        maximum_amount=template.maximum_amount,
        maximum_withdraw=template.maximum_withdraw,
        include_amount_on_target_wager=template.include_amount_on_target_wager,
        cap_calculation_to_maximum=template.cap_calculation_to_maximum,
        compensate_overspending=template.compensate_overspending,
        withdraw_active=template.withdraw_active,
        category=template.category,
        provider=template.provider,
        brand=template.brand,
        bonus_type=template.bonus_type,
        config_type=template.config_type,
        game=template.game,
        expiry=template.expiry,
        config_extra=template.config_extra,
        notes=template.notes,
    )

    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.post("/bonus-templates/simple", status_code=status.HTTP_201_CREATED)
def create_bonus_template_simple(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Create a bonus template using simple JSON format (deposit form)

    Accepts the simplified format:
    {
        "id": "DEPOSIT_...",
        "trigger": { "type": "deposit", "duration": "7d", "schedule": {...} },
        "config": { "cost": {...}, "multiplier": {...}, "maximumBets": {...}, ... },
        "type": "bonus_template"
    }
    """
    try:
        template_id = payload.get("id")
        if not template_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required field: id"
            )

        # Check if template with this ID already exists
        existing = db.query(BonusTemplate).filter(
            BonusTemplate.id == template_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Template with ID '{template_id}' already exists"
            )

        trigger = payload.get("trigger", {})
        config = payload.get("config", {})

        # Extract just the cap values from maximumWithdraw if they exist
        max_withdraw = config.get("maximumWithdraw", {})
        print(f"DEBUG POST: max_withdraw from payload = {max_withdraw}")
        print(f"DEBUG POST: max_withdraw type = {type(max_withdraw)}")

        max_withdraw_flattened = {}
        for curr, val in max_withdraw.items():
            if isinstance(val, dict):
                max_withdraw_flattened[curr] = val.get("cap", 0)
            else:
                max_withdraw_flattened[curr] = val

        print(f"DEBUG POST: max_withdraw_flattened = {max_withdraw_flattened}")

        # Build the FINAL JSON that will be stored - only include what was provided
        final_json = {
            "id": template_id,
            "type": "bonus_template"
        }

        # Add trigger if provided
        if trigger:
            trigger_obj = {}
            if trigger.get("type"):
                trigger_obj["type"] = trigger["type"]
            if trigger.get("duration"):
                trigger_obj["duration"] = trigger["duration"]
            if trigger.get("schedule"):
                trigger_obj["schedule"] = trigger["schedule"]
            if trigger_obj:
                final_json["trigger"] = trigger_obj

        # Add config if provided
        if config:
            config_obj = {}
            if config.get("cost"):
                config_obj["cost"] = config["cost"]
            if config.get("multiplier"):
                config_obj["multiplier"] = config["multiplier"]
            if config.get("maximumBets"):
                config_obj["maximumBets"] = config["maximumBets"]
            if max_withdraw_flattened:
                config_obj["maximumWithdraw"] = max_withdraw_flattened
            if config.get("provider"):
                config_obj["provider"] = config["provider"]
            if config.get("brand"):
                config_obj["brand"] = config["brand"]
            if config.get("type"):
                config_obj["type"] = config["type"]
            if config.get("category"):
                config_obj["category"] = config["category"]
            if config.get("extra"):
                config_obj["extra"] = config["extra"]
            if config_obj:
                final_json["config"] = config_obj

        # Create new template with simple format
        db_template = BonusTemplate(
            id=template_id,
            trigger_name={"*": "Bonus", "en": "Bonus"},
            trigger_description={"*": "", "en": ""},
            trigger_type=trigger.get("type", "deposit"),
            trigger_iterations=1,
            trigger_duration=trigger.get("duration", "7d"),
            minimum_amount={"*": 0},
            percentage=0,
            wagering_multiplier=0,
            minimum_stake_to_wager={"*": 0},
            maximum_stake_to_wager=config.get("maximumBets", {"*": 0}),
            maximum_amount=config.get("cost", {"*": 0}),
            maximum_withdraw=max_withdraw_flattened,
            category=config.get("category", "games"),
            provider=config.get("provider", "PRAGMATIC"),
            brand=config.get("brand", "PRAGMATIC"),
            bonus_type=config.get("type", "cost"),
        )

        # Handle optional schedule
        if trigger.get("schedule"):
            schedule = trigger["schedule"]
            db_template.schedule_from = schedule.get("from")
            db_template.schedule_to = schedule.get("to")

        db.add(db_template)
        db.commit()
        db.refresh(db_template)

        return {
            "status": "created",
            "message": f"Bonus template '{template_id}' created successfully",
            "json_output": final_json
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/bonus-templates")
def list_bonus_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all bonus templates"""
    templates = db.query(BonusTemplate).offset(skip).limit(limit).all()
    return [{"id": t.id, "provider": t.provider, "bonus_type": t.bonus_type, "created_at": t.created_at} for t in templates]


@router.get("/bonus-templates/search")
def search_bonus_template(query: str, db: Session = Depends(get_db)):
    """Search for bonus templates by ID (partial match), date, or other fields"""
    from sqlalchemy import or_, func

    if not query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty"
        )

    query_str = query.strip()

    # Try to parse as date (YYYY-MM-DD, YYYY-MM, or YYYY formats)
    date_filter = None
    if len(query_str) == 10 and query_str.count('-') == 2:  # YYYY-MM-DD
        date_filter = query_str
    elif len(query_str) == 7 and query_str.count('-') == 1:  # YYYY-MM
        date_filter = query_str
    elif len(query_str) == 4 and query_str.isdigit():  # YYYY
        date_filter = query_str

    # Build the query with multiple conditions
    conditions = [
        BonusTemplate.id.ilike(f"%{query_str}%"),  # Partial ID match
        BonusTemplate.provider.ilike(f"%{query_str}%"),
        BonusTemplate.brand.ilike(f"%{query_str}%"),
        BonusTemplate.category.ilike(f"%{query_str}%"),
    ]

    # Add date-based filtering if query looks like a date
    if date_filter:
        if len(date_filter) == 10:  # YYYY-MM-DD
            conditions.append(func.strftime(
                '%Y-%m-%d', BonusTemplate.created_at) == date_filter)
        elif len(date_filter) == 7:  # YYYY-MM
            conditions.append(func.strftime(
                '%Y-%m', BonusTemplate.created_at) == date_filter)
        elif len(date_filter) == 4:  # YYYY
            conditions.append(func.strftime(
                '%Y', BonusTemplate.created_at) == date_filter)

    templates = db.query(BonusTemplate).filter(or_(*conditions)).all()

    if not templates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No bonuses found matching: {query_str}"
        )

    return templates


@router.get("/bonus-templates/dates/{year}/{month}")
def get_bonuses_by_month(year: int, month: int, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Get bonus templates created in a specific month with pagination"""
    from sqlalchemy import desc, func

    print(
        f"[DEBUG] Fetching bonuses for {year}-{month}, skip={skip}, limit={limit}")

    # SQLite-compatible date filtering using strftime
    templates = db.query(BonusTemplate).filter(
        func.strftime(
            '%Y-%m', BonusTemplate.created_at) == f"{year:04d}-{month:02d}"
    ).order_by(desc(BonusTemplate.created_at)).offset(skip).limit(limit).all()

    print(f"[DEBUG] Found {len(templates)} bonuses")
    return [{"id": t.id, "provider": t.provider, "bonus_type": t.bonus_type, "created_at": t.created_at} for t in templates]


@router.get("/bonus-templates/{template_id}")
def get_bonus_template(template_id: str, db: Session = Depends(get_db)):
    """Get a specific bonus template"""
    template = db.query(BonusTemplate).filter(
        BonusTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )
    return template


@router.patch("/bonus-templates/{template_id}", response_model=BonusTemplateResponse)
def patch_bonus_template(template_id: str, template_patch: dict, db: Session = Depends(get_db)):
    """Partially update a bonus template"""
    template = db.query(BonusTemplate).filter(
        BonusTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    # Update only provided fields
    for field, value in template_patch.items():
        if hasattr(template, field):
            setattr(template, field, value)

    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)
    return template


@router.put("/bonus-templates/{template_id}", response_model=BonusTemplateResponse)
def update_bonus_template(template_id: str, template_update: BonusTemplateCreate, db: Session = Depends(get_db)):
    """Update a bonus template"""
    template = db.query(BonusTemplate).filter(
        BonusTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    # Update fields
    for field, value in template_update.dict().items():
        setattr(template, field, value)

    template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(template)
    return template


@router.delete("/bonus-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bonus_template(template_id: str, db: Session = Depends(get_db)):
    """Delete a bonus template"""
    template = db.query(BonusTemplate).filter(
        BonusTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    db.delete(template)
    db.commit()
    return None


# ============= BONUS TRANSLATIONS =============

@router.post("/bonus-templates/{template_id}/translations", status_code=status.HTTP_201_CREATED)
def add_translation(template_id: str, translation: BonusTranslationCreate, db: Session = Depends(get_db)):
    """Add a translation for a bonus template - updates if exists"""

    # Check if template exists
    template = db.query(BonusTemplate).filter(
        BonusTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    print(
        f"[DEBUG] Saving translation for {template_id} - Language: {translation.language}")
    print(
        f"[DEBUG] Name: {translation.name}, Description: {translation.description}")

    # Check if translation already exists for this language
    existing_translation = db.query(BonusTranslation).filter(
        BonusTranslation.template_id == template_id,
        BonusTranslation.language == translation.language
    ).first()

    if existing_translation:
        # Update existing translation
        print(
            f"[DEBUG] Updating existing translation for {translation.language}")
        existing_translation.name = translation.name
        existing_translation.description = translation.description
        existing_translation.currency = translation.currency
        db.commit()
        db.refresh(existing_translation)
        print(f"[DEBUG] Updated translation: {existing_translation.name}")
        return existing_translation
    else:
        # Create new translation
        print(f"[DEBUG] Creating new translation for {translation.language}")
        db_translation = BonusTranslation(
            template_id=template_id,
            language=translation.language,
            currency=translation.currency,
            name=translation.name,
            description=translation.description,
        )

        db.add(db_translation)
        db.commit()
        db.refresh(db_translation)
        print(f"[DEBUG] Created translation: {db_translation.name}")
        return db_translation


@router.get("/bonus-templates/{template_id}/translations", response_model=List[BonusTranslationResponse])
def get_translations(template_id: str, db: Session = Depends(get_db)):
    """Get all translations for a bonus template"""
    print(f"[DEBUG] Getting translations for bonus: {template_id}")

    template = db.query(BonusTemplate).filter(
        BonusTemplate.id == template_id).first()
    if not template:
        print(f"[DEBUG] Template {template_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    translations = db.query(BonusTranslation).filter(
        BonusTranslation.template_id == template_id).all()

    print(f"[DEBUG] Found {len(translations)} translations")
    for t in translations:
        print(f"[DEBUG]   - {t.language}: {t.name}")

    return translations


@router.delete("/bonus-templates/{template_id}/translations/{language}", status_code=status.HTTP_204_NO_CONTENT)
def delete_translation(template_id: str, language: str, db: Session = Depends(get_db)):
    """Delete a translation for a bonus template"""
    print(
        f"[DEBUG] Deleting translation for {template_id} - Language: {language}")

    # Find and delete the translation
    translation = db.query(BonusTranslation).filter(
        BonusTranslation.template_id == template_id,
        BonusTranslation.language == language
    ).first()

    if translation:
        db.delete(translation)
        db.commit()
        print(f"[DEBUG] Deleted translation for {language}")
    else:
        print(f"[DEBUG] Translation for {language} not found")

    return None


# ============= JSON GENERATION =============

@router.get("/bonus-templates/{template_id}/json")
def generate_template_json(template_id: str, db: Session = Depends(get_db)):
    """Generate the final JSON output for a bonus template with stored cost data and translations"""

    template = db.query(BonusTemplate).filter(
        BonusTemplate.id == template_id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found"
        )

    # Fetch admin config to get maximumWithdraw in proper format
    from database.models import StableConfig
    admin_config = db.query(StableConfig).filter(
        StableConfig.provider == template.provider
    ).first()

    # Build maximumWithdraw format based on bonus type
    # For reload bonuses: use flat numbers (no "cap" wrapper)
    # For other bonuses: use nested format with "cap"
    maximum_withdraw_formatted = {}

    print(f"DEBUG: template.maximum_withdraw = {template.maximum_withdraw}")
    print(
        f"DEBUG: template.maximum_withdraw type = {type(template.maximum_withdraw)}")
    print(f"DEBUG: template.bonus_type = {template.bonus_type}")

    if template.maximum_withdraw:
        stored_data = template.maximum_withdraw
        print(f"DEBUG: Using stored data: {stored_data}")
        # If stored as flat dict/JSON, convert based on bonus type
        if isinstance(stored_data, dict):
            for curr, val in stored_data.items():
                if isinstance(val, dict):
                    # Already nested format
                    if template.bonus_type == 'reload':
                        # Extract the cap value for reload bonuses
                        maximum_withdraw_formatted[curr] = val.get('cap', val)
                    else:
                        maximum_withdraw_formatted[curr] = val
                else:
                    # Flat value
                    if template.bonus_type == 'reload':
                        # Keep flat for reload bonuses
                        maximum_withdraw_formatted[curr] = val
                    else:
                        # Wrap in cap for other bonuses
                        maximum_withdraw_formatted[curr] = {"cap": val}
    # Fallback to admin config if stored data is empty
    elif admin_config and admin_config.maximum_withdraw:
        print(f"DEBUG: Using admin config data")
        # Admin stores it as list of dicts with currency and cap
        for item in admin_config.maximum_withdraw:
            if isinstance(item, dict):
                currency = item.get("currency")
                cap = item.get("cap", 0)
                if currency:
                    if template.bonus_type == 'reload':
                        # Flat number for reload bonuses
                        maximum_withdraw_formatted[currency] = cap
                    else:
                        # Nested format for other bonuses
                        maximum_withdraw_formatted[currency] = {"cap": cap}

    print(
        f"DEBUG: Final maximum_withdraw_formatted = {maximum_withdraw_formatted}")

    # Fetch translations for this template
    translations = db.query(BonusTranslation).filter(
        BonusTranslation.template_id == template_id
    ).all()

    # Build multilingual name and description from translations
    trigger_name = {}
    trigger_description = {}

    for translation in translations:
        if translation.language:
            if translation.name:
                trigger_name[translation.language] = translation.name
            if translation.description:
                trigger_description[translation.language] = translation.description

    # Set "*" (default) to English or first available translation
    if "en" in trigger_name:
        trigger_name["*"] = trigger_name["en"]
    elif trigger_name:
        trigger_name["*"] = next(iter(trigger_name.values()))

    if "en" in trigger_description:
        trigger_description["*"] = trigger_description["en"]
    elif trigger_description:
        trigger_description["*"] = next(iter(trigger_description.values()))

    # Build the full JSON from stored data with correct field ordering
    # Structure: 1) id 2) schedule 3) trigger 4) config 5) type
    json_output = {
        "id": template.id,
    }

    # DEBUG: Check schedule fields
    print(f"DEBUG: template.schedule_from = {template.schedule_from}")
    print(f"DEBUG: template.schedule_to = {template.schedule_to}")
    print(f"DEBUG: template.schedule_type = {template.schedule_type}")

    # Add schedule right after id if it exists
    if template.schedule_from and template.schedule_to:
        json_output["schedule"] = {
            "type": template.schedule_type or "period",
            "from": template.schedule_from,
            "to": template.schedule_to
        }
        print(f"DEBUG: Added schedule to JSON: {json_output['schedule']}")
    else:
        print(
            f"DEBUG: Schedule NOT added - schedule_from: {bool(template.schedule_from)}, schedule_to: {bool(template.schedule_to)}")

    # Add trigger section
    json_output["trigger"] = {}

    # Build trigger with correct field order
    # 1) name and description
    if trigger_name:
        json_output["trigger"]["name"] = trigger_name
    if trigger_description:
        json_output["trigger"]["description"] = trigger_description

    # 2) minimum amount
    if template.minimum_amount:
        json_output["trigger"]["minimumAmount"] = template.minimum_amount

    # 3) iterations, type, duration, restrictedCountries, segments
    if template.trigger_iterations and template.trigger_iterations > 0:
        json_output["trigger"]["iterations"] = template.trigger_iterations

    json_output["trigger"]["type"] = template.trigger_type
    json_output["trigger"]["duration"] = template.trigger_duration

    if hasattr(template, 'restricted_countries') and template.restricted_countries:
        json_output["trigger"]["restrictedCountries"] = template.restricted_countries

    if hasattr(template, 'segments') and template.segments:
        json_output["trigger"]["segments"] = template.segments

    # Add config section
    extra_data = {
        "category": template.category,
        "game": template.bonus_type,
    }

    # Fetch proportions if needed
    proportions_text = None
    if template.config_extra:
        import json as json_parser
        try:
            if isinstance(template.config_extra, str):
                config_extra_parsed = json_parser.loads(template.config_extra)
            else:
                config_extra_parsed = template.config_extra

            proportions_type = config_extra_parsed.get('proportions_type')

            if proportions_type:
                admin_config = db.query(StableConfig).filter(
                    StableConfig.provider == 'PRAGMATIC'
                ).first()

                if admin_config:
                    if proportions_type == 'casino' and admin_config.casino_proportions:
                        proportions_text = admin_config.casino_proportions.strip()
                    elif proportions_type == 'live_casino' and admin_config.live_casino_proportions:
                        proportions_text = admin_config.live_casino_proportions.strip()
        except:
            pass

    # Build the config section manually as a string
    import json as json_lib

    # Build config_dict with cost/multiplier/maximumBets first for free_spins
    config_dict = {}

    # Add free_spins specific fields FIRST if bonus_type is free_spins and they have values
    if template.bonus_type == 'free_spins':
        if template.cost:
            config_dict["cost"] = template.cost
        if template.multiplier:
            config_dict["multiplier"] = template.multiplier
        if template.maximum_bets:
            config_dict["maximumBets"] = template.maximum_bets

    # Then add the common fields
    config_dict["provider"] = template.provider
    config_dict["brand"] = template.brand
    config_dict["type"] = template.bonus_type
    config_dict["category"] = template.category
    config_dict["maximumWithdraw"] = maximum_withdraw_formatted

    # Add stake to wager fields if present and non-zero
    if template.minimum_stake_to_wager:
        # Check if any currency has a non-zero value
        if isinstance(template.minimum_stake_to_wager, dict):
            has_value = any(val > 0 for val in template.minimum_stake_to_wager.values(
            ) if isinstance(val, (int, float)))
            if has_value:
                config_dict["minimumStakeToWager"] = template.minimum_stake_to_wager

    if template.maximum_stake_to_wager:
        # Check if any currency has a non-zero value
        if isinstance(template.maximum_stake_to_wager, dict):
            has_value = any(val > 0 for val in template.maximum_stake_to_wager.values(
            ) if isinstance(val, (int, float)))
            if has_value:
                config_dict["maximumStakeToWager"] = template.maximum_stake_to_wager

    config_json = json_lib.dumps(config_dict, indent=2)

    # Remove the closing brace from config
    config_json = config_json.rstrip()[:-1]  # Remove last }

    # Add extra section manually with proportions injected
    config_json += ',\n    "extra": {\n'
    config_json += '      "category": "' + \
        str(extra_data.get("category", "")) + '"'

    # Only include game field for free_spins bonus type
    if template.bonus_type == 'free_spins' and extra_data.get("game"):
        config_json += ',\n      "game": "' + \
            str(extra_data.get("game", "")) + '"'

    if proportions_text:
        config_json += ',\n      "proportions": {' + proportions_text + '}'

    config_json += '\n    }\n'

    # Add expiry field if present
    if template.expiry:
        config_json += ',\n    "expiry": "' + str(template.expiry) + '"\n'
    else:
        config_json += '\n'

    config_json += '  }'

    # Now build complete JSON manually
    json_str = '{\n'
    json_str += '  "id": "' + json_lib.dumps(template.id)[1:-1] + '",\n'

    # Add schedule if it exists
    if "schedule" in json_output:
        json_str += '  "schedule": ' + \
            json_lib.dumps(json_output["schedule"], indent=2).replace(
                '\n', '\n  ') + ',\n'
        print(f"DEBUG: Schedule added to JSON string")

    json_str += '  "trigger": ' + \
        json_lib.dumps(json_output["trigger"], indent=2).replace(
            '\n', '\n  ') + ',\n'
    json_str += '  "config": ' + config_json + ',\n'
    json_str += '  "type": "bonus_template"\n'
    json_str += '}'

    from fastapi.responses import Response
    return Response(content=json_str, media_type="application/json")
