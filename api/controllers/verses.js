const User = require("../models/user");
const { validationResult } = require('express-validator');
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
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            type: "GET",
            status: "400 Bad Request",
            timestamp: new Date().toISOString(),
            errors: errors.array()
        });
    }

    const {translation, book} = req.params;
    const {start, end, superscript, apiKey} = req.query;
    const lowerCaseTranslation = translation.toLowerCase();
    const lowerCaseBook = book.toLowerCase();
    const lowerCaseTranslations = translations.map(t => t.toLowerCase());
    const lowerCaseBooks = books.map(b => b.toLowerCase());
    console.log('Received parameters:', {translation, book, start, end, superscript, apiKey});

    try {
        // Verify the translation
        if (!lowerCaseTranslations.includes(lowerCaseTranslation)) {
            return res.status(400).json({
                type: "GET",
                status: "400 Bad Request",
                timestamp: new Date().toISOString(),
                msg: `Invalid translation provided: ${translation}`,
                available_translations: translations
            });
        }
        // Verify the book
        if (!lowerCaseBooks.includes(lowerCaseBook)) {
            return res.status(400).json({
                type: "GET",
                status: "400 Bad Request",
                timestamp: new Date().toISOString(),
                msg: `Invalid book provided: ${book}`,
                available_books: books
            });
        }

        // Validate the start parameter
        if (!chapterVersePattern.test(start)) {
            return res.status(400).json({
                type: "GET",
                status: "400 Bad Request",
                timestamp: new Date().toISOString(),
                msg: "Start parameter not provided or invalid format. Expected format is 'chapter:verse'.",
                start: start
            });
        }

        // Validate the end parameter
        if (!chapterVersePattern.test(end)) {
            return res.status(400).json({
                type: "GET",
                status: "400 Bad Request",
                timestamp: new Date().toISOString(),
                msg: "End parameter not provided or invalid format. Expected format is 'chapter:verse'.",
                end: end
            });
        }

        // Validate the API Key is there
        if(!apiKey) {
            return res.status(400).json({
                type: "GET",
                status: "400 Bad Request",
                timestamp: new Date().toISOString(),
                msg: "API key is missing."
            })
        }

        // Find existing user if there is one
        const existingUser = await User.findOne({
            where: {
                apikey: apiKey,
            }
        });

        // If there is no use the api key is invalid.
        if (!existingUser) {
            return res.status(401).json({
                type: "GET",
                status: "401 Unauthorized",
                timestamp: new Date().toISOString(),
                msg: "Invalid API key.",
                apikey: apiKey,
            })
        }

        // Extract start and end chapter and verse numbers
        const [startChapter, startVerse] = start.split(':').map(Number);
        const [endChapter, endVerse] = end.split(':').map(Number);

        if(endVerse < startVerse || endChapter < startChapter) {
            return res.status(400).json({
                type: "GET",
                status: "400 Bad Request",
                timestamp: new Date().toISOString(),
                msg: "End parameters can not be less then start parameters.",
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
            switch (superscript && superscript.toLowerCase()) {
                case "super":
                    combinedText += " " + getSuperscript(result.verse) + " ";
                    break;
                case "plain":
                    combinedText += ` ${result.verse} `;
                    break;
                case "html":
                    combinedText += " <sup>" + result.verse + "</sup> ";
                    break;
            }
            combinedText += verseText;
        }

        existingUser.apiKeyCount += 1;
        existingUser.verseCallCount += array.length
        await existingUser.save();

        // Proper response:
        return res.status(200).json({
            type: "GET",
            status: "200 OK",
            timestamp: new Date().toISOString(),
            username: req.query.username,
            parameters: {
                translation: translation,
                book: book,
                start: start,
                end: end,
                superscript: superscript,
                apiKey: apiKey
            },
            result: {
                array: array,
                combined: combinedText
            }
        })
    } catch (error) {
        res.status(500).json({
            type: "GET",
            status: "500 Internal Server Error",
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }

}

function getSuperscript(number) {
    const sup = "⁰¹²³⁴⁵⁶⁷⁸⁹";
    return number.toString().split("").map(digit => sup[digit]).join("");
}