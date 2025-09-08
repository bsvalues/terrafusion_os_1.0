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
  namespace = "monitoring"
}

resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = local.namespace
    labels = {
      name = local.namespace
      environment = var.environment
    }
  }
}

resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "55.5.0"
  
  values = [
    yamlencode({
      prometheus = {
        prometheusSpec = {
          retention = "30d"
          storageSpec = {
            volumeClaimTemplate = {
              spec = {
                accessModes = ["ReadWriteOnce"]
                resources = {
                  requests = {
                    storage = "100Gi"
                  }
                }
              }
            }
          }
        }
      }
      
      grafana = {
        adminPassword = var.grafana_admin_password
        persistence = {
          enabled = true
          size = "10Gi"
        }
        dashboardProviders = {
          dashboardproviders = {
            apiVersion = 1
            providers = [
              {
                name = "terrafusion"
                orgId = 1
                folder = ""
                type = "file"
                disableDeletion = false
                editable = true
                options = {
                  path = "/var/lib/grafana/dashboards/terrafusion"
                }
              }
            ]
          }
        }
        dashboards = {
          terrafusion = {
            "ai-swarm-overview" = {
              json = file("${path.module}/dashboards/ai-swarm-overview.json")
            }
            "terrafusion-performance" = {
              json = file("${path.module}/dashboards/terrafusion-performance.json")
            }
            "quantum-metrics" = {
              json = file("${path.module}/dashboards/quantum-metrics.json")
            }
          }
        }
      }
      
      alertmanager = {
        alertmanagerSpec = {
          retention = "120h"
          storage = {
            volumeClaimTemplate = {
              spec = {
                accessModes = ["ReadWriteOnce"]
                resources = {
                  requests = {
                    storage = "10Gi"
                  }
                }
              }
            }
          }
        }
      }
    })
  ]
  
  depends_on = [kubernetes_namespace.monitoring]
}

resource "helm_release" "fluentbit" {
  name       = "fluentbit"
  repository = "https://fluent.github.io/helm-charts"
  chart      = "fluent-bit"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "0.20.0"
  
  values = [
    yamlencode({
      config = {
        service = {
          parsers = {
            docker = {
              format = "json"
              time_key = "time"
              time_format = "%Y-%m-%dT%H:%M:%S.%L"
            }
            cri = {
              format = "regex"
              regex = "^(?<time>[^ ]+) (?<stream>stdout|stderr) (?<logtag>[^ ]*) (?<message>.*)$"
              time_key = "time"
              time_format = "%Y-%m-%dT%H:%M:%S.%L%z"
            }
          }
        }
        
        inputs = {
          tail = {
            path = "/var/log/containers/*.log"
            parser = "docker"
            tag = "kube.*"
            mem_buf_limit = "5MB"
            skip_long_lines = "On"
          }
        }
        
        filters = {
          kubernetes = {
            match = "kube.*"
            kube_url = "https://kubernetes.default.svc:443"
            kube_tag_prefix = "kube.var.log.containers."
            merge_log = "On"
            k8s_logging_parser = "On"
            k8s_logging_exclude = "On"
            use_kubelet = "On"
            kubelet_port = "10250"
            regex_parser = "On"
            regex = "^(?<pod_name>[a-z0-9](?:[-a-z0-9]*[a-z0-9])?(?:\\.[a-z0-9](?:[-a-z0-9]*[a-z0-9])?)*)_(?<namespace_name>(?:[^_]+_)*[^_]+)_(?<container_name>.+)-(?<docker_id>[a-z0-9]{64})\\.log$"
          }
        }
        
        outputs = {
          loki = {
            match = "kube.*"
            host = "loki-gateway"
            port = "80"
            labels = "job=fluentbit"
            label_keys = "$kubernetes['namespace_name'],$kubernetes['pod_name'],$kubernetes['container_name']"
            remove_keys = "kubernetes,stream,time,tag,logtag,time_received,time_nano,time_nano_sec,time_sec,time_tz,time_tz_offset,time_tz_sec,time_tz_min,time_tz_hour,time_tz_day,time_tz_month,time_tz_year,time_tz_isdst,time_tz_name,time_tz_abbr,time_tz_utc,time_tz_local,time_tz_gmt,time_tz_est,time_tz_pst,time_tz_cst,time_tz_mst,time_tz_hst,time_tz_akst,time_tz_ast,time_tz_brst,time_tz_brt,time_tz_cet,time_tz_cest,time_tz_eet,time_tz_eest,time_tz_gmt,time_tz_ist,time_tz_jst,time_tz_msk,time_tz_pdt,time_tz_pst,time_tz_utc,time_tz_wet,time_tz_west,time_tz_z,time_tz_utc,time_tz_local,time_tz_gmt,time_tz_est,time_tz_pst,time_tz_cst,time_tz_mst,time_tz_hst,time_tz_akst,time_tz_ast,time_tz_brst,time_tz_brt,time_tz_cet,time_tz_cest,time_tz_eet,time_tz_eest,time_tz_gmt,time_tz_ist,time_tz_jst,time_tz_msk,time_tz_pdt,time_tz_pst,time_tz_utc,time_tz_wet,time_tz_west,time_tz_z"
          }
        }
      }
    })
  ]
  
  depends_on = [kubernetes_namespace.monitoring]
}

resource "helm_release" "loki" {
  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  version    = "5.41.0"
  
  values = [
    yamlencode({
      loki = {
        auth_enabled = false
        commonConfig = {
          path_prefix = "/var/loki"
          replication_factor = 1
        }
        storage = {
          filesystem = {
            chunks_directory = "/var/loki/chunks"
            rules_directory = "/var/loki/rules"
          }
        }
        schema_config = {
          configs = [
            {
              from = "2020-10-24"
              store = "boltdb-shipper"
              object_store = "filesystem"
              schema = "v11"
              index = {
                prefix = "index_"
                period = "24h"
              }
            }
          ]
        }
      }
      
      gateway = {
        enabled = true
        replicas = 2
      }
    })
  ]
  
  depends_on = [kubernetes_namespace.monitoring]
}

resource "kubernetes_config_map" "prometheus_rules" {
  metadata {
    name      = "prometheus-rules"
    namespace = kubernetes_namespace.monitoring.metadata[0].name
  }
  
  data = {
    "ai-swarm-rules.yaml" = yamlencode({
      groups = [
        {
          name = "ai-swarm"
          rules = [
            {
              alert = "AISwarmHighErrorRate"
              expr = "rate(ai_swarm_errors_total[5m]) > 0.1"
              for = "5m"
              labels = {
                severity = "warning"
              }
              annotations = {
                summary = "AI Swarm high error rate detected"
                description = "AI Swarm is experiencing {{ $value }} errors per second"
              }
            },
            {
              alert = "AISwarmLowPerformance"
              expr = "ai_swarm_performance_score < 0.8"
              for = "10m"
              labels = {
                severity = "critical"
              }
              annotations = {
                summary = "AI Swarm performance degraded"
                description = "AI Swarm performance score is {{ $value }}"
              }
            }
          ]
        }
      ]
    })
  }
  
  depends_on = [kubernetes_namespace.monitoring]
}
