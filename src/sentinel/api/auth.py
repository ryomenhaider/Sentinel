#from fastapi import Header, HTTPException

#async def verify_jwt(auth: str | None = Header(None), x_api_key: str | None = Header(None)):
#    if x_api_key:
#        return x_api_key
#    if auth and auth.startswith('Bearer '):
#        return auth.removeprefix('Bearer ')
#    raise HTTPException(401, 'Missing token')
