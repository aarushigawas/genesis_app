// app/auth/signup.tsx
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
// from app/auth -> go up two levels to project root, then into src2/firebase/config.js
import { Stack } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../src2/firebase/config";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signup = async () => {
    if (!email || !password) {
      Alert.alert("Fill both fields");
      return;
    }
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Save a simple profile document
      await setDoc(doc(db, "users", uid), {
        email,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Signed up!", `Welcome ${email}`);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Stack.Screen options={{ title: "Sign up" }} />
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ marginBottom: 12, padding: 10, borderWidth: 1, borderRadius: 6 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 12, padding: 10, borderWidth: 1, borderRadius: 6 }}
      />
      <Button title={loading ? "Creating..." : "Sign up"} onPress={signup} disabled={loading} />
      <Text style={{ marginTop: 16, textAlign: "center" }}>
        Already have an account?{" "}
        <Text style={{ color: "blue" }} onPress={() => (window as any).location.href = "/auth/login"}>
          Log in
        </Text>
      </Text>
    </View>
  );
}
