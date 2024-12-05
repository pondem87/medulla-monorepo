import { Money } from "./types";

export function getTotalCost(quantity: number, unitCost: Money): Money {
    const total: Money = {
        amount: unitCost.amount * BigInt(quantity),
        multiplier: unitCost.multiplier
    }
    return total
}

export function addMoney(a: Money, b: Money): Money {
    const multiplier = a.multiplier > b.multiplier ? a.multiplier : b.multiplier
    const A = a.multiplier === multiplier ? a : changeMultiplier(a, multiplier)
    const B = b.multiplier === multiplier ? b : changeMultiplier(b, multiplier)
    return {
        amount: A.amount + B.amount,
        multiplier
    }
}

export function deductMoney(a: Money, b: Money): Money {
    const multiplier = a.multiplier > b.multiplier ? a.multiplier : b.multiplier
    const A = a.multiplier === multiplier ? a : changeMultiplier(a, multiplier)
    const B = b.multiplier === multiplier ? b : changeMultiplier(b, multiplier)
    return {
        amount: A.amount - B.amount,
        multiplier
    }
}

export function changeMultiplier(money: Money, multiplier: bigint): Money {
    if (!isPowerOfTen(multiplier)) {
        throw new Error("Multiplier must be power of 10")
    }
    if (multiplier > money.multiplier) {
        // changing to bigger multiplier (safe method)
        const delta = multiplier / money.multiplier
        return {
            amount: money.amount * delta,
            multiplier: money.multiplier * delta
        } 
    } else if (multiplier < money.multiplier) {
        // chainging to smaller multiplier (unsafe method)
        const delta = money.multiplier / multiplier
        
        if (((money.amount / delta) * delta) !== (money.amount)) {
            throw new Error("Amount must not lose integrity after factoring")
        }
        return {
            amount: money.amount / delta,
            multiplier: money.multiplier / delta
        } 
    } else {
        return money
    }
}

export function isPowerOfTen(x: bigint): boolean {
    if (x <= 0) return false;

    const logResult = Math.log10(Number(x));
    return Number.isInteger(logResult);
}