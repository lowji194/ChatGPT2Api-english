<div align="center">

# ChatGPT2Api English

**Gateway tương thích OpenAI và bảng điều khiển vận hành ChatGPT song ngữ Việt–Anh.**

[![Phiên bản](https://img.shields.io/badge/version-1.8.0-2563eb)](./VERSION)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?logo=python&logoColor=white)](./pyproject.toml)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](./web/package.json)
[![Giấy phép](https://img.shields.io/badge/license-AGPL--3.0-0f766e)](./LICENSE)

[English](./README.md) · [Tiếng Việt](./README.vi.md) · [Dịch vụ](https://gpt.theloi.io.vn) · [Hỗ trợ](https://t.me/theloi194)

</div>

> [!WARNING]
> Dự án chỉ dành cho học tập cá nhân, nghiên cứu khả năng tương thích và trao đổi kỹ thuật phi thương mại. Dự án dựa trên hành vi web được nghiên cứu ngược, có thể ngừng hoạt động bất kỳ lúc nào và có rủi ro đối với tài khoản. Không dùng để lạm dụng, bán lại, tự động hóa quy mô lớn, tạo nội dung trái pháp luật hoặc vi phạm điều khoản OpenAI và pháp luật địa phương.

## Điểm nổi bật

- Tương thích OpenAI với `/v1/chat/completions`, `/v1/responses`, `/v1/images/generations`, `/v1/images/edits`, `/v1/models` và tìm kiếm.
- Quản lý nhóm tài khoản: làm mới, theo dõi giới hạn, giữ tài khoản lỗi để xử lý, cập nhật dữ liệu khi nhập trùng và hỗ trợ nhiều nguồn nhập.
- Giao diện SaaS sáng/tối rõ ràng; tài liệu API là một mục riêng trên menubar, có tô màu code, nút sao chép và ví dụ phản hồi.
- Tự động chọn ngôn ngữ: IP Việt Nam dùng tiếng Việt, ngoài Việt Nam dùng tiếng Anh; có fallback qua cookie và `Accept-Language`.
- Tác vụ PPT/PSD chỉnh sửa được, thư viện ảnh, nhật ký, sao lưu, CPA/Sub2API và WARP/FlareSolverr.
- Bản này đã loại bỏ chức năng Canvas cùng API và cấu hình liên quan.

## Cài nhanh

### Docker

```bash
git clone https://github.com/lowji194/ChatGPT2Api-english.git
cd ChatGPT2Api-english
cp config.example.json config.json
docker compose up -d
```

Hãy đặt `auth-key` mạnh trong `config.json` hoặc truyền `CHATGPT2API_AUTH_KEY` qua môi trường triển khai. Không commit khóa thật hoặc dữ liệu tài khoản.

- Bảng điều khiển: `http://localhost:3000`
- OpenAI base URL: `http://localhost:3000/v1`
- Dữ liệu bền vững: `./data`

### Phát triển cục bộ

```bash
uv sync
uv run main.py
```

```bash
cd web
npm ci
npm run dev
```

Repo chứa `web/` cho giao diện tiếng Việt và `web-en/` cho giao diện tiếng Anh. Khi triển khai, hai bản build nằm ở `web_dist/` và `web_dist_en/`; backend chọn bản phù hợp từ `CF-IPCountry`, rồi fallback qua cookie/header ngôn ngữ.

## Ví dụ API

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <auth-key>" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Xin chào"}]}'
```

```json
{
  "id": "chatcmpl_example",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {"role": "assistant", "content": "Xin chào!"},
      "finish_reason": "stop"
    }
  ]
}
```

Sau khi đăng nhập, mục **Tài liệu API** cung cấp đầy đủ tham số, request có thể sao chép và response mẫu.

## Lưu trữ và triển khai

`STORAGE_BACKEND` hỗ trợ `json`, `sqlite`, `postgres` và kho `git` riêng tư. Nếu luồng ảnh thường gặp Cloudflare, sao chép `.env.example` thành `.env` rồi chạy:

```bash
docker compose -f docker-compose.warp.yml up -d --build
```

Ưu tiên proxy riêng của từng tài khoản. Nếu không có, WARP/Privoxy có thể làm đường ra chung cho upstream; không nên ép email, CPA và lưu lượng không liên quan đi qua WARP.

## Lưu ý bảo mật

- `config.json`, `.env`, cơ sở dữ liệu, log, backup, bản build frontend và file xuất tài khoản đều bị loại khỏi Git.
- Đổi mọi khóa đã từng commit hoặc chia sẻ.
- Đặt dịch vụ sau TLS và giới hạn quyền truy cập bảng quản trị.
- Tự kiểm tra điều khoản nền tảng và tài khoản trước khi triển khai.

## Donate và hỗ trợ

Nếu dự án giúp tiết kiệm thời gian, bạn có thể ủng hộ việc duy trì bằng cách liên hệ [@theloi194 trên Telegram](https://t.me/theloi194). Thông tin donate được cung cấp tại đó để không hard-code dữ liệu thanh toán trong repo.

## Ghi nhận

Bản này kế thừa dự án [basketikun/chatgpt2api](https://github.com/basketikun/chatgpt2api), đồng thời bổ sung giao diện song ngữ, tăng độ an toàn triển khai, cải tiến xử lý tài khoản, bản địa hóa lỗi, thiết kế lại tài liệu và các tối ưu vận hành do [lowji194](https://github.com/lowji194) duy trì.

## Giấy phép

Phân phối theo [AGPL-3.0](./LICENSE). Khi phát hành lại bản sửa đổi, cần giữ thông báo nguồn và tuân thủ đầy đủ giấy phép.
