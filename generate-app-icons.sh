#!/bin/bash

if [ ! -f resources/ios/icon/icon-60@3x.png ] || [ resources/icon-res.svg -nt resources/ios/icon/icon-60@3x.png ] || [ $0 -nt resources/ios/icon/icon-60@3x.png ] ; then
  cat <<EOF > tmp/app-icon-datafile.json
[
    {
        "input": "../resources/icon-res.svg",
        "output": [
              "../resources/ios/icon/icon-60@3x.png 180:180" , "../resources/ios/icon/icon-60@2x.png 120:120", "../resources/ios/icon/icon-60.png 60:60"
            , "../resources/ios/icon/icon-72.png 72:72", "../resources/ios/icon/icon-72@2x.png 144:144"
            , "../resources/ios/icon/icon-76.png 76:76", "../resources/ios/icon/icon-76@2x.png 152:152"
            , "../resources/ios/icon/icon-40.png 40:40", "../resources/ios/icon/icon-40@2x.png 80:80"
            , "../resources/ios/icon/icon-50.png 50:50", "../resources/ios/icon/icon-50@2x.png 100:100"
            , "../resources/ios/icon/icon.png 57:57", "../resources/ios/icon/icon@2x.png 114:114"
            , "../resources/ios/icon/icon-small.png 29:29", "../resources/ios/icon/icon-small@2x.png 58:58", "../resources/ios/icon/icon-small@3x.png 87:87"
            , "../resources/android/icon/drawable-hdpi-icon.png 72 x 72"
            , "../resources/android/icon/drawable-ldpi-icon.png 36:36"
            , "../resources/android/icon/drawable-mdpi-icon.png 48:48"
            , "../resources/android/icon/drawable-xhdpi-icon.png 96:96"
            , "../resources/android/icon/drawable-xxhdpi-icon.png 144:144"
            , "../resources/android/icon/drawable-xxxhdpi-icon.png 192:192"
            , "../resources/android/icon/drawable-hires-icon.png 512:512"
        ]
    }
]
EOF
  node_modules/svgexport/bin/index.js tmp/app-icon-datafile.json
fi
