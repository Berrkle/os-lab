SHELL := /bin/bash
.DEFAULT_GOAL := help

RUNTIME := $(shell if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then echo docker; elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then echo podman; fi)
COMPOSE := $(RUNTIME) compose
WEB_PORT ?= 8006
SSH_PORT ?= 2222
FULL ?=
FILE ?=
CONFIRM ?=

.PHONY: help preflight setup prepare up boot wait wait-ready status monitor profiles logs shell ssh share restart update down backup restore install-service uninstall-service reset clean env

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@printf '\nRuntime: %s\n' "$(if $(RUNTIME),$(RUNTIME),none - run: sudo make setup)"

preflight: ## Read-only checks: OS, KVM, runtime, ports, disk, RAM
	bash scripts/preflight.sh

setup: ## Install KVM/Docker and create lab directories (needs sudo)
	sudo bash scripts/setup-ubuntu.sh

prepare: ## Create .env and data directories if missing
	@test -f .env || cp .env.example .env
	@mkdir -p storage shared backups
	@printf 'prepared: .env storage/ shared/ backups/\n'

up: prepare ## Start the container
	@test -n "$(RUNTIME)" || { echo "no usable Docker/Podman; run: sudo make setup"; exit 1; }
	$(COMPOSE) up -d linux

boot: up wait ## Start and wait for the web viewer

wait: ## Wait for the web viewer to respond
	bash scripts/wait-ready.sh --web

wait-ready: ## Wait for the web viewer and for SSH to accept connections
	bash scripts/wait-ready.sh --all

monitor: ## Live dashboard: state, endpoints, CPU/RAM, storage
	../labctl linux monitor

profiles: ## List management profiles (lightweight/development/performance)
	../labctl linux profiles

status: ## Container state, web viewer, SSH and boot marker
	@printf '== compose ==\n'
	@$(COMPOSE) ps 2>/dev/null || echo "runtime unavailable"
	@printf '\n== web viewer ==\n'
	@curl -fsSI --max-time 3 http://127.0.0.1:$(WEB_PORT)/ 2>/dev/null | head -1 || echo "not responding on :$(WEB_PORT)"
	@printf '\n== ssh ==\n'
	@(exec 3<>/dev/tcp/127.0.0.1/$(SSH_PORT)) 2>/dev/null && echo "accepting on :$(SSH_PORT)" || echo "not accepting on :$(SSH_PORT)"
	@printf '\n== boot marker ==\n'
	@if [ -f storage/linux.ready ]; then echo "present: storage/linux.ready (guest provisioned)"; else echo "absent (not provisioned yet)"; fi
	@printf '\n== storage ==\n'
	@du -sh storage 2>/dev/null || true
	@ls -lah storage 2>/dev/null | head -12 || true

logs: ## Follow container logs
	$(COMPOSE) logs -f linux

shell: ## Open a shell inside the container (debugging)
	$(COMPOSE) exec linux bash

ssh: ## Print SSH connection details
	@set -a; [ -f .env ] && . ./.env; set +a; \
	printf 'SSH:   ssh -p %s %s@<server-ip>\n' "$${SSH_PORT:-2222}" "$${LINUX_USER:-root}"; \
	printf 'User:  %s\n' "$${LINUX_USER:-root}"; \
	printf 'Pass:  %s\n' "$${LINUX_PASSWORD:-root}"; \
	printf '\nLocal: ssh -p %s %s@127.0.0.1\n' "$${SSH_PORT:-2222}" "$${LINUX_USER:-root}"

share: ## Show the host shared folder and guest mount
	@printf 'Host folder: %s/shared\n' "$(CURDIR)"
	@printf 'Guest:       /shared (9p/virtfs, if enabled by the image)\n'
	@ls -lah shared 2>/dev/null || true

restart: ## Restart the container (graceful shutdown)
	$(COMPOSE) restart linux

update: ## Pull the image and recreate the container
	$(COMPOSE) pull linux
	$(COMPOSE) up -d linux

down: ## Stop the container (graceful ACPI shutdown)
	$(COMPOSE) down

backup: ## Archive storage and config into backups/ (FULL=1 adds shared)
	bash scripts/backup.sh $(if $(filter 1 yes Y,$(FULL)),--full)

restore: ## Restore a backup: make restore FILE=backups/x.tar.gz
	@test -n "$(FILE)" || { echo "usage: make restore FILE=backups/linux-lab-....tar.gz"; exit 1; }
	bash scripts/restore.sh "$(FILE)"

install-service: ## Install a systemd unit that starts linux-lab at boot
	sudo bash scripts/install-service.sh

uninstall-service: ## Remove the systemd unit
	sudo bash scripts/uninstall-service.sh

reset: ## DESTROY the VM disks (requires CONFIRM=yes)
	@test "$(CONFIRM)" = "yes" || { echo "refusing: run 'make reset CONFIRM=yes' to destroy storage/"; exit 1; }
	-$(COMPOSE) down
	rm -rf storage
	mkdir -p storage
	touch storage/.gitkeep
	@printf 'reset complete: storage/ is empty; next boot re-provisions the guest\n'

clean: ## Remove backups/ (does not touch storage/)
	find backups -mindepth 1 ! -name .gitkeep -delete
	@printf 'backups/ cleaned\n'

env: ## Show the effective .env
	@cat .env 2>/dev/null || echo "no .env; run: make prepare"
