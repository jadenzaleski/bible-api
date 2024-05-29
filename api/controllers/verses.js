const User = require("../models/user");
const sequelize = require('../../instance');
const translations = ["akjv", "asv", "brg", "ehv", "esv", "esvuk", "gnv", "gw", "isv", "jub", "kj21", "kjv", "leb", "mev", "nasb", "nasb1995", "niv", "nivuk", "nkjv", "nlt", "nlv", "nog", "nrsv", "nrsvue", "web", "ylt",]
const books = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel",
    "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
    "Psalm", "Proverbs", "Ecclesiastes", "Song Of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel",
    "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai",
    "Zechariah", "Malachi", "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
    "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians",
    "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
    "1 John", "2 John", "3 John", "Jude", "Revelation"]
const chapterVersePattern = /^\d+:\d+$/;

exports.retrieve = async (req, res) => {
    const {translation, book} = req.params;
    const {start, end, superscript, apiKey} = req.query;
    // Convert to lowercase for case-insensitive comparison
    const lowerCaseTranslation = translation.toLowerCase();
    const lowerCaseBook = book.toLowerCase();

    // Convert the arrays to lowercase for comparison
    const lowerCaseTranslations = translations.map(t => t.toLowerCase());
    const lowerCaseBooks = books.map(b => b.toLowerCase());
    console.log('Received parameters:', {translation, book, start, end, superscript, apiKey});

    try {
        // Verify the translation and book
        if (!lowerCaseTranslations.includes(lowerCaseTranslation)) {
            return res.status(400).json({
                message: "Invalid translation provided.",
                translation: translation
            });
        }

        if (!lowerCaseBooks.includes(lowerCaseBook)) {
            return res.status(400).json({
                message: "Invalid book provided.",
                book: book
            });
        }

        // Validate the start parameter
        if (!chapterVersePattern.test(start)) {
            return res.status(400).json({
                message: "Start parameter not provided or invalid format. Expected format is 'chapter:verse'.",
                start: start
            });
        }

        if(!apiKey) {
            return res.status(400).json({
                message: "API key is missing."
            })
        }

        // Validate the end parameter if provided
        if (!chapterVersePattern.test(end)) {
            return res.status(400).json({
                message: "End parameter not provided or invalid format. Expected format is 'chapter:verse'.",
                end: end
            });
        }

        const existingUser = await User.findOne({
            where: {
                apikey: apiKey,
            }
        });

        if (!existingUser) {
            return res.status(401).json({
                message: "Invalid API Key.",
                apikey: apiKey,
            })
        }


        // Extract start and end chapter and verse numbers
        const [startChapter, startVerse] = start.split(':').map(Number);
        const [endChapter, endVerse] = end.split(':').map(Number);

        if(endVerse < startVerse || endChapter < startChapter) {
            return res.status(400).json({
                message: "End parameters can not be less than start parameters.",
                start: start,
                end: end
            });
        }
        const array = [];
        if (startChapter !== endChapter) {
            for (let i = startChapter; i <= endChapter; i++) {
                if (i === startChapter) {
                    const query = `SELECT * FROM ${lowerCaseTranslation} WHERE lower(book) = '${lowerCaseBook}' AND chapter = ${i} AND verse >= ${startVerse}`;
                    const [results] = await sequelize.query(query);
                    array.push(...results);
                } else if (i === endChapter) {
                    const query = `SELECT * FROM ${lowerCaseTranslation} WHERE lower(book) = '${lowerCaseBook}' AND chapter = ${i} AND verse <= ${endVerse}`;
                    const [results] = await sequelize.query(query);
                    array.push(...results);
                } else {
                    const query = `SELECT * FROM ${lowerCaseTranslation} WHERE lower(book) = '${lowerCaseBook}' AND chapter = ${i}`;
                    const [results] = await sequelize.query(query);
                    array.push(...results);
                }
            }
        } else {
            const query = `SELECT * FROM ${lowerCaseTranslation} WHERE lower(book) = '${lowerCaseBook}' AND chapter = ${startChapter} AND verse >= ${startVerse} AND verse <= ${endVerse}`;
            const [results] = await sequelize.query(query);
            array.push(...results);
        }

        let combinedText = "";
        for (const result of array) {
            let verseText = result.text;
            if (superscript && superscript.toLowerCase() === "true") {
                combinedText += " " + getSuperscript(result.verse) + " ";
            }
            combinedText += verseText;
        }

        return res.status(200).json({
            array: array,
            result: combinedText

        })
    } catch (error) {
        res.status(500).json({error: error.message});
    }

}

function getSuperscript(number) {
    const sup = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    return number.toString().split("").map(digit => sup[digit]).join("");
}