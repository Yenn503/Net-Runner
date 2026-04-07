export type SubscriptionType = 'max' | 'pro' | 'enterprise' | 'team'

export type RateLimitTier = string

export type BillingType = string

export type OAuthProfileResponse = {
  account: {
    uuid: string
    email: string
    display_name?: string | null
    created_at: string
  }
  organization: {
    uuid: string
    organization_type?: string | null
    rate_limit_tier?: string | null
    has_extra_usage_enabled?: boolean | null
    billing_type?: string | null
    subscription_created_at?: string | null
  }
}

export type OAuthTokenExchangeResponse = {
  access_token: string
  refresh_token?: string | null
  expires_in: number
  scope: string
  account?: {
    uuid: string
    email_address: string
  }
  organization?: {
    uuid: string
  }
}

export type OAuthTokens = {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  scopes: string[]
  subscriptionType: SubscriptionType | null
  rateLimitTier: RateLimitTier | null
  profile?: OAuthProfileResponse
  tokenAccount?: {
    uuid: string
    emailAddress: string
    organizationUuid?: string
  }
}

export type UserRolesResponse = {
  organization_role?: string
  workspace_role?: string
  organization_name?: string
}

export type ReferralCampaign = string

export type ReferrerRewardInfo = {
  amount_minor_units: number
  currency: string
}

export type ReferralEligibilityResponse = {
  eligible: boolean
  remaining_passes?: number
  referral_code_details?: {
    referral_link?: string
    campaign?: ReferralCampaign
    [key: string]: unknown
  }
  referrer_reward?: ReferrerRewardInfo | null
  [key: string]: unknown
}

export type ReferralRedemptionsResponse = {
  limit?: number
  redemptions?: Array<Record<string, unknown>>
  [key: string]: unknown
}
