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
