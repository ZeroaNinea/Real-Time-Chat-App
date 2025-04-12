# **Redis Deployment Guide**

This guide explains how to deploy Redis and Redis Commander using Kubernetes.

## Prerequisites

- A running Kubernetes cluster.
- `kubectl` installed and configured to interact with your cluster.

## Deploy Redis

1. Create a namespace for Redis and Redis Commander:

   ```bash
   kubectl apply -f redis-namespace.yaml

   ```

2. Create a secret to store the password:

   ```bash
   kubectl apply -f redis-secret.yaml

   ```

3. Create a PVC to store the database data:

   ```bash
   kubectl apply -f redis-pvc.yaml

   ```

4. Apply the deployment:

   ```bash
   kubectl apply -f redis-deployment.yaml

   ```

5. Apply the service:

   ```bash
   kubectl apply -f redis-service.yaml

   ```

## Deploy Redis Commander

1. Deploy Redis Commander:

   ```bash
   kubectl apply -f redis-commander-deployment.yaml

   ```

2. Deploy Redis Commander service:

   ```bash
   kubectl apply -f redis-commander-service.yaml

   ```

3. Deploy the ingress:

   ```bash
   kubectl apply -f redis-commander-ingress.yaml

   ```
