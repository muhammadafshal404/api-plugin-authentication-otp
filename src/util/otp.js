// import  Twilio from 'twilio';

// twilio = Twilio(
//   "ACce78b155f83fd47af5d1571274676a43",
//   "cde85cabd918df5ea9ee384f1590597b"
// );

var dict = {};


export async function generateOtp(number) {
  try {
    // const random = require("random");
    let min = 100000;
    let max = 999999;
    let my_otp = Math.floor(Math.random() * (max - min + 1) + min); // () => [ min, max );
    // let my_otp =  "0000";
    dict[number] = { code: my_otp, expiry: new Date().getTime() + 60000 };


    const res = await sendOtp(
      number,
      "Your one time password for Partown is " + my_otp
    );
    return res;
  } catch (err) {
    return err;
  }

}
function sendOtp(number, body) {
  return new Promise((resolve, reject) => {
    console.log("sms", body)
    resolve(true)
    // twilio.sendSms(
    //   {
    //     to: msisdn, // msisdn Any number Twilio can deliver to
    //     from: "+447897022293", // A number you bought from Twilio and can use for outbound communication
    //     body: body, // body of the SMS message
    //   },
    //   function (err, responseData) {
    //     //this function is executed when a response is received from Twilio
    //     if (!err) {
    //       resolve(responseData);
    //       // "err" is an error received during the request, if any
    //       // "responseData" is a JavaScript object containing data received from Twilio.
    //       // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
    //       // http://www.twilio.com/docs/api/rest/sending-sms#example-1
    //     }
    //     if (err) {
    //       console.log("twillio error", err);
    //       reject(err);
    //     }
    //   }
    // );
  });
}
export async function verifyOTP(number, otp, context) {
  console.log("dict", dict)
  console.log(dict[number]["expiry"], new Date().getTime())
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

    const userObj=await users.updateOne({ "phone.phone": number }, {$set: {"phone.verified": "true"}})

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
