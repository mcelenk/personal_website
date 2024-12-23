import { Node } from "./node";

export type Indexable = {
    readonly index: number,
}

export class OrderedList<T extends Indexable> {
    private dummyHead: Node<T>;
    private dummyTail: Node<T>;
    private count: number;
    private mapping: Map<number, Node<T>>;

    constructor() {
        this.dummyHead = new Node<T>();
        this.dummyTail = new Node<T>();
        this.dummyHead.next = this.dummyTail;
        this.dummyTail.prev = this.dummyHead;
        this.count = 0;
        this.mapping = new Map<number, Node<T>>();
    }

    public getCount = (): number => {
        return this.count;
    }

    public getNextId = (): number => {
        return this.count == 0 ? 0 : this.dummyTail.prev!.value!.index + 1;
    }

    public insert = (item: T): boolean => {
        if (this.mapping.has(item.index)) {
            return false;
        }
        const node = new Node<T>(item);
        this.mapping.set(item.index, node);


        // TODO: Can this be done in O(logN) with binary search? Doesn't matter for our use case
        let curr = this.dummyTail.prev;
        while (curr != null && curr != this.dummyHead) {
            if (curr.value!.index < item.index) break;
            curr = curr.prev;
        }
        // curr points to the node that we want to have at our left side
        node.prev = curr;
        node.next = curr!.next;
        curr!.next!.prev = node;
        curr!.next = node;
        this.count++;
        return true;
    }

    public delete = (id: number): boolean => {
        if (!this.mapping.has(id)) {
            return false;
        }
        const item = this.mapping.get(id);
        item!.prev!.next = item!.next;
        item!.next!.prev = item!.prev;
        this.mapping.delete(id);
        this.count--;
        return true;
    }

    public get = (id: number): T | undefined | null => {
        return this.mapping.get(id)?.value;
    }

    public * getAll(): Generator<T> {
        for (let key of this.mapping.keys()) {
            let value = this.mapping.get(key);
            yield value?.value!;
        }
    }
}