import sys

from config.logging_config import get_logger

logger = get_logger(__name__)

JOBS = {
    "ingest": lambda: __import__(
        "ingestion.ingestion_pipeline", fromlist=["run_pipeline"]
    ).run_pipeline(),
    "features": lambda: __import__(
        "ingestion.feature_engineer", fromlist=["main"]
    ).main(),
    "retrain": lambda: __import__(
        "ml.train_pipeline", fromlist=["run_pipeline_with_metrics"]
    ).run_pipeline_with_metrics(),
    "drift": lambda: __import__("mlops.drift_detector", fromlist=["run_drift_check"]),
}


def run(job_name: str) -> int:
    logger.info(f"Scheduled job start: {job_name}")
    if job_name not in JOBS:
        logger.error(f"Unknown job: {job_name}")
        return 2
    try:
        JOBS[job_name]()
        logger.info(f"Scheduled job finished: {job_name}")
        return 0
    except Exception as e:
        logger.exception(f"Scheduled job failed: {job_name}: {e}")
        return 1


def main():
    return sys.exit(run(sys.argv[1] if len(sys.argv) > 1 else "ingest"))


if __name__ == "__main__":
    main()
