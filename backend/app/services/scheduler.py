from __future__ import annotations

import logging

from app.database import AsyncSessionLocal
from app.services.recurring import process_due_recurring_transactions
from app.services.retention import purge_expired_transactions

logger = logging.getLogger(__name__)


async def run_recurring_transactions() -> None:
    async with AsyncSessionLocal() as session:
        count = await process_due_recurring_transactions(session)
        logger.info("Recurring transactions processed: %s created", count)


async def run_data_retention() -> None:
    async with AsyncSessionLocal() as session:
        count = await purge_expired_transactions(session)
        logger.info("Data retention completed: %s purged", count)
