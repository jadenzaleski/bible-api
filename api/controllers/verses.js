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

exports.retrieve = async (req, res, next) => {
    const {translation, book} = req.params;
    const {start, end, apiKey} = req.query;
    // Convert to lowercase for case-insensitive comparison
    const lowerCaseTranslation = translation.toLowerCase();
    const lowerCaseBook = book.toLowerCase();

    // Convert the arrays to lowercase for comparison
    const lowerCaseTranslations = translations.map(t => t.toLowerCase());
    const lowerCaseBooks = books.map(b => b.toLowerCase());
    console.log('Received parameters:', {translation, book, start, end, apiKey});

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
                message: "Invalid start parameter format. Expected format is 'chapter:verse'.",
                start: start
            });
        }

        // Validate the end parameter if provided
        if (end && !chapterVersePattern.test(end)) {
            return res.status(400).json({
                message: "Invalid end parameter format. Expected format is 'chapter:verse'.",
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


        // Validation done. now query
        // Extract start and end chapter and verse numbers
        const [startChapter, startVerse] = start.split(':').map(Number);
        const [endChapter, endVerse] = end.split(':').map(Number);
        const query = `
  SELECT *
  FROM ${lowerCaseTranslation}
  WHERE book = '${book}' AND (
    (chapter = ${startChapter} AND verse >= ${startVerse})
    OR (chapter > ${startChapter} AND chapter < ${endChapter})
    OR (chapter = ${endChapter} AND verse <= ${endVerse})
  )
  ORDER BY chapter, verse;
        `;
        const [results, metadata] = await sequelize.query(query)

        return res.status(200).json({
            result: results,
            metadata: metadata
        })
    } catch (error) {
        res.status(500).json({error: error});
    }


}