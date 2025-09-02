export {}

// Create a type for the roles
export type Roles = 'admin' | 'member'

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}