{{/*
============================================================================
TerraFusion Consciousness Engine - Helm Template Helpers
Government. Transcended. - Reusable AI Template Functions
============================================================================
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "terrafusion-consciousness.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "terrafusion-consciousness.fullname" -}}
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
{{- define "terrafusion-consciousness.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "terrafusion-consciousness.labels" -}}
helm.sh/chart: {{ include "terrafusion-consciousness.chart" . }}
{{ include "terrafusion-consciousness.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: terrafusion-os
terrafusion.io/component: consciousness
terrafusion.io/tier: ai
terrafusion.io/ai-agents: "50000"
{{- end }}

{{/*
Selector labels
*/}}
{{- define "terrafusion-consciousness.selectorLabels" -}}
app.kubernetes.io/name: {{ include "terrafusion-consciousness.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "terrafusion-consciousness.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "terrafusion-consciousness.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate database connection string
*/}}
{{- define "terrafusion-consciousness.databaseConnectionString" -}}
{{- printf "Host=%s;Port=%d;Database=%s;Username=$(DATABASE_USERNAME);Password=$(DATABASE_PASSWORD);SSL Mode=%s;Pooling=true;Maximum Pool Size=%d;Connection Timeout=%d" .Values.database.host .Values.database.port .Values.database.name (ternary "Require" "Disable" .Values.database.ssl) .Values.database.poolSize .Values.database.connectionTimeout }}
{{- end }}

{{/*
Generate Redis connection string
*/}}
{{- define "terrafusion-consciousness.redisConnectionString" -}}
{{- if .Values.redis.enabled }}
{{- printf "%s:%d,password=$(REDIS_PASSWORD),ssl=%s,abortConnect=false,defaultDatabase=%d" .Values.redis.host .Values.redis.port (ternary "true" "false" .Values.redis.ssl) .Values.redis.database }}
{{- end }}
{{- end }}
