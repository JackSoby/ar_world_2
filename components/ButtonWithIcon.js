import React from 'react';
import { View, TouchableOpacity, Text} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import styles from '.././styles/styles';

export default function ButtonWithIcon ({ condition, style, onPress, buttonContent, parentStyle  }) {
 
    if(condition){
        return  <TouchableOpacity style={parentStyle}
        onPress={onPress}
      > 
      <Text style={style}>
        {buttonContent}
      </Text>
      </TouchableOpacity>
    } else {
        return <View></View>
    }
}
 