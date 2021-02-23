import { ARKit } from 'react-native-arkit';
import React from 'react';

export default function DetectedImage ({ position, realityMarkers, eulerAngles }) {
    var children = realityMarkers.map(marker => {
      <ARKit.Image
        position={marker.position}
        imageUrl={marker.content_url}
      />
    })
    
   return  <ARKit.Group 
    position={position} 
    eulerAngles={eulerAngles}
   >
      {children}
    </ARKit.Group>
  }
 