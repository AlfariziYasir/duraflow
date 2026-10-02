.PHONY: build test vet fmt fmt-check up down ci

build:
	go build ./...

test: fmt-check
	go test ./cmd/... ./internal/... -race -count=1 -v

vet:
	go vet ./...

fmt:
	gofmt -w ./cmd ./internal

fmt-check:
	@test -z "$$(gofmt -l ./cmd ./internal)" || (echo "Unformatted files found:" && gofmt -l ./cmd ./internal && exit 1)

up:
	docker compose up -d postgres

down:
	docker compose down

ci: fmt-check vet test build
