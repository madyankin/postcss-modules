BUILD_DIR	= ./build
NODE_IMAGE	= node:22
DOCKER		= docker run --rm -v "$(CURDIR)":/app -w /app $(NODE_IMAGE)
EXEC		= $(DOCKER) npm exec --

.PHONY: clean lint compile test build publish pack release-patch release-minor release-major

# Reinstall whenever package-lock.json is newer than the marker.
node_modules/.installed: package-lock.json package.json
	$(DOCKER) npm ci
	@mkdir -p node_modules
	@touch node_modules/.installed

clean:
	rm -rf $(BUILD_DIR) *.tgz

lint: node_modules/.installed
	$(EXEC) eslint src test

compile: node_modules/.installed
	$(EXEC) swc src -d $(BUILD_DIR) --strip-leading-paths --ignore 'src/*.mjs'
	cp src/*.mjs $(BUILD_DIR)/

test: lint compile
	$(EXEC) jest

build: clean test

publish: build
	npm publish ./
	git push --follow-tags

pack: build
	$(DOCKER) npm pack

release-patch:
	npm version patch
	$(MAKE) publish

release-minor:
	npm version minor
	$(MAKE) publish

release-major:
	npm version major
	$(MAKE) publish
