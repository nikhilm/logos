all: sasljs libxmljs

sasljs:
	cd deps/sasljs; node-waf configure build

libxmljs:
	cd deps/libxmljs; make

.PHONY: doc clean

doc:
	$(MAKE) $(MAKEFLAGS) -C doc

clean:
	cd deps/sasljs; node-waf clean distclean; rm lib/binding_sasl.node; rm .lock-wscript
	cd deps/libxmljs; make clean; rm deps/libxmljs/config.log
	$(MAKE) $(MAKEFLAGS) -C doc clean
