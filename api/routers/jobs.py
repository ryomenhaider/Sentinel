from fastapi import APIRouter, Depends

from api.auth import verify_jwt

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.post("/{job}")
async def trigger_job(job: str, _: dict = Depends(verify_jwt)):
    code = run(job)
    return {"job": job, "exit_code": code}
