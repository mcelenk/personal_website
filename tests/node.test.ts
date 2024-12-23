import { Node } from '../src/gameplay/node';

describe('testing Node class', () => {
    test('A Node of number should have value assigned in the constructor', () => {
        let node = new Node<number>(3);
        expect(node.value).toBe(3);
    });

    test('A Node of an interface should have value of type of that interface', () => {
        interface Interface {
            readonly index: number,
        };
        let node = new Node<Interface>({ index: 1 });

        function implementsInterface(object: any): object is Interface {
            return 'index' in object;
        }
        expect(implementsInterface(node.value)).toBe(true);
    });

    test('A Node\'s prev & next should be null when it is first initialized', () => {
        let node = new Node<number>(3);
        expect(node.next).toBe(null);
        expect(node.prev).toBe(null);
    });
});