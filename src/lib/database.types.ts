export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          onboarded?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      searches: {
        Row: {
          id: number
          user_id: string
          location: string
          property_type: 'apartment' | 'house' | 'any'
          max_budget: number
          min_rooms: number
          wants_parking: boolean
          refinements: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          location: string
          property_type: 'apartment' | 'house' | 'any'
          max_budget: number
          min_rooms: number
          wants_parking: boolean
          refinements?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          location?: string
          property_type?: 'apartment' | 'house' | 'any'
          max_budget?: number
          min_rooms?: number
          wants_parking?: boolean
          refinements?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
