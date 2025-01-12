import { Observable } from "rxjs";

export type UserId = {
    userId: string;
}

export type UserBalance = {
    amount: string
    multiplier: string
    currency: string
}

export type UserBalanceDelta = {
    amount: string
    multiplier: string
    currency: string
}

export type UserBalanceUpdate = {
    userId: string;
    delta: UserBalanceDelta;
    sign: number
}

export interface GrpcSubscriptionClient {
    checkUserBalance(userId: UserId): Observable<UserBalance>;
    updateUserBalance(userBlanceUpdate: UserBalanceUpdate): Observable<UserBalance>;
}

export interface GrpcSubscriptionServer {
    checkUserBalance(userId: UserId): Promise<UserBalance>;
    updateUserBalance(userBlanceUpdate: UserBalanceUpdate): Promise<UserBalance>;
}

export const SubscriptionServicePackage = "subscription"
export const SubscriptionServiceName = "SubscriptionService"