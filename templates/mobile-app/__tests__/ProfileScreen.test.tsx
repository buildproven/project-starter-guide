import { jest } from '@jest/globals'
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { Alert } from 'react-native'
import ProfileScreen from '../src/screens/ProfileScreen'

// Mock Alert
jest.spyOn(Alert, 'alert')

describe('ProfileScreen', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('shows account settings options', async () => {
    const { getByText } = await render(<ProfileScreen />)

    expect(getByText('Account Settings')).toBeTruthy()
    expect(getByText('Support')).toBeTruthy()
    expect(getByText('Sign Out')).toBeTruthy()
  })

  it('shows sign out alert when sign out button is pressed', async () => {
    const { getByText } = await render(<ProfileScreen />)

    const signOutButton = getByText('Sign Out')
    fireEvent.press(signOutButton)

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Out',
      'Are you sure you want to sign out?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Sign Out' }),
      ])
    )
  })

  it('executes sign out logic when confirmed', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const { getByText } = await render(<ProfileScreen />)

    const signOutButton = getByText('Sign Out')
    fireEvent.press(signOutButton)

    // Get the alert callback and execute it
    const alertMock = Alert.alert as jest.MockedFunction<typeof Alert.alert>
    const alertCall = alertMock.mock.calls[0]
    const signOutCallback = alertCall[2]?.[1]?.onPress
    signOutCallback?.()

    expect(consoleSpy).toHaveBeenCalledWith('User signed out')

    consoleSpy.mockRestore()
  })
})
