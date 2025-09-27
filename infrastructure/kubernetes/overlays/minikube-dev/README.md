# Minikube Overlay for Terrafusion Local Development

This overlay provides Minikube-compatible Kubernetes manifests and
configurations for running the full Terrafusion stack locally, with:

- NodePort and Ingress for easy service access
- Local persistent volumes for databases
- Optional mock/external service stubs

## Usage

1. Start Minikube:
   ```bash
   minikube start --cpus=4 --memory=8g
   ```
2. Enable ingress:
   ```bash
   minikube addons enable ingress
   ```
3. Apply the overlay:
   ```bash
   kubectl apply -k kubernetes/overlays/minikube-dev
   ```
4. Access services:
   - Use `minikube service list` or `minikube tunnel` for NodePort/Ingress URLs.

## Next Steps

- Add `kustomization.yaml` and service manifests for your stack.
