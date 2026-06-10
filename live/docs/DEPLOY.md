# Deploy

All commands run from `live/` (or `make -C live …` from the repo root).
Terraform state is local. Region defaults to `ap-southeast-2`; every resource
is tagged `Owner = Scott N` via provider `default_tags` (see
`infra/variables.tf` `tags`).

## Backend

```
make init      # once
make tftest    # terraform tests (mocked providers, no AWS access)
make plan
make deploy    # terraform apply
make outputs
```

The Lambda zip is built by Terraform (`archive_file`) straight from
`backend/src/` + `shared/scoring.mjs` — there is no separate bundling step.
A code change just needs another `make deploy`.

## Frontend wiring

Take the `wss_url` output and replace the placeholder in
`apps/play/config.js`, then push — the Pages workflow deploys `/play/` with
the rest of the repo. On localhost the app ignores this and uses the dev
server (`ws://localhost:8787`); `?ws=wss://…` overrides both.

## Custom domain (optional, Cloudflare DNS)

Two-phase because ACM validation needs DNS records that only exist after the
certificate is created:

1. Set `custom_domain` (e.g. `play.example.com`) in a `terraform.tfvars` in
   `infra/` and `make deploy`. This creates the ACM certificate only.
2. `make outputs` → `acm_validation_records`. Add each record in Cloudflare as
   **DNS only** (grey cloud). Wait for the certificate to be issued
   (AWS console, or `aws acm list-certificates --no-cli-pager`).
3. Set `custom_domain_ready = true` and `make deploy` again. This creates the
   API Gateway custom domain + mapping.
4. `make outputs` → `cloudflare_app_record`: add the CNAME in Cloudflare
   (**DNS only**) pointing the domain at the API Gateway target.
5. Use `custom_wss_url` (`wss://play.example.com`) in `apps/play/config.js`.

## Teardown

```
make destroy
```

Remove any Cloudflare records by hand.

## Costs

Zero when idle: API Gateway WebSocket messages and connection-minutes, Lambda
invocations and DynamoDB on-demand are all pay-per-use; CloudWatch logs have
14-day retention.
