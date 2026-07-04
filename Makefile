SRCDIR := .
DIST_HTML := $(SRCDIR)/dist/index.html
DESTDIR := C:/Users/dave_/Desktop/DragonArt

.PHONY: build run clean install

# Build a single self-contained HTML file (JS/CSS inlined) at dist/index.html
build:
	cd $(SRCDIR) && npm run build

# Serve the built single-file app locally
run: build
	cd $(SRCDIR) && npm run preview

clean:
	rm -rf $(SRCDIR)/dist

# Copy the single HTML file to the install directory
install: build
	mkdir -p $(DESTDIR)
	cp -f $(DIST_HTML) $(DESTDIR)/DragonCurves.html
