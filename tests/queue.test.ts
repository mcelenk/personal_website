import { Queue } from '../src/gameplay/queue';

describe('testing Queue class', () => {
    test('A queue just initialized should be empty', () => {
        let queue = new Queue<number>();
        expect(queue.isEmpty()).toBe(true);
    });
    test('A queue should not be empty when at least one element is enqueued and not dequeued yet', () => {
        let queue = new Queue<number>();
        queue.enqueue(4);
        expect(queue.isEmpty()).toBe(false);
    });
    test('A queue should be empty when equal number of items are enqueued and dequeued', () => {
        let queue = new Queue<number>();
        queue.enqueue(4);
        queue.enqueue(66);
        queue.dequeue();
        queue.dequeue();
        expect(queue.isEmpty()).toBe(true);
    });

    test('A queue should dequeue the items in the order they were enqueued', () => {
        let queue = new Queue<number>();
        queue.enqueue(4);
        queue.enqueue(66);
        expect(queue.dequeue()).toBe(4);
        expect(queue.dequeue()).toBe(66);
    });

    test('When an empty queue\'s dequeue is called, it should return null', () => {
        let queue = new Queue<number>();
        expect(queue.dequeue()).toBe(null);
    });

    test('One can enqueue the same values and they should be stored/dequeued seperately', () => {
        let queue = new Queue<number>();
        let numItems = 10;
        for (let i = 0; i < numItems; i++) {
            queue.enqueue(5);
        }
        expect(queue.getCount()).toBe(numItems);
        for (let i = 0; i < numItems; i++) {
            expect(queue.getCount()).toBe(numItems - i);
            expect(queue.dequeue()).toBe(5);
        }
        expect(queue.isEmpty()).toBe(true);
        expect(queue.dequeue()).toBe(null);
    });

    

});