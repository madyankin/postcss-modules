BUILD_DIR	= ./build

.PHONY: clean lint test build publish pack

clean:
	rm -rf $(BUILD_DIR) *.tgz

lint:
	npx eslint src test

test: lint
	npx jest

build: clean test
	npx babel src -d $(BUILD_DIR)

publish: build
	npm publish ./
  git push --follow-tags

pack: build
	npm pack
