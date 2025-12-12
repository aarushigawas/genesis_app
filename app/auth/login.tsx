import { auth } from "../../src2/firebase/config";
// app/auth/login.tsx
import { Stack } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert("Fill both fields");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Logged in!", `Welcome back ${email}`);
      // Optionally navigate on success: expo-router's push or replace
      // import { useRouter } from "expo-router"; const router = useRouter(); router.replace("/");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
      <Stack.Screen options={{ title: "Log in" }} />
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
      <Button title={loading ? "Signing in..." : "Log in"} onPress={login} disabled={loading} />
      <Text style={{ marginTop: 16, textAlign: "center" }}>
        New here?{" "}
        <Text style={{ color: "blue" }} onPress={() => (window as any).location.href = "/auth/signup"}>
          Create account
        </Text>
      </Text>
    </View>
  );
}

