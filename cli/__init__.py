import typer, os, subprocess, uvicorn

cli = typer.Typer(
    name='Sentinel',
    help='Sentinel CLI'
)

@cli.command()
def ml_train():
    ...

@cli.command()
def serve(
    host: str = typer.Option(
        "0.0.0.0", "--host", "-h", help="The host bind address."
    ),
    port: int = typer.Option(
        7860, "--port", "-p", help="The port to run the API server on."
    ),
):
    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=True,
        reload_excludes=["__pycache__*", "*corrupt*"],
    )