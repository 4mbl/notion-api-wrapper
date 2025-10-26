#!/usr/bin/env bash
set -euo pipefail

git fetch --all

branches=$(git branch -r | grep -E 'origin/v[0-9]+$' | sed 's|origin/||' | xargs)

for branch in $branches; do
  echo "Processing $branch"
  git checkout -B "$branch" "origin/$branch"
  pnpm install
  pnpm run sync-api

  if [[ -n $(git status --porcelain) ]]; then
    new_branch="sync-notion-types-${branch}"
    git checkout -b "$new_branch"
    git add .
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

    git push origin "$new_branch"

    gh pr create \
      --title "[$branch] Sync Notion Types" \
      --body "This PR was automatically created." \
      --base "$branch" \
      --head "$new_branch"
  else
    echo "No changes in $branch"
  fi
done
