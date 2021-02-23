/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Button, ScrollView, Image } from "react-native";
import { ARKit } from "react-native-arkit";
import DetectedImage from "./components/DetectedImage";
import PictureBox from "./components/PictureBox";
import ButtonWithIcon from "./components/ButtonWithIcon";
import { RNS3 } from "react-native-aws3";
import { AMAZON_KEY, AMAZON_SECRET } from "@env"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faTimes,
  faPlus,
  faMinus,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./styles/styles";
import getImages from "./utils/requests";
import ImagePicker from 'react-native-image-picker';

var uuid = require("react-native-uuid");

export default function App({}) {
  const [text, setText] = useState("");
  const [currentTrackedId, setCurrentTrackedId] = useState(null);
  const [realityMarkers, setRealityMarkers] = useState({})
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [detectedImages, setDetectedImages] = useState({});
  const [currentImages, setCurrentImages] = useState([]);
  const [currentScale, setCurrentScale] = useState(1);
  const [pinching, setPinching] = useState(false);
  const [canCall, setCanCall] = useState(true);
  const [tapped, setTapped] = useState(false);
  const [gravity, setGravity] = useState(false);
  const [mappedMarkers, setMappedMarkers] = useState(false);
  const [locationMarkers, setLocationMarkers] = useState({});

  // https://arposts.s3.amazonaws.com/%2F7a420d50-7263-11eb-85b1-cb322733e090.png



  const getDetectionImages = async () => {
    try {
      console.log("tryng this")

      const response = await fetch('http://10.0.0.162:4000/api/v1/get-detection-images', {
        method: "GET", headers: { 'Content-Type': 'application/json' },
      })
      const json = await response.json();
      setCurrentImages(json.data);
    } catch (error) {
      console.log("made it here here", error)

      throw new Error(error);
    }
  };

  useEffect(() => {
    console.log("going here")
    getDetectionImages();
  }, []);


  var takeSnapshot = async () => {
    ARKit.reset();
    const picture = await ARKit.snapshotCamera({ target: "documents" });
    var imageName = uuid.v1() + ".png";
    setCurrentImageUrl(
      "https://arposts.s3.amazonaws.com/%2F" + imageName
    );
    const file = {
      uri: picture.url,
      name: imageName,
      type: "image/png",
    };

    const imageOptions = {
      keyPrefix: "/",
      bucket: "arposts",
      region: "us-east-1",
      accessKey: AMAZON_KEY,
      secretKey: AMAZON_SECRET
    };


    RNS3.put(file, imageOptions).then((response) => {
      if (response.status !== 201)
        throw new Error("Failed to upload image to S3");
    });
  };

  function handleResponderMove(e) {
    hitTestPlanes(
      { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY },
      e.touchHistory.numberActiveTouches
    );
  }

  var hitTestPlanes = async (location, numberActiveTouches) => {
    if (numberActiveTouches == 1 && tapped != true) {
      const objects = await ARKit.hitTestSceneObjects(location);

      if (objects.results[0]) {
        setCurrentTrackedId(objects.results[0].id);
        return;
      }

      if (currentTrackedId != null) {
        const hits = await ARKit.hitTestPlanes(location, 1);

        if (hits.results.length) {
          updateRealityMarkers("position", hits.results[0].position);
        }
      }
    } else {
      if (!currentTrackedId) {
        const objects = await ARKit.hitTestSceneObjects(location);
        if (objects.results[0]) {
          setCurrentTrackedId(objects.results[0].id);
        }
      }
    }
  };

  function updateRealityMarkers(type, object) {
    if (currentTrackedId != null) {
      if (type == "scale") {
        var currentTrackedObject = realityMarkers[currentTrackedId];
        var nextScale;
        if (pinching) {
          nextScale = currentTrackedObject.scale - object;
        } else {
          nextScale = object + currentTrackedObject.scale;
        }

        if (Math.sign(nextScale) == 1 || Math.sign(nextScale) == 0) {
          var nextTrackedObject = {
            ...currentTrackedObject,
            [type]: nextScale,
          };
          var nextRealityMarkers = {
            ...realityMarkers,
            [currentTrackedId]: nextTrackedObject,
          };
          setRealityMarkers(nextRealityMarkers);
        }
      } else if (type == "position") {
        var currentTrackedObject = realityMarkers[currentTrackedId];
        var nextTrackedObject;

        nextTrackedObject = { ...currentTrackedObject, [type]: object };

        // if (nextTrackedObject.text) {
          var nextRealityMarkers = {
            ...realityMarkers,
            [currentTrackedId]: nextTrackedObject,
          };
          setRealityMarkers(nextRealityMarkers);
        // }
      } else {
        var currentTrackedObject = realityMarkers[currentTrackedId];
        var nextTrackedObject = { ...currentTrackedObject, [type]: object };
        if (nextTrackedObject.text) {
          var nextRealityMarkers = {
            ...realityMarkers,
            [currentTrackedId]: nextTrackedObject,
          };
          setRealityMarkers(nextRealityMarkers);
        }
      }
    }
  }

  function onPinch(e) {
    if (e.scale > currentScale) {
      updateRealityMarkers("scale", e.scale - currentScale);
      setPinching(false);
      setCurrentScale(e.scale);
    } else {
      updateRealityMarkers("scale", currentScale - e.scale);
      setPinching(true);
      setCurrentScale(e.scale);
    }
  }

  function submitTextObject() {
    var newObject = {
      text: text,
      position: { x: 0, y: 0, z: -1 },
      scale: 1,
      zRotation: 0,
    };
    setRealityMarkers({
      ...realityMarkers,
      [Object.keys(realityMarkers).length]: newObject,
    });
    setText("");
  }


  const createPost = async () => {
   var post = {
      content: "",
      type: "image",
      position: { x: 0, y: 0, z: 0 },
      scale: 1,
      latitude: lat,
      longitude: long,
      vertical_accuracy: 0,
      horizontal_accuracy: 0,
      altitude: 0,
      euler_angles: { x: 0, y: 0, z: 0 },
    }


    var body = {
      detection_image: { image_url: currentImageUrl, reality_markers: [post] },
    };

    try {
      const response = fetch(
        "http://10.0.0.162:4000/api/v1/create-detection-image",
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("made the request:", response);
      init();
    } catch (error) {
      throw new Error(repsonse);
    }

  }

  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem('@storage_Key')
      if(value !== null) {
        // value previously stored
      }
    } catch(e) {
      // error reading value
    }
  }
  
  const createRealityMarker = async () => {
    let arItems =  Object.values(realityMarkers).reduce((acc, marker) => {
        return [
          ...acc,
          {
            content: marker.contentUrl,
            type: "text",
            position: marker.position,
            scale: marker.scale,
            euler_angles: { x: 0, y: 0, z: marker.zRotation },
          },
        ]
      }
    );

    var body = {
      detection_image: { image_url: currentImageUrl, reality_markers: realityMarkers },
    };

    try {
      const response = fetch(
        "http://10.0.0.162:4000/api/v1/create-detection-image",
        {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("made the request:", response);
    } catch (error) {
      throw new Error(repsonse);
    }
  };


  var realityObjects = Object.values(realityMarkers).map((obj, index) => {
    return (
        <ARKit.Image
          id={`${index}`}
          key={`${index}`}
          position={obj["position"]}
          eulerAngles={obj["euler_angles"]}
          scale={obj["scale"]}
          imageUrl={obj["content_url"]}
        />
    )
  });

  function minus() {
    var currentMarkerPosition = realityMarkers[currentTrackedId].position;
    var nextPosition = {
      x: currentMarkerPosition.x,
      y: currentMarkerPosition.y,
      z: currentMarkerPosition.z,
    };
    updateRealityMarkers("position", nextPosition);
  }

  function plus() {
    var currentMarkerPosition = realityMarkers[currentTrackedId].position;
    var nextPosition = {
      x: currentMarkerPosition.x,
      y: currentMarkerPosition.y,
      z: currentMarkerPosition.z + 0.3,
    };
    updateRealityMarkers("position", nextPosition);
  }

  var anchors = currentImages.map((object) => {
    if(!currentImageUrl){
      var currentDetectedImage = detectedImages[object.image_url];
      if (currentDetectedImage) {
        return (
          <DetectedImage
            position={currentDetectedImage.position}
            realityMarkers={object.reality_markers}
            eulerAngles={object.eulerAngles}
          />
        );
      }
    }
  });

  var mainButton = (
    <TouchableOpacity
      style={styles.cameraButton}
      onPress={pickImage}
    ></TouchableOpacity>
  );

  var detectionURLS = currentImages.map((image) => {
    return image.image_url;
  });


  function pickImage() {
  
  const options = {
    title: 'Select Post',
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };
  takeSnapshot().then(res => {

  ImagePicker.showImagePicker(options, (response) => {
  
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.error) {
      console.log('ImagePicker Error: ', response.error);
    } else if (response.customButton) {
      console.log('User tapped custom button: ', response.customButton);
    } else {
      const source = { uri: response.uri };
  
      var imageName = uuid.v1() + ".png";

      const file = {
        uri: response.uri,
        name: imageName,
        type: "image/png",
      };

      const imageOptions = {
        keyPrefix: "/",
        bucket: "arposts",
        region: "us-east-1",
        accessKey: AMAZON_KEY,
        secretKey: AMAZON_SECRET
      };
  

      RNS3.put(file, imageOptions).then((response) => {  
        var newObject = {
          text: text,
          type: "image",
          position: { x: 0, y: 0, z: -1 },
          scale: 1,
          euler_angles: { x: 0, y: 0, z: 0 },
          content_url: "https://arposts.s3.amazonaws.com/%2F" + imageName,
          zRotation: 0,
        };

        setRealityMarkers({
          ...realityMarkers,
          [Object.keys(realityMarkers).length]: newObject,
        });
        if (response.status !== 201)
          throw new Error("Failed to upload image to S3");
      });
    }
  });
})

}

  return (
    <View
      style={{ flex: 1 }}
      onResponderMove={handleResponderMove}
      onStartShouldSetResponder={() => {
        return true;
      }}
      onMoveShouldSetResponder={() => false}
      onResponderRelease={() => {
        if (!tapped) {
          setCurrentTrackedId(null);
        }
        setCurrentScale(1);
        setCanCall(true);
      }}
    >

        <ARKit
        style={{ flex: 1 }}
        detectionImages={[{ arDetectionImages: detectionURLS}]}
        worldAlignment={
          // gravity
              ARKit.ARWorldAlignment.Gravity
            //  ARKit.ARWorldAlignment.GravityAndHeading
        }
        onRotationGesture={(e) => {
          if (!canCall) return;
          updateRealityMarkers("zRotation", e.rotation);
          setCanCall(false);
          setTimeout(function () {
            setCanCall(true);
          }, 10);
        }}
        onAnchorUpdated={(anchor) => {
          if (anchor.image) {
            setGravity(true);
            if (!detectedImages[anchor.image.name]) {
              var oldMarkers = locationMarkers;
              delete oldMarkers[anchor.image.name];
              setLocationMarkers(oldMarkers);
              setDetectedImages({
                ...detectedImages,
                [anchor.image.name]: { position: anchor.position },
              });
            }
          } else {
            var imageKey = anchor.name.split("|")[0];
            var anchorKey = anchor.name.split("|")[1];

            var image = mappedMarkers[imageKey];
            var prevMarkers = locationMarkers[imageKey]
            var updateAnchor = true 
            

            if(prevMarkers){
              if(prevMarkers[anchorKey] ){
                if( !prevMarkers[anchorKey].position.x > anchor.x || !prevMarkers[anchorKey].position.z > anchor.z){
                  updateAnchor = false  
              }
            } 
          }
          // remove anchors when making new post
          // get function to place content on new post creation
          
            if (image && !detectedImages[imageKey] && updateAnchor) {
              var currentAnchor = image[anchorKey];
              var prevMarkers = locationMarkers[imageKey]
                ? locationMarkers[imageKey]
                : {};

              var nextLocationMarkers = {
                ...locationMarkers,
                [imageKey]: {
                  ...prevMarkers,
                  [anchorKey]: {
                    position: anchor.position,
                    text: currentAnchor.content,
                    eulerAngles: anchor.eulerAngles,
                  },
                },
              };

              setLocationMarkers(nextLocationMarkers);
              // setRealityMarkers({ ...realityMarkers, [anchor.name.split("|")[1]]: {position: anchor.position,
              //   text: currentAnchor.content, eulerAngles: anchor.eulerAngles
              // }})
            }
          }
        }}
        onTapOnPlaneNoExtent={(e) => setTapped(true)}
        onPinchGesture={(e) => {
          if (!canCall) return;
          onPinch(e);
          setCanCall(false);
          setTimeout(function () {
            setCanCall(true);
          }, 25);
        }}
      >  
        {realityObjects}
        {anchors}
      </ARKit>
      <TextInput
        ref={(x) => (this.input = x)}
        value={text}
        style={styles.crosshair}
        onChangeText={(text) => setText(text)}
        onSubmitEditing={submitTextObject}
      ></TextInput>
      {mainButton}
      <ButtonWithIcon
        condition={
          currentImageUrl != "" && Object.values(realityMarkers).length > 0
        }
        onPress={createRealityMarker}
        style={styles.saveStyle}
        parentStyle={styles.saveButton}
        buttonContent={"Save"}
      />
      <ButtonWithIcon
        condition={currentTrackedId != null && tapped}
        onPress={true}
        style={{ top: 3 }}
        parentStyle={styles.dragStyle}
        buttonContent={<FontAwesomeIcon icon={faTimes} />}
      />
      <ButtonWithIcon
        condition={currentTrackedId != null && tapped}
        onPress={minus}
        style={{ top: 3 }}
        parentStyle={styles.minusStyle}
        buttonContent={<FontAwesomeIcon icon={faMinus} />}
      />
      <ButtonWithIcon
        condition={currentTrackedId != null && tapped}
        onPress={plus}
        style={{ top: 3 }}
        parentStyle={styles.plusStyle}
        buttonContent={<FontAwesomeIcon icon={faPlus} />}
      />
      {/* <FontAwesomeIcon icon={faSpinner} />
      <Progress.Circle size={30} indeterminate={true} /> */}

      {/* <ButtonWithIcon condition={true} onPress={resetLocation} style={{top:3}} parentStyle={styles.plusStyle} buttonContent={<FontAwesomeIcon icon={faRedo}/> } /> */}
    </View>
  );
}

