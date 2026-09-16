# Inventory service

A small Go HTTP service that tracks warehouse stock. It keeps everything in
memory and exists as a realistic-but-tiny codebase for demos of AI coding
agents.

## Run

```sh
go run .
```

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/healthz` | Service health check |
| `GET` | `/items` | List all items, sorted by ID |
| `POST` | `/items` | Add an item (`sku`, `name`, `quantity`) |
| `GET` | `/items/{id}` | Fetch one item |

## Test

```sh
go test ./...
```
