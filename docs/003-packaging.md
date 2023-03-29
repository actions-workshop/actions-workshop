# Part 3 - Packaging

In the previous lab, you have use GitHub Actions to create a Continuous Integration (CI) workflow. The next step in a classical **Continous Delivery Process** is to **package and release** your application.

In this lab you will extend the workflow you have created to package the application as a Container Image and publish it inside GitHub Container Registry.

Optionally, you can then **deploy** the application in an environment of your choice, for example Azure Kubernetes Service (AKS). As the deployment is highly individual to your specific requirements, we only give guidance but do not have concrete examples.

## 1 - Using the visualization graph

Every workflow run generates a real-time graph that illustrates the run progress. You can use this graph to monitor and debug workflows. The graph displays each job in the workflow. An icon to the left of the job name indicates the status of the job. Lines between jobs indicate dependencies.

## 2 - Dependent jobs

By default, the jobs in your workflow all run in parallel at the same time. So if you have a job that must only run after another job has been completed, you can use the `needs` keyword to create this dependency. If one of the jobs fails, all dependent jobs are skipped; however, if you need the jobs to continue, you can define this using the if conditional statement. In this example, the build, and publish-container jobs run in series, with publish-container dependent on the successful completion of the job that precedes it:

```yml
jobs:
  build:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      # Build node application
      - ...
        ...
  publish-container:
    # Depends of build
    needs: build
    runs-on: ubuntu-latest
    steps:
      # Build and publish Docker
      - ...
        ...
```

## 3 - Package your Application as Container

For the delivery, you will have to do the following steps:

1. Create a new Job that depends of the `build` job
2. Add steps to build and publish a container image.

When you are building workflows and you need to do specific tasks you should always look into the GitHub Marketplace to see if an action exists to do it.

#### GitHub Marketplace

1. Go in GitHub Marketplace: <https://github.com/marketplace>
2. Search for "Docker"
3. Scroll down to the `Actions` section

You can see many actions related to Docker, for this lab you will use the following actions:

- [Docker Login](https://github.com/marketplace/actions/docker-login): to connect to GitHub Container Registry (<https://ghcr.io>)
- [Build and push Docker images](https://github.com/marketplace/actions/build-and-push-docker-images)

### 3.1 - Edit the workflow

1. Edit the file `.github/workflows/node.js.yml`, and add the `package-and-publish` job so the YAML File looks like below:

    ```yaml
    name: Packaging

    on:
      push:
        branches: [ "main" ]
      pull_request:
        branches: [ "main" ]
      workflow_dispatch: 
      
    jobs:
      build:
        name: "Build and Test"
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
            cache: 'npm'
        - run: npm ci
        - run: npm run build --if-present
        - run: npm test
        
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

2. Commit the `.github/workflows/node.js.yml` file.

3. The workflow will automatically start on Push and the workflow will do the full CI process.

4. Look into the Workflow Runs and inspect the "Build and Publish Container Image" logs.

## 4 - The GITHUB_TOKEN

As you might have noticed, in the `package-and-publish` job in the workflow file above, we are using the [`GITHUB_TOKEN`](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret) to sign in to the GitHub Container Registry and push the generated docker image.

```yaml
        - name: Sign in to GitHub Container Registry
          uses: docker/login-action@v2
          with:
            username: ${{ github.actor }}
            password: ${{ secrets.GITHUB_TOKEN }}
            registry: ghcr.io
```

You have heard of the `GITHUB_TOKEN` in [Part 02 - Basics of CI with Actions](002-basics-of-ci-with-actions.md) already when we were talking about the `permissions` of a workflow.

These permissions are not just magically applied to a workflow, but they are actually passed to the `GITHUB_TOKEN`, which conveniently gets stored for you as a default `secret`. Think of the `GITHUB_TOKEN` as a combination of username & password that grants access to GitHub Resources.

Most actions (e.g. the `davelosert/vitest-coverage-report-action`) use this token by default, so you don't have to actually specify it.

Other Actions like the `docker/login-action` however require you to specifically pass it down through the Action's input parameters - and, in these situations, you can easily access it through the `secrets`-context as seen above with `${{ secrets.GITHUB_TOKEN }}`.

### Limits of the GITHUB_TOKEN

Note that the permissions that can be granted to the `GITHUB_TOKEN` are limited to the scope of the repository of the Actions Workflow itself. That suffices for a lot of use-cases - but sometimes, you will want to access and / or change something in another repository or even on the organization level.

This scenario is out of scope for this workshop, but if you are interested in how to solve this, you have two options:

1. Create a [Personal Access Token (PAT)](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with elevated permissions that you then provide to the GitHub Workflow by [storing it in a Repository Secret](https://docs.github.com/en/enterprise-cloud@latest/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository)
2. Create and install a [GitHub Application](https://docs.github.com/en/enterprise-cloud@latest/apps/maintaining-github-apps/installing-github-apps) in your organization and then use the [Workflow Application Token Action](https://github.com/peter-murray/workflow-application-token-action) to generate a short-lived token during the workflow run

## 5 - Find your image in GitHub Container Registry

1. Go to your project main page

2. Click on the **Packages** link in the right menu

3. Click on your container

![](../images/img-037.png)

## Conclusion

In this lab you have learned how to :

- 👏 Build and Publish a Container Image using GitHub Actions
- 👏 Make use of the `GITHUB_TOKEN`
- 👏 Navigate to GitHub Packages

---

Next :

- **[Security](004-security.md)**
