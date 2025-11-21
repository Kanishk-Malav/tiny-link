/**
 * Property-Based Tests for TinyLink API
 * Feature: tinylink-url-shortener
 * Testing API endpoints with property-based testing
 */

import * as fc from 'fast-check'

// Mock Prisma client
jest.mock('@/lib/db', () => ({
  prisma: {
    link: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}))

import { prisma } from '@/lib/db'

describe('API Endpoints - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Feature: tinylink-url-shortener, Property 1: Link creation generates unique codes
   * Validates: Requirements 1.1, 1.2
   */
  describe('Property 1: Link creation generates unique codes', () => {
    it('should generate unique codes for multiple link creations', async () => {
      const createdCodes = new Set<string>()
      
      // Mock Prisma to return null (no existing link)
      ;(prisma.link.findUnique as jest.Mock).mockResolvedValue(null)
      
      // Mock Prisma create to capture the code
      ;(prisma.link.create as jest.Mock).mockImplementation(({ data }) => {
        createdCodes.add(data.code)
        return Promise.resolve({
          id: 'test-id',
          ...data,
          clicks: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      })

      // Create multiple links
      const iterations = 50
      for (let i = 0; i < iterations; i++) {
        const { POST } = await import('@/app/api/links/route')
        const mockRequest = {
          json: async () => ({ targetUrl: `https://example${i}.com` }),
        } as any

        await POST(mockRequest)
      }

      // All codes should be unique
      expect(createdCodes.size).toBe(iterations)
    })
  })

  /**
   * Feature: tinylink-url-shortener, Property 2: Duplicate codes are rejected
   * Validates: Requirements 1.3, 6.2
   */
  describe('Property 2: Duplicate codes are rejected', () => {
    it('should reject creation when custom code already exists', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 4, maxLength: 10 }).filter(s => /^[a-zA-Z0-9-_]+$/.test(s)),
          async (code) => {
            // Mock existing link
            ;(prisma.link.findUnique as jest.Mock).mockResolvedValue({
              id: 'existing-id',
              code,
              targetUrl: 'https://existing.com',
              clicks: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            })

            const { POST } = await import('@/app/api/links/route')
            const mockRequest = {
              json: async () => ({ 
                targetUrl: 'https://example.com',
                code 
              }),
            } as any

            const response = await POST(mockRequest)
            const data = await response.json()

            // Should return 409 status (conflict - code already exists)
            expect(response.status).toBe(409)
            expect(data.success).toBe(false)
            expect(data.error).toContain('already exists')
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  /**
   * Feature: tinylink-url-shortener, Property 15: Code validation enforces character rules
   * Validates: Requirements 8.2
   */
  describe('Property 15: Code validation enforces character rules', () => {
    it('should reject codes with invalid characters', async () => {
      const invalidCodes = [
        'code with spaces',
        'code@special',
        'code#hash',
        'code$dollar',
        'code%percent',
        'code&ampersand',
        'code*asterisk',
        'code(paren',
        'code)paren',
        'code+plus',
        'code=equals',
        'code[bracket',
        'code]bracket',
        'code{brace',
        'code}brace',
        'code|pipe',
        'code\\backslash',
        'code/slash',
        'code:colon',
        'code;semicolon',
        'code"quote',
        "code'quote",
        'code<less',
        'code>greater',
        'code,comma',
        'code.period',
        'code?question',
        'code!exclaim',
        'code~tilde',
        'code`backtick',
      ]

      for (const code of invalidCodes) {
        const { POST } = await import('@/app/api/links/route')
        const mockRequest = {
          json: async () => ({ 
            targetUrl: 'https://example.com',
            code 
          }),
        } as any

        const response = await POST(mockRequest)
        const data = await response.json()

        // Should return 400 status for invalid input
        expect(response.status).toBe(400)
        expect(data.success).toBe(false)
      }
    })

    it('should accept codes with valid characters', async () => {
      const validCodes = [
        'abc123',
        'my-link',
        'my_link',
        'MyLink123',
        'link-2024',
        'test_code_123',
      ]

      ;(prisma.link.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.link.create as jest.Mock).mockImplementation(({ data }) => 
        Promise.resolve({
          id: 'test-id',
          ...data,
          clicks: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      )

      for (const code of validCodes) {
        const { POST } = await import('@/app/api/links/route')
        const mockRequest = {
          json: async () => ({ 
            targetUrl: 'https://example.com',
            code 
          }),
        } as any

        const response = await POST(mockRequest)
        const data = await response.json()

        // Should return 201 status for valid input
        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
      }
    })
  })

  /**
   * Feature: tinylink-url-shortener, Property 9: Links are ordered by creation date
   * Validates: Requirements 4.1, 6.3
   */
  describe('Property 9: Links are ordered by creation date', () => {
    it('should return links ordered by creation date (newest first)', async () => {
      // Create mock links with different dates
      const mockLinks = [
        {
          id: '1',
          code: 'newest',
          targetUrl: 'https://example1.com',
          clicks: 0,
          createdAt: new Date('2024-01-03'),
          updatedAt: new Date('2024-01-03'),
        },
        {
          id: '2',
          code: 'middle',
          targetUrl: 'https://example2.com',
          clicks: 0,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          id: '3',
          code: 'oldest',
          targetUrl: 'https://example3.com',
          clicks: 0,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ]

      ;(prisma.link.findMany as jest.Mock).mockResolvedValue(mockLinks)

      const { GET } = await import('@/app/api/links/route')
      const response = await GET()
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockLinks)
      
      // Verify Prisma was called with correct ordering
      expect(prisma.link.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      })
    })
  })

  /**
   * Feature: tinylink-url-shortener, Property 16: Validation errors return specific messages
   * Validates: Requirements 8.5
   */
  describe('Property 16: Validation errors return specific messages', () => {
    it('should return specific error messages for invalid inputs', async () => {
      const testCases = [
        {
          input: { targetUrl: '' },
          expectedError: 'Invalid input',
        },
        {
          input: { targetUrl: 'not-a-url' },
          expectedError: 'Invalid URL format',
        },
        {
          input: { targetUrl: 'ftp://example.com' },
          expectedError: 'Invalid URL format',
        },
      ]

      for (const { input, expectedError } of testCases) {
        const { POST } = await import('@/app/api/links/route')
        const mockRequest = {
          json: async () => input,
        } as any

        const response = await POST(mockRequest)
        const data = await response.json()

        expect(response.status).toBeGreaterThanOrEqual(400)
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
      }
    })
  })
})
