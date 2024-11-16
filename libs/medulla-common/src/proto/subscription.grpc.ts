export type UserId = {
    userId: string;
}

export type UserBalance = {
    amount: bigint
    multiplier: bigint
    currency: string
}

export type UserBalanceDelta = {
    amount: bigint
    multiplier: bigint
    currency: string
}

export type UserBalanceUpdate = {
    userId: string;
    delta: UserBalanceDelta
}

export interface GrpcSubscriptionService {
    checkUserBalance(userId: UserId): Promise<UserBalance>;
    updateUserBalance(userBlanceUpdate: UserBalanceUpdate): Promise<UserBalance>;
}

export const SubscriptionServicePackage = "subscription"
export const SubscriptionServiceName = "SubscriptionService"