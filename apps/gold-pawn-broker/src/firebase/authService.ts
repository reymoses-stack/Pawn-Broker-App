import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './config';

// Module-level storage for the active SMS confirmation session
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Safely resets and clears any existing reCAPTCHA instance.
 */
export function resetRecaptchaVerifier() {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch {
      // Ignore
    }
    recaptchaVerifier = null;
  }
}

/**
 * Initializes or reuses an invisible RecaptchaVerifier on the specified element ID.
 */
export function getOrCreateRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  // Create an invisible reCAPTCHA verifier for smooth mobile & web login
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      try {
        recaptchaVerifier?.clear();
      } catch {}
      recaptchaVerifier = null;
    }
  });

  return recaptchaVerifier;
}

/**
 * Sends a real SMS OTP via Google Firebase Authentication to any real mobile number.
 * Automatically formats Indian and international numbers to E.164 (+91...).
 */
export async function sendRealFirebaseOtp(
  rawPhoneNumber: string, 
  containerId: string = 'recaptcha-container'
): Promise<{ success: boolean; message?: string }> {
  try {
    const digitsOnly = rawPhoneNumber.replace(/\D/g, '');
    let formattedNumber: string;

    if (rawPhoneNumber.startsWith('+')) {
      formattedNumber = `+${digitsOnly}`;
    } else if (digitsOnly.length === 10) {
      // Standard Indian 10-digit mobile number
      formattedNumber = `+91${digitsOnly}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      formattedNumber = `+${digitsOnly}`;
    } else {
      formattedNumber = `+${digitsOnly}`;
    }

    const verifier = getOrCreateRecaptchaVerifier(containerId);
    confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, verifier);
    return { 
      success: true, 
      message: `Real verification code dispatched to ${formattedNumber}. Please check your SMS messages.` 
    };
  } catch (error: any) {
    console.error('Firebase SMS OTP send error:', error);
    resetRecaptchaVerifier();
    let msg = error?.message || 'Failed to send SMS OTP.';
    if (error?.code === 'auth/invalid-phone-number') {
      msg = 'Invalid phone number format. Please provide a valid 10-digit number.';
    } else if (error?.code === 'auth/quota-exceeded') {
      msg = 'SMS quota temporarily exceeded for this number. Please try again shortly.';
    } else if (error?.code === 'auth/too-many-requests') {
      msg = 'Too many requests. Please wait a minute before requesting another OTP.';
    }
    return { success: false, message: msg };
  }
}

/**
 * Verifies the 6-digit OTP code against the active Firebase SMS confirmation session.
 */
export async function verifyRealFirebaseOtp(
  otpCode: string
): Promise<{ success: boolean; firebaseUser?: FirebaseUser; message?: string }> {
  try {
    if (!confirmationResult) {
      return { 
        success: false, 
        message: 'No active OTP request found. Please request a new OTP first.' 
      };
    }

    const cleanCode = otpCode.trim();
    if (cleanCode.length !== 6) {
      return { success: false, message: 'Please enter the complete 6-digit OTP.' };
    }

    const result = await confirmationResult.confirm(cleanCode);
    return { 
      success: true, 
      firebaseUser: result.user 
    };
  } catch (error: any) {
    console.error('Firebase SMS OTP verification error:', error);
    let msg = error?.message || 'Invalid or expired OTP code.';
    if (error?.code === 'auth/invalid-verification-code') {
      msg = 'Incorrect 6-digit OTP. Please double check the SMS you received.';
    } else if (error?.code === 'auth/code-expired') {
      msg = 'This OTP has expired. Please request a new code.';
    }
    return { success: false, message: msg };
  }
}

/**
 * Authenticates with real Email & Password using Firebase Authentication.
 * If the user account does not exist in Firebase yet, automatically registers it.
 */
export async function loginWithRealFirebaseEmail(
  email: string,
  password: string
): Promise<{ success: boolean; firebaseUser?: FirebaseUser; message?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return { success: true, firebaseUser: userCred.user };
    } catch (signInErr: any) {
      // If user not found in Firebase, automatically create the master account
      if (signInErr?.code === 'auth/user-not-found' || signInErr?.code === 'auth/invalid-credential') {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          return { success: true, firebaseUser: newCred.user };
        } catch (createErr: any) {
          // If creation failed because password too short or email already exists with different pass
          if (createErr?.code === 'auth/email-already-in-use') {
            return { success: false, message: 'Incorrect password for this email address.' };
          }
          if (createErr?.code === 'auth/weak-password') {
            return { success: false, message: 'Password should be at least 6 characters.' };
          }
          return { success: false, message: signInErr?.message || 'Invalid email or password.' };
        }
      }
      if (signInErr?.code === 'auth/wrong-password') {
        return { success: false, message: 'Incorrect password for this email address.' };
      }
      return { success: false, message: signInErr?.message || 'Authentication failed.' };
    }
  } catch (error: any) {
    console.error('Firebase Email Login error:', error);
    return { success: false, message: error?.message || 'Failed to authenticate via email.' };
  }
}

/**
 * Sends a real password reset link to any real email address.
 */
export async function sendRealPasswordReset(
  email: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, cleanEmail);
    return { 
      success: true, 
      message: `Password reset email dispatched to ${cleanEmail}. Please check your inbox.` 
    };
  } catch (error: any) {
    return { success: false, message: error?.message || 'Failed to send password reset email.' };
  }
}
