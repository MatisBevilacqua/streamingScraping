const cheerio = require("cheerio");
const axios = require("axios");
const mysql = require("mysql");
const moviesData = [];

const connection = mysql.createConnection({
    host: 'localhost:3306',
    user: 'root',
    password: '',
    database: 'streaming_scraping'
});

connection.connect();


const url = "https://imzod.com/9xzk9bkpqsmq1h/home/imzod/";

async function getUrLMovie() {
    try {
        const getUrlMovie = await axios.get(url);
        const $ = cheerio.load(getUrlMovie.data);

        const divAllMovie = $("#hann");

        divAllMovie.each(function () {
            movieName = $(this).find("p").text().trim();
            movieLink = 'https://imzod.com' + $(this).find("p > span > a").attr("href");

            moviesData.push({ movieName, movieLink });
        });
    }

    catch (error) {
        console.log(error);
    }
}


async function getStreamLink() {

    try {

        // console.log(moviesData.length);

        for (const movieData in moviesData) {

            const getStreamUrl = await axios.get(`${moviesData[movieData].movieLink}`);
            const $ = cheerio.load(getStreamUrl.data);

            const movieImg = $("body > div.content > div.row > div.column1 > p:nth-child(5) > img").attr('src');
            const movieStream = $("body > div.content > div.row > div.column1 > p:nth-child(9) > iframe").attr('src');
            const movieDescription = $('body > div.content > div.row > div.column1 > p:nth-child(7)').text().trim();

            moviesData[movieData].movieDescription = movieDescription;
            moviesData[movieData].movieImg = movieImg;
            moviesData[movieData].movieStream = movieStream;

        }

        connection.query('SELECT MAX(id) FROM movies', (error, results, fields) => {
            if (error) throw error;
            console.log(results[0]['MAX(id)']);

            if (results[0]['MAX(id)'] === moviesData.length) return

            connection.query('TRUNCATE TABLE movies', (error, results, fields) => {
                if (error) throw error;
            });
            moviesData.forEach((movie) => {
                connection.query('INSERT INTO movies SET ?', movie, (error, results, fields) => {
                    if (error) throw error;
                    console.log(`Nouveau film inséré avec succès: ${movie.movieName}`);
                });
            });

        });

    } catch (error) {
        console.log(error);
    }
}


async function main() {
    await getUrLMovie();
    await getStreamLink();
}

main();


