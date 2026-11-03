Handover template

# Agent Build Brief

What to give a developer who builds you an agent, with subagents, skills and tools where the task needs them. Fill in each section, or hand over the whole template. Every section has a blank template and a filled example in Markdown and XML.

Sections

00

## Which pieces do you need?

Read first

Decide this before you write the brief, or let the developer propose it. You describe the job. The developer picks the parts, but they need to know what each part costs and what information it needs from you.

| Piece | What it is | Add it when | What you give the developer |
| --- | --- | --- | --- |
| Agent | The model loop that owns the task: it plans, calls tools, talks to the user and decides when it is done. | Always. One per task. | Mission, workflow, guardrails, budget. |
| Subagent | A separate agent with its own context, prompt, tools and model. The main agent calls it and gets back a short result. | Work splits into independent chunks, a step reads a lot but only a summary matters, or a step needs other permissions or a cheaper model. | Purpose, input, the exact return shape, tools, model. |
| Skill | A folder with `SKILL.md` plus references and scripts. It loads only when its description matches the task. | Know-how you want applied the same way every time: house style, procedures, domain rules, checking scripts. | The trigger description, the source material, approved example outputs. |
| Tool | A function with a typed input schema. It does the real reading and writing. | The agent has to touch a system: an API, a database, files, messages. | Name, schema, output, side effects, auth, rate limits, errors. |
| MCP server | A bundle of tools served over the Model Context Protocol, reusable by any client. | The tools already exist as a server (GitHub, Slack, a database), or several agents should share them. | Which server, which tools are allowed, auth scopes. |

### A subagent is worth it if

- There are many independent items to process in parallel (one per PR, file, ticket).
- A step would flood the context with diffs, logs or long documents.
- A step should run read-only or with stricter tools than the main agent.
- A step does fine on a faster, cheaper model.

### Skip it if

- Steps are short and depend on each other in order.
- Each step needs the whole conversation so far.
- The task fits comfortably in one context.
- It would only add another persona with the same tools.

- Give real samples, not descriptions of samples. One real input and one accepted output beat a page of explanation.
- Say what is out of scope. Developers fill silence with features.
- Arrange access (API keys, accounts, test data) before kickoff, and name one person who answers questions.

Template