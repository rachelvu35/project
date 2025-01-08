import { response } from "express";
import UserModel from '../model/User.model.js'
import TransactionModel from "../model/Transaction.model.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ENV from '../config.js';
import otpGenerator from 'otp-generator';

//middleware for user verification
export async function verifyUser(req, res, next){
    try {
        
        const { username } = req.method == "GET" ? req.query : req.body;

        // check the user existence
        let exist = await UserModel.findOne({ username });
        if(!exist) return res.status(404).send({ error : "Can't find User!"});
        next();

    } catch (error) {
        return res.status(404).send({ error: "Authentication Error"});
    }
}

//POST
export async function register(req, res) {
    try {
        const { username, password, profile, email } = req.body;

        // Check if the username exists
        const userWithUsername = await UserModel.findOne({ username });
        if (userWithUsername) {
            return res.status(400).send({ error: "Please use a unique username" });
        }

        // Check if the email exists
        const userWithEmail = await UserModel.findOne({ email });
        if (userWithEmail) {
            return res.status(400).send({ error: "Please use a unique email" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new UserModel({
            username,
            password: hashedPassword,
            profile: profile || '',
            email,
        });

        // Save the user and send a response
        await user.save();
        return res.status(201).send({ msg: "User registered successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Server error" });
    }
}

//POST
export async function login(req,res){
    const { username, password } = req.body;

    try {
        
        UserModel.findOne({ username })
            .then(user => {
                bcrypt.compare(password, user.password)
                    .then(passwordCheck => {

                        if(!passwordCheck) return res.status(400).send({ error: "Don't have Password"});

                        // create jwt token
                        const token = jwt.sign({
                                        userId: user._id,
                                        username : user.username
                                    }, ENV.JWT_SECRET , { expiresIn : "1h"});

                        return res.status(200).send({
                            msg: "Login Successful...!",
                            username: user.username,
                            token
                        });                                    

                    })
                    .catch(error =>{
                        return res.status(400).send({ error: "Password does not Match"})
                    })
            })
            .catch( error => {
                return res.status(404).send({ error : "Username not Found"});
            })

    } catch (error) {
        return res.status(500).send({ error});
    }

}

//GET
export async function getUser(req,res){
    const { username } = req.params;

    try {
        // Validate username
        if (!username) {
            return res.status(400).send({ error: "Invalid Username" }); // 400 for Bad Request
        }

        // Find the user in the database
        const user = await UserModel.findOne({ username });

        if (!user) {
            return res.status(404).send({ error: "Couldn't Find the User" }); // 404 for Not Found
        }

        // Remove the password field from the user object
        const { password, ...rest } = user.toObject(); // Use `toObject` for Mongoose documents

        // Return the user data without the password
        return res.status(200).send(rest); // 200 for Success
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Server Error" }); // 500 for Internal Server Error
    }
}


//PUT
export async function updateUser(req,res){
    try {
        const { userId } = req.user; 
        if (!userId) {
            return res.status(401).send({ error: "User Not Found...!" }); // Exit early
        }

        const body = req.body;

        if (!body || Object.keys(body).length === 0) {
            return res.status(400).send({ error: "No data provided for update!" }); // Exit early
        }

        // Update the user data
        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: userId }, 
            body,            
            { new: true, runValidators: true } 
        );

        if (!updatedUser) {
            return res.status(404).send({ error: "User not found or update failed!" }); // Exit early
        }

        // Success response
        return res.status(200).send({ msg: "Record Updated...!", updatedUser });
    } catch (error) {
        console.error(error); 
        return res.status(500).send({ error: "Server Error" }); 
    }
}


//GET
export async function generateOTP(req,res){
    req.app.locals.OTP = await otpGenerator.generate(6, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false})
    res.status(201).send({ code: req.app.locals.OTP })

}

//GET
export async function verifyOTP(req,res){
    const { code } = req.query;
    if(parseInt(req.app.locals.OTP) === parseInt(code)){
        req.app.locals.OTP = null; // reset the OTP value
        req.app.locals.resetSession = true; // start session for reset password
        return res.status(201).send({ msg: 'Verify Successsfully!'})
    }
    return res.status(400).send({ error: "Invalid OTP"});

}


//GET
export async function createResetSession(req,res){
    try {
        if (req.app.locals.resetSession) {
            // Toggle the resetSession flag off after granting access
            req.app.locals.resetSession = false;
            return res.status(201).send({ msg: "Access granted!" });
        }

        // If resetSession is not active, respond with session expired
        return res.status(440).send({ error: "Session expired!" });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}

//PUT
export async function resetPassword(req,res){
         
    try {
        console.log("resetSession:", req.app.locals.resetSession); // Debug resetSession

        // Check if resetSession is valid (in-memory)
        if (!req.app.locals.resetSession) {
            return res.status(440).send({ error: "Session expired!" });
        }

        const { username, password } = req.body;

        const user = await UserModel.findOne({ username });
        if (!user) {
            return res.status(404).send({ error: "Username not found!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.updateOne({ username: user.username }, { password: hashedPassword });

        // Reset session
        req.app.locals.resetSession = false;
        console.log("Password updated and session reset");

        return res.status(201).send({ msg: "Password updated successfully!" });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ error: "Internal Server Error" });
    }
}

//POST
export async function addTransaction(req,res){
    try {
        const newtransaction = new Transaction(req.body);
        await newtransaction.save();
        res.send("Transaction Added Successfully");
      } catch (error) {
        res.status(500).json(error);
      }
}
//POST
export async function editTransaction(req,res) {
    try {
        await Transaction.findOneAndUpdate({_id : req.body.transactionId} , req.body.payload)
        res.send("Transaction Updated Successfully");
      } catch (error) {
        res.status(500).json(error);
      }
}

//POST
export async function deleteTransaction(req, res) {
    try {
        await Transaction.findOneAndDelete({_id : req.body.transactionId})
        res.send("Transaction Deleted Successfully");
      } catch (error) {
        res.status(500).json(error);
      }
}

//POST
export async function getAllTransaction(req, res) {
    const { frequency, selectedRange, type } = req.body;
  try {
    const transactions = await Transaction.find({
      ...(frequency !== "custom"
        ? {
            date: {
              $gt: moment().subtract(Number(req.body.frequency), "d").toDate(),
            },
          }
        : {
            date: {
              $gte: selectedRange[0],
              $lte: selectedRange[1],
            }, 
          }),
      userid: req.body.userid,
      ...(type!=='all' && {type})
    });

    res.send(transactions);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
}
