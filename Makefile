BUILD_DIR	= ./build
EXEC		= npm exec --no-install --

.PHONY: clean lint test build publish pack release-patch release-minor release-major

node_modules:
	npm ci

clean:
	rm -rf $(BUILD_DIR) *.tgz

lint: node_modules
	$(EXEC) eslint src test

test: lint
	$(EXEC) jest

build: clean test
	$(EXEC) swc src -d $(BUILD_DIR) --strip-leading-paths

publish: build
	npm publish ./
	git push --follow-tags

pack: build
	npm pack

release-patch:
	npm version patch
	$(MAKE) publish

release-minor:
	npm version minor
	$(MAKE) publish

release-major:
	npm version major
	$(MAKE) publish
