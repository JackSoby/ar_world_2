import { ARKit } from 'react-native-arkit';
import React from 'react';

export default function DetectedImage ({ position, realityMarkers, eulerAngles}) {
    var children = realityMarkers.map(marker => {
      console.log("imageurl", marker)
        return<ARKit.Image

          position={marker.position}
          font={{ size: 0.15, depth: 0.0 }}
          text={"arkit is sooo"}
          imageUrl={marker["contentUrl"]}
      >
      </ARKit.Image>
    })

  return  <ARKit.Group 
  position={position} 
  eulerAngles={eulerAngles}
 >
    {children}
  </ARKit.Group>
  }
