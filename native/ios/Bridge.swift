//
//  Bridge.swift
//  libsignal
//
//  Created by Gary Button on 2/11/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation
import SignalProtocol

@objc class Bridge: NSObject {
  @objc func initialize() {
    print("Init")
    let identityKeyPair = try! Signal.generateIdentityKeyPair()
    print(identityKeyPair)
  }
}

