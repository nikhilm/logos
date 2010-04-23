// Copyright 2009, Squish Tech, LLC.
#ifndef SRC_XML_NAMESPACE_H_
#define SRC_XML_NAMESPACE_H_

#include "libxmljs.h"

namespace libxmljs {

class XmlNamespace : public LibXmlObj {
  public:

  xmlNs* xml_obj;
  static void Initialize(v8::Handle<v8::Object> target);
  static v8::Persistent<v8::FunctionTemplate> constructor_template;

  explicit XmlNamespace(xmlNs* ns) : xml_obj(ns) {}
  XmlNamespace(xmlNode* node, const char* prefix, const char* href);

  static v8::Handle<v8::Value> New(xmlNs* ns);

  protected:

  static v8::Handle<v8::Value> New(const v8::Arguments& args);
  static v8::Handle<v8::Value> Href(const v8::Arguments& args);
  static v8::Handle<v8::Value> Prefix(const v8::Arguments& args);

  v8::Handle<v8::Value> get_href();
  v8::Handle<v8::Value> get_prefix();

  friend class Node;
};


}  // namespace libxmljs

#endif  // SRC_XML_NAMESPACE_H_
