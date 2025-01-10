export class Naming {
    private static readonly adjectives: string[] = [
        'Adventurous', 'Bouncy', 'Cheeky', 'Daring', 'Eccentric', 'Feisty', 'Giggly',
        'Hilarious', 'Jacked', 'Kooky', 'Loopy', 'Mischievous', 'Nifty', 'Outrageous',
        'Perky', 'Quirky', 'Rowdy', 'Sassy', 'Tricky', 'Unstoppable', 'Vivacious',
        'Wacky', 'Zany', 'Zippy', 'Blissful', 'Crafty', 'Dapper', 'Enthusiastic',
        'Fantastic', 'Giddy', 'Humorous', 'Jazzy', 'Kinetic', 'Lively', 'Musical',
        'Nutty', 'Playful', 'Rambunctious', 'Spunky', 'Ticklish', 'Unique', 'Whimsical',
        'Zestful', 'Boisterous', 'Crazy', 'Dizzy', 'Eager', 'Fun-loving', 'Groovy', 'Hyper'
    ];

    private static readonly nouns: string[] = [
        'Armadillo', 'Butterfly', 'Cheetah', 'Dodo', 'Elephant', 'Flamingo', 'Giraffe',
        'Hedgehog', 'Iguana', 'Jaguar', 'Kangaroo', 'Lemur', 'Meerkat', 'Narwhal',
        'Octopus', 'Penguin', 'Quokka', 'Raccoon', 'Sloth', 'Tortoise', 'Unicorn',
        'Vulture', 'Walrus', 'Yak', 'Zebra', 'Aardvark', 'Beaver', 'Chameleon', 'Dolphin',
        'Emu', 'Ferret', 'Gorilla', 'Hyena', 'Lemur', 'Macaw', 'Newt', 'Ocelot', 'Parrot',
        'Quail', 'Rhino', 'Salamander', 'Tapir', 'Urchin', 'Viper', 'Wombat', 'Yeti', 'Zebu',
        'Alpaca', 'Bison', 'Caribou'
    ];

    private static readonly maxLength = 22; // derived from the combination with the max length

    private static padString = (str: string, length: number): string => {
        return str.padEnd(length);
    }

    public static generate = (): string => {
        const randomAdjective = Naming.adjectives[Math.floor(Math.random() * Naming.adjectives.length)];
        const randomNoun = Naming.nouns[Math.floor(Math.random() * Naming.nouns.length)];
        const gameName = `${randomAdjective} ${randomNoun}`;
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD
        const formattedTime = currentDate.toTimeString().slice(0, 5).replace(":", ""); // HHMM
        const result = `${Naming.padString(gameName, Naming.maxLength)} - ${formattedDate}_${formattedTime}`;
        return result;
    }

}