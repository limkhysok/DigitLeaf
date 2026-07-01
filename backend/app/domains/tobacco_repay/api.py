import asyncio
from typing import Annotated
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Security
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.api.deps import get_current_user
from app.domains.users.models import User
from app.domains.tobacco_repay.schemas import TobaccoRepayListResponse, TContractRepayCreate, TContractRepayRead, RepayHistoryListResponse, TContractCreate, TContractRead, ConTobaccoItem, RepayHistoryDetail, TContractRepayUpdate, TobaccoRepayContractDetail
from app.domains.tobacco_repay import crud
from app.domains.tobacco_repay.report import build_tobacco_repay_template

router = APIRouter()


@router.get("/", response_model=TobaccoRepayListResponse)
async def read_tobacco_repays(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    year: int | None = Query(None),
    search: str | None = Query(None),
):
    skip = (page - 1) * limit
    result = await crud.get_tobacco_repays(session, skip=skip, limit=limit, year=year, search=search)
    return TobaccoRepayListResponse(
        items=result["items"],
        total=result["total"],
        has_more=(skip + len(result["items"])) < result["total"],
    )


@router.get("/history", response_model=RepayHistoryListResponse)
async def read_tobacco_repay_history(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    year: int | None = Query(None),
    search: str | None = Query(None),
):
    skip = (page - 1) * limit
    result = await crud.get_tobacco_repay_history(session, skip=skip, limit=limit, year=year, search=search)
    return RepayHistoryListResponse(
        items=result["items"],
        total=result["total"],
        has_more=(skip + len(result["items"])) < result["total"],
    )


@router.get("/history/export")
async def export_tobacco_repay_history(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
    representative_id: int | None = Query(None),
    date_from: date = Query(...),
    date_to: date = Query(...),
):
    _EXPORT_LIMIT = 10_000
    data = await crud.get_repay_report_data(
        session,
        representative_id=representative_id,
        date_from=date_from,
        date_to=date_to,
        limit=_EXPORT_LIMIT,
    )
    if data["total"] > _EXPORT_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Export exceeds {_EXPORT_LIMIT:,} records ({data['total']:,} matched). Apply filters to narrow the result.",
        )

    # xlsx generation is CPU-bound — run off the event loop so one export
    # doesn't stall every other request being served by this worker.
    stream = await asyncio.to_thread(
        build_tobacco_repay_template,
        representative=data["representative"],
        date_from=data["date_from"],
        date_to=data["date_to"],
        report_date=data["report_date"],
        rows=data["rows"],
    )

    filename = f"tobacco_repay_history_{date_from}_{date_to}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/years", response_model=list[int])
async def read_available_years(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_available_years(session)


@router.post("/", response_model=TContractRepayRead, status_code=201)
async def create_tobacco_repay(
    request: Request,
    data: TContractRepayCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    try:
        return await crud.create_repay(
            session,
            data,
            user_name=current_user.user_name,
            ip_address=request.client.host if request.client else None,
        )
    except ValueError as e:
        if "exceeds remaining balance" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/next-repay-num", response_model=str)
async def get_next_repay_num(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.generate_repay_num(session)


@router.get("/next-contract-num", response_model=str)
async def get_next_contract_num(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.generate_contract_num(session)


@router.get("/tobacco-types", response_model=list[ConTobaccoItem])
async def get_tobacco_types(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_con_tobacco_types(session)


@router.get("/contracts")
async def get_contracts(
    vendor_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    return await crud.get_vendor_contracts(session, vendor_id)


@router.get("/contracts/{con_id}/detail", response_model=TobaccoRepayContractDetail)
async def read_contract_detail(
    con_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    detail = await crud.get_contract_repay_detail(session, con_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Contract not found")
    return detail


@router.post("/contracts", response_model=TContractRead, status_code=201)
async def create_contract(
    request: Request,
    data: TContractCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    try:
        return await crud.create_contract(
            session,
            data,
            user_name=current_user.user_name,
            ip_address=request.client.host if request.client else None,
        )
    except ValueError as e:
        if "already exists" in str(e):
            raise HTTPException(status_code=409, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{repay_id}", response_model=RepayHistoryDetail)
async def read_repay_detail(
    repay_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    detail = await crud.get_repay_detail(session, repay_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Repay record not found")
    return detail


@router.patch("/{repay_id}", response_model=TContractRepayRead)
async def update_tobacco_repay(
    repay_id: int,
    data: TContractRepayUpdate,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    try:
        return await crud.update_repay(
            session,
            repay_id,
            data,
            user_name=current_user.user_name,
            ip_address=request.client.host if request.client else None,
            page_name=str(request.url.path),
        )
    except ValueError as e:
        if "exceeds remaining balance" in str(e):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{repay_id}", status_code=204)
async def delete_tobacco_repay(
    repay_id: int,
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Security(get_current_user, scopes=["login_system"])],
):
    success = await crud.delete_repay(
        session,
        repay_id,
        user_name=current_user.user_name,
        ip_address=request.client.host if request.client else None,
        page_name=str(request.url.path),
    )
    if not success:
        raise HTTPException(status_code=404, detail="Repay record not found")
    return None
