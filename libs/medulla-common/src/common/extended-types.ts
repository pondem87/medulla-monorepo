import { Snapshot } from "xstate";

// Xstate
export interface StateMachineActor<Event, Context> {
    start(): void;
    send(event: Event): void;
    getSnapshot(): StateMachineSnapshot<Context>;
    getPersistedSnapshot(): Snapshot<any>
    subscribe(callback: (snapshot: StateMachineSnapshot<Context>) => void): void;
}

export interface StateMachineSnapshot<Context> {
    value: any;
    can(event: { type: string }): boolean;
    hasTag(tag: string): boolean;
    matches(stateValue: any): boolean;
    context: Context;
    output: any;
    status: string;
}

export interface Money {
    amount: bigint;
    multiplier: bigint;
}