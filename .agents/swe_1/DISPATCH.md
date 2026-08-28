## 2026-08-21T16:22:03Z

Handle Gemini API 429 rate limit error (Too Many Requests) gracefully in the Anchor app.
- When Gemini API returns 429 Too Many Requests, catch this specific error and prevent it from bubbling up as a raw JSON string to the UI.
- UI must display a clear, user-friendly message explaining rate limit exceeded rather than raw API error details.
- Add/update a programmatic test (unit or integration) that mocks a 429 rate limit error and verifies the user-friendly error message is rendered in UI and raw JSON is not present.

Please execute the SWE Light protocol to implement, test, and review this fix.
