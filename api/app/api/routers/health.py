from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
@router.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
