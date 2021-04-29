import { ARKit } from 'react-native-arkit';
import React from 'react';
import { View } from "react-native";

export default function DetectedImage ({ position, realityMarkers, eulerAngles}) {
    var children = realityMarkers.map(marker => {
      console.log("imageurl", marker.contentUrl)
        return <ARKit.Image
          position={marker.position}
          imageUrl={marker["contentUrl"]}
      >
      </ARKit.Image>
    })

  return  <View>
    {/* {children} */}
  </View>
  }


      // {/* <ARKit.Text
      //       text={likes}
      //       position={{ x: y, y: x, z: realityMarkers.z }}
      //       font={{ size: 0.15, depth: 0.05 }}
      //     /> */}