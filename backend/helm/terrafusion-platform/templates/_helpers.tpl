{{/*
============================================================================
TerraFusion Platform - Helm Template Helpers
Government. Transcended. - Reusable Template Functions
============================================================================
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "terrafusion-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "terrafusion-platform.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "terrafusion-platform.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "terrafusion-platform.labels" -}}
helm.sh/chart: {{ include "terrafusion-platform.chart" . }}
{{ include "terrafusion-platform.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
terrafusion.io/platform: "complete"
terrafusion.io/environment: {{ .Values.global.environment | quote }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "terrafusion-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ include "terrafusion-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Generate PostgreSQL connection string
*/}}
{{- define "terrafusion-platform.databaseConnectionString" -}}
{{- printf "Host=%s;Port=%d;Database=%s;Username=${DATABASE_USERNAME};Password=${DATABASE_PASSWORD};SSL Mode=Require" .Values.global.database.host (int .Values.global.database.port) .Values.global.database.name }}
{{- end }}

{{/*
Generate Redis connection string
*/}}
{{- define "terrafusion-platform.redisConnectionString" -}}
{{- printf "%s:%d,password=${REDIS_PASSWORD},ssl=True,abortConnect=False" .Values.global.redis.host (int .Values.global.redis.port) }}
{{- end }}

{{/*
Generate full image name with registry and tag
*/}}
{{- define "terrafusion-platform.image" -}}
{{- $registry := .Values.global.imageRegistry -}}
{{- $repository := .repository -}}
{{- $tag := .tag | default .Chart.AppVersion -}}
{{- printf "%s/%s:%s" $registry $repository $tag }}
{{- end }}

{{/*
Generate TLS secret name for a given host
*/}}
{{- define "terrafusion-platform.tlsSecretName" -}}
{{- $host := . | replace "." "-" -}}
{{- printf "%s-tls" $host }}
{{- end }}

{{/*
Check if monitoring is enabled
*/}}
{{- define "terrafusion-platform.monitoringEnabled" -}}
{{- if .Values.global.monitoring.enabled -}}
true
{{- else -}}
false
{{- end -}}
{{- end }}

{{/*
Generate Prometheus scrape annotations
*/}}
{{- define "terrafusion-platform.prometheusAnnotations" -}}
{{- if .Values.global.monitoring.prometheus.enabled }}
prometheus.io/scrape: "true"
prometheus.io/port: {{ .port | default "metrics" | quote }}
prometheus.io/path: {{ .path | default "/metrics" | quote }}
{{- end }}
{{- end }}
