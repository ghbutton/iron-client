//
//  Bridge.m
//  libsignal
//
//  Created by Gary Button on 8/29/19.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(Bridge, NSObject)

RCT_EXTERN_METHOD(
                  initialize: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

@end
