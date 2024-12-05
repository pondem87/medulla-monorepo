import { DEFAULT_MONEY_MULTIPLIER } from "./constants"
import { addMoney, changeMultiplier, deductMoney, getTotalCost } from "./functions"
import { Money } from "./types"

describe("Medulla-Common Test Functions", () => {
    it("calculate total cost", () => {
        const unitCostA: Money = {
            amount: 2n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        const quantityOfA_1 = 33
        const quantityOfA_2 = 222

        const totalCostOfA_1 = {
            amount: 66n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        const totalCostOfA_2 = {
            amount: 444n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        expect(getTotalCost(quantityOfA_1, unitCostA)).toEqual(totalCostOfA_1)
        expect(getTotalCost(quantityOfA_2, unitCostA)).toEqual(totalCostOfA_2)
    })

    it("should add money with same multiplier", () => {
        const amountA: Money = {
            amount: 222n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        const amountB: Money = {
            amount: 111n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        expect(addMoney(amountA, amountB)).toEqual({
            amount: 333n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        })
    })

    it("should add money with different multiplier", () => {
        const amountA: Money = {
            amount: 11n,
            multiplier: DEFAULT_MONEY_MULTIPLIER / 100n
        }

        const amountB: Money = {
            amount: 11n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        expect(addMoney(amountA, amountB)).toEqual({
            amount: 1111n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        })
    })

    it("should subtract money with same multiplier", () => {
        const amountA: Money = {
            amount: 222n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        const amountB: Money = {
            amount: 111n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        expect(deductMoney(amountA, amountB)).toEqual({
            amount: 111n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        })
    })

    it("should subtract money with different multiplier", () => {
        const amountA: Money = {
            amount: 1111n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        const amountB: Money = {
            amount: 11n,
            multiplier: DEFAULT_MONEY_MULTIPLIER / 100n
        }

        expect(deductMoney(amountA, amountB)).toEqual({
            amount: 11n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        })
    })

    it("should subtract money and result in negative value", () => {
        const amountA: Money = {
            amount: 111n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        const amountB: Money = {
            amount: 222n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        expect(deductMoney(amountA, amountB)).toEqual({
            amount: -111n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        })
    })

    it("should change to bigger multiplier", () => {
        const amountA: Money = {
            amount: 11n,
            multiplier: DEFAULT_MONEY_MULTIPLIER / 100n
        }

        expect(changeMultiplier(amountA, DEFAULT_MONEY_MULTIPLIER)).toEqual({
            amount: 1100n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        })
    })

    it("should change to smaller multiplier", () => {
        const amountA: Money = {
            amount: 1100n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        expect(changeMultiplier(amountA, DEFAULT_MONEY_MULTIPLIER / 100n)).toEqual({
            amount: 11n,
            multiplier: DEFAULT_MONEY_MULTIPLIER / 100n
        })
    })

    it("should throw error when changing to smaller multiplier results in decimal amount", () => {
        const amountA: Money = {
            amount: 1100n,
            multiplier: DEFAULT_MONEY_MULTIPLIER
        }

        expect(() => changeMultiplier(amountA, DEFAULT_MONEY_MULTIPLIER / 1000n)).toThrow(Error)
    })
})