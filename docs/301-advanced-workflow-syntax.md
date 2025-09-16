# Advanced Workflow Syntax

This module dives deep into GitHub Actions workflow syntax.  First we will discuss the concepts and then have a hands-on lab to use what we learn.  By the end, you’ll be able to confidently build complex workflows using variables, expressions, contexts, and advanced YAML structures.

## 1 — Expressions

Workflows use the expression syntax `${{ }}` to evaluate values dynamically.  Expressions are crucial for creating flexible and reusable workflows. They allow you to access context-specific information and make decisions based on the current state of the workflow.

A few examples of expressions are as follows:

```yaml
if: ${{ github.ref == 'refs/heads/main' }}
```

```yaml
run: echo "Hello ${{ github.actor }}"
```

Note that expressions can use boolean, null, number, or string data types.

### Common Functions

There are several built-in functions that can be used within expressions:
- `startsWith()`, `endsWith()`, `contains()`
  - Search within strings
  - Example: `startsWith(github.ref, 'refs/tags/')`
- `toJSON()`, `fromJSON()`
  - Convert between JSON strings and objects
  - Example: `fromJSON('{"key":"value"}').key`

### Status Check Functions

- `success()`, `failure()`, `cancelled()`, `always()`
  - Check the status of previous steps or jobs
  - Example: `if: ${{ failure() }}`

### Operators

These are typical operators similar to other programming languages:
- Comparison: `==`, `!=`, `>`, `<`, `>=`, `<=`
- Logical: `&&`, `||`, `!`
- Arithmetic: `+`, `-`, `*`, `/`, `%`

It may be helpful to review the [Expressions syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions) for a complete list of functions and operators.

## 2 — Contexts

Contexts in GitHub Actions are special global objects that provide access to runtime information about the workflow, repository, environment, and more. They allow you to write dynamic, flexible workflows by referencing data that changes depending on the event, job, or runner.

Contexts let you use information like branch name, actor, environment variables, secrets, and job outputs to make decisions or customize behavior and facilitate reusability without hardcoding values.

### Common Contexts
* **github:** Information about the repository, event, and actor.
  * Example: `${{ github.ref }}` (current branch or tag), `${{ github.actor }}` (user who triggered the workflow)
* **env:** Environment variables defined in the workflow.
  * Example: `${{ env.NODE_ENV }}`
* **secrets:** Encrypted secrets set in the repository or organization.
  * Example: `${{ secrets.API_KEY }}`
* **job:** Status and outputs of the current job.
  * Example: `${{ job.status }}`
* **runner:** Details about the runner executing the job.
  * Example: `${{ runner.os }}` (operating system), `${{ runner.arch }}` (architecture)
* **steps:** Outputs and status of previous steps in the current job.
  * Example: `${{ steps.step_id.outputs.output_name }}`
* **needs:** Outputs and status of previous jobs that the current job depends on.
  * Example: `${{ needs.job_id.outputs.output_name }}`

For a full list of contexts and their properties, see the [Contexts reference](https://docs.github.com/en/actions/reference/workflows-and-actions/contextshttps://docs.github.com/en/actions/learn-github-actions/contexts) in the documentation.

## 3 — Variables

Variables in GitHub Actions allow you to store and reuse values throughout your workflows. They make workflows more flexible, maintainable, and secure by enabling dynamic configuration and data sharing between steps and jobs.

You can define environment variables at different levels: workflow, job, and step.

Examples of each are below: 

**Workflow level:**
```yaml
env:
  NODE_ENV: production
  API_URL: https://api.example.com
```

**Job level:**
```yaml
jobs:
  build:
    env:
      BUILD_NUMBER: 42
    runs-on: ubuntu-latest
    steps:
      - run: echo "Build number is $BUILD_NUMBER"
```

**Step level:**
```yaml
steps:
  - name: Set custom variable
    env:
      CUSTOM_VAR: hello
    run: echo "Custom var is $CUSTOM_VAR"
```

These can be accessed via shell or expressions: 

- **Shell access:** Use `$VARIABLE_NAME` in shell scripts.
- **Expression access:** Use `${{ env.VARIABLE_NAME }}` in workflow expressions.


Additionally, you can pass data between steps or jobs as follows: 

**Step output:**
```yaml
steps:
  - id: get_sha
    run: echo "sha=${GITHUB_SHA}" >> $GITHUB_OUTPUT
```

**Job output:**
```yaml
jobs:
  build:
    outputs:
      sha: ${{ steps.get_sha.outputs.sha }}
    steps:
      - id: get_sha
        run: echo "sha=${GITHUB_SHA}" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying commit ${{ needs.build.outputs.sha }}"
```

A key thing to understand is that a job is executed on a fresh runner, so environment variables and step outputs do not persist between jobs unless explicitly passed using job outputs.  

Artifacts are an alternative way to pass data between jobs, but they are more suited for larger files or build outputs rather than simple variables.  For example: 

Artifacts are another way to share data between jobs. Unlike outputs, artifacts persist after the workflow run and can be downloaded.

```yaml
- name: Upload artifact
  uses: actions/upload-artifact@v4
  with:
    name: build-log
    path: build.log
```

> The documentation for variables is available [here](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)

## 4 — Advanced YAML Features

**Matrix builds** allow you to run a job multiple times with different combinations of parameters, such as operating systems, language versions, or custom values. This is essential for testing across environments or parallelizing tasks.

**Common use cases:**
- Test across multiple OSes (Windows, Linux, macOS)
- Build and test against several language or tool versions
- Run jobs with different input data sets

**Example:**
```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci
      - run: npm test
```

You can also use `exclude` and `include` to fine-tune which combinations are run:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest]
    node: [20, 22]
    include:
      - os: windows-latest
        node: 20
    exclude:
      - os: ubuntu-latest
        node: 22
