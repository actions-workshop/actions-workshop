// general Azure Container App settings
@description('Specifies the location for the container app.')
param location string

@description('Specifies the name for the container app.')
param name string

@description('Specifies the id of the container app environment.')
param containerAppEnvironmentId string

@description('Specifies the container image.')
param containerImage string

@description('Set to true to expose the container externally.')
param useExternalIngress bool = false

@description('Specifies the container port to expose.')
param containerPort int = 4000

@description('Specifies the environment variables for the container.')
param envVars array = []

resource containerApp 'Microsoft.App/containerApps@2022-03-01' = {
  name: name
  location: location
  properties: {
    managedEnvironmentId: containerAppEnvironmentId
    configuration: {
      ingress: {
        external: useExternalIngress
        targetPort: containerPort
      }
    }
    template: {
      containers: [
        {
          image: containerImage
          name: name
          env: envVars
        }
      ]
      scale: {
        minReplicas: 0
      }
    }
  }
}

@description('The FQDN of the container app.')
output fqdn string = containerApp.properties.configuration.ingress.fqdn
