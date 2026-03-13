---
description: "Phase 1+2: Research the codebase and create a structured task plan for workers"
---

Analyze the following request and create an implementation plan:

$ARGUMENTS

## Process

### 1. Research

Explore the codebase before planning:
- use `Glob` to find relevant files
- use `Grep` to detect existing patterns, conventions, types, and interfaces
- use `Read` to understand similar implementations
- use the Agent tool with `subagent_type=\"Explore\"` if the repository is large

### 2. Clarifying questions

Before writing the plan, identify the ambiguous parts:
- What exact behavior is expected in edge cases?
- Are there performance, compatibility, or breaking-change constraints?
- Which files must not be modified?
- Are there new trust boundaries to analyze?

Present the questions and wait for answers before continuing.

### 3. Structured plan

Break the work into atomic tasks using this format:

```text
TASK 1: [descriptive title]
- Description: [exactly what to do]
- Files to modify: [complete list]
- Dependencies: none | Task N
- Can run in parallel with: Task N | none
- Context for the worker: [what the worker must know]
- Definition of done: [verifiable success criteria]

TASK 2: ...
```

### 4. Initial security analysis

Identify these concerns before implementation:
- Are there new trust boundaries?
- Are there external inputs from users, APIs, or files?
- Does the change create new attack surfaces?
- Is `/threat-model` needed because of the architecture change?

### 5. Confirmation

Present the full plan and wait for approval before execution.
Suggest `/code` for implementation or `/full-cycle` for the complete workflow.
