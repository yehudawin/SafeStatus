export type UserStatus = 'unknown' | 'safe' | 'in_shelter'

export interface Profile {
  id: string
  phone: string
  display_name: string | null
  city: string | null
  status: UserStatus
  status_updated_at: string | null
  fcm_token: string | null
  battery_level: number | null
  network_type: string | null
  device_info_updated_at: string | null
  created_at: string
  updated_at: string
}

export interface MutualContact {
  friend_id: string
  friend_phone: string
  friend_name: string | null
  friend_status: UserStatus
  friend_status_updated_at: string | null
  friend_city: string | null
  friend_battery_level: number | null
  friend_network_type: string | null
  friend_device_info_updated_at: string | null
}

export interface ActiveAlert {
  id: number
  alert_type: string
  cities: string[]
  instructions: string | null
  started_at: string
  ended_at: string | null
}

export interface SocketAlert {
  cities?: string[]
  data?: string[]
  cat?: string
  type?: string
  title?: string
  desc?: string
}
