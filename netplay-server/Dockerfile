# Multi-stage Docker build for RetroNFC Netplay Server (Rust)
FROM rust:1.80-alpine AS builder

RUN apk add --no-cache musl-dev

WORKDIR /usr/src/app
COPY Cargo.toml Cargo.lock* ./
# Pre-build dummy to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

COPY src ./src
RUN touch src/main.rs && cargo build --release

# Runner stage
FROM alpine:3.20

RUN apk add --no-cache ca-certificates libgcc

WORKDIR /app
COPY --from=builder /usr/src/app/target/release/rust-socket-server /app/netplay-server

ENV PORT=3000
EXPOSE 3000

CMD ["/app/netplay-server"]
