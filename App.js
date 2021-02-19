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
import RNLocation from "react-native-location";
import styles from "./styles/styles";
// import getImages from "./utils/requests";
import * as Progress from 'react-native-progress';
import {Surface, Shape} from '@react-native-community/art';
import CameraRoll from "@react-native-community/cameraroll";
import ImagePicker from 'react-native-image-picker';

var uuid = require("react-native-uuid");

export default function App({}) {
  const [text, setText] = useState("");
  const [currentTrackedId, setCurrentTrackedId] = useState(null);
  const [realityMarkers, setRealityMarkers] = useState({0: {
    text: "",
    position: { x: 0, y: 0, z: 0 },
    scale: 1,
    eulerAngles: { x: 0, y: 0, z: 0 },
    imageUrl: "https://arworldposts.s3.us-east-2.amazonaws.com/%2F7a420d50-7263-11eb-85b1-cb322733e090.png",
    zRotation: 0,
  }})
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [detectedImages, setDetectedImages] = useState({});
  const [currentImages, setCurrentImages] = useState([]);
  const [currentScale, setCurrentScale] = useState(1);
  const [pinching, setPinching] = useState(false);
  const [canCall, setCanCall] = useState(true);
  const [tapped, setTapped] = useState(false);
  const [gravity, setGravity] = useState(false);
  const [mappedMarkers, setMappedMarkers] = useState(false);
  const [lat, setLat] = useState(0);
  const [long, setLong] = useState(0);
  const [locationMarkers, setLocationMarkers] = useState({});
  const [spinner, setSpinner] = useState(true);
  const [photo, setPhoto] = useState("");


  https://arworldposts.s3.us-east-2.amazonaws.com/%2F7a420d50-7263-11eb-85b1-cb322733e090.png
  useEffect(() => {
    init();
  }, []);


  useEffect(() => {
    var nextMappedMarkers = currentImages.reduce((acc, image) => {
      var obs = image.reality_markers.reduce((acc1, marker) => {
        return { ...acc1, [marker.id]: marker };
      }, {});

      return { ...acc, [image.image_url]: obs };
    }, {});

    setMappedMarkers(nextMappedMarkers);
  }, [currentImages]);

  useEffect(() => {
    // getDetectionImages()  
  }, [long]);



  function init() {
  }




  const getDetectionImages = async () => {
    try {
      // const json = await getImages();
      let json
      console.log("JSON", json.data)
      setCurrentImages(json.data);
    } catch (error) {
      throw new Error(error);
    }
  };


  var takeSnapshot = async () => {
    ARKit.reset();
    const picture = await ARKit.snapshotCamera({ target: "documents" });
    var imageName = uuid.v1() + ".png";
    setCurrentImageUrl(
      "https://arworldposts.s3.us-east-2.amazonaws.com/%2F" + imageName
    );
    const file = {
      uri: picture.url,
      name: imageName,
      type: "image/png",
    };

    const options = {
      keyPrefix: "/",
      bucket: "arworldposts",
      region: "us-east-2",
      accessKey: AMAZON_KEY,
      secretKey: AMAZON_SECRET,
      successActionStatus: 201,
    };

    RNS3.put(file, options).then((response) => {
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
      content_url: photo,
      altitude: 0,
      euler_angles: { x: 0, y: 0, z: 0 },
    }


    var body = {
      detection_image: { image_url: currentImageUrl, reality_markers: [post] },
    };

    try {
      const response = fetch(
        "http://10.0.0.162:4000/api/create-detection-image",
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
    let arItems = await Object.values(realityMarkers).reduce(
      async (acc, marker) => {
        var accumulator = await acc;
        // var markerCords = await ARKit.getNewCoords(lat, long, (Math.abs(marker.position.z) / 1000), compassHeading)
        var finalLat = newLat(marker.position.x)
        var finalLong = newLong(marker.position.z)

        console.log("finalLat", finalLat)
        console.log("finalLong", finalLong)

        return Promise.resolve([
          ...accumulator,
          {
            content: marker.text,
            type: "text",
            position: marker.position,
            scale: marker.scale,
            latitude: finalLat,
            longitude: finalLong,
            vertical_accuracy: 0,
            horizontal_accuracy: 0,
            altitude: 0,
            euler_angles: { x: 0, y: 0, z: marker.zRotation },
          },
        ]);
      },
      Promise.resolve([])
    );

    var body = {
      detection_image: { image_url: currentImageUrl, reality_markers: arItems },
    };
    try {
      const response = fetch(
        "http://10.0.0.162:4000/api/create-detection-image",
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
  };


  var realityObjects = Object.values(realityMarkers).map((obj, index) => {
    // let isTapTracking = currentTrackedId == index && tapped == true;

    // return (
    //   <ARKit.Text
    //   id={`${index}`}
    //   key={index}
    //   text="ARKit is Cool!"
    //   position={obj["position"]}
    //   eulerAngles={obj["eulerAngles"]}
    //   scale={obj["scale"]}
    //   font={{ size: 0.15, depth: 0.05 }}
    // />
    // );
    return (
        <ARKit.Image
          id={`${index}`}
          key={`${index}`}
          position={obj["position"]}
          eulerAngles={obj["eulerAngles"]}
          scale={obj["scale"]}
          imageUrl={obj["imageUrl"]}
        />
    )
  });



  function resetLocation() {
    RNLocation.configure({
      distanceFilter: 5.0,
      desiredAccuracy: {
        ios: "nearestTenMeters",
      },
    });

    RNLocation.requestPermission({
      ios: "whenInUse",
    }).then((granted) => {
      if (granted) {
        RNLocation.getLatestLocation().then((location) => {
          console.log("location", location);
          Object.keys(mappedMarkers).map((key) => {
            var image = mappedMarkers[key];
            Object.values(image).map((marker) => {
              var name = key + "|" + marker.id;
              ARKit.addAnchorByLocation(
                name,
                location.latitude,
                location.longitude,
                marker.latitude,
                marker.longitude,
                5,
                5,
                6,
                6,
                10.70901107788086,
                10.70901107788086
              );
            });
          });
          closeGate();
        });
      }
    });
  }

  function drag() {
    setTapped(false);
    setCurrentTrackedId(null);
  }




  function newLat(your_meters){
    var earth = 6378.137,  //radius of the earth in kilometer
    pi = Math.PI,
    m = (1 / ((2 * pi / 360) * earth)) / 1000;  //1 meter in degree

    var new_latitude = lat + (your_meters * m);

    return new_latitude;
  }


  function newLong(your_meters){
    var earth = 6378.137,  //radius of the earth in kilometer
    pi = Math.PI,
    cos = Math.cos,
    m = (1 / ((2 * pi / 360) * earth)) / 1000;  //1 meter in degree

    var new_longitude = long + (your_meters * m) / cos(lat * (pi / 180));

    return new_longitude
  }

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

  if (photo != "") {
    mainButton = (
      <TouchableOpacity
        onPress={createPost}
        style={styles.contentButton}
      ></TouchableOpacity>
    );
  }

  function pickImage() {

  
  const options = {
    title: 'Select Post',
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };

  ImagePicker.showImagePicker(options, (response) => {
    console.log('Response = ', response);
  
    if (response.didCancel) {
      console.log('User cancelled image picker');
    } else if (response.error) {
      console.log('ImagePicker Error: ', response.error);
    } else if (response.customButton) {
      console.log('User tapped custom button: ', response.customButton);
    } else {
      takeSnapshot()
      const source = { uri: response.uri };
  
      // You can also display the image using data:
      // const source = { uri: 'data:image/jpeg;base64,' + response.data };
  
      console.log("SOURCE:", source)
      var imageName = uuid.v1() + ".png";

      const file = {
        uri: response.uri,
        name: imageName,
        type: "image/png",
      };

      const ImageOptions = {
        keyPrefix: "/",
        bucket: "arworldposts",
        region: "us-east-2",
        accessKey: AMAZON_KEY,
        secretKey: AMAZON_SECRET,
        successActionStatus: 201,
      };
  

      RNS3.put(file, ImageOptions).then((response) => {
        // setPhoto(
        //   "https://arworldposts.s3.us-east-2.amazonaws.com/%2F" + imageName
        // );

        var newObject = {
          text: text,
          position: { x: 0, y: 0, z: -1 },
          scale: 1,
          eulerAngles: { x: 0, y: 0, z: 0 },
          imageUrl: "https://arworldposts.s3.us-east-2.amazonaws.com/%2F" + imageName,
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

}


  var imageNode = <View></View>
  if(photo != ""){
    imageNode =   <ARKit.Image
    position={{x: 0, y: 0, z: 2}}
    imageUrl={photo}
    />
  }

  console.log("realityobjects", realityObjects)

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
        // detectionImages={[{ arDetectionImages: detectionURLS}]}
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

       {/* <ARKit.Image
          position={{x: 1, y:0, z:0.5}}
          eulerAngles={{x: 0, y:1.5, z:0}}
          imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
        /> 
       <ARKit.Image
        position={{x: -1, y:0, z:-0.5}}
        eulerAngles={{x: 0, y:-1.5, z:0}}
        imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
      /> 

      <ARKit.Image
        position={{x: 0, y:0, z:-1}}
        eulerAngles={{x: 0, y:0, z:0}}
        imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
      /> 
      <ARKit.Image
        position={{x: 0, y:2, z:-3}}
        eulerAngles={{x: 0, y:0, z:0}}
        imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
      /> 
      <ARKit.Image
        position={{x: 4, y:2, z:-3}}
        eulerAngles={{x: 0, y:-1, z:0}}
        imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
      /> 
      <ARKit.Image
        position={{x: 0, y:0, z:3}}
        eulerAngles={{x: 0, y:3, z:0}} 
        imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
      /> 
      <ARKit.Image
          position={{x: 1, y:0, z:1.5}}
          eulerAngles={{x: 0, y:1.5, z:0}}
          imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
        /> 
        <ARKit.Image
          position={{x: 1, y:0, z:-2.5}}
          eulerAngles={{x: 0, y:1.5, z:0}}
          imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
        /> 
        <ARKit.Image
          position={{x: 5, y:0, z:-3.5}}
          eulerAngles={{x: 0, y:0, z:0}}
          imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
        /> 
        <ARKit.Image
          position={{x: 7, y:0, z:1}}
          eulerAngles={{x: 0, y:-1, z:0}}
          imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
        /> 
        <ARKit.Image
          position={{x: 6, y:0, z:5}}
          eulerAngles={{x: 0, y:-2, z:0}}
          imageUrl={"https://arworldposts.s3.us-east-2.amazonaws.com/public/09958906-00A0-451F-A4B7-78966DC5AF60.png"}
        />  */}
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
        onPress={drag}
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

