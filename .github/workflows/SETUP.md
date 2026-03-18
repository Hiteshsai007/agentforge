# GitHub Actions Setup Guide

## ⚠️ Security First

**Never commit secrets to your repository!**

This document explains how to securely configure GitHub Actions for testing.

---

## Step 1: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `TEST_COMPANY_ID` | Test company UUID from database |
| `TEST_API_KEY` | Test company API key |

---

## Step 2: Update Workflow

In `.github/workflows/tests.yml`, update this line with your GitHub username/repo:

```yaml
if: github.repository == 'YOUR_USERNAME/ai-agent-marketplace' || github.event_name != 'pull_request'
```

Replace `YOUR_USERNAME/ai-agent-marketplace` with your actual GitHub username and repository name.

---

## How It Works

### Fork Protection

The workflow has this check:
```yaml
if: github.repository == 'YOUR_USERNAME/ai-agent-marketplace' || github.event_name != 'pull_request'
```

This means:
- ✅ Pushes to your main branch: **RUNS** (has secrets)
- ✅ PRs from your own branches: **RUNS** (has secrets)
- ❌ PRs from forks: **SKIPPED** (no secrets access)

### Secrets Access

- Secrets are encrypted and stored in GitHub
- They are only available during workflow runs
- They are NEVER shown in logs or artifacts
- They can only be accessed by workflow jobs

---

## Alternative: Use Different Test Database

For extra safety, create a separate test database/company:

```sql
-- Create a test company (doesn't affect production)
INSERT INTO companies (company_name) VALUES ('Test Company');
-- Use this company's ID as TEST_COMPANY_ID
```

---

## Local Testing

Run tests locally without GitHub:

```bash
# Set environment variables
export TEST_BASE_URL="http://localhost:8013"
export TEST_COMPANY_ID="your-test-company-id"
export TEST_API_KEY="your-test-api-key"

# Run tests
pytest backend/tests/ -v
```

---

## Troubleshooting

### Secrets Not Working

1. Check secrets are added to GitHub (not .env files)
2. Verify secret names match exactly
3. Check workflow logs for `Secrets not found` errors

### Tests Failing on Fork PRs

This is **expected behavior** - fork PRs don't have access to secrets for security.

To test fork PRs:
1. Create a branch in your own repo
2. Open a PR from your branch
3. Tests will run with secrets

---

## Security Checklist

- [ ] Secrets added to GitHub, not in code
- [ ] Repository name updated in workflow
- [ ] No .env files committed
- [ ] No API keys in git history
- [ ] Lint job works on all PRs (no secrets needed)
