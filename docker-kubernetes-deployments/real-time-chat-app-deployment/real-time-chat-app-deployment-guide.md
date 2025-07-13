# Real-Time-Chat-App Deployment Guide

This guide will help you deploy all Kubernetes resources for the Real-Time-Chat-App.

## Docker Compose

Restart Docker (if you're using Linux).

```bash
sudo systemctl restart docker

```

Don't forget to enable ingresses in Minikube.

```bash
minikube addons enable ingress

```

Use `docker compose` to create images.

```bash
docker compose up --build

```

Now tag the images.

```bash
docker image tag real-time-chat-app-frontend:latest <YOUR_USERNAME>/chat-frontend:latest
docker image tag real-time-chat-app-backend:latest <YOUR_USERNAME>/chat-backend:latest

```

Push them into your DockerHub.

```bash
docker push <YOUR_USERNAME>/chat-frontend:latest
docker push <YOUR_USERNAME>/chat-backend:latest

```

## Deploy

Apply the resources in the following order:

```bash
kubectl apply -f chat-app-namespace.yaml
kubectl apply -f chat-app-secret.yaml
kubectl apply -f chat-app-configmap.yaml
kubectl apply -f chat-app-backend-service.yaml
kubectl apply -f chat-app-backend-deployment.yaml
kubectl apply -f chat-app-frontend-service.yaml
kubectl apply -f chat-app-frontend-deployment.yaml
kubectl apply -f chat-app-ingress.yaml

```

## Delete

To remove all resources, run:

```bash
kubectl delete -f chat-app-secret.yaml
kubectl delete -f chat-app-configmap.yaml
kubectl delete -f chat-app-backend-service.yaml
kubectl delete -f chat-app-backend-deployment.yaml
kubectl delete -f chat-app-frontend-service.yaml
kubectl delete -f chat-app-frontend-deployment.yaml
kubectl delete -f chat-app-ingress.yaml
kubectl delete -f chat-app-namespace.yaml

```

Now access the application by this path: [https://real-time-chat-app.local](https://real-time-chat-app.local)

---

**Tips:**

- Make sure to update any placeholder values in your `chat-app-configmap.yaml` and `chat-app-secret.yaml` before deploying.
- The order matters: namespace first, then secrets/configs, then services/deployments, then ingress.
