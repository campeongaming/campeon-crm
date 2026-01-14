#!/usr/bin/env python
"""Migrate non-cost data from provider rows to DEFAULT row"""
from database.database import SessionLocal
from database.models import StableConfig
from datetime import datetime
import sys
import os
# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def migrate_to_default():
    db = SessionLocal()

    try:
        # Check if DEFAULT already exists
        default_config = db.query(StableConfig).filter(
            StableConfig.provider == "DEFAULT").first()

        if default_config:
            print("✅ DEFAULT config already exists, skipping creation")
        else:
            print("📋 Creating DEFAULT config row...")
            default_config = StableConfig(
                provider="DEFAULT",
                cost=[],  # Cost is provider-specific, not stored in DEFAULT
                maximum_amount=[],
                minimum_amount=[],
                minimum_stake_to_wager=[],
                maximum_stake_to_wager=[],
                maximum_withdraw=[],
                casino_proportions="",
                live_casino_proportions=""
            )
            db.add(default_config)

        # Get PRAGMATIC config (we'll use this as the source for non-cost data)
        pragmatic = db.query(StableConfig).filter(
            StableConfig.provider == "PRAGMATIC").first()
        betsoft = db.query(StableConfig).filter(
            StableConfig.provider == "BETSOFT").first()

        if pragmatic:
            print(f"\n📦 Migrating non-cost data from PRAGMATIC to DEFAULT...")
            # Copy all non-cost fields to DEFAULT
            default_config.maximum_amount = pragmatic.maximum_amount or []
            default_config.minimum_amount = pragmatic.minimum_amount or []
            default_config.minimum_stake_to_wager = pragmatic.minimum_stake_to_wager or []
            default_config.maximum_stake_to_wager = pragmatic.maximum_stake_to_wager or []
            default_config.maximum_withdraw = pragmatic.maximum_withdraw or []
            default_config.casino_proportions = pragmatic.casino_proportions or ""
            default_config.live_casino_proportions = pragmatic.live_casino_proportions or ""

            print(
                f"   ✓ Copied {len(default_config.maximum_amount or [])} maximum_amount tables")
            print(
                f"   ✓ Copied {len(default_config.minimum_amount or [])} minimum_amount tables")
            print(
                f"   ✓ Copied {len(default_config.minimum_stake_to_wager or [])} minimum_stake_to_wager tables")
            print(
                f"   ✓ Copied {len(default_config.maximum_stake_to_wager or [])} maximum_stake_to_wager tables")
            print(
                f"   ✓ Copied {len(default_config.maximum_withdraw or [])} maximum_withdraw tables")

            # Clear non-cost fields from PRAGMATIC (keep only cost)
            print(
                f"\n🧹 Clearing non-cost data from PRAGMATIC (keeping {len(pragmatic.cost or [])} cost tables)...")
            pragmatic.maximum_amount = []
            pragmatic.minimum_amount = []
            pragmatic.minimum_stake_to_wager = []
            pragmatic.maximum_stake_to_wager = []
            pragmatic.maximum_withdraw = []
            pragmatic.casino_proportions = ""
            pragmatic.live_casino_proportions = ""

        if betsoft:
            print(
                f"\n🧹 Clearing non-cost data from BETSOFT (keeping {len(betsoft.cost or [])} cost tables)...")
            # Clear non-cost fields from BETSOFT (keep only cost)
            betsoft.maximum_amount = []
            betsoft.minimum_amount = []
            betsoft.minimum_stake_to_wager = []
            betsoft.maximum_stake_to_wager = []
            betsoft.maximum_withdraw = []
            betsoft.casino_proportions = ""
            betsoft.live_casino_proportions = ""

        db.commit()

        print("\n" + "="*60)
        print("✅ Migration complete!")
        print("="*60)
        print("\n📊 Final structure:")
        print("   • PRAGMATIC row → Only cost tables")
        print("   • BETSOFT row → Only cost tables")
        print("   • DEFAULT row → All other tables (amounts, stakes, withdrawals, proportions)")

    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_to_default()
