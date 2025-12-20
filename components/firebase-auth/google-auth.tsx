// components/firebase-auth/google-auth.tsx

import {
    GoogleSignin,
    GoogleSigninButton,
    statusCodes,
} from "@react-native-google-signin/google-signin";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    "957192498846-kqq85icb9tutr94msevqraua0lvopeq7.apps.googleusercontent.com",
});

interface GoogleAuthProps {
  onSuccess: (idToken: string, accessToken: string) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

const GoogleAuth = ({ onSuccess, onError, disabled }: GoogleAuthProps) => {
  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();

      // ✅ Force account chooser safely
      await GoogleSignin.signOut();

      const response = await GoogleSignin.signIn();
      console.log(response, "google sign-in response");

      const tokens = await GoogleSignin.getTokens();

      if (tokens.idToken) {
        onSuccess(tokens.idToken, tokens.accessToken || "");
      } else {
        onError(new Error("Sign in was cancelled by user"));
      }
    } catch (error: any) {
      console.log(error, "google sign-in error");

      if (error.code) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            onError(new Error("Sign in already in progress"));
            break;

          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            onError(new Error("Play Services not available"));
            break;

          case statusCodes.SIGN_IN_CANCELLED:
            onError(new Error("Sign in was cancelled by user"));
            break;

          case statusCodes.SIGN_IN_REQUIRED:
            onError(new Error("Sign in required. Please try again."));
            break;

          default:
            onError(error);
        }
      } else {
        onError(error);
      }
    }
  };

  return (
    <View
      style={{
        width: Dimensions.get("screen").width,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={signIn}
        disabled={disabled}
      />
    </View>
  );
};

export default GoogleAuth;

const styles = StyleSheet.create({});
