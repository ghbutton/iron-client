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

@objc(Bridge)
class Bridge: NSObject {
  var _store: SignalStore!
  
  struct BridgeSession: Codable {
    var deviceId: Int32
    var name: String
    var data: String
    var record: String?
  }
  
//  struct EncryptPayload: Codable {
//    var payload: String
//    var preKeyBundles: [BridgePreKeyBundle]
//  }
  
  struct DecryptPayload: Codable {
    var encryptedMessage: EncryptedMessage
    var deviceId: Int32
  }
  
  struct BridgePreKeyBundle: Codable {
    var preKey: PublicPreKey?
    var signedPreKey: PublicSignedPreKey
    var identityKey: PublicIdentityKey
    var registrationId: UInt32
  }
 
  struct PublicIdentityKey: Codable {
    var publicKey: String
  }
  
  struct PublicSignedPreKey: Codable {
    var publicKey: String
    var keyId: UInt32
    var signature: String
  }
  
  struct PublicPreKey: Codable {
    var keyId: UInt32
    var publicKey: String
  }
  
  struct PreKey: Codable {
    var data: String
    var id: UInt32
  }
  
  struct SignedPreKey: Codable {
    var data: String
    var id: UInt32
  }
  
  struct IdentityKey: Codable {
    var publicKey: String
    var privateKey: String
  }
  
  struct StoreData: Codable {
    var preKeys: [PreKey]
    var identityKey: IdentityKey
    var registrationId: UInt32
    var currentSignedPreKey: UInt32
    var currentPreKey: UInt32
    var signedPreKeys: [SignedPreKey]
    var sessions: [BridgeSession]
  }
  
  struct Package: Codable {
    var version: Int
    var payload: StoreData
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
  
  func addressName(_ deviceId: Int) -> String {
    return "session\(deviceId).\(deviceId)"
  }
  
  @objc
  func getState(
    _ resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("GET STATE")
    let _identityKeyPair = _store!.identityKeyStore.identityKeyPair()!
    let _registrationId = _store!.identityKeyStore.localRegistrationId()!
    
    let privateKey64: String = _identityKeyPair.privateKey.base64EncodedString()
    let publicKey64: String = _identityKeyPair.publicKey.base64EncodedString()
    
    let preKeyStore = (_store!.preKeyStore as! TestPreKeyStore)
    let preKeyStrings64 = preKeyStore.keys.map{ key in PreKey(data: key.value.base64EncodedString(), id: key.key) }
    let signedKeyStore = (_store!.signedPreKeyStore as! TestSignedPrekeyStore)
    let signedKeys64 = signedKeyStore.keys.map{ key in SignedPreKey(data: key.value.base64EncodedString(), id: key.key)}
    let sessionStore = (_store!.sessionStore as! TestSessionStore)
    let sessions = sessionStore.sessions.keys.map{ key in BridgeSession(deviceId: key.deviceId, name: key.name, data: sessionStore.sessions[key]!.base64EncodedString(), record: sessionStore.records[key]?.base64EncodedString()) }
    
    let package = Package(version: 1, payload: StoreData(preKeys: preKeyStrings64, identityKey: IdentityKey(publicKey: privateKey64, privateKey: publicKey64), registrationId: _registrationId, currentSignedPreKey: signedKeyStore.currentKeyId, currentPreKey: preKeyStore.currentKeyId, signedPreKeys: signedKeys64, sessions: sessions))
    let jsonData = try! JSONEncoder().encode(package)
    let jsonString = String(data: jsonData, encoding: .utf8)!
    
    resolver(jsonString)
  }
  
  @objc
  func getRegistrationId(
    _ resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    let registrationId = _store!.identityKeyStore.localRegistrationId()!
    resolver(registrationId)
  }
  
  @objc
  func getIdentityPublicKey(
    _ resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    let identityKey64: String = _store!.identityKeyStore.identityKeyPair()!.publicKey.base64EncodedString()
    resolver(identityKey64)
  }
  
  @objc
  func generatePreKeys(
    _ count: NSInteger,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock) -> Void {
    let preKeyStore = (_store!.preKeyStore as! TestPreKeyStore)
    let preKeys = try! Signal.generatePreKeys(start: preKeyStore.currentKeyId + 1, count: count)
    
    for key in preKeys {
      _ = preKeyStore.store(preKey: try! key.data(), for: key.id)
    }
    
    preKeyStore.currentKeyId = preKeyStore.currentKeyId + UInt32(count)
    
    let jsonData = try! JSONEncoder().encode(preKeys.map{ PublicPreKey(keyId: $0.id, publicKey: $0.keyPair.publicKey.base64EncodedString()) })
    let jsonString = String(data: jsonData, encoding: .utf8)!
    
    resolver(jsonString)
  }
  
  @objc
  func generateSignedPreKey(
    _ timestamp: NSInteger,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock) -> Void {
    let signedKeyStore = (_store!.signedPreKeyStore as! TestSignedPrekeyStore)
    let keyId = signedKeyStore.currentKeyId + 1
    let signedPreKey = try! Signal.generate(signedPreKey: UInt32(keyId), identity: _store!.identityKeyStore.identityKeyPair()!, timestamp: UInt64(timestamp))
    
    let jsonData = try! JSONEncoder().encode(PublicSignedPreKey(publicKey: signedPreKey.keyPair.publicKey.base64EncodedString(), keyId: signedPreKey.id, signature: signedPreKey.signature.base64EncodedString()))
    let jsonString = String(data: jsonData, encoding: .utf8)!
    
    let data = try! signedPreKey.data()
    
    signedKeyStore.keys[signedPreKey.id] = data
    signedKeyStore.currentKeyId = keyId
    
    resolver(jsonString)
  }
  
