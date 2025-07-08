# Real-Time-Chat-App Deployment Guide

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
