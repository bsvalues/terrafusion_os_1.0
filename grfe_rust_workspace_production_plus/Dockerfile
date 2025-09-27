
# Build stage
FROM rust:1.81 as builder
WORKDIR /app
COPY . .
RUN cargo build -p golden-service --release

# Runtime
FROM gcr.io/distroless/cc-debian12
WORKDIR /
COPY --from=builder /app/target/release/golden-service /bin/golden-service
EXPOSE 8080
USER 65532:65532
ENTRYPOINT ["/bin/golden-service"]
