.PHONY: dev build typecheck lint test coverage docker-up docker-down push help

dev:
	npm run dev

build:
	npm run build

typecheck:
	npm run typecheck

lint:
	npm run lint

test:
	npm run test

coverage:
	npm run test:coverage

check-ports:
	scripts/check-ports.sh

docker-up: check-ports
	docker compose up --build

docker-down:
	docker compose down

push:
	git status
	git push

help:
	@echo "Available targets:"
	@echo "  dev          Start server + client in watch mode"
	@echo "  build        Build all packages"
	@echo "  typecheck    TypeScript type check across all packages"
	@echo "  lint         ESLint across all packages"
	@echo "  test         Run all tests"
	@echo "  coverage     Run tests with coverage (≥70% enforced)"
	@echo "  check-ports  Scan for in-use ports before deploying"
	@echo "  docker-up    Scan ports then docker compose up --build"
	@echo "  docker-down  docker compose down"
	@echo "  push         git status + push to origin"
