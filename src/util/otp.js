
import request from 'request';
import Twilio from "twilio";

var dict = {};

const client = new Twilio("ACxxxxxxxxxxxxxxxxxxxxxxxxx", "xxxxxxxxxxxxxxxxxxxxxxxxxx");
async function sendMessage(number, body) {

  // //     .then(message => {
  // //         console.log("message ", message);
  // //         return true;
  // //     })
  // //     .catch(error => {
  // //         console.log("err ", error)
  // //         return false;
  // //     })
  // return data
}
export function generateOtp(number) {
  return new Promise((resolve, reject) => {
    try {
      // const random = require("random");

      let min = 100000;
      let max = 999999;
      let my_otp = Math.floor(Math.random() * (max - min + 1) + min); // () => [ min, max );
      // let my_otp =  "0000";
      dict[number] = { code: my_otp, expiry: new Date().getTime() + 60000 };

      sendOtp(
        number,
        "Your verification code for is" + my_otp
      ).then((res) => {
        console.log(res)
        resolve(true)
      }).catch((err) => {
        console.log(err)
        resolve(false)
      })


      // return res;
    } catch (err) {
      console.log("reaching", err)
      resolve(false);
    }
  })

}
function sendOtp(number, body) {
  return new Promise((resolve, reject) => {
    try {
      console.log("number, body", number, body)

      //Sending Reset OTP to user number
      // client.messages.create({
      //   body: body,
      //   to: number,
      //   from: "+19302054382"
      // }).then((data) => {
      //   console.log(data)
      //   resolve(true)
      // }).catch((err) => {
      //   console.log("testing")
      //   console.log(err)
      //   reject(err)

      // })
        resolve(true)

      // console.log(messasge)

    }
    catch (err) {
      console.log(err)
      reject(err)
    }

    // const data = sendMessage(number, body);
    // console.log("data", data);

  });
}
export async function verifyOTP(number, otp, context) {
  console.log(number, otp)
  if (dict[number] == undefined || dict[number] == {}) {
    return {
      status: false,
      response: "OTP code invalid"
    }
  }
  const isValid = dict[number]["expiry"] - new Date().getTime() > 0;
  console.log("isValid", isValid)
  if (!isValid) {
    delete dict[number];

    return {
      status: false,
      response: "OTP code expired"
    }
  }
  const res = dict[number]["code"] == otp;
  if (res == true) {
    delete dict[number];
    const { collections } = context;
    const { users } = collections;

    const userObj = await users.updateOne({ "phone": number }, { $set: { "phoneVerified": "true" } })
    console.log("isValid", isValid)

    return {
      status: true,
      response: "Verified successfully"
    }
  } else {
    return {
      status: false,
      response: "Invalid code entered"
    }

  }

}
