# Real-Time-Chat-App Deployment Guide

This guide will help you deploy all Kubernetes resources for the Real-Time-Chat-App.

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

---

**Tips:**

- Make sure to update any placeholder values in your `chat-app-configmap.yaml` and `chat-app-secret.yaml` before deploying.
- The order matters: namespace first, then secrets/configs, then services/deployments, then ingress.
