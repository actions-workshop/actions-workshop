@description('Specifies the name of the container app environment.')
param name string

@description('Specifies the location of the container app environment - not all regions are supported.')
param location string

@description('Specifies the Log Analytics Workspace customer Id.')
param lawCustomerId string

@description('Specifies the Log Analytics Workspace id.')
param lawId string

@description('Specifies the Log Analytics Workspace apiVersion.')
param lawApiVersion string

resource appEnv 'Microsoft.App/managedEnvironments@2022-03-01' = {
  name: name
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: lawCustomerId
        sharedKey: listKeys(lawId, lawApiVersion).primarySharedKey
      }
    }
  }
}

@description('The ID of the container app environment.')
output id string = appEnv.id
