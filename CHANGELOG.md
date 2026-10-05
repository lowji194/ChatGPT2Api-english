# Changelog

## Unreleased

## 1.8.0 - 2026-07-28

+ [Added] Added default upstream model and reasoning-effort settings. They can be changed in Settings or overridden with the `-standard`, `-extended`, and `-max` model suffixes.
+ [Fixed] Added an option to remove local conversations when image generation fails, times out, or returns text only.
+ [Fixed] `/v1/models` now combines the official model lists available to every account type and chooses accounts based on model access.
+ [Fixed] Hidden, non-final, and internal-tool assistant messages are filtered to prevent search instructions and reasoning from leaking into API output.
+ [Fixed] Output cleanup no longer removes spaces before punctuation in code and commands.
+ [Fixed] Added a configurable hard timeout for image-generation SSE streams.
+ [Improved] Database persistence now synchronizes only changed rows while preserving IDs for unchanged records.

## 1.7.0 - 2026-07-05

+ [Removed] Removed registration because anti-abuse enforcement could suspend GitHub accounts.

## 1.6.0 - 2026-07-04

+ [Fixed] Fixed Sub2API imports.
+ [Fixed] Fixed frontend 404 and 405 responses.
+ [Added] Added conversation deletion after image generation.
+ [Changed] Pro accounts are no longer treated as unlimited; the approximate limit is 1,000 images per day.

## 1.5.0 - 2026-06-13

+ [Added] Added WARP, Privoxy, and FlareSolverr recovery for Cloudflare challenges.
+ [Added] Added an `outlook_token` mailbox pool for Outlook/Hotmail verification codes.
+ [Added] Added a web-search compatible endpoint, image-edit masks, and image-task features.
+ [Improved] Updated sentinel/PoW retrieval for better upstream compatibility.
+ [Improved] Adjusted proxy priority and registration retry behavior.

## 1.4.1 - 2026-06-03

+ [Added] Account refresh now runs asynchronously with polling for refresh and re-login progress.
+ [Added] Account management can re-login abnormal accounts with a password.
+ [Added] Abnormal accounts can be re-authenticated automatically after refresh.
+ [Added] Parallel image generation uses separate workers and accounts.
+ [Added] Timed-out image polling can retry with another account up to four times.
+ [Added] Configurable second-stage image confirmation and check-before-hit behavior.
+ [Added] Image-task progress tracking for upload, warm-up, token retrieval, and generation.
+ [Added] A Continue waiting action for timed-out image tasks.
+ [Added] Settings for image confirmation, timeouts, and automatic re-login.
+ [Improved] Faster image-page scrolling, lazy loading, and scroll restoration between conversations.

## 1.4.0 - 2026-05-31

+ [Added] Added reverse-engineered editable PSD generation.
+ [Added] Added reverse-engineered editable PPT generation.

## 1.3.1 - 2026-05-30

+ [Added] Added ChatGPT search debugging and Skills.

## 1.3.0 - 2026-05-30

+ [Added] Added a reverse-engineered ChatGPT search endpoint.

## 1.2.4 - 2026-05-30

+ [Added] Added chat-completion caching and duplicate-request coalescing.
+ [Added] Added one-click access to Infinite Canvas.

## 1.2.3 - 2026-05-29

+ [Added] Added per-account proxies.
+ [Fixed] Improved 503 errors and fixed email line wrapping in the frontend.

## 1.2.2 - 2026-05-29

+ [Added] Added image generation through the Codex path with 2K and 4K support.
+ [Added] Added RT account refresh support.

## 1.2.0 - 2026-05-28

+ [Added] Initial Web panel with image generation, account, image, log, and settings management.
+ [Added] Clickable frontend version with current/latest version and release notes.
+ [Improved] Improved registration efficiency and success rate.
+ [Improved] Refined image-generation settings.
