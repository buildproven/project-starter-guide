import { jest } from "@jest/globals";
import React from "react";
import { render } from "@testing-library/react-native";
import App from "../App";

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }),
}));

jest.mock("@react-navigation/native", () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@react-navigation/stack", () => {
  const { jest: testJest } = require("@jest/globals");

  return {
    createStackNavigator: () => {
      const Screen = ({
        component: Component,
        ...rest
      }: {
        component: React.ComponentType<{ navigation?: unknown }>;
        name: string;
        options?: Record<string, unknown>;
      }) => <Component navigation={{ navigate: testJest.fn() }} {...rest} />;

      const Navigator = ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
      );

      return { Screen, Navigator };
    },
  };
});

describe("App entry", () => {
  it("renders the home screen title", async () => {
    const { findByText } = render(<App />);

    await expect(findByText("Welcome to Your App")).resolves.toBeTruthy();
  });

  it("renders navigation structure", () => {
    const { getByText } = render(<App />);
    // Verify navigation is set up by checking for home screen content
    expect(getByText("Welcome to Your App")).toBeTruthy();
  });
});
