import typer
import uvicorn


cli = typer.Typer(
    name="Sentinel",
    help="Sentinel CLI",
)

API_APP = "sentinel.api.main:app"


@cli.command()
def ingest_v1():
    from sentinel.ingestion.v1.ingestion_pipeline import run_pipeline

    run_pipeline()


@cli.command()
def ml_train_v1():
    from sentinel.ml.train_pipeline import run_pipeline

    run_pipeline()


@cli.command()
def api_start_v1(
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
def all_v1(
    host: str = typer.Option("0.0.0.0", "--host", "-h", help="The host bind address."),
    port: int = typer.Option(
        7860, "--port", "-p", help="The port to run the API server on."
    ),
):
    ingest()  # noqa: F821
    ml_train()  # noqa: F821
    uvicorn.run(
        API_APP,
        host=host,
        port=port,
        reload=True,
        reload_excludes=["__pycache__*", "*corrupt*"],
    )


@cli.command()
def ml_baselines():
    """Run baseline forecasting evaluation."""
    from sentinel.ml.v2.baselines import run_baselines, _print_results

    symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "SOLUSDT"]

    print(f"Running baselines for {len(symbols)} symbols...")
    print("This may take a while.\n")

    results = run_baselines(symbols=symbols, save=True)

    _print_results(results)
    print(f"\nSaved {len(results)} results to database.")

@cli.command()
def run_migrations():
    from sentinel.database.connection import run_migrations
    run_migrations()

if __name__ == "__main__":
    cli()
