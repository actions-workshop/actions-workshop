@description('Specifies the location for the workspace.')
param location string

@description('Specifies the name of the workspace.')
param name string

resource law 'Microsoft.OperationalInsights/workspaces@2020-10-01' = {
  name: name
  location: location
  properties: any({
    retentionInDays: 30
    features: {
      searchVersion: 1
    }
    sku: {
      name: 'PerGB2018'
    }
  })
}

@description('The Log Analytics Workspace customerId.')
output customerId string = law.properties.customerId

@description('The Log Analytics Workspace id.')
output id string = law.id

@description('The Log Analytics Workspace apiVersion.')
output apiVersion string = law.apiVersion