@description('Specifies the environment for the resources.')
param env string = 'staging'

@description('Specifies the location for resource group.')
param location string = 'southcentralus'

@description('Specifies the location of the container app environment - not all regions are supported.')
param containerAppEnvLocation string = 'eastus'

@description('Specifies the name prefix of the container app.')
param containerAppName string = 'octocollector'

@description('Specifies the name of the container image.')
param containerImage string

@description('Specifies the container port.')
param containerPort int = 8080

// ============================
targetScope = 'subscription'

resource rg 'Microsoft.Resources/resourceGroups@2021-01-01' = {
  name: 'rg-octocollector-${env}'
  location: location
}

var lawName = 'law-${env}'
var containerAppEnvName = 'cappenv${env}'

module law 'law.bicep' = {
  scope: rg
  name: 'law'
  params: {
    location: location
    name: lawName
  }
}

module containerAppEnvironment 'container-app-environment.bicep' = {
  scope: rg
  name: 'container-app-environment'
  params: {
    name: containerAppEnvName
    location: containerAppEnvLocation
    lawCustomerId: law.outputs.customerId
    lawId: law.outputs.id
    lawApiVersion: law.outputs.apiVersion
  }
}

module containerApp 'container-app.bicep' = {
  scope: rg
  name: 'container-app'
  params: {
    name: containerAppName
    location: containerAppEnvLocation
    containerAppEnvironmentId: containerAppEnvironment.outputs.id
    containerImage: containerImage
    containerPort: containerPort
    envVars: []
    useExternalIngress: true
  }
}

@description('FQDN of the container app.')
output fqdn string = containerApp.outputs.fqdn
