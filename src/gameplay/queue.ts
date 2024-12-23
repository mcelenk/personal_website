import { Node } from "./node";

export class Queue<T> {
    private dummyHead: Node<T>;
    private dummyTail: Node<T>;
    private count: number;

    constructor() {
        this.dummyHead = new Node<T>();
        this.dummyTail = new Node<T>();
        this.dummyHead.next = this.dummyTail;
        this.dummyTail.prev = this.dummyHead;
        this.count = 0;
    }

    public enqueue = (value: T): void => {
        const node = new Node<T>(value);
        const prevLast = this.dummyTail.prev!;
        prevLast.next = node;
        node.prev = prevLast;
        node.next = this.dummyTail;
        this.dummyTail.prev = node;
        this.count++;
    }

    public dequeue = (): T | null => {
        if (this.count == 0) {
            return null;
        }

        const node = this.dummyHead.next!;
        const newFirst = node.next!;
        this.dummyHead.next = newFirst;
        newFirst.prev = this.dummyHead;
        node.next = node.prev = null;
        this.count--;
        return node.value!;
    }

    public isEmpty = (): boolean => {
        return this.count == 0;
    }

    public getCount = (): number => {
        return this.count;
    }

    public peek = (): T | null => {
        if (this.count == 0) {
            return null;
        }
        return this.dummyHead.next!.value!;
    }
}