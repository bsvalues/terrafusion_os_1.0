terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

locals {
  namespace = "argocd"
}

resource "kubernetes_namespace" "argocd" {
  metadata {
    name = local.namespace
    labels = {
      name = local.namespace
      environment = var.environment
    }
  }
}

resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  namespace  = kubernetes_namespace.argocd.metadata[0].name
  version    = "5.51.6"
  
  values = [
    yamlencode({
      server = {
        extraArgs = [
          "--insecure"
        ]
        ingress = {
          enabled = true
          annotations = {
            "kubernetes.io/ingress.class" = "nginx"
            "cert-manager.io/cluster-issuer" = "letsencrypt-prod"
          }
          hosts = [
            "argocd.${var.domain}"
          ]
          tls = [
            {
              secretName = "argocd-server-tls"
              hosts = [
                "argocd.${var.domain}"
              ]
            }
          ]
        }
      }
      
      repoServer = {
        resources = {
          limits = {
            cpu = "1000m"
            memory = "1Gi"
          }
          requests = {
            cpu = "250m"
            memory = "256Mi"
          }
        }
      }
      
      applicationSet = {
        enabled = true
      }
      
      notifications = {
        enabled = true
      }
      
      dex = {
        enabled = false
      }
      
      rbac = {
        create = true
        pspEnabled = false
      }
    })
  ]
  
  depends_on = [kubernetes_namespace.argocd]
}

resource "kubernetes_config_map" "argocd_apps" {
  metadata {
    name      = "argocd-apps"
    namespace = kubernetes_namespace.argocd.metadata[0].name
  }
  
  data = {
    "terrafusion-apps.yaml" = yamlencode({
      apiVersion = "argoproj.io/v1alpha1"
      kind = "Application"
      metadata = {
        name = "terrafusion-apps"
        namespace = local.namespace
      }
      spec = {
        project = "default"
        source = {
          repoURL = var.git_repo_url
          targetRevision = "HEAD"
          path = "k8s/terrafusion"
        }
        destination = {
          server = "https://kubernetes.default.svc"
          namespace = "terrafusion"
        }
        syncPolicy = {
          automated = {
            prune = true
            selfHeal = true
          }
          syncOptions = [
            "CreateNamespace=true"
          ]
        }
      }
    })
    
    "terrafusion-ai-swarm.yaml" = yamlencode({
      apiVersion = "argoproj.io/v1alpha1"
      kind = "Application"
      metadata = {
        name = "terrafusion-ai-swarm"
        namespace = local.namespace
      }
      spec = {
        project = "default"
        source = {
          repoURL = var.git_repo_url
          targetRevision = "HEAD"
          path = "k8s/ai-swarm"
        }
        destination = {
          server = "https://kubernetes.default.svc"
          namespace = "ai-swarm"
        }
        syncPolicy = {
          automated = {
            prune = true
            selfHeal = true
          }
          syncOptions = [
            "CreateNamespace=true"
          ]
        }
      }
    })
    
    "terrafusion-monitoring.yaml" = yamlencode({
      apiVersion = "argoproj.io/v1alpha1"
      kind = "Application"
      metadata = {
        name = "terrafusion-monitoring"
        namespace = local.namespace
      }
      spec = {
        project = "default"
        source = {
          repoURL = var.git_repo_url
          targetRevision = "HEAD"
          path = "k8s/monitoring"
        }
        destination = {
          server = "https://kubernetes.default.svc"
          namespace = "monitoring"
        }
        syncPolicy = {
          automated = {
            prune = true
            selfHeal = true
          }
          syncOptions = [
            "CreateNamespace=true"
          ]
        }
      }
    })
  }
  
  depends_on = [kubernetes_namespace.argocd]
}

resource "kubernetes_secret" "argocd_git_credentials" {
  metadata {
    name      = "argocd-git-credentials"
    namespace = kubernetes_namespace.argocd.metadata[0].name
  }
  
  data = {
    url = var.git_repo_url
    username = var.git_username
    password = var.git_password
  }
  
  type = "Opaque"
  
  depends_on = [kubernetes_namespace.argocd]
}
