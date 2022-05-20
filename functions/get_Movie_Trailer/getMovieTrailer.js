/**
 * This microservice is a basicIO function that sends back the trailer url given a moviename
 * This microservice gets called inside another basicIO function
 * 
 */


const movieTrailer = require('movie-trailer');

module.exports = async(context, basicIO) => {

    const movie_input = basicIO.getArgument('movie_name');
    const trailer = await movieTrailer(movie_input);
    console.log('testing');
    basicIO.write(trailer);
    context.close();
};