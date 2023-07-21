# Workshop Prepration: Azure Web App

These are the instructions for Trainers to prepare an Azure Account for usage with the [Azure WebApp Deployment Method](./005-deployment-azure-webapp.md).

This method is particular useful if you as a trainer only have limited Access to an Azure Tenant and subscription (e.g. if your company is providing the account for you) and you have to make it work with a single Service Principal with predefined permissions.

## 1. Prepare the Azure Account

### Using the CLI

As administrator of the Azure Account, execute the following commands to create a Service Principal with the required permissions. Of course, all of these steps can also be conducted from within the Azure Portal.

1. Log in to the Azure Account

    ```bash
    az login
    ```

2. Create a new Service Principal

    ```bash
    az ad sp create-for-rbac --name "github-actions-workshop" --role contributor \
                              --scopes /subscriptions/{subscription-id}/ \
                              --sdk-auth
    ```

3. Create a custom role with the correct permissions

    ```bash
    az role definition create --role-definition ./azure-role-definition.json
    ```

4. Assign the custom role to the Service Principal

    ```bash
    az role assignment create --assignee "http://github-actions-workshop" \
                               --role "GitHub Actions Workshop" \
                               --scope /subscriptions/{subscription-id}/
    ```

5. Note the following Ids and Secrets for the next step:
    1. The `Subscription Id`
    2. The `Tenant Id`
    3. The `Client Id` - This is the `appId` from the Service Principal
    4. The `Client Secret` - This is the `password` from the Service Principal. *Tipp: If you need to share this secret in a safe manner, you an Azure KeyVault in the same subscription.*

> **Info:**
> In case it is not the Trainer creating the Service Principal, and you are looking for a safe way to transmit the secret to the Trainer, you could make use of an [Azure KeyVault](https://learn.microsoft.com/en-us/azure/key-vault/general/quick-create-portal) in the same Subscription.

## 2. Prepare a GitHub Organization

For this scenario, it is best to use a GitHub Organisation that all participants are invited to, as you then can safely share the Service Principal's secrets as [Organization Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets?tool=webui#creating-encrypted-secrets-for-an-organization) without ever revealing them to the participants.

1. [Create a new GitHub Organization](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/creating-a-new-organization-from-scratch)
2. Go to `Settings` -> `Secrets and variables` -> `Actions`
3. Create the following organization secrets with the values from the previous step:

    | Secret Name        | Value                                                    |
    | ------------------ | -------------------------------------------------------- |
    | AZ_SUBSCRIPTION_ID | The Azure Subscription ID used above                     |
    | AZ_TENANT_ID       | The Azure Tenant ID used above                           |
    | AZ_CLIENT_ID       | The Azure Client ID of the created service principal     |
    | AZ_CLIENT_SECRET   | The Azure Client Secret of the created service principal |

4. [Invite all participants to the GitHub Organization](https://docs.github.com/en/organizations/managing-membership-in-your-organization/inviting-users-to-join-your-organization)
