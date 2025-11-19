---
name: update-package
description: Updates project dependencies by checking migration guides and breaking changes documentation using Context7, then applies necessary code changes to maintain compatibility with new versions
---

# Update Package Skill

This skill helps you safely upgrade project dependencies by:
1. Reading the current package.json to identify dependencies
2. Using Context7 MCP tools to fetch official upgrade documentation and migration guides
3. Analyzing breaking changes and required code modifications
4. Applying necessary code changes to maintain compatibility
5. Updating package.json and installing new versions

## When to Use This Skill

- User wants to upgrade a specific dependency to a newer version
- User needs to update multiple related packages (e.g., React ecosystem)
- User asks to "update", "upgrade", or "migrate" a package
- User wants to know what changes are needed for a version upgrade

## Instructions

### Step 1: Understand the Upgrade Request

Ask the user which package(s) they want to upgrade and to which version (if they have a target version in mind).

### Step 2: Read Current Dependencies

Read the `package.json` file to identify:
- Current version of the package to be upgraded
- Related packages that might need upgrading together
- Project structure (monorepo, single package, etc.)

### Step 3: Fetch Upgrade Documentation

Use Context7 MCP tools to retrieve official documentation:

1. **Resolve Library ID**: Use `resolve-library-id` to find the correct Context7 library ID
   - Example: For "React", this returns `/facebook/react`

2. **Get Migration Docs**: Use `get-library-docs` with topics like:
   - "migration guide"
   - "upgrading from v{oldVersion} to v{newVersion}"
   - "breaking changes"
   - "changelog"
   - "v{newVersion} release notes"

3. **Get Specific Feature Docs**: If breaking changes mention specific APIs, fetch:
   - Topic: "deprecated APIs"
   - Topic: specific feature names mentioned in breaking changes

### Step 4: Analyze Required Changes

Based on the documentation:
- Identify breaking changes that affect the current codebase
- List deprecated APIs being used in the project
- Note new required configurations
- Identify peer dependency updates needed

### Step 5: Search Codebase for Affected Code

Use Grep tool to find:
- Import statements for the package
- Usage of deprecated APIs
- Configuration files that need updates
- Type definitions that might be affected

### Step 6: Apply Code Changes

Make necessary changes:
1. Update import statements if package structure changed
2. Replace deprecated APIs with new alternatives
3. Update configuration files
4. Fix type errors
5. Update related packages to compatible versions

### Step 7: Update package.json

Update the version in package.json for:
- The main package being upgraded
- Any peer dependencies that need updating
- Related packages in the ecosystem

### Step 8: Install and Test

1. Run the package manager install command
2. Run lint/type check to catch obvious errors
3. Suggest running tests
4. Report the upgrade summary to user

## Example Workflow

```
User: "Upgrade React to version 18"

1. Read package.json ’ Found React 17.0.2
2. resolve-library-id: "react" ’ /facebook/react
3. get-library-docs: /facebook/react with topic "migration guide react 18"
4. get-library-docs: /facebook/react with topic "breaking changes react 18"
5. Analyze docs ’ Found: new root API, automatic batching, strict mode changes
6. Grep codebase for: "ReactDOM.render", "import.*react-dom"
7. Apply changes: Replace ReactDOM.render with createRoot
8. Update package.json: react@18, react-dom@18
9. Run: npm install
10. Report: Successfully upgraded React to v18. Key changes made:
    - Updated ReactDOM.render to createRoot in src/index.tsx
    - Updated react and react-dom to version 18.3.1
    - No breaking changes affecting your codebase
```

## Important Considerations

- **Always check Context7 documentation first** before making code changes
- **Be conservative**: If documentation is unclear, ask the user before proceeding
- **Check peer dependencies**: Many packages require specific versions of peer deps
- **Monorepo awareness**: In workspaces/monorepo, check all packages
- **Version compatibility**: Ensure all related packages have compatible versions
- **Breaking changes**: Always prioritize fixing breaking changes over optional improvements
- **Test recommendations**: Always recommend running tests after upgrades

## Common Packages to Handle

- **React ecosystem**: react, react-dom, react-scripts, @types/react
- **Build tools**: webpack, vite, rollup, esbuild, rsbuild
- **Testing**: jest, vitest, @testing-library/*
- **TypeScript**: typescript, @types/* packages
- **Frameworks**: next.js, remix, gatsby
- **State management**: redux, zustand, jotai, recoil
- **Styling**: styled-components, emotion, tailwind

## Error Handling

If you encounter issues:
1. **No documentation found**: Search with alternate topics or check official website
2. **Multiple breaking changes**: Prioritize by impact, tackle one at a time
3. **Unclear migration path**: Ask user if they want to proceed with best-effort upgrade
4. **Peer dependency conflicts**: Explain the conflict and ask for user preference
5. **Installation fails**: Check error message, may need to update other packages first
