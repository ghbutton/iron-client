//
//  Bridge.swift
//  libsignal
//
//  Created by Gary Button on 2/11/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SignalProtocol

typealias Codable = Decodable & Encodable

enum SignalErrors: Error {
  case missingDeviceId
}

class TestPreKeyStore: PreKeyStore {
  var keys = [UInt32 : Data]()
  
  func load(preKey: UInt32) -> Data? {
    return keys[preKey]
  }
  
  func store(preKey: Data, for id: UInt32) -> Bool {
    keys[id] = preKey
    return true
  }
  
  func contains(preKey: UInt32) -> Bool {
    return keys[preKey] != nil
  }
  
  func remove(preKey: UInt32) -> Bool {
    keys[preKey] = nil
    return true
  }
}

class TestIdentityStore: IdentityKeyStore {
  var keys = [SignalAddress : Data]()
  
  var identity: KeyPair?
  
  var registrationId: UInt32?
  
  func identityKeyPair() -> KeyPair? {
    return identity
  }
  
  func localRegistrationId() -> UInt32? {
    return registrationId
  }
  
  func save(identity: Data?, for address: SignalAddress) -> Bool {
    keys[address] = identity
    return true
  }
  
  func isTrusted(identity: Data, for address: SignalAddress) -> Bool? {
    guard let savedIdentity = keys[address] else {
      return true
    }
    return savedIdentity == identity
  }
}

final class TestSessionStore: SessionStore {
  
  var sessions = [SignalAddress : Data]()
  
  var records = [SignalAddress : Data]()
  
  func loadSession(for address: SignalAddress) -> (session: Data, userRecord: Data?)? {
    guard let session = sessions[address] else {
      return nil
    }
    return (session, records[address])
  }
  
  func subDeviceSessions(for name: String) -> [Int32]? {
    return sessions.keys.filter({ $0.name == name }).map { $0.deviceId }
  }
  
  func store(session: Data, for address: SignalAddress, userRecord: Data?) -> Bool {
    sessions[address] = session
    records[address] = userRecord
    return true
  }
  
  func containsSession(for address: SignalAddress) -> Bool {
    return sessions[address] != nil
  }
  
  func deleteSession(for address: SignalAddress) -> Bool? {
    sessions[address] = nil
    records[address] = nil
    return true
  }
  
  func deleteAllSessions(for name: String) -> Int? {
    let matches = sessions.keys.filter({ $0.name == name })
    for item in matches {
      sessions[item] = nil
    }
    return matches.count
  }
}

final class TestSignedPrekeyStore: SignedPreKeyStore {
  var keys = [UInt32 : Data]()
  
  func load(signedPreKey: UInt32) -> Data? {
    return keys[signedPreKey]
  }
  
  func store(signedPreKey: Data, for id: UInt32) -> Bool {
    keys[id] = signedPreKey
    return true
  }
  
  func contains(signedPreKey: UInt32) -> Bool {
    return keys[signedPreKey] != nil
  }
  
  func remove(signedPreKey: UInt32) -> Bool {
    keys[signedPreKey] = nil
    return true
  }
}

@objc(Bridge)
class Bridge: NSObject {
  var _store: SignalStore? = nil
  
  struct BridgeSession: Codable {
    var deviceId: Int32
    var name: String
    var data: String
    var record: String?
  }
  
  struct EncryptPayload: Codable {
    var payload: String
    var preKeyBundles: [BridgePreKeyBundle]
  }
  
  struct DecryptPayload: Codable {
    var encryptedMessage: EncryptedMessage
    var deviceId: Int32
  }
  
  struct BridgePreKeyBundle: Codable {
    var version: Int
    var identityKey: String
    var preKeyPublicKey: String
    var preKeyId: UInt32
    var signedPreKeyPublicKey: String
    var signedPreKeyId: UInt32
    var signature: String
    var registrationId: UInt32
    var deviceId: String?
  }
  
  struct PreKey: Codable {
    var data: String
    var id: UInt32
  }
  
  struct Payload: Codable {
    var preKeys: [PreKey]
    var privateKey: String
    var publicKey: String
    var registrationId: UInt32
    var signedPreKey: String
    var sessions: [BridgeSession]
  }
  
  struct Package: Codable {
    var version: Int
    var payload: Payload
  }
  
  struct EncryptedMessage: Codable {
    var body: String
    var type: Int
  }
  
