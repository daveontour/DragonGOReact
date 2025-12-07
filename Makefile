SRCDIR := .
DESTDIR := C:\Users\dave_\Desktop\DragonArt
REACTAPPDIR := C:\Users\dave_\source\repos\DragonGOReact
AIDIR := C:\Users\dave_\source\repos\DragonArt.AI

buildstatic:
	-del $(AIDIR)\server\public\*.html
	cd $(REACTAPPDIR) && npm run build
	copy $(REACTAPPDIR)\dist\*.* $(AIDIR)\server\public
	-del $(AIDIR)\server\public\vite.svg
	

build:
	make clean
	-mkdir $(SRCDIR)\server\public
	-mkdir $(SRCDIR)\server\public\assets
	cd $(REACTAPPDIR) && npm run build
	copy $(REACTAPPDIR)\dist\*.* $(SRCDIR)\server\public 
	-del $(SRCDIR)\server\public\vite.svg
	copy $(REACTAPPDIR)\dist\assets\*.* $(SRCDIR)\server\public\assets 
	make lint
	go build  -ldflags="-s -w" -o $(DESTDIR)\dragongo.exe .
	copy *.json $(DESTDIR)
	copy *.crt $(DESTDIR)
	copy *.pem $(DESTDIR)
	copy *.txt $(DESTDIR)


clean:
	-del $(DESTDIR)\*.exe
	-del $(DESTDIR)\*.json	
	-del $(DESTDIR)\*.bak
	-del $(DESTDIR)\*.crt
	-del $(DESTDIR)\*.key
	-del $(DESTDIR)\*.txt
	-del $(SRCDIR)\server\public\*.exe
	-del $(SRCDIR)\server\public\*.html
	-del $(SRCDIR)\server\public\assets\*.js
	-del $(SRCDIR)\server\public\assets\*.css
	-del $(AIDIR)\server\public\*.exe
	-del $(AIDIR)\server\public\*.html
	-del $(AIDIR)\server\public\assets\*.js
	-del $(AIDIR)\server\public\assets\*.css

	

lint: 
	-golangci-lint run
