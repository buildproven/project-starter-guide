import { jest } from '@jest/globals'
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import HomeScreen from '../src/screens/HomeScreen'
import type { StackNavigationProp } from '@react-navigation/stack'
import type { RootStackParamList } from '../src/types/navigation'

describe('HomeScreen', () => {
  it('renders the home screen content', async () => {
    const navigation = {
      navigate: jest.fn(),
    } as unknown as StackNavigationProp<RootStackParamList, 'Home'>
    const { getByText } = await render(<HomeScreen navigation={navigation} />)

    expect(getByText('Welcome to Your App')).toBeTruthy()
    expect(getByText('Features Included')).toBeTruthy()
    expect(getByText('✅ TypeScript support')).toBeTruthy()
  })

  it('navigates to Profile screen when button is pressed', async () => {
    const navigate = jest.fn()
    const navigation = { navigate } as unknown as StackNavigationProp<
      RootStackParamList,
      'Home'
    >
    const { getByText } = await render(<HomeScreen navigation={navigation} />)

    const profileButton = getByText('Go to Profile')
    fireEvent.press(profileButton)

    expect(navigate).toHaveBeenCalledWith('Profile')
  })

  it('renders all feature items', async () => {
    const navigation = {
      navigate: jest.fn(),
    } as unknown as StackNavigationProp<RootStackParamList, 'Home'>
    const { getByText } = await render(<HomeScreen navigation={navigation} />)

    expect(getByText('✅ TypeScript support')).toBeTruthy()
    expect(getByText('✅ React Navigation')).toBeTruthy()
    expect(getByText('✅ Safe Area Context')).toBeTruthy()
    expect(getByText('✅ Expo SDK')).toBeTruthy()
    expect(getByText('✅ ESLint configuration')).toBeTruthy()
    expect(getByText('✅ Jest testing setup')).toBeTruthy()
  })

  it('renders the Learn More button', async () => {
    const navigation = {
      navigate: jest.fn(),
    } as unknown as StackNavigationProp<RootStackParamList, 'Home'>
    const { getByText } = await render(<HomeScreen navigation={navigation} />)

    expect(getByText('Learn More')).toBeTruthy()
  })
})
