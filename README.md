<div align="center">

# ChatGPT2Api English

**A bilingual OpenAI-compatible gateway and operations console for ChatGPT web capabilities.**

[![Version](https://img.shields.io/badge/version-1.8.0-2563eb)](./VERSION)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?logo=python&logoColor=white)](./pyproject.toml)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](./web/package.json)
[![License](https://img.shields.io/badge/license-AGPL--3.0-0f766e)](./LICENSE)

[English](./README.md) · [Tiếng Việt](./README.vi.md) · [Live service](https://gpt.theloi.io.vn) · [Support](https://t.me/theloi194)

</div>

> [!WARNING]
> This project is intended for personal learning, interoperability research, and non-commercial technical exchange. It relies on reverse-engineered web behavior, may stop working without notice, and may put accounts at risk. Do not use it for abuse, resale, large-scale automation, unlawful content, or any activity that violates OpenAI terms or local law.

## Highlights

- OpenAI-compatible `/v1/chat/completions`, `/v1/responses`, `/v1/images/generations`, `/v1/images/edits`, `/v1/models`, and search endpoints.
- Account pool with refresh, rate-limit tracking, error-account preservation, duplicate-account updates, and multiple import methods.
- Professional light/dark SaaS console with a dedicated API documentation page, highlighted request samples, and response examples.
- Automatic web locale selection: Vietnam visitors receive Vietnamese; other locations receive English. Cookie and `Accept-Language` fallbacks are supported.
- Editable PPT/PSD task generation, image library, logs, backup tools, CPA/Sub2API integrations, and WARP/FlareSolverr runtime support.
- Canvas integration and its related API/configuration were intentionally removed from this edition.

## Quick start

### Docker

```bash
git clone https://github.com/lowji194/ChatGPT2Api-english.git
cd ChatGPT2Api-english
cp config.example.json config.json
docker compose up -d
```

Set a strong `auth-key` in `config.json`, or provide `CHATGPT2API_AUTH_KEY` through your deployment environment. Never commit your real key or account data.

- Console: `http://localhost:3000`
- OpenAI base URL: `http://localhost:3000/v1`
- Persistent data: `./data`

### Local development

```bash
uv sync
uv run main.py
```

```bash
cd web
npm ci
npm run dev
```

The repository contains `web/` for the Vietnamese UI and `web-en/` for the English UI. Production builds are served from `web_dist/` and `web_dist_en/`; the backend selects one using `CF-IPCountry`, then cookie/locale headers as fallback.

## API example

```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <auth-key>" \
  -d '{"model":"auto","messages":[{"role":"user","content":"Hello"}]}'
```

```json
{
  "id": "chatcmpl_example",
  "object": "chat.completion",
  "choices": [
    {
      "index": 0,
      "message": {"role": "assistant", "content": "Hello!"},
      "finish_reason": "stop"
    }
  ]
}
```

The authenticated console includes a complete **API documentation** page with request parameters, copyable examples, and sample responses.

## Storage and deployment

`STORAGE_BACKEND` supports `json`, `sqlite`, `postgres`, and private `git` storage. For a more stable Cloudflare-sensitive image path, copy `.env.example` to `.env` and run:

```bash
docker compose -f docker-compose.warp.yml up -d --build
```

Use account-level proxies when available; otherwise WARP/Privoxy can provide a shared upstream route. Keep mail, CPA, and unrelated traffic outside that route unless explicitly required.

## Security notes

- `config.json`, `.env`, databases, logs, backups, generated frontend builds, and account exports are ignored from Git.
- Rotate any key that has ever been committed or shared.
- Put the service behind TLS and restrict the administration console.
- Review account and platform terms before deployment.

## ☕ Buy me a coffee

If this edition saves you time, a coffee from you is wonderful motivation to keep improving and maintaining the project.

<p align="center">
  <img src="https://theloi.io.vn/pay/QR.png?text=QR+Code" alt="Buy me a coffee QR code" width="240" />
</p>

Support and questions: [Telegram @theloi194](https://t.me/theloi194).

## Credits

This edition is based on the upstream work by [basketikun/chatgpt2api](https://github.com/basketikun/chatgpt2api), with bilingual UI, deployment hardening, account-handling changes, localized errors, redesigned documentation, and operational improvements maintained by [lowji194](https://github.com/lowji194).

## License

Distributed under the repository's [AGPL-3.0 license](./LICENSE). Retain upstream notices and comply with the license when redistributing modified versions.
