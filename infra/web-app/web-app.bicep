@description('The Azure location to create the resources in')
param location string = 'westeurope'

@description('Name for the serviceplan and webapp (defines the subdomain)')
param appName string

@description('The container image to deploy')
param containerImage string

@description('The actor (GitHUb username) that started the deployment')
param actor string

@description('The repository that started the deployment')
param repository string

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-plan'
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  tags: {
    actor: actor
    purpose: 'actions-workshop'
    repository: repository
  }
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  kind: 'app,linux,container'
  tags: {
    actor: actor
    purpose: 'GitHub Actions workshop'
    repository: repository
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      appSettings: [
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
        {
          name: 'DOCKER_REGISTRY_SERVER_URL'
          value: 'https://ghcr.io'
        }
        {
          name: 'WEBSITES_PORT'
          value: '8080'
        }
      ]
    }
  }
}

output url string = 'https://${appName}.azurewebsites.net'
