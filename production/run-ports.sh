#!/bin/bash

# Namespace (change if you are not using default)
NAMESPACE=default

# Path to our Kubernetes manifests
MANIFESTS_DIR=.

echo "Applying Kubernetes manifests from $MANIFESTS_DIR..."
kubectl apply -f $MANIFESTS_DIR

echo "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l io.kompose.service=frontend -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=ready pod -l io.kompose.service=backend -n $NAMESPACE --timeout=120s
kubectl wait --for=condition=ready pod -l io.kompose.service=syncserver -n $NAMESPACE --timeout=120s

# Kill any existing session with the same name
tmux kill-session -t k8s-forwards 2>/dev/null

echo "Starting tmux session for port-forwards..."
# Start a new tmux session with the first port-forward
tmux new-session -d -s k8s-forwards -n frontend "kubectl port-forward svc/frontend 80:80 -n $NAMESPACE"

# Add new windows for other services
tmux new-window -t k8s-forwards -n backend "kubectl port-forward svc/backend 8000:8000 -n $NAMESPACE"
tmux new-window -t k8s-forwards -n syncserver "kubectl port-forward svc/syncserver 8080:8080 -n $NAMESPACE"

# Attach to tmux
tmux attach -t k8s-forwards
