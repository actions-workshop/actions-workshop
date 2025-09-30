# Reusable Workflows: DRY, Modular & Composable Automations

As your GitHub Actions usage grows, you’ll often find yourself repeating similar jobs across multiple workflows or even multiple repositories. This can quickly become hard to maintain.

**Reusable workflows** allow you to centralize shared logic once, and call it from many other workflows. This follows the principle of DRY (Don't Repeat Yourself) and allows you to keep your pipelines consistent, easier to update, and easier to scale across teams.

A typical pattern is for a devops or platform team to create a shared set of *golden* pipelines that developer teams can consume.  This ensures consistency and best practices across the organization and minimizes duplicated effort.


## 1 — Creating and calling a reusable workflow

A reusable workflow is a workflow that uses the special trigger `workflow_call` to allow it to be called from other workflows.

Create a new file in your repository called `.github/workflows/reusable-build-and-test.yml`:

```yaml
name: Reusable Build and Test

on:
  workflow_call:
    inputs:
      node_version:
        description: 'Version of Node.js'
        required: true
        type: string
      run_tests:
        description: 'Whether to run tests'
        required: false
        default: true
        type: boolean
    secrets:
      NPM_TOKEN:
        required: false
    outputs:
      test_result:
        description: 'Result of tests'
        value: ${{ jobs.build_and_test.outputs.test_result }}

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: ${{ inputs.node_version }}
      - run: npm ci
      - if: ${{ inputs.run_tests }}
        run: npm test
      - name: Set output
        id: result
        run: echo "test_result=success" >> $GITHUB_OUTPUT
    outputs:
      test_result: ${{ steps.result.outputs.test_result }}
```

This is just doing a simple build and test.  Now call this reusable workflow from another workflow in the same repo.

Create a new workflow `.github/workflows/call-reusable-ci.yml`:

```yaml
name: Call CI Reusable Workflow

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  do-build-test:
    uses: ./.github/workflows/reusable-build-and-test.yml
    with:
      node_version: '24'
      run_tests: true
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

  post-check:
    needs: do-build-test
    runs-on: ubuntu-latest
    steps:
      - run: echo "Test result was ${{ needs.do-build-test.outputs.test_result }}"
```

Commit and push both files.  This should trigger the `Call CI Reusable Workflow`.  Notice how it calls the reusable workflow, passes in inputs, and runs the steps inline with the rest of the workflow.

> Tip: When calling a reusable workflow in the same repo, use the relative path (`./.github/workflows/...`).
When calling from another repo, use:
`org/repo/.github/workflows/workflow.yml@ref`

## 2 — Cross-Repo Reusable Workflows

While using the same repo for testing is convenient, reusable workflows can live in dedicated shared repos and be versioned.  This is the recommended approach for sharing workflows across multiple repositories.  The caller repo must have read access to the shared repo.  This is easily achieved if using internal repositories.  

Example calling a reusable workflow from another repo:
```yaml
jobs:
  build-matrix:
    uses: my-org/shared-workflows/.github/workflows/matrix-build.yml@v1.2.3
    with:
      node_versions: ['22', '24']
      os: ['ubuntu-latest', 'windows-latest']
    secrets:
      GITHUB_TOKEN: ${{ secrets.MY_GITHUB_TOKEN }}
```

## 3 - Inputs, Secrets, and Outputs

Reusable workflows can accept inputs and secrets, and return outputs to the caller.

* Inputs are defined on the called workflow under  `on: workflow_call:`.  If an input is required, the caller must provide it or the workflow will fail.
* Secrets are also defined under `on: workflow_call:`.  The caller can pass secrets similar to inputs, one by one.  Alternatively the caller can pass all secrets using `secrets: inherit` to forward all secrets from the caller to the called workflow.
* Outputs are defined under `jobs.<job_id>.outputs:`.

Lets test these features!  Create a new reusable workflow `.github/workflows/reusable-build-and-test-2.yml`:

```yaml
name: Reusable Build and Test 2

on:
  workflow_call:
    inputs:
      node_version:
        description: 'Version of Node.js'
        required: true
        type: string
      custom_message:
        description: 'A custom message to print'
        required: false
        default: 'Hello from reusable workflow!'
        type: string
    secrets:
      NPM_TOKEN:
        required: false
      API_KEY:
        required: false
    outputs:
      test_result:
        description: 'Result of tests'
        value: ${{ jobs.build_and_test.outputs.test_result }}

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: ${{ inputs.node_version }}
      - run: npm ci
      - run: echo "${{ inputs.custom_message }}"
      - run: |
          if [ -n "${{ secrets.NPM_TOKEN }}" ]; then
            echo "NPM_TOKEN is set and will be used for authentication."
          else
            echo "NPM_TOKEN is not set."
          fi
      - name: Set output
        id: result
        run: echo "test_result=success" >> $GITHUB_OUTPUT
    outputs:
      test_result: ${{ steps.result.outputs.test_result }}
```

> Any time you see `workflow_call`, think "reusable workflow".

Next, create a caller workflow that passes input and secrets, and uses the output.  

Create the file called `.github/workflows/call-reusable-ci-2.yml`:

```yaml
name: Call CI Reusable Workflow 2


on:
  workflow_dispatch:

jobs:
  do-build-test:
    uses: ./.github/workflows/reusable-build-and-test-2.yml
    with:
      node_version: '24'
      custom_message: 'This is a custom message from the caller workflow!'
    secrets: inherit
    # Alternatively, pass secrets one by one:
    #secrets:
    #  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    #  API_KEY: ${{ secrets.API_KEY }}

  post-check:
    needs: do-build-test
    runs-on: ubuntu-latest
    steps:
      - run: echo "Test result was ${{ needs.do-build-test.outputs.test_result }}"
```

Now create a secret in your repo called `NPM_TOKEN`.  Go to your repository’s Settings > Secrets and variables > Actions. It doesn't need to be a real token, just any value for testing.

Commit and push both workflow files to the `main` branch.

Trigger the workflow manually from the Actions tab using the "Run workflow" button.

Once complete, check the logs of the `do-build-test` job.  You should see your custom message printed, and confirmation that the `NPM_TOKEN` secret was received.  You should also see the `post-check` job print the test result output from the reusable workflow.

## 4 — Best Practices and Caveats

When building reusable workflows, consider the following best practices:

* **Pin versions:** Always reference shared workflows by tag or SHA to enable effective versioning and rollback.
* **Minimize surface:** Only expose needed inputs and secrets.  Pass secrets one by one.  If many or all secrets are needed, use `secrets: inherit`. 
* **Document usage:** Add a README or other documentation in the reusable workflows repo for awareness on how to use the workflow
* **Test changes:** Test changes in a branch before updating the tag
* **Monitor and log:** Ensure reusable workflows have enough logging to troubleshoot

A few caveats to be aware of:

* **No direct runs:** Reusable workflows cannot be run directly.  They must be called from another workflow.
* **Limited contexts:** Only `github`, `inputs`, and `secrets` contexts are available in the called workflow.  You cannot access `env`, `jobs`, `steps`, or `runner` contexts from within the called workflow.
* **No own secrets:** Reusable workflows cannot have their own secrets.  They must be passed from the caller.
* **Nesting limits:** Maximum nesting depth of 4 levels.  Meaning a reusable workflow can call another reusable workflow up to 4 levels deep.
* **10 input limit:** A maximum of 10 inputs can be defined for any workflow.  Consider passing json inputs from the caller and parsing them in the called workflow if you need more complex data.
* **Observability:** You cannot directly measure the amount of times your reusable workflow has been called.  You must look at the caller workflows to measure usage.

GitHub is aware of some of these limitations such as input and nesting depth limits and may address them in future updates.

## Conclusion

Reusable workflows are a powerful feature in GitHub Actions that help you enforce consistency, reduce duplication, and scale automation across teams and repositories. By centralizing shared logic, passing inputs and secrets, and returning outputs, you can build modular CI/CD pipelines that are easier to maintain and evolve.

With reusable workflows, your organization can accelerate development, improve security, and ensure best practices are followed everywhere. Start refactoring your existing workflows and consider creating a shared repository to maximize the benefits.

Happy automating!