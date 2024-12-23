import { OrderedList, Indexable } from "../src/gameplay/orderedList";

describe('testing OrderedList class', () => {
    test('A list just initialized should return 0 for getNextId()', () => {
        let list = new OrderedList<Indexable>();
        expect(list.getNextId()).toBe(0);
    });

    test('A list\'s get() should return the item with the given index number, if it contains it', () => {
        let list = new OrderedList<Indexable>();
        list.insert({ index: 3 });
        expect(list.get(3)?.index).toBe(3);
    });

    test('A list\'s get() should return undefined, if it doesn\'t contain it', () => {
        let list = new OrderedList<Indexable>();
        list.insert({ index: 3 });
        expect(list.get(4)).toBe(undefined);
    });

    test('A list\'s getNextId() should return 1 more than the index value of the element that has the biggest value in the list', () => {
        let list = new OrderedList<Indexable>();
        list.insert({ index: 4 });
        list.insert({ index: 0 });
        list.insert({ index: 3 });
        expect(list.getNextId()).toBe(5);
    });

    test('One cannot delete an item from a list where it doesn\'t exist', () => {
        expect(new OrderedList<Indexable>().delete(5)).toBe(false);
    });

    test('When an item is deleted from a list, its count should decrease by one', () => {
        let list = new OrderedList<Indexable>();
        list.insert({ index: 1 });
        expect(list.getCount()).toBe(1);
        expect(list.delete(1)).toBe(true);
        expect(list.getCount()).toBe(0);
    });

    test('When an item is tried to be inserted with an index where another item \
        with the same index value is already present in the list, \
        it should return false and the item should not be added to the list', () => {
        let list = new OrderedList<Indexable>();
        expect(list.insert({ index: 1 })).toBe(true);
        expect(list.getCount()).toBe(1);
        expect(list.insert({ index: 1})).toBe(false);
        expect(list.getCount()).toBe(1);
    });


});