@description('The Azure Location to create the resources in')
param location string = 'westeurope'

@description('Name for the serviceplan and webapp (defines the subdomain)')
param appName string

@description('The container image to deploy')
param containerImage string

@description('The actor (GitHUb Username) that started the deployment')
param actor string

@description('The repository that started the deployment')
param repository string

targetScope = 'subscription'

resource resourceGroup 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: '${appName}-rg'
  location: location
  tags: {
    actor: actor
    purpose: 'actions-workshop'
    repository: repository
  }
}

module webApp 'web-app.bicep' = {
  name: 'web-app'
  scope: resourceGroup
  params: {
    appName: appName
    containerImage: containerImage
    location: location
    actor: actor
    repository: repository
  }
}

output url string = webApp.outputs.url
