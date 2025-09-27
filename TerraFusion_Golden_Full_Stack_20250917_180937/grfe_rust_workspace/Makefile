
.PHONY: build run test fmt docker

build:
	cargo build --workspace --release

run:
	cargo run -p golden-service

test:
	cargo test --workspace

fmt:
	cargo fmt --all

docker:
	docker build -t terrafusion/grfe:latest .
