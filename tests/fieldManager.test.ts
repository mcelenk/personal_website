import { Obj } from '../src/gameplay/object';
import { FieldManager } from '../src/gameplay/fieldManager';
import { PROVINCELESS_INDEX } from '../src/gameplay/constants';
import { Dimension } from '../src/gameplay/positioning';
import { ResourceConfig } from '../src/gameplay/resource';

describe('testing FieldManager class', () => {
    test('Testing a single fraction with 2 hexes only', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 400, height: 400 };
        const jsonData = require('../public/data/twoHexes.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);

        // SELECTING THE PROVINCE, HENCE OVERLAY ACTIVATION
        fManager.handleSingleClick({ x: 150, y: 100 });
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();
        let overlay = fManager.getActiveOverlay();
        expect(overlay !== undefined).toBe(true);
        expect(overlay!.isShown()).toBe(true);
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(2);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(2);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(1);
        // UNIT ADDITION SELECTION CLICK!
        fManager.handleSingleClick({ x: 299, y: 390 });
        // ACTUAL ADDITION OF THE UNIT TO THE EMPTY HEX!
        fManager.handleSingleClick({ x: 150, y: 100 });
        overlay = fManager.getActiveOverlay();
        expect(overlay?.getBalance() !== undefined).toBe(true);
        expect(overlay?.getBalance()).toEqual(0);
        expect(overlay?.getIncome()).toEqual(0);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(2);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(1);
    });

    test('Testing two fractions with one province each, unit merging', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 400, height: 400 };
        const jsonData = require('../public/data/6X6.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);

        // SELECTING THE PROVINCE, AND AN ALREADY ACTIVE UNIT (that is at position 1:1)
        fManager.handleSingleClick({ x: 250, y: 190 });
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();
        let overlay = fManager.getActiveOverlay();
        expect(overlay !== undefined).toBe(true);
        expect(overlay!.isShown()).toBe(true);
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(2);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(6);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(1);

        fManager.handleSingleClick({ x: 305, y: 245 });
        await new Promise((r) => setTimeout(r, 500)); // in order for moving unit animation to complete
        fManager.draw();
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(0);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(6);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(1);
    });

    test('Testing two fractions with one province each, getting an opponent\'s hex', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 400, height: 400 };
        const jsonData = require('../public/data/6X6.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);

        // SELECTING THE PROVINCE, AND AN ALREADY ACTIVE UNIT (that is at position 1:1)
        fManager.handleSingleClick({ x: 250, y: 190 });
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();
        const overlay = fManager.getActiveOverlay();
        expect(overlay !== undefined).toBe(true);
        expect(overlay!.isShown()).toBe(true);
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(2);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(6);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(1);

        fManager.handleSingleClick({ x: 350, y: 190 });
        await new Promise((r) => setTimeout(r, 500)); // in order for moving unit animation to complete
        fManager.draw();
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(3); // the income should increase just by one!
        expect(fManager.getHexCountOfActiveProvince()).toEqual(7); // and hex count, too
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(1);
    });

    test('Testing two fractions with one province each, getting an empty hex', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 400, height: 400 };
        const jsonData = require('../public/data/6X6.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);

        // SELECTING THE PROVINCE, AND AN ALREADY ACTIVE UNIT (that is at position 1:1)
        fManager.handleSingleClick({ x: 250, y: 190 });
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();
        const overlay = fManager.getActiveOverlay();
        expect(overlay !== undefined).toBe(true);
        expect(overlay!.isShown()).toBe(true);
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(2);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(6);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(1);

        fManager.handleSingleClick({ x: 150, y: 100 });
        await new Promise((r) => setTimeout(r, 500)); // in order for moving unit animation to complete
        fManager.draw();
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(3); // the income should increase just by one!
        expect(fManager.getHexCountOfActiveProvince()).toEqual(7); // and hex count, too
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(1);
    });

    test('Testing two fractions with several provinces, taking a tree in our fraction', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 1000, height: 1000 };
        const jsonData = require('../public/data/first.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);

        // SELECTING THE unit
        fManager.handleSingleClick({ x: 250, y: 400 }); // THIS IS 4:1
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();
        const overlay = fManager.getActiveOverlay();
        expect(overlay !== undefined).toBe(true);
        expect(overlay!.isShown()).toBe(true);
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(5);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(57);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(4);
        // dest: a same fraction/province hex with a tree
        fManager.handleSingleClick({ x: 250, y: 350 }); // THIS IS 3:1
        await new Promise((r) => setTimeout(r, 400)); // in order for moving unit animation to complete
        fManager.draw();
        expect(overlay?.getBalance()).toEqual(13); // because we took a tree +3 balance
        expect(overlay?.getIncome()).toEqual(6); // because we took a tree +1 income
        expect(fManager.getHexCountOfActiveProvince()).toEqual(57);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(4);
    });

    test('Testing two fractions with several provinces, merging two provinces', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 1000, height: 1000 };
        const jsonData = require('../public/data/first.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);

        // SELECTING THE unit
        fManager.handleSingleClick({ x: 350, y: 175 }); // THIS IS 1:3
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();
        const overlay = fManager.getActiveOverlay();
        expect(overlay !== undefined).toBe(true);
        expect(overlay!.isShown()).toBe(true);
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(5);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(57);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(4);
        // dest: 
        fManager.handleSingleClick({ x: 400, y: 300 }); // THIS IS 3:4
        await new Promise((r) => setTimeout(r, 400)); // in order for moving unit animation to complete
        fManager.draw();
        expect(overlay?.getBalance()).toEqual(20);
        expect(overlay?.getIncome()).toEqual(14); // 5 + 8 + 1 = 14, merged provinces' hex counts + 1
        expect(fManager.getHexCountOfActiveProvince()).toEqual(62); // 57 + 4 + 1 = 62, merged province's hex counts + 1
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(3); // merged two provinces into one, thus reduced the num of provinces by 1
    });


    test('Testing two fractions with several provinces, merging three provinces', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 1000, height: 1000 };
        const jsonData = require('../public/data/first.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);
        fManager.handleSingleClick({ x: 400, y: 850 }); // THIS IS 11:4
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();
        const overlay = fManager.getActiveOverlay();
        expect(overlay !== undefined).toBe(true);
        expect(overlay!.isShown()).toBe(true);
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(5);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(57);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(4);
        // dest: where we connect three provinces
        fManager.handleSingleClick({ x: 550, y: 800 }); // THIS IS 10:6
        await new Promise((r) => setTimeout(r, 400)); // in order for moving unit animation to complete
        fManager.draw();
        expect(overlay?.getBalance()).toEqual(30);
        expect(overlay?.getIncome()).toEqual(11);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(63);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(2);
    });

    test('Testing two fractions with several provinces, connecting a single hex to a province', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 1000, height: 1000 };
        const jsonData = require('../public/data/first.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);

        // fManager.handleSingleClick({ x: 300, y: 200 }); // THIS IS 2:2
        // fManager.handleSingleClick({ x: 300, y: 300 }); // THIS IS 3:2
        // SELECTING THE unit
        // fManager.handleSingleClick({ x: 250, y: 400 }); // THIS IS 4:1
        fManager.handleSingleClick({ x: 550, y: 650 }); // THIS IS  8:6, selecting the province
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();
        const overlay = fManager.getActiveOverlay();
        expect(overlay !== undefined).toBe(true);
        expect(overlay!.isShown()).toBe(true);
        expect(overlay?.getBalance()).toEqual(10);
        expect(overlay?.getIncome()).toEqual(3);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(3);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(4);

        // new unit addition:
        fManager.handleSingleClick({ x: 650, y: 990 }); // new unit addition selection
        fManager.handleSingleClick({ x: 600, y: 550 }); // THIS IS 6:7, where we join a single hex to our province
        await new Promise((r) => setTimeout(r, 400));
        fManager.draw();
        expect(overlay?.getBalance()).toEqual(0);
        expect(overlay?.getIncome()).toEqual(3);
        expect(fManager.getHexCountOfActiveProvince()).toEqual(5);
        expect(fManager.getProvinceCountOfActiveFraction()).toEqual(4);
    });

    test('Testing leaving a single opponont hex alone that has a town', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 1000, height: 1000 };
        const jsonData = require('../public/data/ninth.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);
        fManager.handleSingleClick({ x: 240, y: 230 }); // selecting the unit
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();

        fManager.handleSingleClick({ x: 200, y: 180 }); // moving the unit
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();

        fManager.handleSingleClick({ x: 650, y: 900 }); // UNIT SELECTION first
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();

        fManager.handleSingleClick({ x: 650, y: 900 }); // UNIT SELECTION second
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();

        // Either <0,0> or <1,0> has a town determine that and add the new unit accordingly
        let hex = fManager.getReadonlyHex(0, 0);
        if (hex.getObjectInside() === Obj.TOWN) {
            fManager.handleSingleClick({ x: 240, y: 100 }); // moving the unit to the other hex
            await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
            fManager.draw();
            hex = fManager.getReadonlyHex(0, 0);
        } else { // Hex at <1,0> has the town
            fManager.handleSingleClick({ x: 200, y: 100 }); // moving the unit to the other hex
            await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
            fManager.draw();
            hex = fManager.getReadonlyHex(1, 0);
        }
        expect(hex.getObjectInside()).toEqual(Obj.PINE);
        expect(hex.getProvinceIndex()).toEqual(PROVINCELESS_INDEX);
    });

    test('Testing taking an opponent hex with a town', async () => {
        const mockResourceConfig = Object.create(ResourceConfig.prototype) as ResourceConfig;
        const dim: Dimension = { width: 1000, height: 1000 };
        const jsonData = require('../public/data/ninth.json');
        const fManager = new FieldManager(dim, mockResourceConfig, jsonData);
        fManager.handleSingleClick({ x: 240, y: 230 }); // selecting the unit
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();

        fManager.handleSingleClick({ x: 200, y: 180 }); // selecting the unit
        await new Promise((r) => setTimeout(r, 400)); // in order for animation to complete
        fManager.draw();

        const hex = fManager.getReadonlyHex(0, 1);
        expect(hex.getObjectInside()).toEqual(Obj.NONE);
    });
});