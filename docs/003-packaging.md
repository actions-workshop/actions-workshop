# Part 3 - Packaging

In the previous lab, you used GitHub Actions to create a continuous integration (CI) workflow. The next step in a classical continuous delivery process is to **package and release** your application.

In this lab, you will extend the workflow you created to package the application as a container image and publish it to the GitHub Container Registry.

Optionally, you can then deploy the application to an environment of your choice, for example, Azure Kubernetes Service (AKS). As the deployment is highly individual to your specific requirements, we provide only guidance and do not offer concrete examples.

## 1 - Using the visualization graph

Every workflow run generates a real-time graph that illustrates the run progress. You can use this graph to monitor and debug workflows. The graph displays each job in the workflow. An icon to the left of the job name indicates the status of the job. Lines between jobs represent dependencies.

## 2 - Dependent jobs

By default, the jobs in your workflow run in parallel at the same time. If you have a job that must run only after another job has completed, you can use the `needs` keyword to create this dependency. If one of the jobs fails, all dependent jobs are skipped; however, if you want the jobs to continue, you can define this using the `if` conditional statement. In the following example, the `build` and `publish-container` jobs run in series, with `publish-container` dependent on the successful completion of `build`:

```yml
jobs:
  build:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      # Build Node application
      - ...
        ...
  publish-container:
    needs: build
    runs-on: ubuntu-latest
    steps:
      # Build and publish Docker image
      - ...
        ...
```

## 3 - Package your application as a container image

For delivering your application, you will need to complete the following steps:

1. Create a new job that depends on the `build` job.
2. Add steps to build and publish a container image.

When building workflows, you should always check the GitHub Marketplace to see if certain actions can perform some of the workflow steps for you.

#### GitHub Marketplace

1. Visit the GitHub Marketplace: <https://github.com/marketplace>
2. Search for "Docker".
3. Scroll down to the **Actions** section.

You will find many actions related to Docker. For this lab, you will use the following actions:

- [Docker Login](https://github.com/marketplace/actions/docker-login): to connect to the GitHub Container Registry (<https://ghcr.io>).
- [Build and push Docker images](https://github.com/marketplace/actions/build-and-push-docker-images).

### 3.1 - Edit the workflow

1. Edit the file `.github/workflows/node.js.yml`, and add the `package-and-publish` job so the file looks like this:

    ```yaml
    name: Packaging

    on:
      push:
        branches: [ main ]
      pull_request:
        branches: [ main ]
      workflow_dispatch:

    jobs:
      build:
        name: Build and Test
        runs-on: ubuntu-latest
        permissions:
          contents: read
          pull-requests: write
        steps:
        - uses: actions/checkout@v3
        - name: Use Node.js 16.x
          uses: actions/setup-node@v3
          with:
            node-version: 16.x
            cache: npm
        - run: npm ci
        - run: npm run build --if-present
        - run: npm test
        - name: Report Coverage
          uses: davelosert/vitest-coverage-report-action@v2
          if: always()

      package-and-publish:
        needs:
          - build

        name: 🐳 Package & Publish
        runs-on: ubuntu-latest
        permissions:
          contents: read
          packages: write

        steps:
          - uses: actions/checkout@v3

          - name: Set up Docker Buildx
            uses: docker/setup-buildx-action@v2

          - name: Sign in to GitHub Container Registry
            uses: docker/login-action@v2
            with:
              username: ${{ github.actor }}
              password: ${{ secrets.GITHUB_TOKEN }}
              registry: ghcr.io

          - name: Generate Docker Metadata
            id: meta
            uses: docker/metadata-action@v4
            with:
              images: ghcr.io/${{ github.repository }}
              tags: |
                type=ref,event=tag
                type=ref,event=pr
                type=sha,event=branch,prefix=,suffix=,format=short

          - name: Build and Push Docker Image
            uses: docker/build-push-action@v2
            with:
              push: true
              tags: ${{ steps.meta.outputs.tags }}
              labels: ${{ steps.meta.outputs.labels }}
              cache-from: type=gha
              cache-to: type=gha,mode=max
    ```

2. Commit the changes to `.github/workflows/node.js.yml`.

3. Upon pushing, the workflow will automatically start and carry out the full CI process.

4. Review the workflow runs and inspect the "Build and Publish Container Image" logs.

## 4 - The GITHUB_TOKEN

As you may have noticed in the `package-and-publish` job of the workflow file mentioned above, we use the [`GITHUB_TOKEN`](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret) to sign in to the GitHub Container Registry and push the generated Docker image.

```yaml
        - name: Sign in to GitHub Container Registry
          uses: docker/login-action@v2
          with:
            username: ${{ github.actor }}
            password: ${{ secrets.GITHUB_TOKEN }}
            registry: ghcr.io
```

You may recall the `GITHUB_TOKEN` from [Part 02 - Basics of CI with Actions](002-basics-of-ci-with-actions.md) when we discussed the permissions of a workflow.

These permissions aren't automatically applied to a workflow; they are actually passed to the `GITHUB_TOKEN`, which is conveniently stored for you as a default `secret`. Think of the `GITHUB_TOKEN` as a combination of a username and password that grants access to GitHub resources.

Many actions, like `davelosert/vitest-coverage-report-action`, use this token by default, so you typically don't have to specify it.

However, some actions, such as `docker/login-action`, require you to explicitly pass the token through the action's input parameters. In these cases, you can easily access it using the `secrets` context, as demonstrated above with `${{ secrets.GITHUB_TOKEN }}`.

### Limits of the GITHUB_TOKEN

Note that the permissions that can be granted to the `GITHUB_TOKEN` are limited to the scope of the repository where the Actions workflow is running. While this is sufficient for many use cases, there are times when you might want to access or modify something in another repository or even at the organization level.

This scenario is beyond the scope of this workshop, but if you're interested in addressing this, you have two options:

1. Create a [personal access token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the necessary permissions, and then provide it to the GitHub Actions workflow by [storing it as a repository secret](https://docs.github.com/en/enterprise-cloud@latest/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).
2. Create and install a [GitHub App](https://docs.github.com/en/enterprise-cloud@latest/apps/maintaining-github-apps/installing-github-apps) in your organization, and then use the [workflow application token action](https://github.com/peter-murray/workflow-application-token-action) to generate a short-lived token during the workflow run.

## 5 - Locate your image in the GitHub Container Registry

1. Navigate to your project's main page.
2. Click on the **Packages** link on the right menu.
3. Select your container.

![](../images/img-037.png)

## Conclusion

In this lab, you have learned how to:

- 👏 Build and publish a container image using GitHub Actions.
- 👏 Make use of the `GITHUB_TOKEN`.
- 👏 Navigate to GitHub Packages.

---

Next:

- **[Security](004-security.md)**
