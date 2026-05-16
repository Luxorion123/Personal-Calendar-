import { useCallback, useEffect, useState } from 'react'
import useStore from '../store'
import type { Task } from '../types'
import { format, parseISO } from 'date-fns'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string
const DISCOVERY_DOC =
  'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/calendar'

const CATEGORY_COLOR_IDS: Record<string, string> = {
  work: '9',      // Blueberry
  personal: '3',  // Grape
  health: '2',    // Sage
  other: '5',     // Banana
}

export function useGoogleCalendar() {
  const { googleAccessToken, setGoogleAccessToken, addTask, updateTask } =
    useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [gapiReady, setGapiReady] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID || !API_KEY) return

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        })
        setGapiReady(true)
      })
    }
    document.head.appendChild(script)

    const gsiScript = document.createElement('script')
    gsiScript.src = 'https://accounts.google.com/gsi/client'
    document.head.appendChild(gsiScript)
  }, [])

  useEffect(() => {
    if (gapiReady && googleAccessToken) {
      window.gapi.client.setToken({ access_token: googleAccessToken })
      setIsSignedIn(true)
    }
  }, [gapiReady, googleAccessToken])

  const signIn = useCallback(() => {
    if (!CLIENT_ID) return
    // @ts-expect-error google identity services
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp: { access_token?: string }) => {
        if (resp.access_token) {
          setGoogleAccessToken(resp.access_token)
          window.gapi.client.setToken({ access_token: resp.access_token })
          setIsSignedIn(true)
        }
      },
    })
    client.requestAccessToken()
  }, [setGoogleAccessToken])

  const signOut = useCallback(() => {
    if (googleAccessToken) {
      // @ts-expect-error google identity services
      google.accounts.oauth2.revoke(googleAccessToken)
    }
    setGoogleAccessToken(null)
    setIsSignedIn(false)
  }, [googleAccessToken, setGoogleAccessToken])

  const createCalendarEvent = useCallback(
    async (task: Task): Promise<string | null> => {
      if (!isSignedIn || !gapiReady) return null
      try {
        const startDate = parseISO(task.date)
        const event = {
          summary: task.title,
          description: task.notes,
          colorId: CATEGORY_COLOR_IDS[task.category] || '1',
          start: { date: format(startDate, 'yyyy-MM-dd') },
          end: { date: format(startDate, 'yyyy-MM-dd') },
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const calClient = window.gapi.client as any
        const response = await calClient.calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        })
        return response.result.id || null
      } catch (err) {
        console.error('Failed to create calendar event', err)
        return null
      }
    },
    [isSignedIn, gapiReady]
  )

  const deleteCalendarEvent = useCallback(
    async (eventId: string) => {
      if (!isSignedIn || !gapiReady) return
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (window.gapi.client as any).calendar.events.delete({
          calendarId: 'primary',
          eventId,
        })
      } catch (err) {
        console.error('Failed to delete calendar event', err)
      }
    },
    [isSignedIn, gapiReady]
  )

  const syncFromCalendar = useCallback(async () => {
    if (!isSignedIn || !gapiReady) return
    setIsLoading(true)
    try {
      const timeMin = new Date()
      timeMin.setDate(timeMin.getDate() - 7)
      const timeMax = new Date()
      timeMax.setDate(timeMax.getDate() + 30)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (window.gapi.client as any).calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      })

      const events = response.result.items || []
      const existingTasks = useStore.getState().tasks

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      events.forEach((event: any) => {
        if (!event.id || !event.summary) return
        const alreadySynced = existingTasks.some(
          (t) => t.googleEventId === event.id
        )
        if (alreadySynced) return

        const dateStr =
          event.start?.date ||
          (event.start?.dateTime
            ? event.start.dateTime.slice(0, 10)
            : null)
        if (!dateStr) return

        addTask({
          title: event.summary,
          date: dateStr,
          estimatedMinutes: 60,
          category: 'work',
          priority: 'medium',
          notes: event.description || '',
          completed: false,
          googleEventId: event.id,
        })
      })
    } catch (err) {
      console.error('Failed to sync from calendar', err)
    } finally {
      setIsLoading(false)
    }
  }, [isSignedIn, gapiReady, addTask])

  return {
    isSignedIn,
    isLoading,
    gapiReady,
    signIn,
    signOut,
    createCalendarEvent,
    deleteCalendarEvent,
    syncFromCalendar,
    updateTask,
  }
}
