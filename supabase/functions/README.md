# EnglishOS Edge Functions

`claude-review` is the private bridge between EnglishOS and the model provider
(currently Groq). It only accepts an authenticated Supabase user and reads
`GROQ_API_KEY` from the Supabase Edge Function secret store; neither the website
bundle nor GitHub has access to that key.

The function name is historical — it called Anthropic first. Renaming it means
deploying the new name, updating `src/services/ai/claudeProvider.ts`, and
deleting the old function, so it has been left alone.

## Deploy

1. Install and sign in to the Supabase CLI with an owner/developer account.
2. Deploy the function:

   ```bash
   supabase functions deploy claude-review --project-ref hupfinfuowvnmwprlzxn
   ```

3. In Supabase Dashboard → Edge Functions → Secrets, set:

   ```text
   GROQ_API_KEY=<your Groq key, starts with gsk_>
   ```

   Optionally set `GROQ_MODEL`. If omitted the function uses
   `openai/gpt-oss-120b`, chosen because it is one of the few Groq models
   supporting **strict** `json_schema` responses. A model without strict schema
   support will return JSON that the validators silently discard, which looks
   to the user like "the AI found no mistakes." Check current model support at
   https://console.groq.com/docs/structured-outputs before changing this.

4. Add `VITE_AI_PROVIDER=claude` as a GitHub Actions repository **variable**
   (Settings → Secrets and variables → Actions → Variables), then push to
   `main`. Set it to `mock` to force the local practice engine.

   The only valid values are the literal strings `claude` and `mock`. Anything
   else silently falls back to the offline practice engine, with no error.

## Never put an API key in a `VITE_` variable

Every `VITE_*` value is compiled into the public browser bundle by design —
anyone can read it by opening the site's `.js` file. API keys belong only in
the Supabase Edge Function secret store, which the browser never sees.

`VITE_AI_PROVIDER` takes the *word* `claude`, not a key.

## Debugging

The function logs the provider's real error response before returning its
generic message to the browser. When the button fails, read
Supabase Dashboard → Edge Functions → `claude-review` → Logs — that shows the
actual status and body (bad key, rate limit, unknown model) instead of the
user-facing text.
