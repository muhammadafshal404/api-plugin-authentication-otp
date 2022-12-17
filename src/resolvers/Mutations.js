
import { generateOtp } from '../util/otp.js'
import { verifyOTP } from '../util/otp.js'

import password_1 from "@accounts/password";
import server_1 from "@accounts/server";

export default {
        async sendOTP(parent, args, context, info) {
                const { collections } = context;
                const { users } = collections;

                let msisdn;
                if (args.phone && args.phone.length > 10 && args.phone[0] == "+") {
                        msisdn = args.phone;
                }
                else if (args.email) {
                        const userExist = await users.findOne({ "emails.0.address": args?.email })
                        if (!userExist) {
                                throw new Error("User does not exist")
                        }
                        msisdn = userExist.phone;
                }
                else {
                        throw Error("Invalid input");
                }

                const res = await generateOtp(msisdn);
                console.log("resturant ", res);
                return res ? true : false
        },
        verifyOTP(parent, args, context, info) {
                return verifyOTP(args.phone, args.otp, context);

        },
        async createUser(_, { user }, ctx) {

                const { injector, infos, collections } = ctx;
                const { Accounts,users } = collections;
                const accountsServer = injector.get(server_1.AccountsServer);
                const accountsPassword = injector.get(password_1.AccountsPassword);
                let userId;
                try {
                        userId = await accountsPassword.createUser(user);
                }
                catch (error) {
                        // If ambiguousErrorMessages is true we obfuscate the email or username already exist error
                        // to prevent user enumeration during user creation
                        if (accountsServer.options.ambiguousErrorMessages &&
                                error instanceof server_1.AccountsJsError &&
                                (error.code === password_1.CreateUserErrors.EmailAlreadyExists ||
                                        error.code === password_1.CreateUserErrors.UsernameAlreadyExists)) {
                                return {};
                        }
                        throw error;
                }
                if (!accountsServer.options.enableAutologin) {
                        return {
                                userId: accountsServer.options.ambiguousErrorMessages ? null : userId,
                        };
                }
                const adminCount=await Accounts.findOne({"adminUIShopIds.0":{$ne:null}});
                console.log("adminCount",adminCount);
                if (userId && adminCount?._id) {
                        console.log("user",user)
                        const account={
                                "_id" : userId,
                                "acceptsMarketing" : false,
                                "emails" : [ 
                                    {
                                        "address" : user.email,
                                        "verified" : false,
                                        "provides" : "default"
                                    }
                                ],
                                "groups" : [],
                                "name" : null,
                                "profile" : {
                                        firstName:user.firstName,
                                        lastName:user.lastName,
                                        dob:user.dob,
                                        phone:user.phone,
                                },
                                "shopId" : null,
                                "state" : "new",
                                "userId" : userId
                            }
                        const accountAdded = await Accounts.insertOne(account);

                }
                // When initializing AccountsServer we check that enableAutologin and ambiguousErrorMessages options
                // are not enabled at the same time
                const createdUser = await accountsServer.findUserById(userId);
                // If we are here - user must be created successfully
                // Explicitly saying this to Typescript compiler
                const loginResult = await accountsServer.loginWithUser(createdUser, infos);
                await generateOtp(user.phone);
                return {
                        userId,
                        // loginResult,
                };
        },
        authenticate: async (_, args, ctx) => {
                const { serviceName, params } = args;
                const { injector, infos, collections } = ctx;
                const { users } = collections;
                const userExist = await users.findOne({ "emails.0.address": params?.user?.email })
                if (userExist.phoneVerified) {
                        const authenticated = await injector
                                .get(server_1.AccountsServer)
                                .loginWithService(serviceName, params, infos);
                        return authenticated;
                }
                else {
                        return null
                }
        },
        authenticateWithOTP: async (_, args, ctx) => {
                const { serviceName, params } = args;
                const { injector, infos, collections } = ctx;
                const { users } = collections;
                const userExist = await users.findOne({ "emails.0.address": params?.user?.email })
                const resOTP = await verifyOTP(userExist.phone, params.code, ctx);
                console.log("status", resOTP)
                // console.log(userExist)
                // if (userExist.phoneVerified) {
                //         const authenticated = await injector
                //                 .get(server_1.AccountsServer)
                //                 .loginWithService(serviceName, params, infos);
                //         return authenticated;
                // }
                // else 
                if (!resOTP?.status) {
                        throw new Error("Invalid otp")
                }
                else {
                        const authenticated = await injector
                                .get(server_1.AccountsServer)
                                .loginWithService(serviceName, params, infos);
                        return authenticated;
                }
        },
        sendResetPasswordEmail: async (_, { email }, { injector }) => {
                const accountsServer = injector.get(server_1.AccountsServer);
                const accountsPassword = injector.get(password_1.AccountsPassword);
                try {
                        await accountsPassword.sendResetPasswordEmail(email);
                }
                catch (error) {
                        // If ambiguousErrorMessages is true,
                        // to prevent user enumeration we fail silently in case there is no user attached to this email
                        if (accountsServer.options.ambiguousErrorMessages &&
                                error instanceof server_1.AccountsJsError &&
                                error.code === password_1.SendResetPasswordEmailErrors.UserNotFound) {
                                return null;
                        }
                        throw error;
                }
                return null;
        },
        changePassword: async (_, { oldPassword, newPassword }, { user, injector }) => {
                if (!(user && user.id)) {
                        throw new Error('Unauthorized');
                }
                const userId = user.id;
                await injector.get(password_1.AccountsPassword).changePassword(userId, oldPassword, newPassword);
                return null;
        },
        verifyEmail: async (_, { token }, { injector }) => {
                await injector.get(password_1.AccountsPassword).verifyEmail(token);
                return null;
        },
        sendVerificationEmail: async (_, { email }, { injector }) => {
                const accountsServer = injector.get(server_1.AccountsServer);
                const accountsPassword = injector.get(password_1.AccountsPassword);
                try {
                        await accountsPassword.sendVerificationEmail(email);
                }
                catch (error) {
                        // If ambiguousErrorMessages is true,
                        // to prevent user enumeration we fail silently in case there is no user attached to this email
                        if (accountsServer.options.ambiguousErrorMessages &&
                                error instanceof server_1.AccountsJsError &&
                                error.code === password_1.SendVerificationEmailErrors.UserNotFound) {
                                return null;
                        }
                        throw error;
                }
                return null;
        },
        addEmail: async (_, { newEmail }, { user, injector }) => {
                if (!(user && user.id)) {
                        throw new Error('Unauthorized');
                }
                const userId = user.id;
                await injector.get(password_1.AccountsPassword).addEmail(userId, newEmail);
                return null;
        },
        changePassword: async (_, { oldPassword, newPassword }, { user, injector }) => {
                if (!(user && user.id)) {
                        throw new Error('Unauthorized');
                }
                try {
                        const userId = user.id;
                        await injector.get(password_1.AccountsPassword).changePassword(userId, oldPassword, newPassword);
                        return true;
                }
                catch (err) {
                        console.log(err);
                        throw new Error(err)
                }
        },
        resetPassword: async (_, { token, newPassword }, { injector, infos }) => {
                return injector.get(password_1.AccountsPassword).resetPassword(token, newPassword, infos);
            },
}
