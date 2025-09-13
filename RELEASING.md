> [!NOTE]
> This document is intended for maintainers of this project.

## Major release process

When preparing a **new major version**, we first publish **beta prereleases** from the `main` branch.

### Beta releases

All commits merged into `main` will be released to npm as prereleases for the next major version.

### Promoting to stable

When the beta is ready to go stable:

1. Create a new branch named `vX` from `main`
   1. Update `.changeset/config.json` to set the `baseBranch` to `vX`
   2. Update `.github/workflows/release.yml` `on.push.branches` to `[vX]`
   3. Run `pnpm changeset pre exit` to leave prerelease mode.
   4. Push the branch
   5. Merge the PR for releasing the `vX` major version

2. On `main` branch
   1. Cleanup released changesets by running `rm .changeset/*.md`
   2. Run `pnpm changeset pre exit`
   3. Set the package version on `package.json` to the recently published version
   4. Run `pnpm changeset pre enter beta`
   5. Update `.github/dependabot.yml` with new update group targeting `vX`
