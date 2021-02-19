import { ARKit } from 'react-native-arkit';
import React from 'react';
import { View} from 'react-native';

export default function PictureBox ({ currentImageUrl }) {
 
    if(currentImageUrl != ""){
        return  <View>
        <ARKit.Box
            position={{ x: -0.6, y: 0, z: -1 }}
            eulerAngles={{x: 0, y: 0, z: 0}}
            shape={{ width: 0.1, height: 2.5}}
            />
            <ARKit.Box
            position={{ x: 0.6, y: 0, z: -1 }}
            eulerAngles={{x: 0, y: 0, z: 0}}
            shape={{ width: 0.1, height: 2.5}}
            />
            <ARKit.Box
            position={{ x: 0, y: 1.196, z: -1 }}
            eulerAngles={{x: 0, y: 0, z: 0}}
            shape={{ width: 0.1, height: 1.3}}
            eulerAngles={{x: 0, y:0, z: 4.7}}
            />
            <ARKit.Box
            position={{ x: 0, y: -1.197, z: -1 }}
            eulerAngles={{x: 0, y: 0, z: 0}}
            shape={{ width: 0.1, height: 1.3}}
            eulerAngles={{x: 0, y:0, z: 4.7}}
            />
        </View>
    } else {
        return <View></View>
    }
}
 