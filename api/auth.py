from fastapi import Header, HTTPException

async def verify_jwt(auth: str | None = Header(None)):
    if not auth or not auth.startswith('Bearer '):
        raise HTTPException(401, 'Missing token')
    token = auth.removeprefix('Bearer ')