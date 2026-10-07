"""告警事件接口：维护告警事件，覆盖确认告警、开始处理、消除告警等动作。"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.actions import build_result, read_action
from app.schemas import ActionResult, EntryPayload, PageResult
from app.services.alarm import AlarmService

router = APIRouter(prefix="/api/alarm", tags=["告警事件"])

service = AlarmService()

LIST_FIELDS = ["告警编号", "告警来源", "告警类型", "触发时间", "告警阈值", "当前值", "确认人", "告警状态"]
STATUSES = ["未确认", "已确认", "处理中", "已消除"]


@router.get("", response_model=PageResult[dict])
def list_entries(
    keyword: str | None = Query(default=None, description="按告警编号检索"),
    status: str | None = Query(default=None, description="未确认、已确认、处理中、已消除"),
    page: int = 1,
    size: int = 20,
) -> PageResult[dict]:
    """按告警编号与状态过滤告警事件列表；没有数据时返回空页，不报错。"""
    if size > 200:
        raise HTTPException(status_code=400, detail="每页最多 200 条，请缩小分页范围")
    items, total = service.list_entries(keyword=keyword, status=status, page=page, size=size)
    return PageResult(items=items, total=total, page=page, size=size)


@router.get("/{entry_id}", response_model=dict)
def get_entry(entry_id: int) -> dict:
    """读取单条告警事件明细；不存在时给出可读的错误说明。"""
    entry = service.get_entry(entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"告警事件 {entry_id} 不存在或已归档")
    return entry


@router.post("", response_model=ActionResult)
def create_entry(payload: EntryPayload) -> ActionResult:
    """登记一条告警事件，缺字段时说明原因而不是静默丢弃。"""
    entry, missing = service.create_entry(payload.values)
    if missing:
        return ActionResult(ok=False, message=f"缺少必填字段：{'、'.join(missing)}")
    return ActionResult(ok=True, message="告警事件已登记", entry=entry)


@router.post("/{entry_id}/actions", response_model=ActionResult)
def run_action(entry_id: int, payload: EntryPayload) -> ActionResult:
    """对单条告警事件执行确认告警、开始处理、消除告警；不允许的动作会被拦下并说明原因。

    请求体与回执由公共动作链路统一生成：兼容 ``{"action": ...}`` 与
    ``{"values": {"action": ...}}`` 两种历史请求体，成功失败口径全模块一致。
    """
    action, remark = read_action(payload.as_body())
    entry, message = service.run_action(entry_id, action)
    return build_result(action=action, remark=remark, entry=entry, message=message)


@router.get("/export")
def export_entries() -> dict[str, Any]:
    """导出告警事件清单：返回当前过滤条件下的全量数据。"""
    items, total = service.list_entries(page=1, size=10000)
    return {"module": "alarm", "total": total, "items": items}
