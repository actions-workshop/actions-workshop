# Building Custom Actions & Composite Workflows

In the past module you learned how to build reusable workflows which help standardize CI/CD processes.  In this module you will learn how to author your own custom actions and composite workflows.  This includes JavaScript-based actions and Docker-based actions.

**Composite Actions** are a way to group multiple workflow steps into a single action.  This allows you to reuse common sequences of steps without having to create a full JavaScript or Docker action.  It is called as a single step in a workflow, but runs multiple steps.  In contrast, a reusable workflow is a full workflow that is called from another workflow. 

**Javascript Actions** are custom actions written in JavaScript or Typescript that run directly on the runner.

**Docker Actions** are custom actions that run inside a Docker container.  This allows you full control over the runtime environment, but does add some overhead.

## Prerequisites
- Ideally you will complete the module on reusable workflows first, but it is not required.

---

## Part 1: Composite Workflows

Composite workflows allow you to define a workflow that can be called from other workflows.  This is useful for grouping common steps that are used in multiple workflows.  Unlike reusable workflows, composite workflows are defined as actions and are called as a single step in a job.

In this lab we will extract build and test steps from an existing workflow into a reusable composite workflow.

Take this simple workflow that builds, tests, and lints a Node.js app:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
```

Note the repeated steps for checking out the code, setting up Node.js, and installing dependencies.  We can extract these into a reusable composite workflow.

Create a file for the composite workflow at `.github/actions/setup-and-install/action.yml`.  Note the use of an action.yml file to define the composite action.  This aligns with how JavaScript and Docker actions are defined.  Use the following content:

```yaml
name: 'Setup and Install'
description: 'Checks out code, sets up Node, and installs dependencies'
inputs:
  node-version:
    description: 'Node.js version'
    required: true
runs:
  using: 'composite'
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
    - run: npm ci
```

Now create a new workflow that uses this composite action.  Create `.github/workflows/composite-call-ci.yml` with the following content:

```yaml
name: Composite CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-and-install
        with:
          node-version: '20'
      - run: npm test

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/setup-and-install
        with:
          node-version: '20'
      - run: npm run lint
```

Execute this workflow by manually triggering it with workflow dispatch.  Review the logs of the run to see how the composite action is executed as a single step, but runs multiple steps.

> Note this reduces duplication compared to defining all steps in each job and may be easier to maintain than a full reusable workflow.


## Part 2: Authoring a JavaScript Action

JavaScript actions run directly on the runner and can use the GitHub Actions Toolkit to speed development. They are fast to execute and easy to distribute via GitHub Marketplace or hosted privately in your enterprise.

In this lab we will build a simple JavaScript action that greets a user by name.

Start by creating a new folder and initializing a base action: `hello-js-action`:

```bash
mkdir hello-js-action && cd hello-js-action
npm init -y
npm install @actions/core @actions/github
```

The base of an action is the `action.yml` file which defines inputs, outputs, and the runtime.  Create this file with the following content:

```yaml
name: 'Hello JS Action'
description: 'Greets the provided name'
inputs:
  name:
    description: 'Name to greet'
    required: true
runs:
  using: 'node20'
  main: 'index.js'
```

Note that this defines inputs required, but also specified the runtime and the main script to run.

Next, create `index.js`, the main script for the action:

```javascript
const core = require('@actions/core');

async function run() {
  try {
    const name = core.getInput('name');
    core.info(`Hello ${name}!`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

Finally we can create a workflow to test our action.  In your repo add `.github/workflows/test-js-action.yml`:

```yaml
name: Test JS Action

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./hello-js-action
        with:
          name: 'World'
```

Commit and push this code to your repository.  Then manually trigger the workflow from the Actions tab.  You should see the action run and output "Hello World!" in the logs.

Note this is just a simple example to show the basics.  Typically the action would do something more useful like interacting with the GitHub API, processing files, or integrating with external services.  In addition, typically you would document common usage in a readme, tag it, and create a release to version the action to make it consumable by others.

GitHub provides templates to help you get started with actions development:
* [javascript-action template repository](https://github.com/actions/javascript-action)
* [typescript-action template repository](https://github.com/actions/typescript-action)

Also here is the link to the [GitHub Actions Toolkit](https://github.com/actions/toolkit) which provides libraries to help with common tasks like getting inputs, setting outputs, logging, and interacting with the GitHub API.

## Part 3: Authoring a Docker Action

Docker actions let you run your logic inside a container. This is useful when you need full control of the environment (specific binaries, OS, or dependencies).  It also helps if you can't update to the latest versions of runtimes available on hosted runners.  For example, GitHub no longer supports RedHat Enterprise Linux 7 runners, but you could still run RHEL 7 in a Docker action.

In this lab we will create a simple Docker action that does the same steps as the previous action.  

Create a new folder `hello-docker-action`

```bash
mkdir hello-docker-action && cd hello-docker-action
```

Within that folder, create `action.yml` similar to how we did for the JavaScript action.  Note this runs using docker and the image is defined in a Dockerfile.

```yaml
name: 'Hello Docker Action'
description: 'Greets the provided name'
inputs:
  name:
    description: 'Name to greet'
    required: true
runs:
  using: 'docker'
  image: 'Dockerfile'
```

For Docker actions you need to create both a `Dockerfile` as well as the code that is executed by the action.  Create `entrypoint.sh` with the following content:

```bash
#!/bin/sh -l
echo "Hello $1"
```

Create a `Dockerfile` to build the container with the following content:

```dockerfile
FROM alpine:3.20

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

Now that we have our Docker action defined, add a workflow to test it. Create `.github/workflows/test-docker-action.yml`:

```yaml
name: Test Docker Action

on: 
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./hello-docker-action
        with:
          name: 'World'
```

Commit and push all of this code to your repository and then manually trigger the workflow from the Actions tab.

Verify the action runs and outputs “Hello World!”

There are a few key things to call out about Docker actions: 

* The example above uses a simple shell script, but you can use any language or framework you want.  Just ensure the necessary runtime is included in the Docker image.
* By specifying `Dockerfile` in the action.yml, GitHub automatically builds the image when the action is run.  This adds some overhead to each run 
  * You can pre-build and push your image to a container registry and reference it in the action.yml.
  ```yaml
  runs:
  using: 'docker'
  image: 'ghcr.io/OWNER/REPO:TAG'
  ```
* If using a private container registry, you will need to handle authentication in your workflow before using the action.  For example, using the `docker/login-action` action to authenticate.  

## Conclusion

In this module you learned how to create composite workflows, JavaScript actions, and Docker actions.  The [GitHub Marketplace](https://github.com/marketplace?type=actions) is a great place to find and share actions. Generally start there prior to any development as there may be existing actions that meet your needs.  Just remember it is code downloaded off the internet... you have to review to make certain the action comes from a trusted source and does what is expected.  

If there is not an existing action that meets your needs you can also build and share it across your organization or the broader GitHub community.