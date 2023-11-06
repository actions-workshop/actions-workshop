# Part 5 - Deployment: Azure IssueOps

In a previous lab, you used GitHub Actions to package an application into a Docker image and publish that package to the GitHub Container registry. The next step in a classic continuous delivery process is to **deploy** the application.

In this lab, you will extend the workflow to deploy the container image to [Azure Web Apps](https://azure.microsoft.com/en-us/products/app-service/web), a managed web application service in Azure that also supports container deployment.

Before deploying, you will learn how to authenticate to Azure using OIDC (OpenID Connect), an open and secure standard for authentication. OIDC eliminates the need to store secrets or credentials while still allowing secure authentication to Azure. OIDC can be used to [authenticate with many cloud providers](https://docs.github.com/en/enterprise-cloud@latest/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect), such as AWS, GCP, and others.

To gain access to the necessary Azure resources, you will need to submit a request via `IssueOps` (more on that later).

After deployment, you will set up an approval process for the environment to manage future deployments.

> **Note**
> The Azure account you will use in this workshop is provided for you, so there's no need to create one yourself.

## 1 - Request your deployment environment using IssueOps

**Note**
> IssueOps is an automation strategy that involves using GitHub Issues to trigger the execution of workflows in order to automate specific operations. This is made possible by the fact that GitHub Actions allow workflows to be initiated by issue events, such as creation, update, delete, etc.

You should have received a URL from your trainer pointing to another GitHub repository. Opening a new issue in this repository triggers an Actions workflow that sets up a complete deployment environment in Azure. This workflow will also populate some Actions variables in your workshop repository that you will need for the next step.

Generally, in the context of IssueOps, the "IssueOps repository" will be owned by an operations or security team. IssueOps allows these teams to offer a convenient method for requesting a deployment environment on-demand. This process retains their control over the automation, while ensuring both transparency and auditability throughout.

Let's now initiate our deployment environment request.

### 1.1 Request a deployment environment

1. Navigate to the URL of the deployment environment repository that you received from your trainer.
2. Click on **Issues** -> **New Issue**.
    ![Navigate to Issues page](./images/005/issue-ops-001-navigate-issue.png)
3. You will be presented with a list of [Issue Templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository). Choose **Request a Deployment Environment**.
    ![Select Issue Template](./images/005/issue-ops-002-select-issue-template.png)
4. A form will appear with a single input field. Enter your repository name along with the leading organization name (you can simply copy this from the URL of your repository - the segment after `github.com`). Submit the issue once done.
    ![Fill out Issue Template](./images/005/issue-ops-003-fill-issue-template.png)
5. A comment from the `github-actions` bot will inform you that the environment is being created. Head to the **Actions** tab of the repository to see the running workflow triggered by your issue creation.
6. Once the workflow concludes, the comment on the issue will update with a success message, signaling that you can proceed.
    ![GitHub Bot's success message](./images/005/issue-ops-004-view-issue-success-comment.png)

### 1.2 Create a new Actions variable

You have already learned how to utilize variables within a workflow. However, up to now, you have only used variables provided by GitHub itself. Now, let's learn how to add your own variables (and secrets) to define repository-specific configurations and other values that you might not want to hard-code into your workflow files.

1. Navigate to your repository's **Settings**, expand **Secrets and variables**, and select **Actions**.
    ![Navigate to Actions secrets](./images/005/issue-ops-005-navigate-secrets.png)
2. Pause here and observe that there are already some organization secrets defined: `AZ_SUBSCRIPTION_ID` and `AZ_TENANT_ID`. These secrets were created for you by your organization's administrator, allowing you to authenticate against Azure with a service principal (also known as "machine user") to execute your deployment. You can (and will) access these secrets from your workflow files under the `secrets` namespace (e.g., `secrets.AZ_CLIENT_ID`). Further details on the scopes of secrets and variables are provided below.
3. Navigate to the **Variables** tab. Note that two variables, `AZ_CLIENT_ID` and `AZ_RESOURCE_GROUP`, are already present. These were created by the IssueOps workflow in step [1.1 Request a deployment environment](#11-request-a-deployment-environment).
    ![Click on New repository variable](./images/005/issue-ops-006-navigate-variables.png)
4. Click on **New repository variable**. Name the variable `AZ_APP_NAME` and provide a value of your choice, preferably your repository's name (since the app name needs to be unique across all Azure web services, choose something distinctive). Click on **Add variable** once finished.
    ![Create a new variable](./images/005/issue-ops-007-create-az-app-name.png)
5. Review the finalized variables. These will be accessible in your Actions workflows under the `vars` scope (e.g., `${{ vars.AZ_APP_NAME }}`), and you will use them in the steps that follow.
   ![Final variables](./images/005/issue-ops-008-final-variables.png)

<details>
  <summary>(optional) Understand Azure and the provided secrets and variables</summary>

- `AZ_TENANT_ID`: An Azure tenant essentially represents the Azure account itself. This ID indicates the specific Azure account we will be logging into and deploying our app to later on.
- `AZ_SUBSCRIPTION_ID`: In Azure, a subscription functions as a billing unit, meaning that all associated resources will be billed based on the information linked to the subscription. Everything deployed to Azure must exist within a subscription, so you can view it as a top-level organizational mechanism.
- `AZ_CLIENT_ID`: The "client ID" is akin to the username of the machine user granted access through the OIDC configuration. There are other authentication methods (e.g., using certificates or passwords) supported by GitHub, but they're outside the scope of this workshop.
- `AZ_RESOURCE_GROUP`: A resource group in Azure is a container for various services. It allows you to group together related services and also to set permissions specific to that resource group for service principals. For instance, in this lab, you will only have access to the resource group specifically created for you and provided as a variable.

</details>

### 1.3 Scopes of secrets and variables

Secrets and variables can be defined across three distinct scopes:

1. **Environment**: Secrets and variables within this scope are only accessible for jobs that specify an `environment`. Environments can be protected, making this scope an excellent choice for restricting the use of these variables. Additionally, it can make workflows versatile for various environments like deployment targets by reusing identical variable names. You will delve deeper into environments in this lab.

2. **Repository**: Secrets and variables at this scope are available in all workflows of the repository. They are suitable for general secrets and variables you want to use or reuse across the repository.

3. **Organization**: Secrets and variables within this scope can be accessed in all workflows across all repositories of the organization. This is especially beneficial for defining secrets and variables used across multiple repositories, such as a shared deployment account, as seen in this workshop.

Once a job starts, all the scopes merge into the `secrets` namespace for secrets and the `vars` namespace for variables.

If two variables from different scopes share the same name, the one from the scope with the higher precedence is used. The precedence order is: **Environment** > **Repository** > **Organization**.
For instance, if you have a secret at the organization level named `SECRET` with the value `Organization`, and another with the same name in your repository with the value `Repository`, using `${{ secrets.SECRET }}` in your workflow will yield the value `Repository`.

## 2 - Extend the workflow to deploy to staging

Time to put everything into action with a real deployment. In previous labs, you built the application and packaged it into a container image, which was then published to the GitHub Container registry. To launch the application, you need to run this container image. Multiple methods exist to achieve this, such as through Azure Container Instances, Azure Web Apps for Linux, or within a Kubernetes cluster like Azure Kubernetes Services (AKS). Additionally, Azure offers a managed web app service known as Azure Web Apps, capable of running container instances. For this workshop, you will deploy the container image to Azure Web Apps.

A recommended best practice for deployments involves defining resources via code (Infrastructure as Code or IaC). This project comes equipped with [Bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview?tabs=bicep) scripts that detail the entire infrastructure. However, alternatives like Terraform can also be used for that purpose.

### 2.1 Utilizing Infrastructure as Code (IaC)

You can find the Bicep file for deployment at [`/infra/web-app/web-app.bicep`](../infra/web-app/web-app.bicep).

> **Note**: The `main.bicep` file in the `infra` folder can be disregarded for this workshop. It caters to another type of deployment and isn't relevant here.

To set up the necessary infrastructure services and deploy the application, you will use the Azure command-line interface (`az cli`). Soon, you will integrate this step into the workflow. Before that, though, it's essential to make the package publicly accessible.

### 2.2 Publish the package

While it's generally not recommended to make container images public (unless you're working with open-source code), you will do so for this lab's simplicity. In a real-world scenario, the package would remain private, and you would need to provide Azure with the necessary registry credentials to access the container images.

1. Head to your repository's main page and click on **Packages**. Search for the relevant package and open it.

2. Click the **Package settings** button at the bottom right of the page:

    ![Click on Package settings](images/005/package-settings-button.png)

3. Scroll down to the bottom of the page and click on **Change visibility**:

    ![Click change visibility](images/005/danger-zone.png)

4. Change the visibility to **Public**, enter the repository's name, and hit the confirm button:

    ![Confirm your changes](images/005/change-visibility.png)

### 2.3 Integrate the deployment step into the workflow

It's now time to adjust the workflow, integrating automation for the application's deployment.

Open the `node.js.yml` file. Right after the `package-and-publish` job, insert the following job:

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

Keep in mind that you must set [explicit permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token) for the `GITHUB_TOKEN`. This is because the `id-token: write` permission is necessary to request the OIDC JWT ID token.

```yml
    permissions:
      id-token: write
      contents: read
```

Finally, you must include an [`output`](https://docs.github.com/en/actions/using-jobs/defining-outputs-for-jobs) in your `package-and-publish` job to retrieve the container image name from the registry. This will be utilized during the Azure deployment to configure the container hosting.

```yml
     runs-on: ubuntu-latest
     outputs:
       container: ${{ steps.meta.outputs.tags }}
```

<details>
<summary>Click here to see what the full workflow file should look like</summary>

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

The new job performs the following tasks:

- Targets an environment named `staging`. This approach simplifies the process of understanding what is deployed and where. It also provides a direct link to the target within GitHub.
- Determines the URL of the environment by examining the outputs from the `Deploy resources` step. This step reads the output parameter of the Bicep file.
- Checks out the code to access the Infrastructure as Code files.
- Logs into Azure using the provided secrets from your organization.
- Invokes the `azure/arm-deploy` action to deploy the application to Azure. This is done by passing in the main template and additional parameters, including the `appName` you provided as an Actions variable.

Commit the file changes to trigger the workflow to run.

### 2.4 Navigate to the staging environment

1. After the workflow run completes, you should see a link in the **Deploy to Staging** job in the workflow visualization graph:

    ![Deployment success](images/005/deploy-success.png)

2. Click on the link to open the application running in Azure!

    ![Running app](images/005/running-app.png)

## 3 - Set up required approval for the staging environment

Now that the deployment is functioning, you might want to introduce a manual approval process.

1. Navigate to your repository **Settings**, then click on **Environments**, then select **staging**:

    ![Configure staging](images/005/click-env.png)

2. Ensure the **Required reviewers** option is selected, and add yourself as a reviewer.
3. Click **Save protection rules** to confirm your changes:

    ![Configure staging](images/005/approvers.png)

4. (Optional) Explore other environment options such as **Wait timers** and **Deployment branches**. The latter setting allows you to specify which branches can deploy to this environment.
5. The next time you push code, the workflow will pause at the **Deploy to Staging** job and wait for manual approval before executing the subsequent job steps.

## Conclusion

In this lab, you have learned how to:

- 👏 Utilize [Actions secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) and [Actions variables](https://docs.github.com/en/actions/learn-github-actions/variables) to store sensitive information and/or configuration values, and understand their scopes.
- 👏 Employ Infrastructure as Code to simplify deployments.
- 👏 Set up secure, secret-less authentication to Azure via OIDC.
- 👏 Set up an environment and designate approvers for best deployment practices.

This marks the conclusion of our workshop. We hope you found it enlightening and had a ton of fun along the way!
