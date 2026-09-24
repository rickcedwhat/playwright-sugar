# AI agent identity (rickcedwhat-ai)

AI agent work in this repo must be attributed to **`rickcedwhat-ai`**, not `rickcedwhat`.

## Pull requests (required)

**Every agent-opened PR must be authored by `rickcedwhat-ai`.**

GitHub sets PR author from whoever creates the PR. Cursor’s `ManagePullRequest` / default cloud `gh` session often opens as `rickcedwhat` — that is wrong for this repo.

### How to open / fix

1. Push the branch as usual.
2. Create the PR with the AI token:
   ```bash
   GH_TOKEN="$GITHUB_AI_TOKEN" gh pr create \
     --repo rickcedwhat/playwright-sugar \
     --base main \
     --head <branch> \
     --title "..." \
     --body "..."
   ```
3. Confirm author:
   ```bash
   GH_TOKEN="$GITHUB_AI_TOKEN" gh pr view <n> --json author --jq .author.login
   # expect: rickcedwhat-ai
   ```
4. If a PR was already opened under `rickcedwhat`:
   - Close it.
   - Re-open the **same branch** with the command above.
   - Note in the new body: `Replaces #<old> (opened under the wrong GitHub account).`
   - Same pattern as #64 → #65 and #62 → #63.

Do **not** leave agent PRs authored by `rickcedwhat`. Prefer recreating over leaving the wrong author.

## Commits (verified badge)

To ensure AI-generated commits are attributed to the bot and receive the green **"Verified"** badge on GitHub, follow this local repository setup.

### Prerequisites
- A dedicated bot SSH key (e.g., `~/.ssh/id_ed25519_bot.pub`) must be registered on the bot's GitHub account.
- The repository must have "Signed Commits" requirement in its ruleset (optional but recommended).

### Local repository configuration

Run these commands within the root of any new repository to link the AI agent to the signing key:

```bash
# 1. Set the Bot Identity
git config user.email "ccata002+ai@gmail.com"
git config user.name "rickcedwhat-ai"

# 2. Configure SSH Signing
git config user.signingkey "/Users/cedrick/.ssh/id_ed25519_bot.pub"
git config gpg.format "ssh"

# 3. Enable Auto-Signing
git config commit.gpgsign "true"
```

### Why this is necessary
Even if a global Git config exists, individual repositories (especially when managed by different AI agents or manager tools) may not inherit the SSH agent identities of the host machine. Explicitly pointing to the public key file in the local `.git/config` ensures that the signature is always applied without needing a manual `ssh-add`.

### Troubleshooting
If commits are still unverified:
- Ensure the email address matches exactly what is registered on the GitHub account.
- Check that `gpg.format` is set to `ssh` (not the default `gpg`).
- Verify that the ruleset allows the actor or that the key is trusted.