```

### Concurrency

**Concurrency controls** prevent duplicate or overlapping workflow runs, saving resources and avoiding conflicts (e.g., multiple deployments).

**Example:**
```yaml
concurrency:
  group: ${{ github.ref }}
  cancel-in-progress: true
```
- `group`: A unique identifier for the concurrency group (often a branch or environment)
- `cancel-in-progress`: If true, cancels any in-progress runs in the same group before starting a new one

### Conditional Execution

You can use `if` expressions to run jobs or steps only when certain conditions are met. This enables dynamic workflows that respond to events, branch names, or previous job results.

**Job-level condition:**
```yaml
jobs:
  deploy:
    if: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to production"
```

**Step-level condition:**
```yaml
steps:
  - name: Run only on PRs
    if: ${{ github.event_name == 'pull_request' }}
    run: echo "This is a pull request"
```

## 5 — Lab: Advanced Workflow Syntax

In this lab, you’ll build a workflow that generates and uploads a test log, and conditionally deploys if all tests pass. You’ll use expressions, contexts, variables, outputs, matrix builds, and artifacts.

### Step 1: Create a New Workflow File

Create a file named `.github/workflows/expressions-lab.yml` in your repository.

### Step 2: Set Up a Matrix Build and Run Tests

Define a workflow that installs dependencies, runs tests, and saves the results to a log file.

```yaml
name: Advanced Workflow Lab

on: [push]

env:
  GLOBAL_ENV: "global"

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        #os: [ubuntu-latest, windows-latest]
        os: [ubuntu-latest]
        node: [20, 22]
    env:
      JOB_ENV: "job"
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: ${{ matrix.node }}
      - name: Install dependencies
        run: npm ci
      - name: Run tests and save log
        run: |
          npm test | tee test-${{ matrix.os }}-${{ matrix.node }}.log
      - name: Print context values
        run: |
          echo "Branch: ${{ github.ref }}"
          echo "Actor: ${{ github.actor }}"
          echo "OS: ${{ runner.os }}"
          echo "Node version: ${{ matrix.node }}"
          echo "Global env: $GLOBAL_ENV"
          echo "Job env: $JOB_ENV"
      - name: Dump entire github context
        run: echo '${{ toJSON(github) }}'
      - name: Save test result output
        id: save
        run: |
          if grep -q "FAIL" test.log; then
            echo "result=failure" >> $GITHUB_OUTPUT
          else
            echo "result=success" >> $GITHUB_OUTPUT
          fi
      - name: Upload test log
        uses: actions/upload-artifact@v4
        with:
          name: test-log-${{ matrix.os }}-${{ matrix.node }}
          path: test-${{ matrix.os }}-${{ matrix.node }}.log
```

The workflow runs `npm test` and saves the output to `test.log`.  The `Save test result output` step checks for failures and sets the output accordingly.  The test log is uploaded as an artifact.

### Step 3: Pass Outputs and Conditionally Deploy

Add a deploy job that only runs if all tests succeed and the branch is `main`.  Note we're not actually deploying anywhere, just simulating it.

```yaml
  deploy:
    needs: test
    if: ${{ needs.test.outputs.result == 'success' && github.ref == 'refs/heads/main' }}
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        # os: [ubuntu-latest, windows-latest]
        os: [ubuntu-latest]
        node: [20, 22]
    steps:
      - name: Download test log
        uses: actions/download-artifact@v4
        with:
          name: test-log-${{ matrix.os }}-${{ matrix.node }}
      - run: echo "Deploying to production"
```

The deploy job downloads the test log artifact from the previous job for inspection.  Deployment only happens if tests pass and the branch is `main`.

### Step 4: Add Concurrency Control

Use concurrency to prevent duplicate runs on the same branch.

```yaml
concurrency:
  group: ${{ github.ref }}
  cancel-in-progress: true
```

### Step 5: Commit, Push, and Observe

1. Commit your workflow file and push it to your repository.
2. Check the Actions tab to see the workflow run for each matrix combination.
3. Inspect the uploaded test logs and verify that deployment only occurs when tests pass on the main branch.
4. (Optional) Create multiple pushes to see concurrency in action.

## Conclusion

This lab guided you through building a CI/CD workflow to learn advanced workflow syntax including: 
* Expressions (`${{ }}`) with operators and functions
* Contexts (github, env, secrets, runner, steps, needs)
* Variables, outputs, and artifacts to share data across steps and jobs
* Advanced YAML features (matrix builds, concurrency, conditionals)

By mastering these concepts, you can create powerful, flexible workflows that adapt to your project's needs.  Experiment further by adding more complexity or integrating with other services!