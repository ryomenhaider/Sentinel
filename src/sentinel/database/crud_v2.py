import pandas as pd
import numpy as np
from sentinel.database.models import (
    TechnicalSnapshot, CompanyFundamental, market_features,
    macro_data
)
from sentinel.database.connection import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

async def insert_ta_data(session: AsyncSession, data: dict):
    data = {
        key: value.item() if isinstance(value, np.generic) else value
        for key, value in data.items()
    }
    stmt = insert(TechnicalSnapshot).values(data)
    stmt = stmt.on_conflict_do_nothing(
        index_elements=["symbol", "timestamp_ms"]
    )
    await session.execute(stmt)


async def get_ta_data(session: AsyncSession, symbol: str, limit: int = 1) -> TechnicalSnapshot:
    result = await session.execute(
        select(TechnicalSnapshot)
        .where(TechnicalSnapshot.symbol == symbol)
        .limit(limit)
    )
    return result.scalars().first()

async def insert_fa_data(session: AsyncSession, data: dict):
    data = {
        key: value.item() if isinstance(value, np.generic) else value
        for key, value in data.items()
    }
    stmt = insert(CompanyFundamental).values(data)
    stmt = stmt.on_conflict_do_nothing(
        index_elements=["ticker", "filing_date"]
    )
    await session.execute(stmt)

async def insert_crypto_history_data(session: AsyncSession, data: pd.DataFrame):
    df = data.copy()
    for col in ["drawdown_duration", "trades_count"]:
        if col in df.columns:
            df[col] = np.where(df[col].isna(), None, df[col])
    mappings = df.to_dict(orient='records')

    await session.execute(insert(market_features).values(mappings))

async def get_crypto_history_data(session: AsyncSession, symbol: str, limit: int = 1000):
    result = await session.execute(
        select(market_features)
        .where(market_features.symbol == symbol)
        .limit(limit)
    )
    return result.scalars().all()

async def get_fa_data(session: AsyncSession, ticker: str, limit: int = 1) -> CompanyFundamental:
    result = await session.execute(
        select(CompanyFundamental)
        .where(CompanyFundamental.ticker == ticker)
        .limit(limit)
    )
    return result.scalars().first()

async def insert_macro_data(
    session: AsyncSession,
    data: pd.DataFrame,
) -> None:

    df = data[
        ["date", "value", "series_id", "unit"]
    ].copy()

    df["date"] = pd.to_datetime(
        df["date"],
        utc=True,
    )

    df["value"] = df["value"].where(
        df["value"].notna(),
        None,
    )

    records = df.to_dict(orient="records")

    for i in range(0, len(records), 5000):
        batch = records[i:i + 5000]

        stmt = (
            insert(macro_data)
            .values(batch)
            .on_conflict_do_nothing(
                index_elements=[
                    "date",
                    "series_id",
                ],
            )
        )

        await session.execute(stmt)

async def get_macro_data(session: AsyncSession, series_id: str, limit: int = 100) -> macro_data:
    result = await session.execute(
        select(macro_data)
        .where(macro_data.series_id == series_id)
        .limit(limit)
    )
    return result.scalars().all()
