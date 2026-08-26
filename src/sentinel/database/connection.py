from pathlib import Path
from contextlib import asynccontextmanager, contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sentinel.config.logging_config import get_logger
from sentinel.config.settings import DB_URL

logger = get_logger(__name__)

engine = create_engine(
        DB_URL,
        pool_size=2,
        max_overflow=3,
        pool_pre_ping=True,
        pool_recycle=600,
        echo=False,
    )
Session_local = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

ASYNC_DB_URL = DB_URL.replace("postgresql://", "postgresql+asyncpg://")

async_engine = create_async_engine(
        ASYNC_DB_URL,
        pool_size=2,
        max_overflow=3,
        pool_pre_ping=True,
        pool_recycle=600,
        echo=False,
        connect_args={"statement_cache_size": 0},
    )
AsyncSessionLocal = async_sessionmaker(
        bind=async_engine,
        class_=AsyncSession,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )


@contextmanager
def get_session():
    if Session_local is None:
        raise RuntimeError(
            "Database is not configured. Set the DB_URL environment variable."
        )
    session: Session = Session_local()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@asynccontextmanager
async def get_async_session():
    if AsyncSessionLocal is None:
        raise RuntimeError(
            "Database is not configured. Set the DB_URL environment variable."
        )
    session: AsyncSession = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


def test_connection() -> bool:
    if Session_local is None:
        logger.error("DB_URL not configured — skipping connection test")
        return False
    try:
        with get_session() as session:
            result = session.execute(text("SELECT 1"))
            value = result.scalar()
            logger.info(f"DB connection OK — SELECT 1 returned {value}")
            return True
    except Exception as e:
        logger.error(f"DB connection failed: {e}")
        return False


def run_migrations():
    migrations_dir = Path(__file__).parent / "migrations"
    sql_files = sorted(migrations_dir.glob("*.sql"))

    if not sql_files:
        logger.warning(f"No migration files found in {migrations_dir}")
        return

    logger.info(f"Found {len(sql_files)} migration(s) in {migrations_dir}")

    with engine.connect() as conn:
        for sql_file in sql_files:
            logger.info(f"Running migration: {sql_file.name}")
            sql = sql_file.read_text()
            conn.execute(text(sql))
            conn.commit()
            logger.info(f"Completed: {sql_file.name}")

    logger.info("All migrations applied successfully")


if __name__ == "__main__":
    run_migrations()
    test_connection()