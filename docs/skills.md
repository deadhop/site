---
title: Agent skills
description: Agent skills for deadhop that install with npx skills add. They cover payments, the dashboard, lnaddr, the relay, the sweeper, deployment, the docs and the brand.
---

# Agent skills

Every deadhop repository ships [agent skills](https://skills.sh): folders with a `SKILL.md`
that teach a coding agent (Claude Code, Codex, Cursor, OpenCode and others) one deadhop job.
Each skill says when it applies, what to ask you, the commands to run, the mistakes that lose
money or leak a key, and how to check the result. For details, the skills point back to these
docs, through each page's Markdown twin (`.md`, see [Markdown and llms.txt](./agents.md)).

## Install

The [skills CLI](https://github.com/vercel-labs/skills) installs from a repository on GitHub:

```sh
npx skills add deadhop/js                                 # every skill in deadhop/js
npx skills add deadhop/js --skill deadhop-js-integrate    # just one
npx skills add deadhop/js --list                          # see what a repository has
```

It asks which agents to install for and whether to install into the project or for your
user (`-g`). `-a claude-code` picks the agent, and `-y` skips the questions. Update later with
`npx skills update`.

Install the skills for the job at hand rather than all of them: an agent reads every
installed skill's description to decide which one applies.

## The skills

### Build with deadhop

| Skill | Repository | Use it to |
| --- | --- | --- |
| `deadhop-js-integrate` | [deadhop/js](https://github.com/deadhop/js) | Add a pay button, invoice form or back-end invoices to an app (React, Solid, Svelte, plain JavaScript, Node), and check payments on the server before fulfilling |
| `deadhop-js-dashboard` | [deadhop/js](https://github.com/deadhop/js) | Host the dashboard and the network console, write `config.json`, sign in as an operator |

### Run deadhop

| Skill | Repository | Use it to |
| --- | --- | --- |
| `deadhop-stack-deploy` | [deadhop/stack](https://github.com/deadhop/stack) | Deploy with Docker Compose: `.env`, the generated wallet and its recovery phrase, the first address, the dashboard behind a reverse proxy, updates |
| `deadhop-server-operate` | [deadhop/server](https://github.com/deadhop/server) | Configure the payment service: Electrum and its pinned certificate, your own wallet or a generated one, operators, hiding it, the production checklist, troubleshooting |
| `deadhop-wallet-sweep` | [deadhop/wallet](https://github.com/deadhop/wallet) | Sweep to a cold wallet by send, PayJoin or CoinJoin; the threshold and fee cap; why a sweep waits |
| `deadhop-relay-setup` | [deadhop/relay](https://github.com/deadhop/relay) | Run a whitelist-only relay for your service, behind TLS, and point deadhop and the dashboard at it |
| `deadhop-lnaddr-setup` | [deadhop/lnaddr](https://github.com/deadhop/lnaddr) | Give a home Lightning node a Lightning address: `lnaddr-node` next to the node, `lnaddr-gateway` on a public host |

### Develop deadhop

| Skill | Repository | Use it to |
| --- | --- | --- |
| `deadhop-stack-regtest` | [deadhop/stack](https://github.com/deadhop/stack) | Run the local regtest stack: `just up`, `just server`, `just pay`, `just e2e` |
| `deadhop-server-develop` | [deadhop/server](https://github.com/deadhop/server) | Change the service or its shared crates: the 100% coverage gate, snapshots, what other repositories consume |
| `deadhop-js-develop` | [deadhop/js](https://github.com/deadhop/js) | Change the packages, dashboard or console: the gates, the copied fixtures, releases |
| `deadhop-lnaddr-develop` | [deadhop/lnaddr](https://github.com/deadhop/lnaddr) | Change lnaddr: the gate, moving the shared crates, the demo stage |
| `deadhop-relay-develop` | [deadhop/relay](https://github.com/deadhop/relay) | Change the relay: the gate, and the benchmark that runs only in its container |
| `deadhop-wallet-develop` | [deadhop/wallet](https://github.com/deadhop/wallet) | Change the sweeper: the gate and the regtest sweeps |
| `deadhop-site-docs` | [deadhop/site](https://github.com/deadhop/site) | Write or fix a page of these docs: its kind, the docs map, the checks |
| `deadhop-brand` | [deadhop/brand](https://github.com/deadhop/brand) | Make something look like deadhop: colours, type, logo, and where the brand files are copied |

## What the skills will not do

The skills tell the agent to leave a few things to you:

- **Secrets.** The agent never asks you to paste a secret key (`nsec`) or the recovery phrase
  into the chat. It tells you which file or variable to set, and you set it yourself.
- **The recovery phrase.** You print it in your own terminal and write it down offline. The
  agent does not run the export for you.
- **Releasing goods.** Integrations ship an order only when your back end sees the invoice
  `confirmed`, never on `detected` and never on the browser's word alone.

## Write or fix a skill

A skill lives in its repository under `skills/<name>/SKILL.md`. Change it with a pull
request there, like any other file. Settings tables and long explanations belong in these
docs; the skill links to them.
