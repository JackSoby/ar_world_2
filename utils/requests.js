export const getImages = async () => {
  console.log("tryng this")
    try {
      console.log("tryng this")

      const response = await fetch('http://10.0.0.162:4000/api/v1/get-detection-images', {
        method: "GET", headers: { 'Content-Type': 'application/json' },
      })


      const json = await response.json();
      return json;
    } catch (error) {
      console.log("REPONSE", error)

      throw new Error(error);

    }
}

export const signUp = async (body) => {
  try {
    const response = await fetch('http://10.0.0.162:4000/api/v1/sign_up', {
      method: "POST", headers: { 'Content-Type': 'application/json' }, body: body
    })

    const json = await response.json();
    console.log("json",json)
    // return json;
  } catch (error) {
    throw new Error(error);

  }
}