  struct EncryptedMessageGroup: Codable {
    var messages: [EncryptedMessage]
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func getState(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("GET STATE")
    let _identityKeyPair = _store!.identityKeyStore.identityKeyPair()!
    let _registrationId = _store!.identityKeyStore.localRegistrationId()!
    
    let privateKey64: String = _identityKeyPair.privateKey.base64EncodedString()
    let publicKey64: String = _identityKeyPair.publicKey.base64EncodedString()
    
    let preKeyStrings64 = (_store!.preKeyStore as! TestPreKeyStore).keys.map{ key in PreKey(data: key.value.base64EncodedString(), id: key.key) }
    print(preKeyStrings64)
    let signedKey64 = (_store!.signedPreKeyStore as! TestSignedPrekeyStore).keys[1]!.base64EncodedString()
    let sessionStore = (_store!.sessionStore as! TestSessionStore)
    let sessions = sessionStore.sessions.keys.map{ key in BridgeSession(deviceId: key.deviceId, name: key.name, data: sessionStore.sessions[key]!.base64EncodedString(), record: sessionStore.records[key]?.base64EncodedString()) }
    
    let package = Package(version: 1, payload: Payload(preKeys: preKeyStrings64, privateKey: privateKey64, publicKey: publicKey64, registrationId: _registrationId, signedPreKey: signedKey64, sessions: sessions))
    let jsonData = try! JSONEncoder().encode(package)
    let jsonString = String(data: jsonData, encoding: .utf8)!
    
    resolve(jsonString)
  }
  
  @objc
  func getPreKeyBundle(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("GET PRE KEY BUNDLE")
    let identityKey64: String = _store!.identityKeyStore.identityKeyPair()!.publicKey.base64EncodedString()
    let _registrationId = _store!.identityKeyStore.localRegistrationId()!
    let preKeyStructs = (_store!.preKeyStore as! TestPreKeyStore).keys.map{ key in try! SessionPreKey.init(from: key.value) }.map{ key in ["id": key.id, "publicKey": key.keyPair.publicKey.base64EncodedString()]}
    let signedKey = try! SessionSignedPreKey(from: (_store!.signedPreKeyStore as! TestSignedPrekeyStore).keys[1]!)

    let signedPublicKey64 = signedKey.keyPair.publicKey.base64EncodedString()
    let signedKeyId = signedKey.id
    let signature64 = signedKey.signature.base64EncodedString()
    
    let package = BridgePreKeyBundle(version: 1, identityKey: identityKey64, preKeyPublicKey: preKeyStructs.first!["publicKey"] as! String, preKeyId: preKeyStructs.first!["id"] as! UInt32, signedPreKeyPublicKey: signedPublicKey64, signedPreKeyId: signedKeyId, signature: signature64, registrationId: _registrationId, deviceId: nil)
    let jsonData = try! JSONEncoder().encode(package)
    let jsonString = String(data: jsonData, encoding: .utf8)!
    resolve(jsonString)
  }
  
  @objc
  func initialize(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("BRIDGE INIT")
    let _myIdentityStore: TestIdentityStore = TestIdentityStore()
    let _myPreKeyStore: TestPreKeyStore = TestPreKeyStore()
    let _mySessionStore: TestSessionStore = TestSessionStore()
    let _mySignedPrekeyStore: TestSignedPrekeyStore = TestSignedPrekeyStore()
    
    _store = try! SignalStore(
      identityKeyStore: _myIdentityStore,
      preKeyStore: _myPreKeyStore,
      sessionStore: _mySessionStore,
      signedPreKeyStore: _mySignedPrekeyStore,
      senderKeyStore: nil)
    
    (_store!.identityKeyStore as! TestIdentityStore).identity = try! Signal.generateIdentityKeyPair()
    (_store!.identityKeyStore as! TestIdentityStore).registrationId = try! Signal.generateRegistrationId()
    let _preKeys = try! Signal.generatePreKeys(start: 1, count: 1)
    
    for key in _preKeys {
      _ = _store!.preKeyStore.store(preKey: try! key.data(), for: key.id)
    }

    let signedPreKey = try! Signal.generate(signedPreKey: 1, identity: _store!.identityKeyStore.identityKeyPair()!, timestamp: 0)
    
    (_store!.signedPreKeyStore as! TestSignedPrekeyStore).keys[signedPreKey.id] = try! signedPreKey.data()

    resolve(true)
  }
  
  @objc
  func decryptPayload(
    _ payload: String,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("DECRYPT PAYLOAD")
    
    let decryptPayloadData = payload.data(using: .utf8)!
    let decryptPayload = try! JSONDecoder().decode(DecryptPayload.self, from: decryptPayloadData)
    
    let remoteAddress = SignalAddress(name: "\(decryptPayload.deviceId)", deviceId: decryptPayload.deviceId)
    let ownSessionCipher = SessionCipher(for: remoteAddress, in: _store!)
    
    
    var decryptedMessage:Data?
    
    if decryptPayload.encryptedMessage.type == 3 {
      decryptedMessage = try! ownSessionCipher.decrypt(preKeySignalMessage: Data(base64Encoded: decryptPayload.encryptedMessage.body)!)
    } else {
      decryptedMessage = try! ownSessionCipher.decrypt(signalMessage: Data(base64Encoded: decryptPayload.encryptedMessage.body)!)
    }
    
    resolver(decryptedMessage!.base64EncodedString())
  }
  
