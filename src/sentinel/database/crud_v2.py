import pandas as pd
import numpy as np
from sentinel.database.models import (
    TechnicalSnapshot, CompanyFundamental, market_features,
    macro_data
)
from sentinel.database.connection import Session
from sqlalchemy.dialects.postgresql import insert

def insert_ta_data(session: Session, data: dict):
    data = {
        key: value.item() if isinstance(value, np.generic) else value
        for key, value in data.items()
    }
    stmt = insert(TechnicalSnapshot).values(data)
    stmt = stmt.on_conflict_do_nothing(
        index_elements=["symbol", "timestamp_ms"]
    )
    session.execute(stmt)
    session.commit()


def get_ta_data(session: Session, symbol: str, limit: int = 1) -> TechnicalSnapshot:
    return (
        session.query(TechnicalSnapshot)
        .filter(TechnicalSnapshot.symbol == symbol)
        .limit(limit)
        .first()
    )

def insert_fa_data(session: Session, data: dict):
    data = {
        key: value.item() if isinstance(value, np.generic) else value
        for key, value in data.items()
    }
    stmt = insert(CompanyFundamental).values(data)
    stmt = stmt.on_conflict_do_nothing(
        index_elements=["ticker", "filing_date"]
    )
    session.execute(stmt)
    session.commit()

def insert_crypto_history_data(session: Session, data: pd.DataFrame):
    df = data.copy()
    for col in ["drawdown_duration", "trades_count"]:
        if col in df.columns:
            df[col] = np.where(df[col].isna(), None, df[col])
    mappings = df.to_dict(orient='records')

    session.bulk_insert_mappings(market_features, mappings)
    session.commit()

def get_crypto_history_data(session: Session, symbol: str, limit: int = 1000):
    return (
        session.query(market_features)
        .filter(market_features.symbol == symbol)
        .limit(limit=limit)
        .all()
    )

def get_fa_data(session: Session, ticker: str, limit: int = 1) -> CompanyFundamental:
    return (
        session.query(CompanyFundamental)
        .filter(CompanyFundamental.ticker == ticker)
        .limit(limit)
        .first()
    )

def insert_macro_data(
    session: Session,
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

        session.execute(stmt)

    session.commit()
    
def get_macro_data(session: Session, series_id: str, limit: int = 100) -> macro_data:
    return (
        session.query(macro_data)
        .filter(macro_data.series_id == series_id)
        .limit(limit=limit)
        .all()
    )
