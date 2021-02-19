import { ARKit } from 'react-native-arkit';
import React from 'react';

export default function DetectedImage ({ position, realityMarkers, eulerAngles }) {
    var children = realityMarkers.map(marker => {
        return <ARKit.Text
          position={marker.position}
          font={{ size: 0.15, depth: 0.0 }}
          text={marker.content}

      >
      </ARKit.Text>
    })
    
   return  <ARKit.Group 
    position={position} 
    eulerAngles={eulerAngles}
   >
      {children}
    </ARKit.Group>
  }
 