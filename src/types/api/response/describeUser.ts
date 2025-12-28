export interface NotificationMember {
  id: number;
  type: 'ccEmail' | 'phone';
  value: string;
  confirmed: boolean;
}

export interface CreditCardInfo {
  brand: string;
  lastFourDigits: string;
}

export interface Address {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  state?: string;
}

export interface BillingDetails {
  address?: Address;
  email?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  taxId?: string;
  phoneNumber?: string;
  creditCard?: CreditCardInfo;
}

export interface UserBillingDetails extends BillingDetails {
  creditCard?: CreditCardInfo;
}

export type SlackInstallationStatus = 'success' | 'error';

export interface SlackInstallation {
  initialHandshake?: SlackInstallationStatus;
  privateChannelHandshake?: SlackInstallationStatus;
}

export type ProductType = 'plan' | 'add-on' | 'misc';
export type ProductSubType =
  | 'free'
  | 'payg'
  | 'personal'
  | 'business'
  | 'custom'
  | 'misc'
  | 'trial_active'
  | 'trial_ended'
  | 'additional_pages'
  | 'support'
  | 'inactive';
export type ProductAvailability =
  | 'none'
  | 'pricing_page_only'
  | 'subscription_page_only'
  | 'both_pricing_and_subscription_pages';
export type BillingPeriod = 'monthly' | 'yearly';

export interface FeatureFlag {
  enabled: boolean;
}

export interface FeatureWithValue<T = number> extends FeatureFlag {
  value: T;
}

export interface SupportFeature extends FeatureFlag {
  duration: number;
  responseTime: number;
}

export interface CcEmailsFeature extends FeatureFlag {
  maxAddressCount: number;
}

export interface AccountFeatureSet {
  reports?: FeatureFlag;
  exports?: FeatureFlag;
  bulkImport?: FeatureFlag;
  ccEmails?: CcEmailsFeature;
  sms?: FeatureFlag;
  advancedNotifications?: FeatureFlag;

  maxActiveJobsPerWorkspace?: FeatureWithValue<number>;
  maxJobFrequency?: FeatureWithValue<number>;
  seatCount?: FeatureWithValue<number>;

  allowOverConsumption?: FeatureFlag;
  emailSupport?: FeatureFlag;
  dedicatedSupport?: FeatureFlag;
  sso?: FeatureFlag;

  support?: SupportFeature;

  additionalPages?: FeatureWithValue<number>;

  newSlackIntegration?: FeatureFlag;
  newGoogleChatIntegration?: FeatureFlag;

  archiveMode?: FeatureFlag;

  /**
   * Forward compatibility for newly added account features on Visualping side
   */
  [key: string]:
    | FeatureFlag
    | FeatureWithValue<number>
    | SupportFeature
    | CcEmailsFeature
    | undefined;
}

export interface Product {
  name: string;
  type: ProductType;
  subType: ProductSubType;
  isMostPopular: boolean;
  availability: ProductAvailability;
  price?: number;
  credits?: number;
  billingPeriod: BillingPeriod;
  stripeId?: string;
  paypalId?: string;
  label?: string;
  accountFeatureSet?: AccountFeatureSet;
  otherPeriodEquivalentProductName?: string;
  latestGenEquivalentProductName?: string;
}

export type SubscriptionItemType = 'plan' | 'additional_pages' | 'support';

export interface SubscriptionItem {
  name: string;
  type: SubscriptionItemType;
  quantity: number;
  remoteSubscriptionItemId?: string;
}

export type PaymentProvider = 'stripe' | 'paypal' | 'cheque' | 'terminal';
export type SubscriptionStatus = 'active' | 'cancelled' | 'update';

export interface Subscription {
  createdAt: string;
  activatedAt?: string;
  groupId?: number;
  items: SubscriptionItem[];
  upcomingPlanName?: string;
  upcomingPlanEffectiveAt?: any;
  provider: PaymentProvider;
  nextBillingAt?: string;
  lastSuccessPaymentAt?: string;
  creditCard?: CreditCardInfo;
  billingDetails?: BillingDetails;
  status: SubscriptionStatus;
}

export interface Balances {
  credits?: number;
  subscriptionCredits?: number;
  nextCreditRenewalAt?: string;
  estimatedMonthlyConsumption?: number;
  inOverConsumption?: boolean;
}

export interface Counts {
  activeJobCount: number;
  activeJobFreeCount?: number;
  activeJobOverflow: boolean;
  activeUserCount: number;
  activeUserFreeCount?: number;
  activeUserOverflow: boolean;
}

export type Role = 'ADMIN' | 'BASIC' | 'EDITOR' | 'SUPERADMIN' | 'VIEWER';

export interface PersonalWorkspace {
  plan: Product;
  subscription?: Subscription;
  pendingInviteOrgId?: number;
  groupId?: number;
  groupCompanyName?: string;
  notificationMembers?: NotificationMember[];
  allowBusinessTrial?: boolean;
  timeZone?: string;
  accountFeatures: Record<string, any>;
  promptId?: string;
  balances: Balances;
  counts: Counts;
}

export interface Organisation {
  subscription?: Subscription;
  isSsoActive: boolean;
  verifiedDomain?: string;
  trialEndDate?: string;
  userHasPersonalSubscription: boolean;
  logoUrl?: string;
  id: number;
  name: string;
  plan?: Product;
  role: Role;
  timeZone?: string;
  accountFeatures: Record<string, any>;
  promptId?: string;
  balances: Balances;
  counts: Counts;
}

export type AccountStatus = 'active' | 'cancellation_requested' | 'deleted';

export interface ExtraProductItem {
  name: string;
  quantity: number;
}

export interface ExtraProducts {
  free?: ExtraProductItem[];
  payg?: ExtraProductItem[];
  personal?: ExtraProductItem[];
  business?: ExtraProductItem[];
  custom?: ExtraProductItem[];
  misc?: ExtraProductItem[];
  trial_active?: ExtraProductItem[];
  trial_ended?: ExtraProductItem[];
  additional_pages?: ExtraProductItem[];
  support?: ExtraProductItem[];
  inactive?: ExtraProductItem[];
}

export interface Workspace {
  notificationMembers?: NotificationMember[];
  extraProducts?: ExtraProducts;
  status?: AccountStatus;
  id: number;
  name: string;
  plan?: Product;
  role: Role;
  timeZone?: string;
  accountFeatures: Record<string, any>;
  promptId?: string;
  balances: Balances;
  counts: Counts;
}

export interface VisualpingUser {
  userId: number;
  emailAddress: string;
  phoneNumberNotificationMember?: NotificationMember;
  country?: string;
  locale?: string;
  timeZone?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  avatarUrl?: string;
  billingDetails?: UserBillingDetails;
  slackInstallationStatus?: SlackInstallation;
  googleChatIntegrated?: boolean;
  organisationIds?: number[];
  personalWorkspace?: PersonalWorkspace;
  organisation?: Organisation;
  workspaces: Workspace[];
  intentForBusiness?: boolean;
  refreshToken?: boolean;
}
