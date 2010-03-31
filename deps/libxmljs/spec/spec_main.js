process.mixin(require('./helpers'));

describe('libxmljs', function() {
  it('has a version number', function() {
    if (specVerbose) print(libxml.version+" ");
    assert(typeof libxml.version == 'string');
  });

  it('knows the libxml version number', function() {
    if (specVerbose) print(libxml.libxml_version+" ");
    assert(typeof libxml.libxml_version == 'string');
  });

  it('knows the libxml parser version number', function() {
    if (specVerbose) print(libxml.libxml_parser_version+" ");
    assert(typeof libxml.libxml_parser_version == 'string');
  });
});
