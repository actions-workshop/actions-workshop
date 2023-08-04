# Part 5 - Deployment

In a previous lab, you used GitHub Actions to package the application into a Docker image and publish the package to the GitHub Container Registry. The next step in a classical **Continuous Delivery Process** is to **deploy** your application.

In this lab you will extend the workflow to deploy the container image to [Azure Web Apps](https://azure.microsoft.com/en-us/products/app-service/web), a managed Web Application Service that also allows to deploy Containers in Azure.

Before you deploy, you will learn how to authenticate to Azure using OIDC (Open ID Connect), an open, secure standard for authentication. OIDC removes the need for you to store secrets or credentials and still authenticate securely to Azure. OIDC can be used to [authenticate with many Cloud Providers](https://docs.github.com/en/enterprise-cloud@latest/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect) like AWS, GCP and others.

To request this access, you will use something called `Issue Ops` - a neat way to use GitHub Issues to trigger actions and do certain operations.

Once you have deployed, you will configure an approval on the Environment for future deployments.

> **Note**
> The Azure Account you will be using in this workshop is provided for you, so you don't have to create one yourself.

## 1 - Request your Deployment Environment using Issue Ops

Issue Ops is a term coined by GitHub to describe a way to use GitHub Issues to trigger actions and do certain operations.

In this Lab, we will use this functionality to request access to Azure for your demo-repository.

tbd.

### 1.2 Create a new Action Variable

You have already learned to how utilize variables from within a workflow. But so far, we you were only  using variables that are provided to you by GitHub itself. Let's learn how you can add your own variables (and secrets) to make it easier to define repository-specific configurations and other values that you might not want to hard-code into your workflow files.

1. Navigate to your repositorie's `Settings`, unfold `Secrets and variables` and select `Actions`
    ![Navigate to Actions Secrets](images/005/navigate-to-actions-secrets.png)

2. Let's stop here for a second and recognize that there are already some `Organization secrets` defined (`AZ_SUBSCRIPTION_ID`, `AZ_TENANT_ID`). These are secrets created for you by your Organization's administrator and they will allow you to authenticate against Azure with a Service Principal (alias Machine User) to conduct your deployment. You can (and will) access those secrets from within your workflow files under the `secrets`-namespace (so e.g. `secrets.AZ_CLIENT_ID`). You can read more on the scopes of secrets and variables below.

3. Navigate to the `Variables` tab and click on `New repository variable`

    ![Navigate to New repository variable](images/005/navigate-to-variables.png)

4. Use `APP_NAME` as the Name of the variable and provide a value of your choice - preferrably your repositorie's name (as the Appname needs to be unique for all of Azure Web Services, choose something not too simple). Click on `Add variable` once you are done.
    ![Create a new variable](images/005/create-new-variable.png)

Now you have created a variable that will be accessible from all workflows within this repository as `${{ vars.APP_NAME }}` - and we will make use of this in our deployment workflow.

<details>
  <summary>(optional) Understand Azure and the provided secrets</summary>
  
- **AZ_TENANT_ID**: An Azure Tenant is basically the Azure Account itself. So this ID specifies into which Azure Account we are supposed to login and deploy our App to later.
- **AZ_SUBSCRIPTION_ID**: In Azure, a Subscription is a billing unit, meaning that all resources defined beneath it will be billed with the information provided on the subscription. Everything you deploy into azure must be within a subscription - so you can also view it as a Top-Level Grouping Mechanism.
- **AZ_CLIENT_ID**: The `ClientId` is something like the Username of the machine users that was given Access through the OIDC Configuration. There are other ways of authentication (e.g. with Certificates or Passwords) which are also supported by GitHub, but out of scope of this workshop.
  
</details>

### 1.2 Scopes of secrets and variables

As you saw, both variables and secrets can be defined on 3 different scopes:

1. `Environment`: Secrets and variables under this scope are only accessible for jobs that define an `environment`. Environments can be protected, so using this scope is a great way to lock down usage of these variables - but also to make workflows dynamically usable for different environments like deployment targets by reusing the same variable-names. You will learn more about environments in this lab. Environments can be a great way to
2. `Repository`: Secrets and variables defined here are accessible in all workflows of the repository, so they are great for general secrets and variables that you want to use or reuse.
3. `Organization`: Secrets and variables defined here are accessible in all workflows of all repositories of the organization. This is a great way to define secrets and variables that are used across multiple repositories, e.g. for a shared deployment account, as we are doing it in this workshop.

Once a job is executed, all scopes are accumulated into the `secrets` namespace for Secrets and the `vars` namespace for variables.

If two variables from different scopes have the same name, the variable from the scope with the highest precedence is used. The precedence order is the same as above, so `Environment` > `Repository` > `Organization`.

That means if you have a secret on your organization with the name `SECRET` and value `Organization`, and one with the same name in your repository with the value `Repository`, using `${{ secrets.SECRET }}` in your workflow will result in the value `Repository`.

## 2 - Extend the Workflow to deploy to staging

So let's get real and finally come to a deployment. In the previous labs, you built the application and packaged it into a container image published to GitHub Container Registry. To run the application, you need to run the container image. This can be done in a number of ways, such as Azure Container instances or Azure Web Apps for Linux, or hosted in a Kubernetes cluster such as Azure Kubernetes Services (AKS). Azure also provides a managed Web App service called Azure Web Apps that can also run container instances. For this workshop, you will deploy the container image to Azure Web Apps.

A best practice when it comes to deployments is to describe the resources using code (Infrastructure as Code). This project has some [Bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview?tabs=bicep) scripts that describe the entire infraustrcture, but something like Terraform would also work.

### 2.1 Use Infrastructure as Code

The Bicep file for the deployment is [`/infra/web-app/web-app.bicep`](../infra/web-app/web-app.bicep).

To provision the infrastructure services and deploy the appcation, you can invoke the Azure CLI (`az cli`). You will shortly modify the workflow to add this step. However, first you need to make the Package feed public.

> **Note**
> You can ignore the other file `main.bicep` in the `infra` folder. It is used by another deployment type and out of scope for this workshop.

### 2.2 Add the deployment step to workflow

You can now modify the workflow to automate the deployment of the application.

Open the `node.js.yml` file. After the `package-and-publish` job, add the following job:

```yml
    staging:
      name: Deploy to Staging
      needs: [package-and-publish]
      runs-on: ubuntu-latest
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      permissions:
        contents: read
        id-token: write
      environment:
        name: staging
        url: "${{ steps.deploy.outputs.url }}"
      steps:
        - uses: actions/checkout@v2

        - name: Log in to Azure using OIDC
          uses: azure/login@v1
          with:
            client-id: ${{ vars.AZ_CLIENT_ID }}
            tenant-id: ${{ secrets.AZ_TENANT_ID }}
            subscription-id: ${{ secrets.AZ_SUBSCRIPTION_ID }}

        - name: Deploy resources
          uses: azure/arm-deploy@v1
          id: deploy
          with:
            scope: resourcegroup
            region: westeurope
            template: ./infra/web-app/web-app.bicep
            resourceGroupName: ${{ vars.AZ_RESOURCE_GROUP }}
            parameters: "location=westeurope appName=${{ vars.AZ_APP_NAME }} containerImage=${{ needs.package-and-publish.outputs.container }} actor=${{ github.actor }} repository=${{ github.repository }}"
```

Lastly you need to add an [output](https://docs.github.com/en/actions/using-jobs/defining-outputs-for-jobs) to your `package-and-publish` job to get the name of the container image from your registry. This is being used in the Azure deployment to set up the Container hosting.

```yml
     runs-on: ubuntu-latest
     outputs:
      container: ${{ steps.meta.outputs.tags }}
```

<details>
<summary>Check this for an example for the full workflow file</summary>

```yml
name: Node.js CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  build:
    name: "Build and Test"
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 16.x
          cache: "npm"
      - run: npm ci
      - run: npm run build --if-present
      - run: npm test
      - name: "Report Coverage"
        if: always()
        uses: davelosert/vitest-coverage-report-action@v2

  package-and-publish:
    needs:
      - build
    name: 🐳 Package & Publish
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      container: ${{ steps.meta.outputs.tags }}

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

      - name: Generate docker metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=tag
            type=ref,event=pr
            type=sha,event=branch,prefix=,suffix=,format=short
      - name: Build and Push Docker Image
        uses: docker/build-push-action@v4
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  staging:
    name: Deploy to Staging
    needs: [package-and-publish]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      id-token: write
    environment:
      name: staging
      url: "${{ steps.deploy.outputs.url }}"
    steps:
      - uses: actions/checkout@v2

      - name: Log in to Azure using OIDC
        uses: azure/login@v1
        with:
          client-id: ${{ vars.AZ_CLIENT_ID }}
          tenant-id: ${{ secrets.AZ_TENANT_ID }}
          subscription-id: ${{ secrets.AZ_SUBSCRIPTION_ID }}

      - name: Deploy resources
        uses: azure/arm-deploy@v1
        id: deploy
        with:
          scope: resourcegroup
          region: westeurope
          template: ./infra/web-app/web-app.bicep
          resourceGroupName: ${{ vars.AZ_RESOURCE_GROUP }}
          parameters: "location=westeurope appName=${{ vars.AZ_APP_NAME }} containerImage=${{ needs.package-and-publish.outputs.container }} actor=${{ github.actor }} repository=${{ github.repository }}"
```

</details>

The new job performs the following:

- Targets an environment called `staging` - this makes it easier to get an overview of what is deployed where, and have a link to the target right in GitHub.
- Determines the URL of the environment for this by examining the outputs of the `Deploy resources` step, which in turn is reading the output parameter of the Bicep file.
- Checks out the code to get access to the Infrastructure as Code files.
- Logs into Azure using the provided Secrets from your organization.
- Invokes the `azure/arm-deploy` Action to deploy the application to Azure, passing in main template and additional parameters including the `appName` that you provided as Action Variable.

Check in the file - this should trigger the workflow to run.

### 2.4 Navigating to the Environment

1. Once the workflow run completes, you should see a link in the **Deploy to staging** job in the visualizer:

    ![Deployment success](images/005/deploy-success.png)

1. Click on the link to open the application running in Azure!

    ![Running app](images/005/running-app.png)

## 3 - Configuring an Approval on the Environment

Now that the deployment is working, you may want to enforce a manual approval.

1. Navigate to the GitHub repo and click on **Settings**. Click on **Environments** and then click `staging`:

    ![Configure staging](images/005/click-env.png)

1. Ensure that **Required reviewers** is selected and add yourself as a reviewer.
1. Click **Save protection rules** to save your changes:

    ![Configure staging](images/005/approvers.png)

1. (Optional) You can also see the other environment options such as **Wait timers** and **Deployment branches** that let you specify which branches can be deployed to this environment.
1. The next time you push code, the workflow will pause on the **Deploy to Staging** job to wait for approval before executing the job steps.

## Conclusion

In this lab you learned how creatge action variables, and used them to deploy your application to a cloud provider. You also configured rules for the environment to enforce good practices.

- 👏 About Action [Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) and [Variables](https://docs.github.com/en/actions/learn-github-actions/variables) to store sensitive information and / or configuration values as well as their scopes
- 👏 How to use Infrastructre as Code to make deployments a breeze
- 👏 How to use actions to login and deploy to Azure
- 👏 Create an environment and configure approvers for good deployment pracitces

That also concludes this workshop. We hope you enjoyed it and learned something new!
