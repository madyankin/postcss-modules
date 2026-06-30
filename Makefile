BUILD_DIR	= ./build

.PHONY: clean lint test build publish pack release-patch release-minor release-major

clean:
	rm -rf $(BUILD_DIR) *.tgz

lint:
	npx eslint src test

test: lint
	npx jest

build: clean test
	npx swc src -d $(BUILD_DIR) --strip-leading-paths

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
