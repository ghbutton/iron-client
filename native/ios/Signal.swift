//
//  Bridge.swift
//  libsignal
//
//  Created by Gary Button on 2/11/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SignalProtocol

@objc(Bridge)
class Bridge: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func initialize(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
    let identityKeyPair = try! Signal.generateIdentityKeyPair()
    let registrationId = try! Signal.generateRegistrationId()
    let preKeys = try! Signal.generatePreKeys(start: 1, count: 10)
    let signedPreKey = try! Signal.generate(signedPreKey: 1, identity: identityKeyPair, timestamp: 0)
    let privateKey: String = identityKeyPair.privateKey.base64EncodedString()
    let publicKey: String = identityKeyPair.publicKey.base64EncodedString()
    
    let dic = ["publicKey": publicKey,
               "privateKey": privateKey, "registrationId": registrationId] as [String: Any]
    print(dic)
    do {
      let jsonData = try JSONSerialization.data(withJSONObject: dic, options: .prettyPrinted)
      // here "jsonData" is the dictionary encoded in JSON data
      
      let decoded = try JSONSerialization.jsonObject(with: jsonData, options: [])
      // here "decoded" is of type `Any`, decoded from JSON data
      
      // you can now cast it with the right type
      if let dictFromJSON = decoded as? [String: Any] {
        // use dictFromJSON
        resolve(dictFromJSON)
      } else {
        let error = NSError(domain: "", code: 200, userInfo: nil)
        reject("JSON_ERROR", "Json error", error)
      }
    } catch {
      reject("JSON_ERROR", "Json error", error)
    }
  }
}
