SHELL := /bin/bash
.DEFAULT_GOAL := help

RUNTIME := $(shell if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then echo docker; elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then echo podman; fi)
COMPOSE := $(RUNTIME) compose
WEB_PORT ?= 8006
RDP_PORT ?= 3389
FULL ?=
FILE ?=
CONFIRM ?=

.PHONY: help preflight setup prepare up boot wait wait-install status monitor profiles logs shell rdp smb restart update down backup restore install-service uninstall-service reset clean env

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
	@mkdir -p storage shared oem backups
	@printf 'prepared: .env storage/ shared/ oem/ backups/\n'

up: prepare ## Start the container
	@test -n "$(RUNTIME)" || { echo "no usable Docker/Podman; run: sudo make setup"; exit 1; }
	$(COMPOSE) up -d windows

boot: up wait ## Start and wait for the web viewer

wait: ## Wait for the web viewer to respond
	bash scripts/wait-ready.sh --web

wait-install: ## Wait for storage/windows.boot (Windows installation finished)
	bash scripts/wait-ready.sh --install

monitor: ## Live dashboard: state, endpoints, CPU/RAM, storage
	../labctl win monitor

profiles: ## List management profiles (lightweight/development/performance)
	../labctl win profiles

status: ## Container state, web viewer, ports and install marker
	@printf '== compose ==\n'
	@$(COMPOSE) ps 2>/dev/null || echo "runtime unavailable"
	@printf '\n== web viewer ==\n'
	@curl -fsSI --max-time 3 http://127.0.0.1:$(WEB_PORT)/ 2>/dev/null | head -1 || echo "not responding on :$(WEB_PORT)"
	@printf '\n== install marker ==\n'
	@if [ -f storage/windows.boot ]; then echo "present: storage/windows.boot (installed)"; else echo "absent (installation not finished)"; fi
	@printf '\n== storage ==\n'
	@du -sh storage 2>/dev/null || true
	@ls -lah storage 2>/dev/null | head -12 || true

logs: ## Follow container logs
	$(COMPOSE) logs -f windows

shell: ## Open a shell inside the container (debugging)
	$(COMPOSE) exec windows bash

rdp: ## Print RDP connection details
	@set -a; [ -f .env ] && . ./.env; set +a; \
	printf 'RDP:   %s:%s\n' "$${RDP_HOST:-<server-ip>}" "$${RDP_PORT:-3389}"; \
	printf 'User:  %s\n' "$${WINDOWS_USER:-Docker}"; \
	printf 'Pass:  %s\n' "$${WINDOWS_PASSWORD:-admin}"; \
	printf '\nLinux:  xfreerdp /v:<server-ip> /u:%s /p:<password> /dynamic-resolution\n' "$${WINDOWS_USER:-Docker}"

smb: ## Show the host shared folder and guest path
	@printf 'Host folder: %s/shared\n' "$(CURDIR)"
	@printf 'Guest:       \\\\<guest-name>\\Shared  (drive Z:)\n'
	@ls -lah shared 2>/dev/null || true

restart: ## Restart the container (graceful shutdown)
	$(COMPOSE) restart windows

update: ## Pull the image and recreate the container
	$(COMPOSE) pull windows
	$(COMPOSE) up -d windows

down: ## Stop the container (graceful ACPI shutdown)
	$(COMPOSE) down

backup: ## Archive storage and config into backups/ (FULL=1 adds shared/oem)
	bash scripts/backup.sh $(if $(filter 1 yes Y,$(FULL)),--full)

restore: ## Restore a backup: make restore FILE=backups/x.tar.gz
	@test -n "$(FILE)" || { echo "usage: make restore FILE=backups/win-lab-....tar.gz"; exit 1; }
	bash scripts/restore.sh "$(FILE)"

install-service: ## Install a systemd unit that starts win-lab at boot
	sudo bash scripts/install-service.sh

uninstall-service: ## Remove the systemd unit
	sudo bash scripts/uninstall-service.sh

reset: ## DESTROY the VM disks (requires CONFIRM=yes)
	@test "$(CONFIRM)" = "yes" || { echo "refusing: run 'make reset CONFIRM=yes' to destroy storage/"; exit 1; }
	-$(COMPOSE) down
	rm -rf storage
	mkdir -p storage
	touch storage/.gitkeep
	@printf 'reset complete: storage/ is empty; next boot reinstalls Windows\n'

clean: ## Remove backups/ (does not touch storage/)
	find backups -mindepth 1 ! -name .gitkeep -delete
	@printf 'backups/ cleaned\n'

env: ## Show the effective .env
	@cat .env 2>/dev/null || echo "no .env; run: make prepare"
