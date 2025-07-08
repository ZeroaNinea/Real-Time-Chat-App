# Real-Time-Chat-App Deployment Guide

To deploy:

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

To delete:

```bash
kubectl delete -f chat-app-namespace.yaml
kubectl delete -f chat-app-secret.yaml
kubectl delete -f chat-app-configmap.yaml
kubectl delete -f chat-app-backend-service.yaml
kubectl delete -f chat-app-backend-deployment.yaml
kubectl delete -f chat-app-frontend-service.yaml
kubectl delete -f chat-app-frontend-deployment.yaml
kubectl delete -f chat-app-ingress.yaml

```
