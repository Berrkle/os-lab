SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help preflight up boot down status logs adb install wf1 wf2 hook report clean

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

preflight: ## Check OS / KVM / docker / ports / disk (cheat sheet §0)
	bash scripts/preflight.sh

up: ## Start all services (without waiting for emulator boot)
	docker compose up -d

boot: ## Start services and wait until the emulator is ready
	docker compose up -d
	bash scripts/wait-boot.sh

down: ## Stop the stack
	docker compose down

status: ## Service status + emulator readiness
	docker compose ps
	-docker compose exec -T android cat device_status

logs: ## Follow emulator container logs
	docker compose logs -f android

adb: ## Interactive shell on the emulator
	docker compose exec android adb shell

install: ## Install an APK into the emulator: make install APK=path/to/app.apk
	@test -n "$(APK)" || { echo "usage: make install APK=path/to/app.apk"; exit 1; }
	@mkdir -p apks && cp "$(APK)" apks/
	docker compose exec -T android adb install -r "/apks/$(notdir $(APK))"

wf1: ## WF1 static: MobSF scan → JADX decompile → report. make wf1 APK=app.apk
	@test -n "$(APK)" || { echo "usage: make wf1 APK=path/to/app.apk"; exit 1; }
	bash scripts/wf1-static.sh "$(APK)"

wf2: ## WF2 dynamic: boot → deploy → mitmproxy → frida (optional). make wf2 APK=app.apk [PKG=com.example]
	bash scripts/wf2-dynamic.sh $(APK) $(PKG)

hook: ## Run a Frida hook against a running app: make hook PKG=com.example HOOK=hooks/ssl-pinning-bypass.js
	@test -n "$(PKG)" && test -n "$(HOOK)" || { echo "usage: make hook PKG=com.example HOOK=hooks/ssl-pinning-bypass.js"; exit 1; }
	frida -U -f "$(PKG)" -l "$(HOOK)" --no-pause

report: ## Collect logs, device status and flows into artifacts/
	bash scripts/report.sh

clean: ## Remove all artifacts
	rm -rf artifacts/*
