#!/usr/bin/env bash
set -euo pipefail

git fetch --all --prune

branches="$(git branch -r | grep -E 'origin/v[0-9]+$' | sed 's|origin/||' | xargs) main"

for branch in $branches; do
  echo "Processing $branch"

  git checkout -B "$branch" "origin/$branch" --force

  git reset --hard
  git clean -fd

  mkdir -p src
  out_file="src/notion-types.ts"
  cat <<'EOF' > "$out_file"
// NOTE: This file is vendored from @notionhq/client.
// Licensed under MIT (https://github.com/makenotion/notion-sdk-js/blob/main/LICENSE).
EOF

  curl --silent https://raw.githubusercontent.com/makenotion/notion-sdk-js/refs/heads/main/src/api-endpoints.ts >> "$out_file"
  echo "synced $out_file"

  if [[ -n $(git status --porcelain) ]]; then
    new_branch="sync-notion-types-${branch}"

    if git show-ref --verify --quiet "refs/remotes/origin/$new_branch"; then
      git checkout -B "$new_branch" "origin/$new_branch" --force
    else
      git checkout -b "$new_branch"
    fi

    git add src/notion-types.ts
    git commit -m "sync notion types"

    mkdir -p .changeset
    changeset_file=".changeset/sync-notion-types.md"
    if [[ ! -f "$changeset_file" ]]; then
      cat <<EOF > "$changeset_file"
---
"notion-api-wrapper": minor
---

Sync Notion types
EOF
      git add "$changeset_file"
      git commit -m "docs(changeset): Sync Notion types"
    fi

    git push --force-with-lease origin "$new_branch"

    existing_pr=$(gh pr list --head "$new_branch" --json number --jq '.[0].number')
    if [[ -n "$existing_pr" ]]; then
      echo "Skipping PR creation. Updated existing PR #$existing_pr"
    else
      gh pr create \
        --title "[$branch] Sync Notion Types" \
        --body "This PR was automatically created." \
        --base "$branch" \
        --head "$new_branch"
    fi
  else
    echo "No changes in $branch"
  fi
done
