from __future__ import annotations

import re
from typing import Any


_CJK_RE = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff]")

_ZH_ERROR_TRANSLATIONS: tuple[tuple[str, str], ...] = (
    (
        "非常抱歉，生成的图片可能违反了我们的内容政策。如果你认为此判断有误，请重试或修改提示语。",
        "Rất tiếc, hình ảnh có thể vi phạm chính sách nội dung. Nếu cho rằng đây là nhầm lẫn, hãy thử lại hoặc chỉnh sửa nội dung mô tả.",
    ),
    ("生成的图片可能违反了我们的内容政策", "Hình ảnh có thể vi phạm chính sách nội dung"),
    ("如果你认为此判断有误，请重试或修改提示语", "Nếu cho rằng đây là nhầm lẫn, hãy thử lại hoặc chỉnh sửa nội dung mô tả"),
    ("检测到敏感词，拒绝本次任务", "Phát hiện từ ngữ nhạy cảm nên yêu cầu đã bị từ chối"),
    ("AI 审核服务暂时不可用，请稍后重试", "Dịch vụ kiểm duyệt AI tạm thời không khả dụng, vui lòng thử lại sau"),
    ("AI 审核未通过，拒绝本次任务", "Yêu cầu không vượt qua kiểm duyệt AI nên đã bị từ chối"),
    ("图片 URL 解析失败", "Không thể phân tích URL hình ảnh"),
    ("还没有检测到改动，请修改后再保存", "Chưa phát hiện thay đổi nào; hãy chỉnh sửa trước khi lưu"),
    ("这条用户密钥不存在，可能已经被删除", "Khóa người dùng không tồn tại hoặc đã bị xóa"),
    ("没有可导出的完整账号，需要同时有 access_token、refresh_token 和 id_token", "Không có tài khoản đầy đủ để xuất; cần đồng thời có access_token, refresh_token và id_token"),
    ("请输入新的专用密钥", "Vui lòng nhập khóa chuyên dụng mới"),
    ("这个专用密钥已经存在，请换一个新的密钥", "Khóa chuyên dụng này đã tồn tại; vui lòng dùng khóa khác"),
    ("这个名称已经在使用中了，换一个更容易区分的名称吧", "Tên này đã được sử dụng; vui lòng chọn tên khác"),
    ("当前环境缺少 openssl，无法执行加密备份", "Môi trường hiện tại thiếu openssl nên không thể tạo bản sao lưu mã hóa"),
    ("当前环境缺少 openssl，无法解密备份内容", "Môi trường hiện tại thiếu openssl nên không thể giải mã bản sao lưu"),
    ("连接 R2 失败", "Kết nối R2 thất bại"),
    ("上传备份失败", "Tải bản sao lưu lên thất bại"),
    ("配置不完整：缺少", "Cấu hình chưa đầy đủ; còn thiếu"),
    ("无法解析 callback URL", "Không thể phân tích callback URL"),
    ("callback URL 中没有 code 参数", "callback URL không có tham số code"),
    ("缺少 code 或 callback URL", "Thiếu code hoặc callback URL"),
    ("既未提供 session_id，callback URL 中也未携带 state", "Không có session_id và callback URL cũng không chứa state"),
    ("换 token 网络异常", "Lỗi mạng khi đổi token"),
    ("OpenAI 返回的 access_token 为空", "OpenAI trả về access_token rỗng"),
)


def localize_error_message(message: object) -> str:
    """Convert known upstream Chinese errors to Vietnamese without touching codes."""
    text = str(message or "").strip()
    if not text:
        return ""
    for source, translated in _ZH_ERROR_TRANSLATIONS:
        text = text.replace(source, translated)
    if not _CJK_RE.search(text):
        return text
    if any(keyword in text for keyword in ("内容政策", "违反", "敏感", "审核", "拒绝")):
        return "Yêu cầu đã bị từ chối do chính sách nội dung. Vui lòng điều chỉnh nội dung và thử lại."
    if any(keyword in text for keyword in ("超时", "网络", "连接")):
        return "Không thể kết nối tới dịch vụ thượng nguồn hoặc kết nối đã hết thời gian chờ. Vui lòng thử lại sau."
    if any(keyword in text for keyword in ("账号", "密钥", "token", "登录", "权限")):
        return "Thông tin tài khoản, khóa truy cập hoặc quyền truy cập không hợp lệ. Vui lòng kiểm tra lại."
    return "Dịch vụ thượng nguồn trả về lỗi. Vui lòng thử lại sau."


def localize_error_detail(value: Any) -> Any:
    """Recursively localize user-facing error strings while preserving response shape."""
    if isinstance(value, str):
        return localize_error_message(value)
    if isinstance(value, dict):
        return {key: localize_error_detail(item) for key, item in value.items()}
    if isinstance(value, list):
        return [localize_error_detail(item) for item in value]
    if isinstance(value, tuple):
        return tuple(localize_error_detail(item) for item in value)
    return value