  @objc
  func initialize(
    _ resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("BRIDGE INIT")
    // Identity key and registration id
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

    resolver(true)
  }
  
  @objc
  func processPreKeyBundle(
    _ deviceId: NSInteger,
    payload: String,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    
    let preKeyBundle = try! JSONDecoder().decode(BridgePreKeyBundle.self, from: payload.data(using: .utf8)!)
    let deviceId = Int(deviceId)
    let name = addressName(deviceId)
    let address = SignalAddress(name: name, deviceId: Int32(deviceId))
    let preKeyId = preKeyBundle.preKey?.keyId ?? 0
    
    let retrievedBundle = SessionPreKeyBundle(registrationId: preKeyBundle.registrationId, deviceId: Int32(deviceId), preKeyId: preKeyId, preKey: Data(base64Encoded: preKeyBundle.preKey!.publicKey)!, signedPreKeyId: preKeyBundle.signedPreKey.keyId, signedPreKey: Data(base64Encoded: preKeyBundle.signedPreKey.publicKey)!, signature: Data(base64Encoded: preKeyBundle.signedPreKey.signature)!, identityKey: Data(base64Encoded: preKeyBundle.identityKey.publicKey)!)
    
    try! SessionBuilder(for: address, in: _store!).process(preKeyBundle: retrievedBundle)
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
  func hasSession(
    _ deviceId: NSInteger,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("HAS SESSION")
    let name = addressName(deviceId)
    let address = SignalAddress(name: name, deviceId: Int32(deviceId))
    let sessionStore = (_store!.sessionStore as! TestSessionStore)
    resolver(sessionStore.containsSession(for: address))
  }
  
  @objc
  func encryptPayload(
    _ payload: String,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("ENCRYPT PAYLOAD")
//
//    let encryptPayloadData = payload.data(using: .utf8)!
//    let encryptPayload = try! JSONDecoder().decode(EncryptPayload.self, from: encryptPayloadData)
//
//    let messages = try! encryptPayload.preKeyBundles.map{ preKeyBundle -> EncryptedMessage in
//      if (preKeyBundle.deviceId == nil) {
//        throw SignalErrors.missingDeviceId
//      }
//
//      let deviceId = Int32(preKeyBundle.deviceId!)!
//      let address = SignalAddress(name: preKeyBundle.deviceId!, deviceId: deviceId)
//
//      let retrievedBundle = SessionPreKeyBundle.init(registrationId: preKeyBundle.registrationId, deviceId: deviceId, preKeyId: preKeyBundle.preKeyId, preKey: Data(base64Encoded: preKeyBundle.preKeyPublicKey)!, signedPreKeyId: preKeyBundle.signedPreKeyId, signedPreKey: Data(base64Encoded: preKeyBundle.signedPreKeyPublicKey)!, signature: Data(base64Encoded: preKeyBundle.signature)!, identityKey: Data(base64Encoded: preKeyBundle.identityKey)!)
//
//      try SessionBuilder(for: address, in: _store!).process(preKeyBundle: retrievedBundle)
//      /* Create the session cipher and encrypt the message */
//      let cipher = SessionCipher(for: address, in: _store!)
//      let encryptedMessage = try cipher.encrypt(encryptPayload.payload.data(using: .utf8)!)
//      print(encryptedMessage)
//
//      var type = 1
//      if (encryptedMessage.type == CiphertextMessage.MessageType.preKey) {
//        type = 3;
//      }
//      return EncryptedMessage(body: encryptedMessage.message.base64EncodedString(), type: type)
//    }
//    let group = EncryptedMessageGroup(messages: messages)
//    let jsonData = try! JSONEncoder().encode(group)
//    let jsonString = String(data: jsonData, encoding: .utf8)!
//    resolver(jsonString)
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

    let privateKey = Data(base64Encoded: package.payload.identityKey.privateKey)!
    let publicKey = Data(base64Encoded: package.payload.identityKey.publicKey)!

    let identityStore = (_store!.identityKeyStore as! TestIdentityStore)
    identityStore.identity = KeyPair(publicKey: publicKey, privateKey: privateKey)
    (_store!.identityKeyStore as! TestIdentityStore).registrationId = UInt32(package.payload.registrationId)
    
    let signedPreKeyStore = (_store!.signedPreKeyStore as! TestSignedPrekeyStore)
    signedPreKeyStore.keys = package.payload.signedPreKeys.reduce(into: [UInt32: Data]()) {
      acc, signedPreKey in acc[signedPreKey.id] = Data(base64Encoded: signedPreKey.data)!
    }
    signedPreKeyStore.currentKeyId = package.payload.currentSignedPreKey
    
    let preKeyStore = (_store!.preKeyStore as! TestPreKeyStore)
    preKeyStore.keys = package.payload.preKeys.reduce(into: [UInt32: Data]()){ acc, preKey64 in acc[preKey64.id] = Data(base64Encoded: preKey64.data)! }
    
    preKeyStore.currentKeyId = package.payload.currentPreKey
    
    (_store!.sessionStore as! TestSessionStore).sessions = package.payload.sessions.reduce(into: [SignalAddress: Data]()) { acc, bridgeSession in
      acc[SignalAddress(name: bridgeSession.name, deviceId: bridgeSession.deviceId)] = Data(base64Encoded: bridgeSession.data)!
      
    }
    (_store!.sessionStore as! TestSessionStore).records = package.payload.sessions.reduce(into: [SignalAddress: Data]()) { acc, bridgeSession in
      if let record = bridgeSession.record {
        acc[SignalAddress(name: bridgeSession.name, deviceId: bridgeSession.deviceId)] = Data(base64Encoded: record)
      }
    }
    
    resolver(true)
  }
}
