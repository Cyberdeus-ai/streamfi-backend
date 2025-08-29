import { Router } from 'express'; 

import { signUpHandler, signInHandler, signInWithTokenHandler, getNonceHandler, verifyHandler } from "../controllers/auth.controller";

import { tokenValidation } from '../middlewares/tokenValidation';

const router = Router();

router.get('/nonce', getNonceHandler);
router.post('/verify', verifyHandler);
router.post('/signup', signUpHandler);
router.post('/signin', signInHandler);
router.get("/signin-with-token", tokenValidation, signInWithTokenHandler)

export default router;