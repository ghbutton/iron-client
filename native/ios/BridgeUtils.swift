//
//  Utils.swift
//  ironnotice
//
//  Created by Gary Button on 5/3/20.
//  Copyright © 2020 Facebook. All rights reserved.
//

import Foundation

@objc(BridgeUtils)
class BridgeUtils: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func isSimulator(
    _ resolver: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
      #if targetEnvironment(simulator)
        resolver(true)
      #else
        resolver(false)
      #endif
  }
}
