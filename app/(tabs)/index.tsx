// app/(tabs)/index.tsx
import { Link, useRouter } from "expo-router";
import React from "react";
import { Button, Text, View } from "react-native";

export default function TabIndex(){
  const router = useRouter();
  return (
    <View style={{flex:1, alignItems:"center", justifyContent:"center"}}>
      <Text>Tab One</Text>

      {/* Simple expo-router link (works on web + native) */}
      <Link href="/auth/login" style={{marginTop:20}}>Go to Login (Link)</Link>

      {/* Or use programmatic navigation */}
      <Button title="Go to Signup" onPress={() => router.push("/auth/signup")} />
    </View>
  );
}



