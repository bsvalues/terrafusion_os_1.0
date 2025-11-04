{{/*
============================================================================
TerraFusion API - Helm Template Helpers
Government. Transcended. - Reusable Template Functions
============================================================================
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "terrafusion-api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "terrafusion-api.fullname" -}}
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
{{- define "terrafusion-api.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "terrafusion-api.labels" -}}
helm.sh/chart: {{ include "terrafusion-api.chart" . }}
{{ include "terrafusion-api.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: terrafusion-os
terrafusion.io/component: api
terrafusion.io/tier: core
{{- end }}

{{/*
Selector labels
*/}}
{{- define "terrafusion-api.selectorLabels" -}}
app.kubernetes.io/name: {{ include "terrafusion-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "terrafusion-api.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "terrafusion-api.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate database connection string
*/}}
{{- define "terrafusion-api.databaseConnectionString" -}}
{{- printf "Host=%s;Port=%d;Database=%s;Username=$(DATABASE_USERNAME);Password=$(DATABASE_PASSWORD);SSL Mode=%s;Pooling=true;Maximum Pool Size=%d;Connection Timeout=%d" .Values.database.host .Values.database.port .Values.database.name (ternary "Require" "Disable" .Values.database.ssl) .Values.database.poolSize .Values.database.connectionTimeout }}
{{- end }}

{{/*
Generate Redis connection string
*/}}
{{- define "terrafusion-api.redisConnectionString" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s:%d,password=$(REDIS_PASSWORD),ssl=%s,abortConnect=false,defaultDatabase=%d" .Values.redis.host .Values.redis.port (ternary "true" "false" .Values.redis.ssl) .Values.redis.database }}
{{- end }}
{{- end }}
