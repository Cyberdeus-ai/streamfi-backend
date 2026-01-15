import { Router } from 'express'; 

import { signUpHandler, signInHandler, getNonceHandler, verifyHandler, setAccountTypeHandler } from "../controllers/auth.controller";

const router = Router();

router.get('/nonce', getNonceHandler);
router.post('/verify', verifyHandler);
router.post('/signup', signUpHandler);
router.post('/accounttype', setAccountTypeHandler);
router.post('/signin', signInHandler);

export default router;