# Part 5 - Deployment

In a previous lab, you used GitHub Actions to package the application into a Docker image and publish the package to the GitHub Container Registry. The next step in a classical **Continuous Delivery Process** is to **deploy** your application.

In this lab you will extend the workflow to deploy the container image to [Azure Container Apps](https://azure.microsoft.com/en-gb/products/container-apps/), a managed Kubernetes service in Azure.

Before you deploy, you will learn how to authenticate to Azure using OIDC (Open ID Connect), an open, secure standard for authentication. OIDC removes the need for you to store secrets or credentials and still authenticate securely to Azure. OIDC can be used to [authenticate with many Cloud Providers](https://docs.github.com/en/enterprise-cloud@latest/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect) like AWS, GCP and others. Once you have deployed, you will configure an approval on the Environment for future deployments.

## 1 - Create a federated credential

In this step you will need to log in to your Azure account. You will then:

- create a new service principal (SP)
- create a federated credential to authenticate GitHub Actions workflows
- assign the `Contributor` role to the SP for a subscription.
- record the SP information in your GitHub repo

### Create an Azure Service principle (SP)

> **Note**: To perform this step you will require at least `Contributor` access to your Azure Active Directory.

You will now create a Service Principal (SP) or App Registration. This is like a "service account" that you can assign roles and permissions to.

1. Open the [Azure Portal](https://portal.azure.com) in a browser and log in.
1. In the search bar at the top of the page, enter `active directory` and then click on **Azure Active Directory**:
  
    ![Navigate to Azure Active Directory](images/005/navigate-active-directory.png)

1. In the left menu, click on **App Registrations**. Click on **+ New registration** to create a new SP:

    ![Create a new App Registration](images/005/new-app-registration.png)

1. Enter a name for the SP, leave the rest of the fields as default and click **Register**:

    ![Register the new App](images/005/app-registration-details.png)

### Create Federated Credentials for Actions from your repo

You will now create a federated (OIDC) credential. This credential will be authenticated only if the request comes from your repo and from an environment named `staging`. No other scenario will be authenticated.

1. Click on the SP to navigate to its settings. Click on **Certificates & Secrets**. Click on **Federated credentials** and then click the **+ Add credential** button:

    ![Add a new credential](images/005/add-credential.png)

1. In **Federated credential scenario**, select `GitHub Actions deploying Azure resources`.
1. In **Organization** enter your GitHub organization name - or if you are using a personal account, enter your handle name here.
1. In **Repository** enter the name of your repo.
1. Under **Entity type** select `Environment`.
1. Enter `staging` for the **GitHub environment name**.
1. In the **Credential details** section, enter `Staging` as the **Name**.
1. Click **Add** to create the credential:

    ![Add a federated credential](images/005/federated-creds.png)

1. Now click back on **Overview** and note down the **Application (client) ID** and **Directory (tenant) ID**:

    ![Record client and tenant IDs](images/005/app-registration-overview.png)

### Assign Roles to the SP

Now that you have an SP that can be used by Actions in your repo targeting the `staging` environment, you must give the SP permissions to create Resources and Resource Groups in a subscription. For this workshop, you will assign the `Contributor` role to the SP.

1. In the search bar at the top of the page, enter `sub` and click on **Subscriptions**:

    ![Navigate to subscriptions](images/005/navigate-subscriptions.png)

1. Click on the subscription you want to give the SP permissions to.
1. Click on **Access control (IAM)**, then click **+ Add** at the top of the menu and select **Add role assignment**:

    ![Add role assignment](images/005/add-role-assignment.png)

1. Select `Contributor` in the list of roles and click **Next**:

    ![Select the Contributor role](images/005/select-contributor.png)

1. Click **+ Select members** and type in the name of your SP. Click on the SP in the list and click **Select**:

    ![Select the SP](images/005/select-sp.png)

1. In the overview, ensure that everything is correct. _Save the subscription ID for later_ and then click **Review and assign**:

    ![Complete role assignment](images/005/complete-role-assignment.png)

1. Make sure the role assignment is completed successfully.

### Record IDs as Secrets in your repo

You now have an SP that will allow your workflows to create/update/delete resources in a subscription in Azure. Now you will record the IDs that you need for the OIDC to work during a workflow, namely the Tenant ID, the Subscription ID and the Client ID (of the SP). Note how we are not storing any passwords or tokens!

The IDs are not strictly "secret" since they cannot be used without a token or client secret. However, we will store them as secrets in the repo for convenience.

1. Navigate to your repo and click on the **Settings** tab. In the left menu, expand **Secrets** and click **Actions**. Click on **New repository secret**:

    ![Create a new repo secret](images/005/new-secret.png)

1. Enter the following secrets from the values you recorded earlier:

    | Name                  | Value               |
    | --------------------- | ------------------- |
    | `ARM_CLIENT_ID`       | The SP client ID    |
    | `ARM_SUBSCRIPTION_ID` | The subscription ID |
    | `ARM_TENANT_ID`       | The tenant ID       |

    ![Add the secret](images/005/add-secret.png)

1. When you have finished, your secrets should look something like this:

    ![Secrets in the repo](images/005/repo-secrets.png)

## 2 - Extend the Workflow to deploy to staging

In the previous labs, you built the application and packaged it into a container image published to GitHub Container Registry. To run the application, you need to run the container image. This can be done in a number of ways, such as Azure Container instances or Azure Web Apps for Linux, or hosted in a Kubernetes cluster such as Azure Kubernetes Services (AKS). Azure also provides a managed Kubernetes service called Azure Container Apps that can run container instances. For this workshop, you will deploy the container image to Azure Container Apps.

You could navigate to the portal and create an Azure Container App and point it to your Packages in GitHub - but a better practice is to describe the resources using code (Infrastructure as Code). This project has some [Bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview?tabs=bicep) scripts, but Terraform would also work.

### Infrastructure as Code

The Bicep files for the deployment are in the `/infra` folder in the repo. There are 4 files:

| File                              | Description                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `container-app-environment.bicep` | Specifies the compute SKU for the container application                                                             |
| `container-app.bicep`             | Specifies the app itself - including which image(s) to run and whether or not the application is exposed externally |
| `law.bicep`                       | Log analytics workspace for diagnostics                                                                             |
| `main.bicep`                      | The main infrastructure file which invokes the other files to create the full environment                           |

To provision the infrastructure services and deploy the application, you can invoke the Azure CLI (`az cli`). You will shortly modify the workflow to add this step. However, first you need to make the Package feed public.

### Make the Package public

It is not best practice to make the container images public, unless you are developing open source code. However, to simplify this lab you are going to do so. In "real life" you can leave the Package feed private and would simply add the registry credentials to the Azure resource so that Azure can pull the container images.

1. Navigate to your GitHub repo page and click on **Packages**. Locate the Package and open it.
1. On the bottom right, click the **Package Settings** button:

    ![Click on Package settings](images/005/package-settings-button.png)

1. Scroll to the bottom of the page and click on **Change visibility**:

    ![Click change visibility](images/005/danger-zone.png)

1. Change the visibility to **Public**, type in the name of the repo and click the confirm button:

    ![Confirm the change](images/005/change-visibility.png)

### Modify the Workflow

You can now modify the workflow to automate the deployment of the application.

Open the `node.js.yml` file. After the `package-and-publish` job, add the following job:

```yml
  staging:
    name: Deploy to Staging
    needs: [ package-and-publish ]
    runs-on: ubuntu-latest
    permissions:
        contents: read
        id-token: write
    environment:
      name: staging
      url: "https://${{ steps.deploy.outputs.fqdn }}"

    steps:
      - uses: actions/checkout@v2

      - name: Log in to Azure using OIDC
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.ARM_CLIENT_ID }}
          tenant-id: ${{ secrets.ARM_TENANT_ID }}
          subscription-id: ${{ secrets.ARM_SUBSCRIPTION_ID }}

      - name: Deploy resources
        uses: azure/arm-deploy@v1
        id: deploy
        with:
          scope: subscription
          region: eastus
          template: ./infra/main.bicep
          parameters: "containerImage=${{ needs.package-and-publish.outputs.container }} env=staging"
```

Note that, again, you need to set [explicit permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token) for the `GITHUB_TOKEN` as `id-token: write` permissions are required to request the OIDC JWT ID token.

```yml
    permissions:
        id-token: write
        contents: read
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
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

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
        cache: 'npm'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
    - name: 'Report Coverage'
      if: always() # Also generate the report if tests are failing
      uses:  davelosert/vitest-coverage-report-action@v1
      with:
        vite-config-path: vite.config.ts
  
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
        uses: docker/build-push-action@v2
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
           
  staging:
    name: Deploy to Staging
    needs: [ package-and-publish ]
    runs-on: ubuntu-latest
    permissions:
        contents: read
        id-token: write
    environment:
      name: staging
      url: "https://${{ steps.deploy.outputs.fqdn }}"

    steps:
      - uses: actions/checkout@v2

      - name: Log in to Azure using OIDC
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.CLIENT_ID }}
          tenant-id: ${{ secrets.TENANT_ID }}
          subscription-id: ${{ secrets.SUBSCRIPTION_ID }}

      - name: Deploy resources
        uses: azure/arm-deploy@v1
        id: deploy
        with:
          scope: subscription
          region: eastus
          template: ./infra/main.bicep
          parameters: "containerImage=${{ needs.package-and-publish.outputs.container }} env=staging"
```

</details>

The new job performs the following:

- Targets and environment called `staging` - this is important because the federated (OIDC) credential you created earlier will only authorize this workflow if the `environment` matches.
- Determines the URL of the environment by examining the outputs of the `Deploy resources` step, which in turn is reading the output parameter of the Bicep file.
- Checks out the code to get access to the Infrastructure as Code files.
- Logs into Azure using the IDs you saved as secrets - no password required!
- Invokes the `azure/arm-deploy` Action to deploy the application to Azure, passing in the region, main template and additional parameters.

Check in the file - this should trigger the workflow to run.

### Navigating to the Environment

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

## Cleaning Up

If you want to clean up the resources in Azure, follow these steps:

1. Navigate to the Azure Portal
2. Click on Azure Active Directory and search for the Service Principal you created. Delete it.
3. Click on Resource Groups and find the Resource Group called something like `rg-octocollector-staging`.
4. Ensure that this is the Resource Group that contains your Azure Container App.
5. If this is the correct Resource Group, delete it.

## Conclusion

In this lab you learned how to set up secure, secret-less authentication to Azure using OIDC. You then added a job to deploy the application to Azure using Bicep (infrastructure as code). You also configured rules for the environment to enforce good practices.
