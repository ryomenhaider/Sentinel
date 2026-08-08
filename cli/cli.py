import os
import sys
from pathlib import Path

os.environ.setdefault("SETUPTOOLS_USE_DISTUTILS", "stdlib")
try:
    import _distutils_hack

    _distutils_hack.remove_shim()
    for _m in [m for m in list(sys.modules) if m == "distutils" or m.startswith("distutils.")]:
        del sys.modules[_m]
except Exception:
    pass

import typer
import uvicorn

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

cli = typer.Typer(
    name="Sentinel",
    help="Sentinel CLI",
)

API_APP = "api.main:app"


@cli.command()
def ingest():
    from ingestion.ingestion_pipeline import run_pipeline

    run_pipeline()


@cli.command()
def ml_train():
    from ml.train_pipeline import run_pipeline

    run_pipeline()


@cli.command()
def api_start(
    host: str = typer.Option("0.0.0.0", "--host", "-h", help="The host bind address."),
    port: int = typer.Option(
        7860, "--port", "-p", help="The port to run the API server on."
    ),
):
    uvicorn.run(
        API_APP,
        host=host,
        port=port,
        reload=True,
        reload_excludes=["__pycache__*", "*corrupt*"],
    )


@cli.command()
def all(
    host: str = typer.Option("0.0.0.0", "--host", "-h", help="The host bind address."),
    port: int = typer.Option(
        7860, "--port", "-p", help="The port to run the API server on."
    ),
):
    """Run everything in series: ingest -> ml train -> start the API."""
    ingest()
    ml_train()
    uvicorn.run(
        API_APP,
        host=host,
        port=port,
        reload=True,
        reload_excludes=["__pycache__*", "*corrupt*"],
    )


if __name__ == "__main__":
    cli()
