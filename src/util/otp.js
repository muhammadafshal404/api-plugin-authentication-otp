import request from "request";

var dict = {};

export async function generateOtp(number) {
  try {
    // const random = require("random");
    let min = 100000;
    let max = 999999;
    let my_otp = Math.floor(Math.random() * (max - min + 1) + min); // () => [ min, max );
    // let my_otp =  "0000";
    dict[number] = { code: my_otp, expiry: new Date().getTime() + 60000 };

    const res = await sendOtp(number, my_otp);
    return res;
  } catch (err) {
    return err;
  }
}
function sendOtp(number, body) {
  return new Promise((resolve, reject) => {
    console.log("sms", number, body);
    var options = {
      method: "GET",
      url:
        "https://sms.convexinteractive.com/api/sendsms.php?apisecret=3sOQu0TfEzBlSr1HWmvNViaDg619&apikey=Y9ixUzy5OkPc2fWQ4TMrhgV8R573&from=8833&to=" +
        number +
        "&message=" +
        body +
        "&response_type=json",
      headers: {},
    };
    request(options, function (error, response) {
      if (error) {
        resolve(false);
      }
      resolve(true);
    });
  });
}
export async function verifyOTP(number, otp, context) {
  console.log(number, otp);
  if (dict[number] == undefined || dict[number] == {}) {
    return {
      status: false,
      response: "OTP code invalid",
    };
  }
  const isValid = dict[number]["expiry"] - new Date().getTime() > 0;
  console.log("isValid", isValid);
  if (!isValid) {
    delete dict[number];

    return {
      status: false,
      response: "OTP code expired",
    };
  }
  const res = dict[number]["code"] == otp;
  if (res == true) {
    delete dict[number];
    const { collections } = context;
    const { users } = collections;

    const userObj = await users.updateOne(
      { phone: number },
      { $set: { phoneVerified: "true" } }
    );
    console.log("isValid", isValid);

    return {
      status: true,
      response: "Verified successfully",
    };
  } else {
    return {
      status: false,
      response: "Invalid code entered",
    };
  }
}
