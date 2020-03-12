// EventManager.m
#import "EventManager.h"

@implementation EventManager

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"loaded_no_user", @"loaded_with_user", @"new_message"];
}

@end
