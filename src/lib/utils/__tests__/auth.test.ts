import { describe, expect, it } from 'vitest'
import {
  parseStoredParticipantScopes,
  participantHasRequiredScopes,
} from '../permissions'

describe('participant scope authorization', () => {
  it('treats null scopes as full project access', () => {
    expect(participantHasRequiredScopes(null)).toBe(true)
    expect(participantHasRequiredScopes(null, ['project:read'])).toBe(true)
  })

  it('requires matching stored scopes for restricted participants', () => {
    const scopes = JSON.stringify(['project:read', 'expenses:create'])

    expect(participantHasRequiredScopes(scopes, ['project:read'])).toBe(true)
    expect(participantHasRequiredScopes(scopes, ['expenses:create'])).toBe(true)
    expect(participantHasRequiredScopes(scopes, ['settlements:read'])).toBe(false)
  })

  it('denies full-access routes for restricted participants without required scopes', () => {
    expect(participantHasRequiredScopes(JSON.stringify(['project:read']))).toBe(false)
  })

  it('parses invalid stored scopes as no scopes', () => {
    expect(parseStoredParticipantScopes('not-json')).toEqual([])
    expect(participantHasRequiredScopes('not-json', ['project:read'])).toBe(false)
  })
})
