import os


import typer
import uvicorn


cli = typer.Typer(
    name="Sentinel",
    help="Sentinel CLI",
)

API_APP = "sentinel.api.main:app"


@cli.command()
def ingest():
    from sentinel.ingestion.v1.ingestion_pipeline import run_pipeline

    run_pipeline()


@cli.command()
def ml_train():
    from sentinel.ml.train_pipeline import run_pipeline

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
