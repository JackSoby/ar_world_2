import React, { useState, useEffect } from "react";

import signUp from "../.././utils/requests";
import { View, Text, StyleSheet, Label, TextInput, Button} from "react-native";
import styles from "../.././styles/styles";


export default function Login ({  }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");


    function newUser(){
        signUp({username: username, password: password, passwordConfirm: passwordConfirm})
    }
    return (  
        <View
            style={{            
                backgroundColor: 'blue',
            }}
        >
        <View 
            style={{
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center'}}>
                <TextInput
                 style={styles.userName}
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}

                >
                </TextInput>     
     </View>
     <View style={{
            top: 60, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center'}}>
                <TextInput
                 style={styles.userName}
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}

                >
                </TextInput>     
     </View>
     <View style={{
            top: 120, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center'}}>
                <TextInput
                 style={styles.userName}
                 value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                >
                </TextInput>     
     </View>
     <View style={{
            top: 100, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center'}}>
            <Button title={"Submit"} onPress={newUser}>
                
            </Button>   
     </View>
     </View>
    )
}
