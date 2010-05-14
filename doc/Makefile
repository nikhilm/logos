RONN = ronn --html --build

all: $(patsubst %.txt,%.3.html,$(wildcard *.txt core/*.txt utils/*.txt))

%.3.html: %.txt
	$(RONN) $?

.PHONY: clean
clean:
	-find -name '*.3.html'|xargs rm
