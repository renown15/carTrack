.PHONY: help dev install build clean \
        typecheck lint test coverage ci \
        check-ports docker-up docker-down docker-logs docker-restart docker-ps \
        commit push

# ── Default ───────────────────────────────────────────────────────────────────
.DEFAULT_GOAL := help

# ── Development ───────────────────────────────────────────────────────────────
dev:
	npm run dev

install:
	npm install

build:
	npm run build

clean:
	rm -rf apps/server/dist apps/client/dist apps/server/coverage apps/client/coverage

# ── Quality gates ─────────────────────────────────────────────────────────────
typecheck:
	npm run typecheck

lint:
	npm run lint

test:
	npm run test

coverage:
	npm run test:coverage

## ci: typecheck + lint + coverage — run before every push
ci: typecheck lint coverage

# ── Docker ────────────────────────────────────────────────────────────────────
check-ports:
	scripts/check-ports.sh

docker-up: check-ports
	docker compose up --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs --follow

docker-restart:
	docker compose restart

docker-ps:
	docker compose ps

# ── Source control ────────────────────────────────────────────────────────────
## commit: stage all changes, open editor for message, then push
commit:
	git add -A
	git status
	git commit
	git push

## push: run ci checks then push
push: ci
	git push

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "carTrack — available make targets"
	@echo ""
	@echo "  Development"
	@echo "    install        npm install"
	@echo "    dev            start server + client in watch mode"
	@echo "    build          build all packages"
	@echo "    clean          remove dist/ and coverage/ directories"
	@echo ""
	@echo "  Quality gates"
	@echo "    typecheck      tsc --noEmit across all packages"
	@echo "    lint           ESLint across all packages"
	@echo "    test           run all tests"
	@echo "    coverage       run tests with coverage (>=70% enforced)"
	@echo "    ci             typecheck + lint + coverage (pre-push gate)"
	@echo ""
	@echo "  Docker"
	@echo "    check-ports    scan for in-use ports"
	@echo "    docker-up      check-ports then docker compose up --build"
	@echo "    docker-down    docker compose down"
	@echo "    docker-logs    docker compose logs --follow"
	@echo "    docker-restart docker compose restart"
	@echo "    docker-ps      docker compose ps"
	@echo ""
	@echo "  Source control"
	@echo "    commit         git add -A, commit, push"
	@echo "    push           run ci then git push"
	@echo ""
