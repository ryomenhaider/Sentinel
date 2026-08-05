
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from config.logging_config import get_logger
from config.settings import DB_URL, LOG_LEVEL

logger = get_logger(__name__)

engine = create_engine(
        DB_URL,
        pool_size=2,
        max_overflow=3,
        pool_pre_ping=True,
        pool_recycle=600,
        connect_args={'sslmode': 'require'},
        echo=False,
    )
Session_local = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
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


if __name__ == "__main__":
    test_connection()