
import { generateOtp } from '../util/otp.js'
import { verifyOTP } from '../util/otp.js'

export default {
        async sendOTP(parent, args, context, info) {
                console.log("sendOTP")
                const res = await generateOtp(args.phone);
                console.log("res", res);
                return true;
        },
        verifyOTP(parent, args, context, info) {
                return  verifyOTP(args.phone,args.otp,context);
                
        }

}