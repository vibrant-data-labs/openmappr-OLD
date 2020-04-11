#!/bin/bash
# 
# This script assumes you have nothing installed. It will skip over anything you don't need.
# 
#
#
# Install Xcode as unattended first

# Accept EULA so there is no prompt

if [[ -e "/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild" ]]; then
  "/Applications/Xcode.app/Contents/Developer/usr/bin/xcodebuild" -license accept
fi

# Just in case the xcodebuild command above fails to accept the EULA, set the license acceptance info 
# in /Library/Preferences/com.apple.dt.Xcode.plist. For more details on this, see Tim Sutton's post: 
# http://macops.ca/deploying-xcode-the-trick-with-accepting-license-agreements/

if [[ -e "/Applications/Xcode.app/Contents/Resources/LicenseInfo.plist" ]]; then

   xcode_version_number=`/usr/bin/defaults read "/Applications/Xcode.app/Contents/"Info CFBundleShortVersionString`
   xcode_build_number=`/usr/bin/defaults read "/Applications/Xcode.app/Contents/Resources/"LicenseInfo licenseID`
   xcode_license_type=`/usr/bin/defaults read "/Applications/Xcode.app/Contents/Resources/"LicenseInfo licenseType`

   if [[ "${xcode_license_type}" == "GM" ]]; then
       /usr/bin/defaults write "/Library/Preferences/"com.apple.dt.Xcode IDEXcodeVersionForAgreedToGMLicense "$xcode_version_number"
       /usr/bin/defaults write "/Library/Preferences/"com.apple.dt.Xcode IDELastGMLicenseAgreedTo "$xcode_build_number"
    else
       /usr/bin/defaults write "/Library/Preferences/"com.apple.dt.Xcode IDEXcodeVersionForAgreedToBetaLicense "$xcode_version_number"
       /usr/bin/defaults write "/Library/Preferences/"com.apple.dt.Xcode IDELastBetaLicenseAgreedTo "$xcode_build_number"
   fi       

fi

# DevToolsSecurity tool to change the authorization policies, such that a user who is a
# member of either the admin group or the _developer group does not need to enter an additional
# password to use the Apple-code-signed debugger or performance analysis tools.

/usr/sbin/DevToolsSecurity -enable

# Add all users to developer group, if they're not admins

/usr/sbin/dseditgroup -o edit -a everyone -t group _developer

# If you have multiple versions of Xcode installed, specify which one you want to be current.

/usr/bin/xcode-select --switch /Applications/Xcode.app

# Bypass Gatekeeper verification for Xcode, which can take awhile.

if [[ -e "/Applications/Xcode.app" ]]; then xattr -dr com.apple.quarantine /Applications/Xcode.app
fi

# Install Mobile Device Packages so there is no prompt

if [[ -e "/Applications/Xcode.app/Contents/Resources/Packages/MobileDevice.pkg" ]]; then
  /usr/sbin/installer -dumplog -verbose -pkg "/Applications/Xcode.app/Contents/Resources/Packages/MobileDevice.pkg" -target /
fi

if [[ -e "/Applications/Xcode.app/Contents/Resources/Packages/MobileDeviceDevelopment.pkg" ]]; then
  /usr/sbin/installer -dumplog -verbose -pkg "/Applications/Xcode.app/Contents/Resources/Packages/MobileDeviceDevelopment.pkg" -target /
fi

# Install XcodeSystemResources.pkg so there is no prompt

if [[ -e "/Applications/Xcode.app/Contents/Resources/Packages/XcodeSystemResources.pkg" ]]; then
  /usr/sbin/installer -dumplog -verbose -pkg "/Applications/Xcode.app/Contents/Resources/Packages/XcodeSystemResources.pkg" -target /
fi

exit 0

####################

echo installing homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

echo installing nvm
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.1/install.sh | bash

# reload the system environment
echo Reloading system environment
source ~/.zshrc

# Install
echo Installing NodeJS v8.12.0
nvm install 8.12.0

 

echo installing docker
brew install docker 

echo installing dependencies
brew install git curl

echo cloning openmappr repo
git clone https://github.com/selfhostedofficial/openmappr
cd openmappr


echo installing gems
echo compass:
gem install compass

clear

echo installing bower and grunt 

sudo npm install -g yo bower grunt-cli
npm install
bower install

clear

echo building app

grunt

echo running server at PORT: http://localhost:8080
./run_local_mode.sh

# Open a browser window
echo opening https://localhost:8080
open https://localhost:8080