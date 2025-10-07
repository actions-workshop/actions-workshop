# Triggers and Events

This module explores the different ways to trigger GitHub Actions workflows.  You’ll learn how to respond to repository events, schedule workflows, filter runs, and manually dispatch workflows.

## 1 — Workflow Triggers (`on:`)

Every workflow must specify at least one trigger under `on:`.  These are what start a workflow.  Examples of the most common triggers: 

- **push** — runs on pushes to the repo
- **pull_request** — runs on PR open/update/merge events
- **workflow_dispatch** — manual trigger button in the Actions tab
- **schedule** — cron-based scheduling
- **repository_dispatch** — external trigger via API
- **workflow_call** — called by another workflow (reusable workflows)
- **issues** - runs on issue events (open, close, comment, etc)
- **issue_comment** - runs on issue comment events (create, edit, delete)

### Examples

```yaml
on: push
```

```yaml
on:
  pull_request:
    branches: [ main ]
```

```yaml
on:
  schedule:
    - cron: "0 9 * * 1" # every Monday at 9am UTC
```

A full list of triggers and their options can be found in the [GitHub Actions documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

## 2 — Filtering by Branches, Tags, and Paths

Filtering can be used to limit when these triggers are applied.  Common use cases: 

* Only run when push or pull request to the default branch
* Only execute when changes are made that touch my source code.  Or in a monorepo, executing based on the portion of code that changed 
* When a new release tag is applied, trigger a deployment

### Branch filters

```yaml
on:
  push:
    branches:
      - main
      - "release/*"
```

### Path filters

```yaml
on:
  push:
    paths:
      - "src/**"
      - "!docs/**"
```

### Tag filters

```yaml
on:
  push:
    tags:
      - "v*.*.*"
```

## 3 — Scheduled Workflows

Scheduled workflows can be useful if you have automation that needs to run at a particular time.  For example, with GitHub Advanced Security we scan on push and pull request, but also want to scan weekly in case code has not changed, but new vulnerability definitions exist.  A schedule using cron syntax can be used to trigger workflows.  

```yaml
on:
  schedule:
    - cron: "0 0 * * *" # daily at midnight UTC
```

> 💡 Tip: Use GitHub Copilot to create your cron schedule.  Alternatively look at [crontab.guru](https://crontab.guru/) to help.

## 4 — Manual Triggers

### workflow_dispatch

Workflow dispatch allows users to run a workflow manually from the GitHub UI.  This can be useful for testing as well as for remediating issues.  You have the ability to define inputs as well as defaults if needed.

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Deploy environment"
        required: true
        default: "staging"
```

> Tip: `workflow_dispatch` is currently limited to 10 inputs with a max length of 255 characters each.  If you need more complex input, consider using a JSON string as an input and parsing it in your workflow.


## 5 — External Triggers

### repository_dispatch

`repository_dispatch` allows integration with external systems. An external system sends a POST request to the GitHub API to trigger a workflow.  Unlike `workflow_dispatch`, this does not have pre-defined inputs and you can pass a JSON payload. This is intended for programmatic use.  

In the below example we define a custom event type.  By default repository_dispatch will run on all event types, but you can filter to specific types as shown.

```yaml
on:
  repository_dispatch:
    types: [deploy]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deployment triggered externally!"
```

Trigger with API:

```bash
curl -X POST \
  -H "Authorization: token <PAT>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -d '{"event_type":"deploy"}'
```

## 6 - Chaining Workflows

Often you will want to break up your workflows into multiple stages where one job triggers another.  This can be done by using the `needs:` keyword within a workflow with multiple jobs.  However, you can also trigger one workflow from another using `workflow_run`.  This is useful if you want to separate concerns or have different teams own different workflows. 

**Example:**

```yaml
# .github/workflows/test.yml
name: Build and Test
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."
  test:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - run: echo "Testing..."
```

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  workflow_run:
    workflows: ["Build and Test"]
    types:
      - completed
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying after build and test!"
```

In this example the `Deploy` workflow runs automatically after the `Build and Test` workflow completes.

While `workflow_run` works within a repo, triggering across repos requires `workflow_dispatch` or `repository_dispatch`.  An example of using workflow_dispatch is as follows: 

```yaml
# In repo A: .github/workflows/build.yml
name: Build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."
      - name: Trigger downstream workflow
        run: |
          curl -X POST \
            -H "Authorization: token ${{ secrets.PERSONAL_ACCESS_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/OWNER/REPO_B/actions/workflows/deploy.yml/dispatches \
            -d '{"ref":"main"}'
```

```yaml
# In repo B: .github/workflows/deploy.yml
name: Deploy
on:
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying from repo B!"
```


## 7 — Lab: Triggers and Events

In this lab we will walk through a few examples from the above triggers.

* Scheduled and manual triggers
* Chaining with workflow_run and workflow_dispatch
* Triggering with repository_dispatch

### 1 - Schedule and Manual Trigger

Here we will create a workflow that runs on a schedule as well as manually.  This could be used for scheduled builds, nightly tests, or other periodic tasks.  In this example we will run every 5 minutes so that you can see it in action.  

Create `.github/workflows/schedule-and-dispatch.yml`:

```yaml
name: Schedule and Dispatch Lab

on:
  schedule:
    - cron: "5 * * * *" # every 5 minutes
  workflow_dispatch:
    inputs:
      env:
        description: "Environment to test"
        required: true
        default: "staging"

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Running tests on ${{ github.event.inputs.env || 'nightly run' }}"
```

Wait for a 5 minute interval to see it run automatically.  Once it has run, I suggest editing the workflow to comment out the schedule to avoid this running every 5 minutes indefinitely.

> Tip: While cron will run the jobs approximately at the scheduled time, it is not exact.  The job may start a few minutes later depending on system load, runner availability, and queue time.

`workflow_dispatch` allows manually triggering the workflow.  We'll cover that in the next section.

### 2 - Chaining Workflows

To chain workflows, we will create two workflows.  The first will build and test code.  The second will deploy only after the first completes.

In your repo, create a `.github/workflows/chaining-test.yml`:

```yaml
name: Chaining - Build and Test
on:
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Building..."
  test:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - run: echo "Testing..."
```

Then create another workflow, `.github/workflows/chaining-deploy.yml`: 

```yaml
name: Chaining - Deploy
on:
  workflow_run:
    workflows: ["Build and Test"]
    types:
      - completed
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying after build and test!"
```

This is a typical workflow where code is built and tested on push or PR, and then deployed only after successful completion.  Typically this would be triggered on push or pull request, but for the sake of the lab we will use `workflow_dispatch` to manually trigger it.

Go to the Actions tab in the repo, navigate to `Chaining - Build and Test`, and execute this by manually triggering this with the `Run workflow` button in the Actions tab.  Monitor that the job completes, then see that the `Chaining - Deploy` workflow runs automatically after.

### 3 - External Trigger with repository_dispatch

In this example we will create a workflow that is triggered externally using the `repository_dispatch` event.  This could be used to integrate with other systems or trigger workflows from scripts.

Create `.github/workflows/external-trigger.yml`:

```yaml
name: External Trigger Lab

on:
  repository_dispatch:
    types: [trigger]

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Triggered by external event!"
```

Commit and push this workflow to your repository.  To trigger this workflow, you will need to use the GitHub API.  You can do this with `curl` or any HTTP client.  You will need a personal access token (PAT) to authenticate.  Options:
* Classic token with `repo` scope.
* Fine-grained token with `Actions: Read and write` permission and `Contents: Read and write` access.

```bash
curl -X POST \
  https://api.github.com/repos/OWNER/REPO/dispatches \
  -H "Authorization: token YOUR_TOKEN" \
  -d '{"event_type":"trigger"}'
```
If in a codespace you can run `echo $GITHUB_REPOSITORY` to find the OWNER and REPO.  Otherwise they are just part of your repository URL.  Replace `OWNER`, `REPO`, and `YOUR_TOKEN` with your GitHub username, repository name, and personal access token respectively.

Monitor in the Actions tab that the `External Trigger Lab` workflow runs successfully.

## Conclusion

In this lab, you explored several workflow triggers available in GitHub Actions, including scheduled, manual, and external events. You learned how to filter workflow runs by branch, path, and tag, and how to chain workflows together for multi-stage automation. 

These skills are essential for building flexible, efficient, and maintainable CI/CD pipelines. You can now confidently design workflows that respond to any event, automate complex build and deployment processes, and integrate with tools across your development ecosystem.
