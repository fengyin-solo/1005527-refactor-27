"""储能电池组接口：维护储能电池组，覆盖启动充电、启动放电、切换到待机等动作。"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.actions import build_result, read_action
from app.schemas import ActionResult, EntryPayload, PageResult
from app.services.energy_storage import EnergyStorageService

router = APIRouter(prefix="/api/energy_storage", tags=["储能电池组"])

service = EnergyStorageService()

LIST_FIELDS = ["电池组编号", "电池类型", "额定容量", "SOC上限", "充放电循环", "电池温度", "内阻变化率", "运行状态"]
STATUSES = ["充电中", "放电中", "待机", "故障停机"]


@router.get("", response_model=PageResult[dict])
def list_entries(
    keyword: str | None = Query(default=None, description="按电池组编号检索"),
    status: str | None = Query(default=None, description="充电中、放电中、待机、故障停机"),
    page: int = 1,
    size: int = 20,
) -> PageResult[dict]:
    """按电池组编号与状态过滤储能电池组列表；没有数据时返回空页，不报错。"""
    if size > 200:
        raise HTTPException(status_code=400, detail="每页最多 200 条，请缩小分页范围")
    items, total = service.list_entries(keyword=keyword, status=status, page=page, size=size)
    return PageResult(items=items, total=total, page=page, size=size)


@router.get("/{entry_id}", response_model=dict)
def get_entry(entry_id: int) -> dict:
    """读取单条储能电池组明细；不存在时给出可读的错误说明。"""
    entry = service.get_entry(entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"储能电池组 {entry_id} 不存在或已归档")
    return entry


@router.post("", response_model=ActionResult)
def create_entry(payload: EntryPayload) -> ActionResult:
    """登记一条储能电池组，缺字段时说明原因而不是静默丢弃。"""
    entry, missing = service.create_entry(payload.values)
    if missing:
        return ActionResult(ok=False, message=f"缺少必填字段：{'、'.join(missing)}")
    return ActionResult(ok=True, message="储能电池组已登记", entry=entry)


@router.post("/{entry_id}/actions", response_model=ActionResult)
def run_action(entry_id: int, payload: EntryPayload) -> ActionResult:
    """对单条储能电池组执行启动充电、启动放电、切换到待机；不允许的动作会被拦下并说明原因。

    请求体与回执由公共动作链路统一生成：兼容 ``{"action": ...}`` 与
    ``{"values": {"action": ...}}`` 两种历史请求体，成功失败口径全模块一致。
    """
    action, remark = read_action(payload.as_body())
    entry, message = service.run_action(entry_id, action)
    return build_result(action=action, remark=remark, entry=entry, message=message)


@router.get("/export")
def export_entries() -> dict[str, Any]:
    """导出储能电池组清单：返回当前过滤条件下的全量数据。"""
    items, total = service.list_entries(page=1, size=10000)
    return {"module": "energy_storage", "total": total, "items": items}
