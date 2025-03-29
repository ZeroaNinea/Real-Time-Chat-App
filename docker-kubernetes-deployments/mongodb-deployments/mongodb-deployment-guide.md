# **MongoDB Deployment Guide**

This guide explains how to deploy MongoDB and MongoDB Express using Kubernetes.

## Prerequisites
- A running Kubernetes cluster.
- `kubectl` installed and configured to interact with your cluster.

## Deploy MongoDB
1. Create a namespace and use it:
   ```sh
   kubectl apply -f mongodb-namespace.yaml
   kubens mongodb-express

   ```

2. Apply the secrets for MongoDB (stores sensitive information like username and password):
   ```sh
   kubectl apply -f mongodb-secret.yaml

   ```

3. Deploy the MongoDB database:
   ```sh
   kubectl apply -f mongodb-deployment.yaml

   ```

4. Expose MongoDB as a service:
   ```sh
   kubectl apply -f mongodb-service.yaml

   ```

## Deploy MongoDB Express (Optional)
1. Deploy the MongoDB Express admin interface:
   ```sh
   kubectl apply -f mongodb-express-deployment.yaml
   kubectl apply -f mongodb-express-service.yaml
   kubectl apply -f mongodb-express-configmap.yaml
   kubectl apply -f mongodb-express-ingress.yaml

   ```

2. Update the `hosts` file located at `C:\Windows\System32\drivers\etc\hosts` (requires administrator privileges) and add the following line:
   ```plaintext
   127.0.0.1  mongodb-express.local
   ```

3. Access MongoDB Express at [`http://mongodb-express.local`](http://mongodb-express.local).

## Verify the Deployment
- Check the status of the MongoDB pods:
  ```sh
  kubectl get pods -l app=mongodb
  ```

- Check the status of the MongoDB Express pods:
  ```sh
  kubectl get pods -l app=mongodb-express

  ```

- Access MongoDB Express at [`http://mongodb-express.local`](http://mongodb-express.local).

## Troubleshooting
- **MongoDB Express is not accessible:**
  - Ensure the `mongodb-express-ingress.yaml` file is applied correctly.
  - Verify that the `hosts` file is updated with `127.0.0.1 mongodb-express.local`.
  - Check the status of the ingress controller using:
    ```sh
    kubectl get ingress

    ```

- **Kubernetes resources not created:**
  - Ensure `kubectl` is configured correctly and connected to your cluster.
  - Check for errors in the output of `kubectl apply` commands.
