import { Router } from "express";
const router = Router();

//import controllers
import * as controller from '../controllers/appController.js';
import { registerMail } from '../controllers/mailer.js'
import Auth, { localVariables } from '../middleware/authentication.js';

//post method
router.route('/register').post(controller.register)
router.route('/registerMail').post(registerMail); // send the email
router.route('/authentication').post(controller.verifyUser, (req, res) => res.end()); // authenticate user
router.route('/login').post(controller.verifyUser, controller.login);
router.route('/add-transaction').post(controller.addTransaction)
router.route('/edit-transaction').post(controller.editTransaction)
router.route('/delete-transaction').post(controller.deleteTransaction)
router.route('/get-all-transaction').post(controller.getAllTransaction)


//get method
router.route('/user/:username').get(controller.getUser)
router.route('/generateOTP').get(controller.verifyUser, localVariables, controller.generateOTP)
router.route('/verifyOTP').get(controller.verifyUser, controller.verifyOTP), 
router.route('/createResetSession').get(controller.createResetSession)

//put method
router.route('/updateuser').put(Auth, controller.updateUser)
router.route('/resetPassword').put(controller.verifyUser, controller.resetPassword)



export default router;