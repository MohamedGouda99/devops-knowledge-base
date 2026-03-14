{{/*
Expand the name of the chart.
*/}}
{{- define "devops-kb.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "devops-kb.fullname" -}}
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
{{- define "devops-kb.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "devops-kb.labels" -}}
helm.sh/chart: {{ include "devops-kb.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: devops-knowledge-base
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "devops-kb.backend.labels" -}}
{{ include "devops-kb.labels" . }}
app.kubernetes.io/name: backend
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "devops-kb.backend.selectorLabels" -}}
app.kubernetes.io/name: backend
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "devops-kb.frontend.labels" -}}
{{ include "devops-kb.labels" . }}
app.kubernetes.io/name: frontend
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "devops-kb.frontend.selectorLabels" -}}
app.kubernetes.io/name: frontend
app.kubernetes.io/component: frontend
{{- end }}

{{/*
ServiceAccount name
*/}}
{{- define "devops-kb.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "devops-kb.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Backend image
*/}}
{{- define "devops-kb.backend.image" -}}
{{- printf "%s/%s:%s" .Values.global.imageRegistry .Values.backend.image.repository .Values.backend.image.tag }}
{{- end }}

{{/*
Frontend image
*/}}
{{- define "devops-kb.frontend.image" -}}
{{- printf "%s/%s:%s" .Values.global.imageRegistry .Values.frontend.image.repository .Values.frontend.image.tag }}
{{- end }}

{{/*
Backend secret name
*/}}
{{- define "devops-kb.backend.secretName" -}}
{{- if .Values.backend.existingSecret }}
{{- .Values.backend.existingSecret }}
{{- else }}
{{- printf "%s-backend-secrets" (include "devops-kb.fullname" .) }}
{{- end }}
{{- end }}
