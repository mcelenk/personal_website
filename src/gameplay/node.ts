export class Node<T> {
    public next: Node<T> | null;
    public prev: Node<T> | null;
    public value: T | null;

    constructor(val: T | null = null) {
        this.value = val;
        this.prev = this.next = null;
    }
}