//
//  SignalStorage.swift
//  ironnotice
//
//  Created by Gary Button on 2/22/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation
import SignalProtocol

public final class TestPreKeyStore: PreKeyStore {
  var keys = [UInt32 : Data]()
  var currentKeyId = UInt32(0)
  
  public func load(preKey: UInt32) -> Data? {
    return keys[preKey]
  }
  
  public func store(preKey: Data, for id: UInt32) -> Bool {
    keys[id] = preKey
    return true
  }
  
  public func contains(preKey: UInt32) -> Bool {
    return keys[preKey] != nil
  }
  
  public func remove(preKey: UInt32) -> Bool {
    keys[preKey] = nil
    return true
  }
}

public final class TestIdentityStore: IdentityKeyStore {
  var keys = [SignalAddress : Data]()
  
  var identity: KeyPair?
  
  var registrationId: UInt32?
  
  public func identityKeyPair() -> KeyPair? {
    return identity
  }
  
  public func localRegistrationId() -> UInt32? {
    return registrationId
  }
  
  public func save(identity: Data?, for address: SignalAddress) -> Bool {
    keys[address] = identity
    return true
  }
  
  public func isTrusted(identity: Data, for address: SignalAddress) -> Bool? {
    guard let savedIdentity = keys[address] else {
      return true
    }
    return savedIdentity == identity
  }
}

public final class TestSessionStore: SessionStore {
  var sessions = [SignalAddress : Data]()
  var records = [SignalAddress : Data]()
  
  public func loadSession(for address: SignalAddress) -> (session: Data, userRecord: Data?)? {
    guard let session = sessions[address] else {
      return nil
    }
    return (session, records[address])
  }
  
  public func subDeviceSessions(for name: String) -> [Int32]? {
    return sessions.keys.filter({ $0.name == name }).map { $0.deviceId }
  }
  
  public func store(session: Data, for address: SignalAddress, userRecord: Data?) -> Bool {
    sessions[address] = session
    records[address] = userRecord
    return true
  }
  
  public func containsSession(for address: SignalAddress) -> Bool {
    return sessions[address] != nil
  }
  
  public func deleteSession(for address: SignalAddress) -> Bool? {
    sessions[address] = nil
    records[address] = nil
    return true
  }
  
  public func deleteAllSessions(for name: String) -> Int? {
    let matches = sessions.keys.filter({ $0.name == name })
    for item in matches {
      sessions[item] = nil
    }
    return matches.count
  }
}

public final class TestSignedPrekeyStore: SignedPreKeyStore {
  var keys = [UInt32 : Data]()
  var currentKeyId = UInt32(0)
  
  public func load(signedPreKey: UInt32) -> Data? {
    return keys[signedPreKey]
  }
  
  public func store(signedPreKey: Data, for id: UInt32) -> Bool {
    keys[id] = signedPreKey
    return true
  }
  
  public func contains(signedPreKey: UInt32) -> Bool {
    return keys[signedPreKey] != nil
  }
  
  public func remove(signedPreKey: UInt32) -> Bool {
    keys[signedPreKey] = nil
    return true
  }
}
