# ==============================================================================
# Multi-stage Dockerfile for Nexus Gold Go Backend
# Optimized for Koyeb / Railway / Render / Fly.io
# ==============================================================================

# Build Stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install git and TLS root certs for Supabase connectivity
RUN apk add --no-cache ca-certificates git

# Copy dependency definitions
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and compile optimized static binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server main.go

# Production Stage
FROM alpine:3.20

# TLS certificates & timezone support
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /app/server /app/server

ENV PORT=8080
EXPOSE 8080

CMD ["/app/server"]
