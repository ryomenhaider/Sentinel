import asyncio
import logging

import pandas as pd

from hermes.sources.fred import fred_series

from sentinel.database.connection import get_session
from sentinel.database.crud_v2 import insert_macro_data
from sentinel.ingestion.v2.hermes_c import hr

logger = logging.getLogger(__name__)

MAX_CONCURRENT_FETCHES = 5


async def main() -> None:
    logger.info("Starting concurrent macro data fetch...")

    semaphore = asyncio.Semaphore(MAX_CONCURRENT_FETCHES)

    async def fetch_series(series_id: str):
        async with semaphore:
            try:
                data = await hr.fred.fetch(
                    series_id=series_id,
                    force=True,
                )
                data['value'] = pd.to_numeric(data['value'], errors='coerce')
                return data
            except Exception as e:
                logger.exception(
                    "Failed to fetch FRED series %s: %s",
                    series_id,
                    e,
                )
                return e

    tasks = [
        fetch_series(series)
        for series in fred_series
    ]

    results = await asyncio.gather(
        *tasks,
        return_exceptions=True,
    )

    logger.info("Macro data fetching completed.")

    df_list: list[pd.DataFrame] = []

    for series, result in zip(fred_series, results):
        if isinstance(result, Exception):
            logger.error(
                "Skipping failed FRED series %s: %s",
                series,
                result,
            )
            continue

        if isinstance(result, pd.DataFrame):
            df_list.append(result)

    if not df_list:
        logger.warning("No macro data fetched to insert.")
        return

    # Hermes returns `date` as the DataFrame index.
    combined_df = pd.concat(
        df_list,
        ignore_index=False,
    ).reset_index()
    
    combined_df["value"] = combined_df["value"].where(
        combined_df["value"].notna(),
        None,
    )
    
    logger.info(
        "Macro data combined successfully: %d rows.",
        len(combined_df),
    )

    def db_write_worker() -> None:
        with get_session() as session:
            logger.info("Inserting macro data into database...")

            insert_macro_data(
                session=session,
                data=combined_df,
            )

            logger.info(
                "Macro data successfully inserted into database."
            )

    try:
        await asyncio.to_thread(db_write_worker)
    except Exception:
        logger.exception("Database insertion error.")
        return

    logger.info("Macro data ingestion completed successfully.")


if __name__ == "__main__":
    asyncio.run(main())