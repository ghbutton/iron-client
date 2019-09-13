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

@objc(Bridge)
class Bridge: NSObject {
  var identityKeyPair: KeyPair!;
  var registrationId: UInt32!;
  var preKeys: [SessionPreKey] = [];
  var signedPreKey: SessionSignedPreKey!;
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func getState(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    let privateKey64: String = identityKeyPair.privateKey.base64EncodedString()
    let publicKey64: String = identityKeyPair.publicKey.base64EncodedString()
    let preKeyStrings64 = preKeys.map{ key in try! key.data().base64EncodedString() }
    let signedKey64 = try! signedPreKey.data().base64EncodedString()
    
    let package = Package(version: 1, payload: Payload(preKeys: preKeyStrings64, privateKey: privateKey64, publicKey: publicKey64, registrationId: Int(registrationId), signedPreKey: signedKey64))
    let jsonData = try! JSONEncoder().encode(package)
    let jsonString = String(data: jsonData, encoding: .utf8)!
    resolve(jsonString)
  }
  
  struct PreKeyBundle: Codable {
    var version: Int
    var identityKey: String
    var preKeyPublicKey: String
    var preKeyId: Int
    var signedPreKeyPublicKey: String
    var signedPreKeyId: Int
    var signature: String
    var registrationId: Int
  }
  
  @objc
  func getPreKeyBundle(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("GET PRE KEY BUNDLE")
    let identityKey64: String = identityKeyPair.publicKey.base64EncodedString()
    let preKeyStructs = preKeys.map{ key in ["id": key.id, "publicKey": key.keyPair.publicKey.base64EncodedString()] }
    let signedPublicKey64 = signedPreKey.keyPair.publicKey.base64EncodedString()
    let signedKeyId = signedPreKey.id;
    let signature64 = signedPreKey.signature.base64EncodedString()
    
    let package = PreKeyBundle(version: 1, identityKey: identityKey64, preKeyPublicKey: preKeyStructs.first!["publicKey"] as! String, preKeyId: Int(preKeyStructs.first!["id"] as! UInt32), signedPreKeyPublicKey: signedPublicKey64, signedPreKeyId: Int(signedKeyId), signature: signature64, registrationId: Int(registrationId))
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
    identityKeyPair = try! Signal.generateIdentityKeyPair()
    registrationId = try! Signal.generateRegistrationId()
    preKeys = try! Signal.generatePreKeys(start: 1, count: 1)
    signedPreKey = try! Signal.generate(signedPreKey: 1, identity: identityKeyPair, timestamp: 0)
    resolve(true)
  }
  
  struct Payload: Codable {
    var preKeys: [String]
    var privateKey: String
    var publicKey: String
    var registrationId: Int
    var signedPreKey: String
  }
  
  struct Package: Codable {
    var version: Int
    var payload: Payload
  }
  
  @objc
  func loadFromDisk(
    _ payload: String,
    resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    print("BRIDGE LOAD")
    let payloadData = payload.data(using: .utf8)!
    let package = try! JSONDecoder().decode(Package.self, from: payloadData)

    let privateKey = Data(base64Encoded: package.payload.privateKey)!
    let publicKey = Data(base64Encoded: package.payload.publicKey)!
    let signedPreKeyData = Data(base64Encoded: package.payload.signedPreKey)!

    identityKeyPair = KeyPair(publicKey: publicKey, privateKey: privateKey)
    registrationId = UInt32(package.payload.registrationId)
    signedPreKey = try! SessionSignedPreKey(from: signedPreKeyData)
    preKeys = package.payload.preKeys.map{ preKey64 in try! SessionPreKey(from: Data(base64Encoded: preKey64)!) }
    
    resolver(true)
  }
}
