"""动作回执的公共约定。

所有业务模块的「单条记录动作」接口都走这一条链路：

1. :func:`read_action` 统一解析请求体——历史前端直接发 ``{"action": "..."}``，
   登记类接口沿用的 ``{"values": {...}, "remark": "..."}`` 也继续兼容；
2. 路由层把动作名交给各自的 service 执行，得到 ``(entry, message)``；
3. :func:`build_result` 统一生成 :class:`~app.schemas.ActionResult`，
   ``ok/message/entry/action`` 的口径在全部模块间保持一致。

动作历史（状态流转、pending/abnormal 标记）仍由各模块 service 原样维护，
本模块不参与改写。
"""
from __future__ import annotations

from typing import Any

from app.schemas import ActionResult


def read_action(body: dict[str, Any] | None) -> tuple[str, str | None]:
    """从请求体中取出动作名与备注。

    兼容两种既有请求体：
    - 列表页动作按钮：``{"action": "确认签订"}``（历史格式，必须继续支持）；
    - 登记/流转的统一载荷：``{"values": {"action": "..."}, "remark": "..."}``。
    额外平铺字段（如 ``remark``）也一并识别，避免调用方传了却被丢掉。
    """
    data = body or {}
    values = data.get("values")
    values = values if isinstance(values, dict) else {}

    raw = values.get("action")
    if raw is None:
        raw = data.get("action")
    action = str(raw or "").strip()

    remark = values.get("remark") if values.get("remark") is not None else data.get("remark")
    return action, (str(remark).strip() if remark is not None else None)


def build_result(
    *,
    action: str,
    entry: dict[str, Any] | None,
    message: str,
    remark: str | None = None,
) -> ActionResult:
    """按公共口径生成动作回执。

    ``entry is None`` 即业务失败（记录不存在、动作不允许等），由调用方保证
    ``message`` 是给用户看的可读原因；成功时 ``message`` 是成功提示语。
    """
    return ActionResult(ok=entry is not None, action=action or None, message=message, entry=entry, remark=remark)
