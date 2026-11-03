SHELL := /bin/bash
.DEFAULT_GOAL := help

RUNTIME := $(shell if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then echo docker; elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then echo podman; fi)
COMPOSE := $(RUNTIME) compose
WEB_PORT ?= 8007
SSH_PORT ?= 2223
CONFIRM ?=

# Rule-set rendering: make render SLUG=acme-academy [BRANCH=..] [SEGMENT=..] [TARGET=ufw|nft|table]
SLUG ?=
BRANCH ?=
SEGMENT ?=
TARGET ?= ufw
EXT := $(if $(filter nft,$(TARGET)),nft,$(if $(filter table,$(TARGET)),txt,sh))
RENDER_ARGS := --target $(TARGET) $(if $(BRANCH),--branch $(BRANCH),) $(if $(SEGMENT),--segment $(SEGMENT),)

.PHONY: help preflight prepare up boot wait wait-ready status ssh render apply shell logs restart down reset env

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
	@printf '\nRuntime: %s\n' "$(if $(RUNTIME),$(RUNTIME),none - install Docker/Podman)"

preflight: ## Read-only checks: runtime, KVM, ports
	bash scripts/preflight.sh

prepare: ## Create .env and data directories if missing
	@test -f .env || cp .env.example .env
	@mkdir -p storage shared
	@printf 'prepared: .env storage/ shared/\n'

up: prepare ## Start the guest container
	@test -n "$(RUNTIME)" || { echo "no usable Docker/Podman"; exit 1; }
	$(COMPOSE) up -d fw

boot: up wait ## Start and wait for the web viewer

wait: ## Wait for the web viewer
	bash scripts/wait-ready.sh --web

wait-ready: ## Wait for the web viewer and SSH
	bash scripts/wait-ready.sh --all

status: ## Container state, web viewer, SSH
	@printf '== compose ==\n'; $(COMPOSE) ps 2>/dev/null || echo "runtime unavailable"
	@printf '\n== web viewer ==\n'; curl -fsSI --max-time 3 http://127.0.0.1:$(WEB_PORT)/ 2>/dev/null | head -1 || echo "not responding on :$(WEB_PORT)"
	@printf '\n== ssh ==\n'; (exec 3<>/dev/tcp/127.0.0.1/$(SSH_PORT)) 2>/dev/null && echo "accepting on :$(SSH_PORT)" || echo "not accepting on :$(SSH_PORT)"

ssh: ## Print SSH connection details
	@set -a; [ -f .env ] && . ./.env; set +a; \
	printf 'Local: ssh -p %s %s@127.0.0.1   (pass: %s)\n' "$${SSH_PORT:-2223}" "$${FW_USER:-ubuntu}" "$${FW_PASSWORD:-ubuntu}"

render: ## Render a rule set to shared/  (SLUG=.. [BRANCH=..] [SEGMENT=..] [TARGET=ufw|nft|table])
	@test -n "$(SLUG)" || { echo "usage: make render SLUG=acme-academy [BRANCH=istanbul-hq] [SEGMENT=perimeter] [TARGET=ufw|nft|table]"; exit 1; }
	@mkdir -p shared
	python3 scripts/render-rules.py "$(SLUG)" $(RENDER_ARGS) -o "shared/$(SLUG).$(TARGET).$(EXT)"
	@printf 'Rendered shared/%s.%s.%s — review it, then (ufw/nft): make apply SLUG=%s TARGET=%s\n' "$(SLUG)" "$(TARGET)" "$(EXT)" "$(SLUG)" "$(TARGET)"

apply: ## Copy a rendered ufw/nft rule set into the guest and run it (needs sshpass)
	@test -n "$(SLUG)" || { echo "usage: make apply SLUG=acme-academy [TARGET=ufw|nft]"; exit 1; }
	bash scripts/apply.sh "$(SLUG)" "$(TARGET)" "$(EXT)"

shell: ## Shell inside the container (debugging the qemu wrapper, not the guest)
	$(COMPOSE) exec fw bash

logs: ## Follow container logs
	$(COMPOSE) logs -f fw

restart: ## Restart the container
	$(COMPOSE) restart fw

down: ## Stop the container
	$(COMPOSE) down

reset: ## DESTROY the VM disk (requires CONFIRM=yes)
	@test "$(CONFIRM)" = "yes" || { echo "refusing: run 'make reset CONFIRM=yes' to destroy storage/"; exit 1; }
	-$(COMPOSE) down
	rm -rf storage && mkdir -p storage && touch storage/.gitkeep
	@printf 'reset complete: next boot re-provisions the guest\n'

env: ## Show the effective .env
	@cat .env 2>/dev/null || echo "no .env; run: make prepare"
