# sampleworks RFCs deployment

The Inkling deployment that serves `rfcs.sampleworks.dev`. It deploys the current checkout.

| Setting         | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Cloudflare zone | `sampleworks.dev`                                                    |
| Worker          | `sampleworks-inkling`                                                |
| Hostname        | `rfcs.sampleworks.dev` (custom domain)                               |
| R2 buckets      | `sampleworks-inkling-objects`, `sampleworks-inkling-objects-preview` |

## One-time setup

Run these from this directory, after `make setup` at the repository root.

1. Create the R2 buckets:

   ```sh
   pnpm exec wrangler r2 bucket create sampleworks-inkling-objects
   pnpm exec wrangler r2 bucket create sampleworks-inkling-objects-preview
   ```

2. On the Google OAuth web client, register this redirect URI:

   ```text
   https://rfcs.sampleworks.dev/api/auth/google/callback
   ```

3. Store the Worker secrets. Set at least one of `GOOGLE_ALLOWED_DOMAINS` and
   `GOOGLE_ALLOWED_EMAILS`; generate the state secret with `openssl rand -base64 48`:

   ```sh
   pnpm exec wrangler secret put GOOGLE_CLIENT_ID
   pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
   pnpm exec wrangler secret put GOOGLE_ALLOWED_DOMAINS
   pnpm exec wrangler secret put GOOGLE_ALLOWED_EMAILS
   pnpm exec wrangler secret put GOOGLE_ADMIN_EMAILS
   pnpm exec wrangler secret put INKLING_OAUTH_STATE_SECRET
   ```

   Before the first deploy, Wrangler offers to create the Worker to hold the secrets. Sign-in
   fails closed until they exist.

## Deploying

From the repository root:

```sh
pnpm --filter @earendil-works/inkling-frontend build
pnpm --filter inkling-deployment-sampleworks-rfc run deploy
```

## Backups

`.github/workflows/backup-sampleworks-rfc.yml` exports the workspace every Monday and uploads it
to the private `sampleworks-inkling-backups` bucket. It can also be run by hand from the Actions
tab. A backup includes unpublished drafts.

One-time setup:

1. Create the bucket, from this directory:

   ```sh
   pnpm exec wrangler r2 bucket create sampleworks-inkling-backups
   ```

   Decline Wrangler's offer to add the bucket to `wrangler.jsonc`: the Worker does not use it.

2. In the GitHub repository settings, under "Secrets and variables" for Actions, add:

   | Kind     | Name                    | Value                                                       |
   | -------- | ----------------------- | ----------------------------------------------------------- |
   | Secret   | `INKLING_API_KEY`       | An API key an administrator created from the account menu   |
   | Secret   | `CLOUDFLARE_API_TOKEN`  | A Cloudflare API token with "Workers R2 Storage: Edit"      |
   | Variable | `CLOUDFLARE_ACCOUNT_ID` | The account ID shown on the Cloudflare dashboard's overview |

To restore, download a backup from the bucket and run `inkling restore WORKSPACE BACKUP`.
