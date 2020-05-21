# Native builds for iron notice

## Install ios
$ yarn install
$ cd ios
$ pod install
$ git clone git@github.com:ghbutton/libsignal-protocol-swift.git
$ cd ..

## Running iOS
$ yarn start
$ #use xcode to launch, add SignalProtocol framework to project

## Building iOS for production
$ yarn build:ios
$ # use xcode to create a release
