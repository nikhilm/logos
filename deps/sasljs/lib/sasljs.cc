/*
 * Copyright 2010, Nikhil Marathe <nsm.nikhil@gmail.com> All rights reserved.
 * See LICENSE for details.
*/
#include "sasljs.h"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <iostream>

using namespace v8;
using namespace node;

/*
 * Macro from the sqlite3 bindings
 * http://github.com/grumdrig/node-sqlite/blob/master/sqlite3_bindings.cc
 * by Eric Fredricksen
 */
#define REQ_STR_ARG(I, VAR)                                             \
      if (args.Length() <= (I) || !args[I]->IsString())                     \
    return ThrowException(Exception::TypeError(                         \
                                  String::New("Argument " #I " must be a string"))); \
  String::Utf8Value VAR(args[I]->ToString());

#define ENSURE_STARTED( session_obj )\
  if( !session_obj->m_session )\
    std::cerr << "sasljs: Session is not started!\n";\
  assert( session_obj->m_session != NULL )

namespace sasljs {
void ServerSession::Initialize ( Handle<Object> target )
{
  v8::HandleScope scope;

  v8::Local<v8::FunctionTemplate> t = v8::FunctionTemplate::New(New);

  t->InstanceTemplate()->SetInternalFieldCount(1);

  // error codes
  NODE_DEFINE_CONSTANT( target, GSASL_OK  );
  NODE_DEFINE_CONSTANT( target, GSASL_NEEDS_MORE  );
  NODE_DEFINE_CONSTANT( target, GSASL_UNKNOWN_MECHANISM  );
  NODE_DEFINE_CONSTANT( target, GSASL_MECHANISM_CALLED_TOO_MANY_TIMES  );
  NODE_DEFINE_CONSTANT( target, GSASL_MALLOC_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_BASE64_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_CRYPTO_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_SASLPREP_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_MECHANISM_PARSE_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_AUTHENTICATION_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_INTEGRITY_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_CLIENT_CODE  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_SERVER_CODE  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_CALLBACK  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_ANONYMOUS_TOKEN  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_AUTHID  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_AUTHZID  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_PASSWORD  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_PASSCODE  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_PIN  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_SERVICE  );
  NODE_DEFINE_CONSTANT( target, GSASL_NO_HOSTNAME  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_RELEASE_BUFFER_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_IMPORT_NAME_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_INIT_SEC_CONTEXT_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_ACCEPT_SEC_CONTEXT_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_UNWRAP_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_WRAP_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_ACQUIRE_CRED_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_DISPLAY_NAME_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_UNSUPPORTED_PROTECTION_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_KERBEROS_V5_INIT_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_KERBEROS_V5_INTERNAL_ERROR  );
  NODE_DEFINE_CONSTANT( target, GSASL_SHISHI_ERROR );
  NODE_DEFINE_CONSTANT( target, GSASL_SECURID_SERVER_NEED_ADDITIONAL_PASSCODE  );
  NODE_DEFINE_CONSTANT( target, GSASL_SECURID_SERVER_NEED_NEW_PIN  );

  // property constants
  NODE_DEFINE_CONSTANT( target, GSASL_AUTHID );
  NODE_DEFINE_CONSTANT( target, GSASL_AUTHZID );
  NODE_DEFINE_CONSTANT( target, GSASL_PASSWORD );
  NODE_DEFINE_CONSTANT( target, GSASL_ANONYMOUS_TOKEN );
  NODE_DEFINE_CONSTANT( target, GSASL_SERVICE );
  NODE_DEFINE_CONSTANT( target, GSASL_HOSTNAME );
  NODE_DEFINE_CONSTANT( target, GSASL_GSSAPI_DISPLAY_NAME );
  NODE_DEFINE_CONSTANT( target, GSASL_PASSCODE );
  NODE_DEFINE_CONSTANT( target, GSASL_SUGGESTED_PIN );
  NODE_DEFINE_CONSTANT( target, GSASL_PIN );
  NODE_DEFINE_CONSTANT( target, GSASL_REALM );
  NODE_DEFINE_CONSTANT( target, GSASL_DIGEST_MD5_HASHED_PASSWORD );
  NODE_DEFINE_CONSTANT( target, GSASL_QOPS );
  NODE_DEFINE_CONSTANT( target, GSASL_QOP );
  NODE_DEFINE_CONSTANT( target, GSASL_SCRAM_ITER );
  NODE_DEFINE_CONSTANT( target, GSASL_SCRAM_SALT );
  NODE_DEFINE_CONSTANT( target, GSASL_SCRAM_SALTED_PASSWORD );
  NODE_DEFINE_CONSTANT( target, GSASL_VALIDATE_SIMPLE );
  NODE_DEFINE_CONSTANT( target, GSASL_VALIDATE_EXTERNAL );
  NODE_DEFINE_CONSTANT( target, GSASL_VALIDATE_ANONYMOUS );
  NODE_DEFINE_CONSTANT( target, GSASL_VALIDATE_GSSAPI );
  NODE_DEFINE_CONSTANT( target, GSASL_VALIDATE_SECURID );

  NODE_SET_PROTOTYPE_METHOD( t, "_mechanisms", GetMechanisms );
  NODE_SET_PROTOTYPE_METHOD( t, "start", Start );
  NODE_SET_PROTOTYPE_METHOD( t, "step", Step );
  NODE_SET_PROTOTYPE_METHOD( t, "property", GetSaslProperty );
  NODE_SET_PROTOTYPE_METHOD( t, "setProperty", SetSaslProperty );

  target->Set( v8::String::NewSymbol( "ServerSession"), t->GetFunction() );
}

/*
 * Call in JS
 * new ServerSession( "service name" );
 * All other options default to NULL for now
 */
v8::Handle<v8::Value>
ServerSession::New (const v8::Arguments& args)
{
  HandleScope scope;

  REQ_STR_ARG( 0, realm );

  if( args.Length() <= 1 || !args[1]->IsFunction() ) {
    return ThrowException(Exception::TypeError(
                                  String::New("Argument 1 must be a callback")));
  }

  ServerSession *server = new ServerSession( *realm, cb_persist( args[1] ) );
  server->Wrap( args.This() );
  return args.This();
}

ServerSession::ServerSession( const char *realm, Persistent<Function> *cb )
  : ObjectWrap()
  , m_session( NULL )
  , m_callback( cb )
{
}

ServerSession::~ServerSession()
{
  m_callback->Dispose();
}

Handle<Value>
ServerSession::GetMechanisms( const v8::Arguments &args )
{
  ServerSession *sc = Unwrap<ServerSession>( args.This() );

  char *result;
  
  int mechres = gsasl_server_mechlist( ctx, &result );
  if( mechres != GSASL_OK ) {
    return String::New( "" );
  }

  Handle<String> ret = String::New( result, strlen( result ) );
  free( result );
  return ret;
}

int
ServerSession::Callback( Gsasl *ctx, Gsasl_session *sctx, Gsasl_property prop )
{
  ServerSession *sc = static_cast<ServerSession*>(gsasl_session_hook_get( sctx ));
  ENSURE_STARTED( sc );

  Local<Value> argv[] = { Integer::New( prop ), Local<Object>::New(sc->handle_) };
  Local<Value> ret = (*sc->m_callback)->Call( sc->handle_, 2, argv );

  if( !ret->IsNumber() )
    return GSASL_NO_CALLBACK;

  return ret->ToInteger()->Value();
}

/**
 * Returns a map
 * { status: integer_error_code,
 *   data : data to send to client if error == GSASL_OK }
 */
v8::Handle<v8::Value>
ServerSession::Start( const v8::Arguments &args )
{
  REQ_STR_ARG( 0, mechanismString );

  int res;

  ServerSession *sc = Unwrap<ServerSession>( args.This() );
  if( sc->m_session != NULL ) {
    return ThrowException( Exception::Error( String::New( "sasljs: This session is already started!" ) ) );
  }

  res = gsasl_server_start( ctx, *mechanismString, &sc->m_session );
  gsasl_session_hook_set( sc->m_session, sc );
  gsasl_callback_set( ctx, sc->Callback );

  return Integer::New( res );
}

v8::Handle<v8::Value>
ServerSession::Step( const v8::Arguments &args )
{
  REQ_STR_ARG( 0, clientinString );

  ServerSession *sc = Unwrap<ServerSession>( args.This() );

  char *reply;

  int res = gsasl_step64( sc->m_session, *clientinString, &reply );

  Handle<Object> obj = Object::New();
  Local<String> status = String::NewSymbol( "status" );

  obj->Set( status, Integer::New( res ) );

  if( res == GSASL_OK || res == GSASL_NEEDS_MORE ) {
    obj->Set( String::NewSymbol( "data" ), String::New( reply, strlen( reply ) ) );
  }
  else {
    obj->Set( String::NewSymbol( "data" ), String::New( gsasl_strerror( res ) ) );
  }

  return obj;
}

Handle<Value>
ServerSession::GetSaslProperty( const Arguments &args )
{
  ServerSession *sc = Unwrap<ServerSession>( args.This() );
  ENSURE_STARTED( sc );

  if( args.Length() < 1 || !args[0]->IsString() ) {
    return ThrowException( Exception::TypeError( String::New( "Expect property name as first argument" ) ) );
  }

  String::AsciiValue key( args[0]->ToString() );

  std::map<std::string, Gsasl_property>::iterator it = property_strings.find( *key );

  if( it != property_strings.end() ) {
    const char *prop = gsasl_property_fast( sc->m_session, it->second );

    if( prop == NULL )
      return Null();
    return String::New( prop );
  }

  return Null();
}

Handle<Value>
ServerSession::SetSaslProperty( const Arguments &args )
{
  ServerSession *sc = Unwrap<ServerSession>( args.This() );
  ENSURE_STARTED( sc );

  if( args.Length() < 1 || !args[0]->IsString() ) {
    return ThrowException( Exception::TypeError( String::New( "Expect property name as first argument" ) ) );
  }

  String::AsciiValue key( args[0]->ToString() );

  if( args.Length() < 2 || !args[1]->IsString() ) {
    return ThrowException( Exception::TypeError( String::New( "Expect property value as second argument" ) ) );
  }

  String::AsciiValue val( args[1]->ToString() );

  std::map<std::string, Gsasl_property>::iterator it = property_strings.find( *key );
  if( it != property_strings.end() ) {
    gsasl_property_set( sc->m_session, it->second, *val );
  }

  return Null();
}
}

extern "C" void
init (Handle<Object> target)
{
  HandleScope scope;

  sasljs::ctx = NULL;
  int initres = gsasl_init( &sasljs::ctx );

  if( initres != GSASL_OK ) {
      fprintf( stderr, "Could not initialize gsasl: %s\n", gsasl_strerror( initres ) );
      abort();
  }

  sasljs::property_strings["authid"] =                     GSASL_AUTHID;
  sasljs::property_strings["authzid"] =                    GSASL_AUTHZID;
  sasljs::property_strings["password"] =                   GSASL_PASSWORD;
  sasljs::property_strings["anonymous_token"] =            GSASL_ANONYMOUS_TOKEN;
  sasljs::property_strings["service"] =                    GSASL_SERVICE;
  sasljs::property_strings["hostname"] =                   GSASL_HOSTNAME;
  sasljs::property_strings["gssapi_display_name"] =       GSASL_GSSAPI_DISPLAY_NAME;
  sasljs::property_strings["passcode"] =                   GSASL_PASSCODE;
  sasljs::property_strings["suggested_pin"] =              GSASL_SUGGESTED_PIN;
  sasljs::property_strings["pin"] =                        GSASL_PIN;
  sasljs::property_strings["realm"] =                      GSASL_REALM;
  sasljs::property_strings["digest_md5_hashed_password"] = GSASL_DIGEST_MD5_HASHED_PASSWORD;
  sasljs::property_strings["qops"] =                       GSASL_QOPS;
  sasljs::property_strings["qop"] =                        GSASL_QOP;
  sasljs::property_strings["scram_iter"] =                 GSASL_SCRAM_ITER;
  sasljs::property_strings["scram_salt"] =                 GSASL_SCRAM_SALT;
  sasljs::property_strings["scram_salted_password"] =      GSASL_SCRAM_SALTED_PASSWORD;
  sasljs::property_strings["validate_simple"] =            GSASL_VALIDATE_SIMPLE;
  sasljs::property_strings["validate_external"] =          GSASL_VALIDATE_EXTERNAL;
  sasljs::property_strings["validate_anonymous"] =         GSASL_VALIDATE_ANONYMOUS;
  sasljs::property_strings["validate_gssapi"] =            GSASL_VALIDATE_GSSAPI;
  sasljs::property_strings["validate_securid"] =           GSASL_VALIDATE_SECURID;

  sasljs::ServerSession::Initialize(target);
}
