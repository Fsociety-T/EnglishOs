# EnglishOS Edge Functions

`claude-review` is the private bridge between EnglishOS and Anthropic. It only
accepts an authenticated Supabase user and reads `ANTHROPIC_API_KEY` from the
Supabase Edge Function secret store; neither the website bundle nor GitHub has
access to that key.

## Deploy

1. Install and sign in to the Supabase CLI with an owner/developer account.
2. Deploy the function:

   ```bash
   supabase functions deploy claude-review --project-ref hupfinfuowvnmwprlzxn
   ```

3. In Supabase Dashboard → Edge Functions → Secrets, set:

   ```text
   ANTHROPIC_API_KEY=<your new Claude key>
   ```

   Optionally set `ANTHROPIC_MODEL` to a Claude model your account can use. If
   omitted, the function uses `claude-sonnet-4-20250514`.

4. Add `VITE_AI_PROVIDER=claude` as a GitHub Actions repository secret or
   variable, then push/deploy the frontend. Set it to `mock` to force the local
   practice engine.

Never add an Anthropic key to a `VITE_` variable, GitHub Pages secret, or any
file committed to git.
