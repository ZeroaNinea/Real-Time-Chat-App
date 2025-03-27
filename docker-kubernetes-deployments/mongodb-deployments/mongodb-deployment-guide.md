# **MongoDB Deployment Guide**

Go to the [`mongodb`](./mongodb/) directory and run these commands:

```sh
kubectl apply -f mongodb-secret.yaml
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f mongodb-service.yaml

```

Now go to the [`mongodb-express`](./mongodb-express/) directory and run these commands:

```sh
kubectl apply -f mongodb-express-deployment.yaml
kubectl apply -f mongodb-express-service.yaml
kubectl apply -f mongodb-express-configmap.yaml
kubectl apply -f mongodb-express-ingress.yaml

```

Then edit the `hosts` file located at `C:\Windows\System32\drivers\etc\hosts` and add the following line:

```plaintext
127.0.0.1  mongodb-express.local
```

And now you can access MongoDB Express at `http://mongodb-express.local`.
