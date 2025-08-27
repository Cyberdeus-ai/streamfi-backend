import { Router } from 'express'; 

import { signUpHandler, signInHandler, signInWithTokenHandler } from "../controllers/auth.controller";

import { tokenValidation } from '../middlewares/tokenValidation';

const router = Router();

router.post('/signup', signUpHandler);
router.post('/signin', signInHandler);
router.get("/signin-with-token", tokenValidation, signInWithTokenHandler)

export default router;