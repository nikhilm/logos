all: sasljs libxmljs

sasljs:
	cd deps/sasljs; node-waf configure build

libxmljs:
	cd deps/libxmljs; make

clean:
	cd deps/sasljs; node-waf clean distclean; rm lib/binding_sasl.node
	cd deps/libxmljs; make clean
