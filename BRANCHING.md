# Branching Strategy

This repo uses a **main + develop** model (production + staging), suited to a
solo/small team deploying to Vercel.

## Long-lived branches

| Branch | Purpose | Deploys to |
|--------|---------|-----------|
| **`main`** | Production. Always deployable. Only updated by merging `develop` (a release) or a `hotfix/*`. | Vercel **Production** |
| **`develop`** | Integration / staging. The default target for everyday work. | Vercel **Preview** (stable staging URL) |

Both are **protected**: no direct commits, no force-push, changes land via Pull Request.

## Working branches (short-lived — branch off `develop`)

Name them `type/short-slug`:

- `feat/…` — a new feature (`feat/wishlist`)
- `fix/…` — a bug fix (`fix/cart-quantity`)
- `chore/…` — tooling, deps, docs (`chore/bump-next`)
- `refactor/…` — internal change, no behavior change

Flow: branch from `develop` → push → open a PR **into `develop`** → review → merge → delete the branch. Vercel builds a preview URL for every PR.

## Hotfixes (urgent production fix)

- `hotfix/…` — branch from **`main`**, PR **into `main`**, deploy, then merge
  `main` back into `develop` so the two stay in sync.

## Release flow

1. Features/fixes merge into `develop` (each PR gets its own preview).
2. When `develop` is stable, open a PR **`develop → main`** titled e.g. `Release`.
3. Merge it → Vercel deploys `main` to production.
4. Tag the release: `git tag v1.0.0 && git push --tags`.

## Everyday commands

```bash
# start a feature
git checkout develop
git pull
git checkout -b feat/product-reviews
# ...work + commit...
git push -u origin feat/product-reviews      # then open a PR into develop on GitHub

# keep your branch current
git checkout feat/product-reviews
git merge develop            # (or: git rebase develop)

# cut a release
# open PR develop -> main on GitHub and merge, then:
git checkout main && git pull
git tag v1.0.0 && git push --tags
```

## One-time GitHub setup (Settings → Branches → Add rule)

Protect **`main`** and **`develop`**:
- Require a pull request before merging
- Require status checks to pass (select the Vercel check once connected)
- Do not allow force pushes / deletions

Recommended: set **`develop` as the repository's default branch**
(Settings → General → Default branch) so new PRs target `develop`, not `main`.

## Vercel setup (Project → Settings → Git)

- **Production Branch = `main`** (default).
- `develop` and every PR automatically get **Preview Deployments**. You can attach
  a custom domain (e.g. `staging.yourdomain.com`) to the `develop` branch for a
  stable staging URL.
- Set environment variables per environment (Production vs Preview) so, if desired,
  staging can point at different Stripe/Supabase keys.

> Note: this project currently uses a single Supabase project and Stripe test keys,
> so `develop`/preview and `main`/production share the same backend until you
> provision separate ones. Keep that in mind when testing against real data.