  @objc
  func encryptPayload(
    _ payload: String,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("ENCRYPT PAYLOAD")

    let encryptPayloadData = payload.data(using: .utf8)!
    let encryptPayload = try! JSONDecoder().decode(EncryptPayload.self, from: encryptPayloadData)
    
    let messages = try! encryptPayload.preKeyBundles.map{ preKeyBundle -> EncryptedMessage in
      if (preKeyBundle.deviceId == nil) {
        throw SignalErrors.missingDeviceId
      }
      
      let deviceId = Int32(preKeyBundle.deviceId!)!
      let address = SignalAddress(name: preKeyBundle.deviceId!, deviceId: deviceId)
      
      let retrievedBundle = SessionPreKeyBundle.init(registrationId: preKeyBundle.registrationId, deviceId: deviceId, preKeyId: preKeyBundle.preKeyId, preKey: Data(base64Encoded: preKeyBundle.preKeyPublicKey)!, signedPreKeyId: preKeyBundle.signedPreKeyId, signedPreKey: Data(base64Encoded: preKeyBundle.signedPreKeyPublicKey)!, signature: Data(base64Encoded: preKeyBundle.signature)!, identityKey: Data(base64Encoded: preKeyBundle.identityKey)!)

      try SessionBuilder(for: address, in: _store!).process(preKeyBundle: retrievedBundle)
      /* Create the session cipher and encrypt the message */
      let cipher = SessionCipher(for: address, in: _store!)
      let encryptedMessage = try cipher.encrypt(encryptPayload.payload.data(using: .utf8)!)
      print(encryptedMessage)
      
      var type = 1
      if (encryptedMessage.type == CiphertextMessage.MessageType.preKey) {
        type = 3;
      }
      return EncryptedMessage(body: encryptedMessage.message.base64EncodedString(), type: type)
    }
    let group = EncryptedMessageGroup(messages: messages)
    let jsonData = try! JSONEncoder().encode(group)
    let jsonString = String(data: jsonData, encoding: .utf8)!
    resolver(jsonString)
  }
  
  @objc
  func loadFromDisk(
    _ payload: String,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("BRIDGE LOAD")
    
    let _myIdentityStore: TestIdentityStore = TestIdentityStore()
    let _myPreKeyStore: TestPreKeyStore = TestPreKeyStore()
    let _mySessionStore: TestSessionStore = TestSessionStore()
    let _mySignedPrekeyStore: TestSignedPrekeyStore = TestSignedPrekeyStore()
    
    _store = try! SignalStore(
      identityKeyStore: _myIdentityStore,
      preKeyStore: _myPreKeyStore,
      sessionStore: _mySessionStore,
      signedPreKeyStore: _mySignedPrekeyStore,
      senderKeyStore: nil)
    
    let payloadData = payload.data(using: .utf8)!
    let package = try! JSONDecoder().decode(Package.self, from: payloadData)

    let privateKey = Data(base64Encoded: package.payload.privateKey)!
    let publicKey = Data(base64Encoded: package.payload.publicKey)!
    let signedPreKeyData = Data(base64Encoded: package.payload.signedPreKey)!

    (_store!.identityKeyStore as! TestIdentityStore).identity = KeyPair(publicKey: publicKey, privateKey: privateKey)
    (_store!.identityKeyStore as! TestIdentityStore).registrationId = UInt32(package.payload.registrationId)
    
    (_store!.signedPreKeyStore as! TestSignedPrekeyStore).keys[1] = signedPreKeyData
    (_store!.preKeyStore as! TestPreKeyStore).keys = package.payload.preKeys.reduce(into: [UInt32: Data]()){ acc, preKey64 in acc[preKey64.id] = Data(base64Encoded: preKey64.data)! }
    
    print((_store!.preKeyStore as! TestPreKeyStore).keys)
    
    (_store!.sessionStore as! TestSessionStore).sessions = package.payload.sessions.reduce(into: [SignalAddress: Data]()) { acc, bridgeSession in
      acc[SignalAddress(name: bridgeSession.name, deviceId: bridgeSession.deviceId)] = Data(base64Encoded: bridgeSession.data)!
      
    }
    (_store!.sessionStore as! TestSessionStore).records = package.payload.sessions.reduce(into: [SignalAddress: Data]()) { acc, bridgeSession in
      if let record = bridgeSession.record {
        acc[SignalAddress(name: bridgeSession.name, deviceId: bridgeSession.deviceId)] = Data(base64Encoded: record)
      }
    }
    
    print(_store!.sessionStore as! TestSessionStore)
    
    resolver(true)
  }
}
