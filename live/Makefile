TF_DIR := infra

.PHONY: init fmt validate plan deploy destroy outputs tftest test dev

init:
	terraform -chdir=$(TF_DIR) init

fmt:
	terraform -chdir=$(TF_DIR) fmt

validate:
	terraform -chdir=$(TF_DIR) validate

plan:
	terraform -chdir=$(TF_DIR) plan

deploy:
	terraform -chdir=$(TF_DIR) apply

destroy:
	terraform -chdir=$(TF_DIR) destroy

outputs:
	terraform -chdir=$(TF_DIR) output

tftest:
	terraform -chdir=$(TF_DIR) test

test:
	node --test backend/test/*.test.mjs

dev:
	node backend/dev/dev-server.mjs
