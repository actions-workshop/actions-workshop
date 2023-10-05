# Workshop preparation: Azure web app

These instructions are for trainers preparing an Azure Account to use with the [Azure web app deployment method](./005-deployment-azure-webapp.md).

This method is particularly useful if, as a trainer, you have limited access to an Azure tenant and subscription (e.g., if your company provides the account for you) and you need to configure it using a single service principal with predefined permissions.

## 1. Prepare the Azure account

### Using the CLI

If you're the administrator of the Azure account, execute the following commands to create a service principal with the necessary permissions. Alternatively, these steps can also be performed within the Azure portal.

1. Log in to the Azure account:

    ```bash
    az login
    ```

2. Create a new service principal:

    ```bash
    az ad sp create-for-rbac --name "github-actions-workshop" --role contributor \
                              --scopes /subscriptions/{subscription-id}/ \
                              --sdk-auth
    ```

3. Define a custom role with the correct permissions:

    ```bash
    az role definition create --role-definition ./azure-role-definition.json
    ```
4. Assign the custom role to the service principal:

    ```bash
    az role assignment create --assignee "http://github-actions-workshop" \
                               --role "GitHub Actions workshop" \
                               --scope /subscriptions/{subscription-id}/
    ```

5. Take note of the following IDs and secrets for the next step:
    1. `Subscription ID`
    2. `Tenant ID`
    3. `Client ID` - This is the `appId` of the service principal
    4. `Client secret` - This is the `password` of the service principal

> **Tip:**
> If someone other than the trainer is creating the service principal and you need a secure way to transmit the secret to the trainer, consider using an [Azure key vault](https://learn.microsoft.com/en-us/azure/key-vault/general/quick-create-portal) in the same subscription.

## 2. Prepare a GitHub organization

For this scenario, it's ideal to use a GitHub organization that all participants are invited to. This way, you can securely share the service principal's credentials as [organization secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets?tool=webui#creating-encrypted-secrets-for-an-organization) without revealing them to the participants.

1. [Create a new GitHub organization](https://docs.github.com/en/organizations/collaborating-with-groups-in-organizations/creating-a-new-organization-from-scratch).
2. Navigate to **Settings** -> **Secrets and variables** -> **Actions**.
3. Create the following organization secrets using the values from the previous step:

    | Secret Name        | Value                                                    |
    | ------------------ | -------------------------------------------------------- |
    | AZ_SUBSCRIPTION_ID | The Azure subscription ID                                |
    | AZ_TENANT_ID       | The Azure tenant ID                                      |
    | AZ_CLIENT_ID       | The Azure client ID of the created service principal     |
    | AZ_CLIENT_SECRET   | The Azure client secret of the created service principal |

4. [Invite all participants to the GitHub organization](https://docs.github.com/en/organizations/managing-membership-in-your-organization/inviting-users-to-join-your-organization).
