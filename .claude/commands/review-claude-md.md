---
name: review-claude-md
description: Review and update CLAUDE.md based on recent changes
allowed-tools: [Read, Write, Edit, Bash(git:*), Grep]
---

# Review CLAUDE.md - Automated Maintenance

Review project CLAUDE.md and suggest updates based on recent repository changes.

## Process

1. **Analyze Recent Changes**:
   - Read last 20 git commits
   - Identify workflow changes (scripts, workflows, commands)
   - Check for new patterns/learnings
   - Note authentication/config changes

2. **Review Current CLAUDE.md**:
   - Check "Last Updated" timestamp
   - Verify documented workflows match actual code
   - Identify missing learnings from recent work

3. **Suggest Updates**:
   - New workflow patterns to document
   - Testing requirements to add
   - Command permissions to update
   - Timestamp to update

4. **Auto-Update or Prompt**:
   - If changes are minor: Auto-update with explanation
   - If changes are significant: Show diff and ask for approval
   - Always update "Last Updated" timestamp

## Triggers for Updates

**Workflow Changes**:

- New files in `.github/workflows/`
- New files in `scripts/`
- New custom commands in `.claude/commands/`

**Template Changes**:

- Auth configuration modifications
- Testing strategy changes
- Build process updates

**Pattern Discovery**:

- After code review rounds
- After fixing critical bugs
- After implementing new features

## Implementation

```bash
# Get recent commits
git log --oneline -20 --name-only

# Check workflow files
git diff HEAD~20..HEAD -- .github/workflows/ scripts/ .claude/commands/

# Check template changes
git diff HEAD~20..HEAD -- templates/*/package.json templates/*/{auth,config}*

# Analyze and suggest updates
# (AI-driven analysis of patterns and learnings)
```

## Output Format

Provide:

1. **What Changed**: Summary of recent repository changes
2. **Current CLAUDE.md**: Relevant sections that may need updates
3. **Suggested Updates**: Specific additions or modifications
4. **Justification**: Why each update improves documentation

---

**Usage**: `/review-claude-md` (run monthly or after major milestones)
